import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as nodeCrypto from "node:crypto";
import { Buffer } from "node:buffer";
import { asUuid } from "../_shared/billingConfig.ts";

function sortForSignature(value: any): any {
  if (Array.isArray(value)) return value.map(sortForSignature);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((result: Record<string, unknown>, key) => {
      result[key] = sortForSignature(value[key]);
      return result;
    }, {});
  }
  return value;
}

function signaturesMatch(expectedHex: string, receivedHex: string) {
  if (!/^[0-9a-f]+$/i.test(receivedHex)) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");
  return expected.length === received.length && nodeCrypto.timingSafeEqual(expected, received);
}

async function claimEvent(supabase: any, eventId: string, eventType: string) {
  const { data, error } = await supabase.rpc("claim_processed_stripe_event", {
    p_event_id: eventId,
    p_event_type: eventType,
  });
  if (error) throw error;
  const result = data?.[0];
  if (result?.claimed) return true;
  if (result?.event_status === "completed") return false;
  throw new Error("This payment notification is already being processed; please retry.");
}

serve(async (req) => {
  let claimedEventId: string | null = null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const signature = req.headers.get("x-nowpayments-sig")?.trim() ?? "";
    const ipnSecret = Deno.env.get("NOWPAYMENTS_IPN_SECRET");
    if (!signature || !ipnSecret) {
      return new Response(JSON.stringify({ error: "Missing signature configuration." }), { status: 400 });
    }

    const body = await req.json();
    const signedPayload = JSON.stringify(sortForSignature(body));
    const generatedSignature = nodeCrypto
      .createHmac("sha512", ipnSecret)
      .update(signedPayload)
      .digest("hex");
    if (!signaturesMatch(generatedSignature, signature)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    // Credit only the terminal success state. Intermediate confirmations are
    // acknowledged and NOWPayments can continue delivering status changes.
    if (body.payment_status !== "finished") {
      return new Response(JSON.stringify({ status: "accepted" }), { status: 200 });
    }

    const prefix = "CREDIT_TOPUP_";
    if (typeof body.order_id !== "string" || !body.order_id.startsWith(prefix)) {
      return new Response(JSON.stringify({ status: "ignored" }), { status: 200 });
    }
    const attemptId = asUuid(body.order_id.slice(prefix.length), "billing attempt id");
    const paymentReference = String(body.payment_id ?? "");
    if (!paymentReference) throw new Error("NOWPayments payment id is missing.");

    const eventId = `nowpayments_${paymentReference}_finished`;
    if (!(await claimEvent(supabase, eventId, "crypto_topup.finished"))) {
      return new Response(JSON.stringify({ status: "success", deduped: true }), { status: 200 });
    }
    claimedEventId = eventId;

    const { data: attempt, error: attemptError } = await supabase
      .from("billing_payment_attempts")
      .select("id, provider, purpose")
      .eq("id", attemptId)
      .maybeSingle();
    if (attemptError) throw attemptError;
    if (!attempt || attempt.provider !== "nowpayments" || attempt.purpose !== "credit_topup") {
      throw new Error("NOWPayments order does not match a credit top-up attempt.");
    }

    const paidAmountCents = Math.round(Number(body.price_amount) * 100);
    if (!Number.isSafeInteger(paidAmountCents) || paidAmountCents <= 0) {
      throw new Error("NOWPayments reported an invalid paid amount.");
    }

    const { error: creditError } = await supabase.rpc("complete_billing_credit_topup", {
      p_attempt_id: attemptId,
      p_provider_payment_reference: paymentReference,
      p_amount_paid_cents: paidAmountCents,
      p_currency: String(body.price_currency ?? ""),
    });
    if (creditError) throw creditError;

    const { error: completeError } = await supabase.rpc("complete_processed_stripe_event", {
      p_event_id: eventId,
    });
    if (completeError) throw completeError;

    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
  } catch (error: any) {
    if (claimedEventId) {
      await supabase.rpc("fail_processed_stripe_event", { p_event_id: claimedEventId });
    }
    console.error("NOWPayments webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
