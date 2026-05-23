import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (request) => {
  const signature = request.headers.get("Stripe-Signature");
  // Note: We use a distinct secret specifically for Connect events!
  const webhookSecret = Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Webhook secret or signature missing", { status: 400 });
  }

  try {
    const body = await request.text();
    // Verify the event actually came from Stripe
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    // We only care about successful Connect payments
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Mark the order as paid!
      const { error } = await supabase
        .from("pro_orders")
        .update({ status: "paid" })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error(`Connect Webhook Error: ${err.message}`);
    return new Response(`Connect Webhook Error: ${err.message}`, { status: 400 });
  }
});