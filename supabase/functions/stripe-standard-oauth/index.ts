import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { requireActorForRequest } from "../_shared/actorAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const { code, actorId, portfolioId } = await req.json();

    // 1. Swap the code for the Stripe User ID
    const stripeResponse = await fetch(
      "https://connect.stripe.com/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: Deno.env.get("STRIPE_CLIENT_ID") || "",
          client_secret: Deno.env.get("STRIPE_SECRET_KEY") || "",
          code: code,
        }),
      }
    );

    const stripeData = await stripeResponse.json();

    if (stripeData.error) {
      throw new Error(stripeData.error_description || stripeData.error);
    }

    // This is the Standard Stripe Account ID!
    const stripeAccountId = stripeData.stripe_user_id;

    // 2. Save it to Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    await requireActorForRequest(req, supabaseClient, actorId);

    if (portfolioId === "global") {
      // Save as Global Account
      await supabaseClient
        .from("actors")
        .update({
          stripe_account_id: stripeAccountId,
          stripe_account_type: "standard",
        })
        .eq("id", actorId);
    } else {
      // Save as Site Override
      const { data: portfolio, error: portfolioError } = await supabaseClient
        .from("portfolios")
        .select("id")
        .eq("id", portfolioId)
        .eq("actor_id", actorId)
        .maybeSingle();
      if (portfolioError || !portfolio) throw new Error("Portfolio does not belong to this actor.");

      await supabaseClient
        .from("portfolios")
        .update({
          stripe_account_id: stripeAccountId,
          stripe_account_type: "standard",
        })
        .eq("id", portfolioId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
