import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isSlotAvailable } from "../_shared/bookingSlots.ts";
import { escapeHtml, loadBookingContext, sendEmail, sha256Hex } from "../_shared/bookingData.ts";
import { deleteEvent, getCalendarAccess, updateEventTime } from "../_shared/googleCalendar.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function ownerEmail(admin: any, portfolioId: string): Promise<string | null> {
  const { data: portfolio } = await admin.from("portfolios").select("actor_id").eq("id", portfolioId).maybeSingle();
  if (!portfolio) return null;
  const { data: actor } = await admin.from("actors").select("ActorEmail").eq("id", portfolio.actor_id).maybeSingle();
  return actor?.ActorEmail ?? null;
}

const COLUMNS =
  "id, portfolio_id, service_id, service_name, customer_name, customer_email, customer_timezone, start_at, end_at, status, google_event_id";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const { token, action, start } = await req.json();
    if (typeof token !== "string" || !/^[0-9a-f]{48}$/.test(token)) return json({ error: "Invalid link." }, 400);
    if (!["get", "cancel", "reschedule"].includes(action)) return json({ error: "Invalid action." }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: booking } = await admin
      .from("bookings")
      .select(COLUMNS)
      .eq("manage_token_hash", await sha256Hex(token))
      .maybeSingle();
    if (!booking) return json({ error: "Booking not found." }, 404);

    const view = (b: typeof booking) => ({
      portfolioId: b.portfolio_id,
      serviceId: b.service_id,
      serviceName: b.service_name,
      customerName: b.customer_name,
      start: b.start_at,
      end: b.end_at,
      status: b.status,
      timezone: b.customer_timezone,
    });
    if (action === "get") return json(view(booking));

    const active = ["pending", "confirmed"].includes(booking.status);

    if (action === "cancel") {
      if (booking.status === "cancelled") return json(view(booking));
      if (!active) return json({ error: "This booking can no longer be cancelled." }, 409);
      if (Date.parse(booking.start_at) <= Date.now()) return json({ error: "This booking has already started." }, 409);

      await admin.from("bookings").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", booking.id);
      if (booking.google_event_id) {
        const access = await getCalendarAccess(admin, booking.portfolio_id);
        if (access) await deleteEvent(access, booking.google_event_id);
      }
      const to = await ownerEmail(admin, booking.portfolio_id);
      if (to) {
        await sendEmail(
          to,
          `Booking cancelled: ${booking.service_name}`,
          `<p>${escapeHtml(booking.customer_name)} (${escapeHtml(booking.customer_email)}) cancelled their booking for ${escapeHtml(booking.service_name)}.</p>`,
        );
      }
      return json(view({ ...booking, status: "cancelled" }));
    }

    // reschedule
    if (!active) return json({ error: "This booking can no longer be changed." }, 409);
    if (Date.parse(booking.start_at) <= Date.now()) return json({ error: "This booking has already started." }, 409);
    if (!booking.service_id) return json({ error: "This service is no longer available. Please cancel and contact the provider." }, 409);
    const startMs = Date.parse(start);
    if (Number.isNaN(startMs)) return json({ error: "Invalid start time." }, 400);

    const ctx = await loadBookingContext(
      admin,
      booking.portfolio_id,
      booking.service_id,
      new Date(startMs - 2 * 86_400_000).toISOString(),
      new Date(startMs + 2 * 86_400_000).toISOString(),
      { bookingId: booking.id, startIso: booking.start_at, endIso: booking.end_at },
    );
    if (!ctx) return json({ error: "Service not available." }, 404);
    const startIso = new Date(startMs).toISOString();
    if (!isSlotAvailable(startIso, { now: Date.now(), ...ctx })) {
      return json({ error: "That time is no longer available.", code: "slot_unavailable" }, 409);
    }

    const s = ctx.service;
    const endMs = startMs + s.duration_min * 60_000;
    const { data: updated, error } = await admin
      .from("bookings")
      .update({
        start_at: startIso,
        end_at: new Date(endMs).toISOString(),
        blocked_start: new Date(startMs - s.buffer_before_min * 60_000).toISOString(),
        blocked_end: new Date(endMs + s.buffer_after_min * 60_000).toISOString(),
        reminder_sent_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .select(COLUMNS)
      .single();
    if (error) {
      // 23P01: another booking took the slot after we checked.
      if (error.code === "23P01") return json({ error: "That time was just taken.", code: "slot_unavailable" }, 409);
      throw error;
    }

    if (updated.google_event_id) {
      const access = await getCalendarAccess(admin, booking.portfolio_id);
      if (access) await updateEventTime(access, updated.google_event_id, updated.start_at, updated.end_at);
    }

    const when = new Date(startMs).toLocaleString("en-US", { timeZone: booking.customer_timezone, dateStyle: "full", timeStyle: "short" });
    const to = await ownerEmail(admin, booking.portfolio_id);
    if (to) {
      await sendEmail(
        to,
        `Booking rescheduled: ${booking.service_name}`,
        `<p>${escapeHtml(booking.customer_name)} moved their booking for ${escapeHtml(booking.service_name)} to ${escapeHtml(when)} (${escapeHtml(booking.customer_timezone)}).</p>`,
      );
    }
    await sendEmail(
      booking.customer_email,
      `Booking updated: ${booking.service_name}`,
      `<p>Hi ${escapeHtml(booking.customer_name)}, your booking for <strong>${escapeHtml(booking.service_name)}</strong> is now ${escapeHtml(when)} (${escapeHtml(booking.customer_timezone)}).</p>`,
    );

    return json(view(updated));
  } catch (error) {
    console.error("booking-manage", error);
    return json({ error: "Could not process the request." }, 500);
  }
});
