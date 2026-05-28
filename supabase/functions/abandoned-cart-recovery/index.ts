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
      let storeLink = "https://ucpmaroc.com";
      if (order.portfolio_id) {
        const { data: portData } = await supabase.from('portfolios').select('public_slug, custom_domain').eq('id', order.portfolio_id).single();
        if (portData) {
          if (portData.custom_domain) {
            storeLink = `https://${portData.custom_domain}/shop`;
          } else {
            storeLink = `https://ucpmaroc.com/pro/${portData.public_slug}/shop`;
          }
        }
      }

      let itemsHtml = "";
      if (order.items && Array.isArray(order.items)) {
        itemsHtml = order.items.map((item: any) => `
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #eaeaea;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  ${item.image ? `<td style="width: 80px; vertical-align: middle;"><img src="${item.image}" alt="${item.title.replace(/"/g, '&quot;')}" style="width: 64px; height: 64px; object-fit: cover; border-radius: 8px; display: block;" /></td>` : ''}
                  <td style="vertical-align: middle;">
                    <p style="margin: 0; font-weight: bold; color: #111; font-size: 16px;">${item.title}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #666;">Qty: ${item.quantity} ${item.variant && item.variant !== 'default' ? `| ${item.variant}` : ''}</p>
                    <p style="margin: 4px 0 0 0; font-weight: 600; color: #111; font-size: 14px;">$${(item.price * item.quantity).toFixed(2)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `).join("");
      } else {
         itemsHtml = `
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #eaeaea;">
              <p style="margin: 0; font-weight: bold; color: #111; font-size: 16px;">${order.product_name}</p>
              <p style="margin: 4px 0 0 0; font-weight: 600; color: #111; font-size: 14px;">${order.product_price}</p>
            </td>
          </tr>
         `;
      }

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #f4f4f5; padding: 40px 32px; text-align: center; border-bottom: 1px solid #eaeaea;">
            <span style="font-size: 48px; line-height: 1;">🛒</span>
            <h1 style="color: #111; margin: 16px 0 0 0; font-size: 24px; letter-spacing: -0.5px;">Did you forget something?</h1>
          </div>
          
          <div style="padding: 32px;">
            <p style="color: #3f3f46; font-size: 16px; line-height: 24px; margin-top: 0;">Hi ${order.customer_name || 'there'},</p>
            <p style="color: #3f3f46; font-size: 16px; line-height: 24px;">We noticed you left some great items in your cart. We've saved them for you, but they might sell out soon!</p>
            
            <div style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 12px; padding: 0 24px; margin-top: 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <div style="text-align: center; margin-top: 40px;">
              <a href="${storeLink}" style="display: inline-block; background-color: #000000; color: #ffffff; font-weight: 600; font-size: 16px; text-decoration: none; padding: 16px 32px; border-radius: 8px;">Complete Your Purchase</a>
            </div>
          </div>
          
          <div style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #eaeaea;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">If you need any help, just reply to this email. We're here for you!</p>
          </div>
        </div>
      `;

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
          html: emailHtml,
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