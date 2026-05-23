import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) return new Response("Missing Resend API Key", { status: 500 });

  // Find pending orders between 2 and 24 hours old that haven't received a recovery email
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: abandonedOrders } = await supabase
    .from("pro_orders")
    .select("*")
    .eq("status", "pending")
    .lt("created_at", twoHoursAgo)
    .gt("created_at", twentyFourHoursAgo)
    // We use the notes field as a clever flag to mark if we already sent the email!
    .not("notes", "ilike", "%[Recovery Sent]%");

  if (!abandonedOrders || abandonedOrders.length === 0) {
    return new Response("No abandoned carts to process.", { status: 200 });
  }

  for (const order of abandonedOrders) {
    const emailMatch = order.notes?.match(/(?:email|checkout_email|email address):\s*([^\n]+)/i);
    const customerEmail = emailMatch ? emailMatch[1].trim() : null;

    if (customerEmail && customerEmail.includes("@")) {
      // 1. Send Recovery Email
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Store <orders@resend.dev>", // Replace with your domain
          to: customerEmail,
          subject: "You left something in your cart!",
          html: `
            <div style="font-family: sans-serif; padding: 24px;">
              <h2>Did you forget something? 👀</h2>
              <p>Hi ${order.customer_name},</p>
              <p>You left some great items in your cart. Come back and complete your purchase before they sell out!</p>
            </div>
          `,
        }),
      });

      // 2. Mark as sent so we don't spam them again
      await supabase
        .from("pro_orders")
        .update({ notes: `${order.notes}\n\n[Recovery Sent]` })
        .eq("id", order.id);
    }
  }

  return new Response(`Processed ${abandonedOrders.length} abandoned carts.`, { status: 200 });
});