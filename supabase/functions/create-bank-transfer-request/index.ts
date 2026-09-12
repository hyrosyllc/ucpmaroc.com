import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { requireActorForRequest } from "../_shared/actorAuth.ts";
import { asUuid, resolveCreditPurchase } from "../_shared/billingConfig.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { actorId, packId, credits } = await req.json();
    const trustedActorId = asUuid(actorId, "actorId");
    const purchase = resolveCreditPurchase(packId, credits);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    await requireActorForRequest(req, supabase, trustedActorId);

    const attemptId = crypto.randomUUID();
    const reference = `UCP-${attemptId.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    const { error } = await supabase.from("billing_payment_attempts").insert({
      id: attemptId,
      actor_id: trustedActorId,
      provider: "bank_transfer",
      purpose: "credit_topup",
      status: "pending",
      currency: "usd",
      expected_amount_cents: purchase.amountCents,
      credits_amount: purchase.credits,
      provider_reference: reference,
      metadata: { pack_id: purchase.packId },
    });
    if (error) throw error;

    return new Response(JSON.stringify({
      reference,
      amountUsd: purchase.amountCents / 100,
      credits: purchase.credits,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Bank transfer request error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
