import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// @ts-ignore: VS Code doesn't natively understand Deno's npm: prefix
import Stripe from "npm:stripe@^14.0.0";
import { requireActorForRequest } from "../_shared/actorAuth.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Extract the Token explicitly
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");

    // 2. Authenticate the User
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // 🚀 THE FIX: Pass the explicit token into getUser()
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error(`Auth failed: ${userError?.message || "No user found"}`);
    }

    // 2. Parse the Request
    const { actorId, portfolioId, returnUrl } = await req.json();

    if (!actorId) throw new Error("Missing actorId in request payload");

    // 🚀 Security Check - Ensure this actor profile actually belongs to the logged in Auth User
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    await requireActorForRequest(req, supabaseAdmin, actorId);

    let stripeAccountId = null;
    let targetTable = portfolioId ? "portfolios" : "actors";
    let targetId = portfolioId ? portfolioId : actorId;

    // 3. Check if they already have a Stripe Account in the DB
    let existingQuery = supabaseAdmin
      .from(targetTable)
      .select("stripe_account_id")
      .eq("id", targetId);
    if (portfolioId) existingQuery = existingQuery.eq("actor_id", actorId);
    const { data: existingData, error: fetchError } = await existingQuery.single();
    if (fetchError || !existingData) {
      throw new Error("Portfolio does not belong to this actor or could not be found.");
    }

    if (existingData?.stripe_account_id) {
      stripeAccountId = existingData.stripe_account_id;
    }

    // 4. If they don't have one, create a new Express Account
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US", // Adjust to your platform's country
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;

      // Save the new ID to Supabase
      const { error: updateError } = await supabaseAdmin
        .from(targetTable)
        .update({ stripe_account_id: stripeAccountId })
        .eq("id", targetId);

      if (updateError) throw new Error("Failed to save Stripe ID to database");
    }

    // 5. Generate the Onboarding Link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${returnUrl}&status=refresh`,
      return_url: `${returnUrl}&status=success`,
      type: "account_onboarding",
    });

    // 6. Return the URL to the frontend
    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Stripe Connect Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
