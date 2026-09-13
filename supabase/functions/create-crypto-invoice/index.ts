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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  let attemptId: string | null = null;
  let invoiceCreated = false;
  let invoiceRequestStarted = false;

  try {
    const { actorId, packId, credits } = await req.json();
    const trustedActorId = asUuid(actorId, "actorId");
    await requireActorForRequest(req, supabase, trustedActorId);
    const purchase = resolveCreditPurchase(packId, credits);

    const nowPaymentsApiKey = Deno.env.get("NOWPAYMENTS_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "");
    if (!nowPaymentsApiKey) throw new Error("Missing NOWPAYMENTS_API_KEY");
    if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
    if (!appUrl) throw new Error("Missing APP_URL in Supabase Edge Function secrets.");

    attemptId = crypto.randomUUID();
    const { error: attemptError } = await supabase
      .from("billing_payment_attempts")
      .insert({
        id: attemptId,
        actor_id: trustedActorId,
        provider: "nowpayments",
        purpose: "credit_topup",
        status: "pending",
        currency: "usd",
        expected_amount_cents: purchase.amountCents,
        credits_amount: purchase.credits,
        metadata: { pack_id: purchase.packId },
      });
    if (attemptError) throw attemptError;

    invoiceRequestStarted = true;
    const response = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": nowPaymentsApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: purchase.amountCents / 100,
        price_currency: "usd",
        order_id: `CREDIT_TOPUP_${attemptId}`,
        order_description: `${purchase.credits} Platform Credits`,
        ipn_callback_url: `${supabaseUrl}/functions/v1/crypto-webhook`,
        success_url: `${appUrl}/dashboard/billing?topup=success`,
        cancel_url: `${appUrl}/dashboard/billing?topup=canceled`,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "NOWPayments API error");
    if (!data.invoice_url || !data.id) throw new Error("NOWPayments returned an incomplete invoice.");
    invoiceCreated = true;

    const { error: updateError } = await supabase
      .from("billing_payment_attempts")
      .update({
        provider_reference: String(data.id),
        updated_at: new Date().toISOString(),
      })
      .eq("id", attemptId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ invoiceUrl: data.invoice_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (attemptId && !invoiceCreated && !invoiceRequestStarted) {
      await supabase.from("billing_payment_attempts").update({
        status: "failed",
        failure_code: "invoice_creation_failed",
        updated_at: new Date().toISOString(),
      }).eq("id", attemptId).eq("status", "pending");
    }
    console.error("Crypto invoice error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
