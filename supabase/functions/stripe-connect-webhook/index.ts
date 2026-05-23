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

      // 1. Fetch the exact order to process items and customer info
      const { data: order } = await supabase
        .from("pro_orders")
        .select("*")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .single();

      if (order && order.status === "pending") {
        // 2. Mark the order as paid!
        const { error } = await supabase
          .from("pro_orders")
          .update({ status: "paid" })
          .eq("id", order.id);
          
        if (error) throw error;

        // 3. Inventory Management: Deduct stock automatically
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            await supabase.rpc("decrement_stock", {
              p_product_id: item.id,
              p_quantity: item.quantity,
            });
          }
        }

        // 4. Automated Email Receipts (via Resend API)
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        // Intelligently parse the email out of the notes text
        const emailMatch = order.notes?.match(/(?:email|checkout_email|email address):\s*([^\n]+)/i);
        const customerEmail = emailMatch ? emailMatch[1].trim() : null;

        if (resendApiKey && customerEmail && customerEmail.includes("@")) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Store Updates <orders@resend.dev>", // Replace with your verified Resend domain later
              to: customerEmail,
              subject: `Receipt for Order #${order.id.split("-")[0].toUpperCase()}`,
              html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #eaeaea; padding: 24px; border-radius: 12px;">
                  <h2 style="color: #111;">Payment Successful! 🎉</h2>
                  <p style="color: #444;">Hi ${order.customer_name},</p>
                  <p style="color: #444;">We've successfully received your payment of <strong>$${(order.amount_cents / 100).toFixed(2)}</strong>.</p>
                  <p style="color: #444;">Your order is now being processed by the seller. We will notify you when there are further updates.</p>
                  <br/>
                  <p style="color: #888; font-size: 12px;">Thank you for your business!</p>
                </div>
              `,
            }),
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error(`Connect Webhook Error: ${err.message}`);
    return new Response(`Connect Webhook Error: ${err.message}`, { status: 400 });
  }
});