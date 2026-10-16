import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Auto-top-up via saved card: triggered when balance falls below threshold.
// Calls charge-saved-card to debit the user's default payment method and add credits.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { actor_id, threshold_credits, charge_amount_usd } = await req.json();

    if (!actor_id || typeof threshold_credits !== "number" || typeof charge_amount_usd !== "number") {
      return new Response(JSON.stringify({ error: "Missing or invalid parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch actor and check balance + auto-top-up settings.
    const { data: actor, error: actorError } = await supabase
      .from("actors")
      .select("wallet_balance, stripe_customer_id, auto_topup_enabled, auto_topup_threshold, auto_topup_amount")
      .eq("id", actor_id)
      .single();

    if (actorError || !actor) {
      return new Response(JSON.stringify({ error: "Actor not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if auto-top-up is enabled and balance is below threshold.
    if (!actor.auto_topup_enabled || actor.wallet_balance >= actor.auto_topup_threshold) {
      return new Response(JSON.stringify({ ok: false, reason: "Auto-top-up not triggered" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No saved payment method, can't auto-charge.
    if (!actor.stripe_customer_id) {
      return new Response(JSON.stringify({ ok: false, reason: "No saved payment method" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call charge-saved-card to debit the user's account.
    const chargeAmount = actor.auto_topup_amount ?? charge_amount_usd;
    const { data: chargeResult, error: chargeError } = await supabase.functions.invoke(
      "charge-saved-card",
      {
        body: {
          amount: chargeAmount,
          customerId: actor.stripe_customer_id,
          actor_id,
        },
      }
    );

    if (chargeError || !chargeResult?.success) {
      console.error("Auto-top-up charge failed", chargeError || chargeResult?.error);
      return new Response(
        JSON.stringify({ ok: false, error: chargeError?.message || chargeResult?.error || "Charge failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate credits to add based on top-up amount and credit unit rate.
    // Default: $0.02 per credit, so $20 = 1000 credits.
    const CREDIT_UNIT_USD = 0.02;
    const creditsToAdd = Math.round((chargeAmount / CREDIT_UNIT_USD) * 100) / 100;

    // Add credits to actor's wallet.
    const { error: updateError } = await supabase
      .from("actors")
      .update({ wallet_balance: actor.wallet_balance + creditsToAdd })
      .eq("id", actor_id);

    if (updateError) {
      console.error("Failed to update wallet balance after auto-charge", updateError);
      return new Response(JSON.stringify({ ok: false, error: "Could not credit wallet" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the transaction.
    await supabase.from("wallet_transactions").insert({
      actor_id,
      amount: Math.round(creditsToAdd),
      type: "purchase",
      status: "completed",
      description: `Auto top-up via saved card: $${chargeAmount.toFixed(2)} USD`,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        charged_usd: chargeAmount,
        credits_added: Math.round(creditsToAdd),
        new_balance: actor.wallet_balance + creditsToAdd,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Auto-top-up error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
