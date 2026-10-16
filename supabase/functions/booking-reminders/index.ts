import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { escapeHtml, sendEmail } from "../_shared/bookingData.ts";

// Scheduled job (every ~15 minutes): releases expired payment holds and sends 24h reminders.
// Protected by a shared secret instead of a user JWT.
const REMINDER_WINDOW_MS = 24 * 3_600_000;

serve(async (req) => {
  const secret = Deno.env.get("BOOKING_CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const now = new Date();

  const { data: expired } = await admin
    .from("bookings")
    .update({ status: "cancelled", updated_at: now.toISOString() })
    .eq("status", "pending")
    .eq("payment_status", "unpaid")
    .lt("hold_expires_at", now.toISOString())
    .select("id");

  const { data: due } = await admin
    .from("bookings")
    .select("id, service_name, customer_name, customer_email, customer_timezone, start_at")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gt("start_at", now.toISOString())
    .lte("start_at", new Date(now.getTime() + REMINDER_WINDOW_MS).toISOString())
    .limit(200);

  let reminded = 0;
  for (const b of due ?? []) {
    // Claim first so overlapping runs never send twice.
    const { data: claimed } = await admin
      .from("bookings")
      .update({ reminder_sent_at: now.toISOString() })
      .eq("id", b.id)
      .is("reminder_sent_at", null)
      .select("id");
    if (!claimed?.length) continue;

    const when = new Date(b.start_at).toLocaleString("en-US", { timeZone: b.customer_timezone, dateStyle: "full", timeStyle: "short" });
    await sendEmail(
      b.customer_email,
      `Reminder: ${b.service_name} on ${when}`,
      `<p>Hi ${escapeHtml(b.customer_name)}, this is a reminder of your booking for <strong>${escapeHtml(b.service_name)}</strong> on ${escapeHtml(when)} (${escapeHtml(b.customer_timezone)}).</p>`,
    );
    reminded++;
  }

  return new Response(JSON.stringify({ expiredHolds: expired?.length ?? 0, reminded }), {
    headers: { "Content-Type": "application/json" },
  });
});
