import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

async function claimEvent(supabase: any, eventId: string, eventType: string) {
  const { data, error } = await supabase.rpc("claim_processed_stripe_event", {
    p_event_id: eventId,
    p_event_type: eventType,
  });
  if (error) throw error;
  const result = data?.[0];
  if (result?.claimed) return true;
  if (result?.event_status === "completed") return false;
  throw new Error("This webhook event is already being processed; please retry.");
}

serve(async (request) => {
  let claimedEventId: string | null = null;
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const eventId = `connect_${event.id}`;
    if (!(await claimEvent(supabase, eventId, event.type))) {
      return new Response(JSON.stringify({ received: true, deduped: true }), { status: 200 });
    }
    claimedEventId = eventId;

    // This endpoint is only for connected-account events. Platform billing
    // events belong to stripe-webhook and must never be processed here.
    const connectedAccountId = (event as any).account as string | undefined;
    if (!connectedAccountId) {
      await supabase.rpc("complete_processed_stripe_event", { p_event_id: eventId });
      return new Response(JSON.stringify({ received: true, ignored: "not a connected-account event" }), { status: 200 });
    }

    // We only care about successful Connect payments
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;

      if (paymentIntent.metadata?.connected_account_id && paymentIntent.metadata.connected_account_id !== connectedAccountId) {
        throw new Error("Connected account does not match payment metadata.");
      }

      const storeAttemptId = paymentIntent.metadata?.store_payment_attempt_id;
      if (!storeAttemptId || paymentIntent.metadata?.store_checkout !== "true") {
        await supabase.rpc("complete_processed_stripe_event", { p_event_id: eventId });
        return new Response(
          JSON.stringify({ received: true, ignored: "not a platform store checkout" }),
          { status: 200 },
        );
      }

      // Payment, order state, coupon redemption, and inventory move in one
      // database transaction. A webhook retry cannot repeat fulfillment.
      const { data: applied, error: fulfillmentError } = await supabase.rpc(
        "complete_store_order_payment",
        {
          p_attempt_id: storeAttemptId,
          p_stripe_payment_intent_id: paymentIntent.id,
          p_connected_account_id: connectedAccountId,
          p_amount_paid_cents: Number(paymentIntent.amount_received || paymentIntent.amount),
          p_currency: paymentIntent.currency,
        },
      );
      if (fulfillmentError) throw fulfillmentError;

      const { data: order, error: orderError } = await supabase
        .from("pro_orders")
        .select("*")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .single();
      if (orderError) throw orderError;

      if (order && applied) {
        // Email is intentionally outside the financial transaction. A receipt
        // failure is logged but must not roll back a settled order.
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        // Intelligently parse the email out of the notes text
        const emailMatch = order.notes?.match(/(?:email|checkout_email|email address):\s*([^\n]+)/i);
        const customerEmail = emailMatch ? emailMatch[1].trim() : null;

        if (resendApiKey && customerEmail && customerEmail.includes("@")) {
          let itemsHtml = "";
          if (order.items && Array.isArray(order.items)) {
            itemsHtml = order.items.map((item: any) => `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      ${item.image ? `<td style="width: 76px; vertical-align: middle;"><img src="${item.image}" alt="${item.title.replace(/"/g, '&quot;')}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; display: block;" /></td>` : ''}
                      <td style="vertical-align: middle;">
                        <p style="margin: 0; font-weight: bold; color: #111;">${item.title}</p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Qty: ${item.quantity} ${item.variant && item.variant !== 'default' ? `| Variant: ${item.variant}` : ''}</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold; color: #111; vertical-align: middle;">
                  $${(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            `).join("");
          } else {
             itemsHtml = `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea;">
                  <p style="margin: 0; font-weight: bold; color: #111;">${order.product_name}</p>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold; color: #111;">
                   ${order.product_price}
                </td>
              </tr>
             `;
          }

          const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #000000; padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Payment Successful</h1>
                <p style="color: #a1a1aa; margin: 8px 0 0 0; font-size: 14px;">Order #${order.id.split('-')[0].toUpperCase()}</p>
              </div>
              
              <div style="padding: 32px;">
                <p style="color: #3f3f46; font-size: 16px; line-height: 24px; margin-top: 0;">Hi ${order.customer_name || 'there'},</p>
                <p style="color: #3f3f46; font-size: 16px; line-height: 24px;">Thank you for your purchase. We've successfully received your payment. Below are your order details.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 32px;">
                  <thead>
                    <tr>
                      <th style="text-align: left; padding-bottom: 12px; border-bottom: 2px solid #e4e4e7; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                      <th style="text-align: right; padding-bottom: 12px; border-bottom: 2px solid #e4e4e7; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style="padding-top: 24px; text-align: right; font-weight: 500; color: #71717a;">Total Paid</td>
                      <td style="padding-top: 24px; text-align: right; font-weight: bold; font-size: 18px; color: #111;">
                        $${(order.amount_cents ? order.amount_cents / 100 : parseFloat(order.product_price.replace(/[^0-9.]/g, ''))).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #eaeaea;">
                  <h3 style="margin: 0 0 16px 0; color: #111; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Customer Details</h3>
                  <p style="margin: 0 0 8px 0; color: #52525b; font-size: 14px;"><strong>Name:</strong> ${order.customer_name}</p>
                  <p style="margin: 0 0 8px 0; color: #52525b; font-size: 14px;"><strong>Email:</strong> ${customerEmail}</p>
                  ${order.customer_phone && order.customer_phone !== "No Phone" ? `<p style="margin: 0 0 8px 0; color: #52525b; font-size: 14px;"><strong>Phone:</strong> ${order.customer_phone}</p>` : ''}
                  ${order.customer_address && order.customer_address !== "No Address Provided" ? `<p style="margin: 0 0 8px 0; color: #52525b; font-size: 14px;"><strong>Address:</strong> ${order.customer_address}</p>` : ''}
                </div>
              </div>
              
              <div style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #eaeaea;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">This is an automated receipt. If you have any questions, please contact the seller directly.</p>
              </div>
            </div>
          `;

          try {
            const receiptResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: "Store Updates <orders@resend.dev>", // Replace with your verified Resend domain later
                to: customerEmail,
                subject: `Receipt for Order #${order.id.split("-")[0].toUpperCase()}`,
                html: emailHtml,
              }),
            });
            if (!receiptResponse.ok) {
              console.error("Store receipt delivery failed:", receiptResponse.status);
            }
          } catch (receiptError) {
            console.error("Store receipt delivery failed:", receiptError);
          }
        }
      }
    }

    // A cardholder disputed a charge. Route the reversal based on what the payment was for:
    // a Platform Credits top-up (reverse credits + suspend) or a store order (flag it).
    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as any;
      const paymentIntent = await stripe.paymentIntents.retrieve(
        dispute.payment_intent as string,
        {},
        { stripeAccount: connectedAccountId },
      );

      const { error } = await supabase
        .from("pro_orders")
        .update({ status: "disputed" })
        .eq("stripe_payment_intent_id", paymentIntent.id);
      if (error) throw error;
      const { error: attemptError } = await supabase
        .from("store_payment_attempts")
        .update({ status: "disputed", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntent.id);
      if (attemptError) throw attemptError;
    }

    await supabase.rpc("complete_processed_stripe_event", { p_event_id: eventId });
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    if (claimedEventId) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        await supabase.rpc("fail_processed_stripe_event", { p_event_id: claimedEventId });
      } catch (failureError) {
        console.error("Could not mark webhook event as failed:", failureError);
      }
    }
    console.error(`Connect Webhook Error: ${err.message}`);
    return new Response(`Connect Webhook Error: ${err.message}`, { status: 400 });
  }
});
