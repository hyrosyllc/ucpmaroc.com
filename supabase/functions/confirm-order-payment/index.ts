import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) throw new Error("Authentication is required.");

    const { orderId, paymentIntentId } = await req.json();
    if (!orderId || !paymentIntentId) throw new Error("Order and payment details are required.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authorization } } },
    );
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error("Authentication is required.");

    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (clientError) throw clientError;
    if (!client) throw new Error("A client profile is required.");

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, client_id, total_price, status")
      .eq("id", orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.client_id !== client.id) throw new Error("Order not found.");
    if (!order.total_price || order.total_price <= 0) throw new Error("Order has no payable amount.");
    if (["Completed", "Cancelled"].includes(order.status)) throw new Error("This order cannot be paid.");

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("Stripe payment configuration is missing.");

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
      { headers: { Authorization: `Bearer ${stripeSecretKey}` } },
    );
    const paymentIntent = await stripeResponse.json();
    if (!stripeResponse.ok || paymentIntent.status !== "succeeded") {
      throw new Error("Stripe payment has not succeeded.");
    }
    if (paymentIntent.currency !== "mad" || paymentIntent.amount_received !== Math.round(Number(order.total_price) * 100)) {
      throw new Error("Stripe payment amount does not match the order.");
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "In Progress",
        payment_method: "stripe",
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", order.id)
      .select()
      .single();
    if (updateError) throw updateError;

    return new Response(JSON.stringify(updatedOrder), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
