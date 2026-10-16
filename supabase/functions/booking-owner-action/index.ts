import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { deleteEvent, getCalendarAccess } from "../_shared/googleCalendar.ts";
import { escapeHtml, sendEmail } from "../_shared/bookingData.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const STATUSES = ["cancelled", "completed", "no_show", "confirmed"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication is required." }, 401);

    const { bookingId, status } = await req.json();
    if (typeof bookingId !== "string" || !STATUSES.includes(status)) return json({ error: "Invalid request." }, 400);

    const userClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authorization } },
    });
    // RLS limits this select to bookings of portfolios the caller owns.
    const { data: booking } = await userClient
      .from("bookings")
      .select("id, portfolio_id, status, google_event_id, customer_name, customer_email, customer_timezone, service_name, start_at")
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return json({ error: "Booking not found." }, 404);

    const { error } = await userClient.from("bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", bookingId);
    if (error) {
      // 23P01: re-confirming a cancelled booking whose slot has since been taken.
      if (error.code === "23P01") return json({ error: "That time slot is now taken." }, 409);
      throw error;
    }

    if (status === "cancelled" && booking.google_event_id) {
      const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      const access = await getCalendarAccess(admin, booking.portfolio_id);
      if (access) await deleteEvent(access, booking.google_event_id);
    }

    if ((status === "cancelled" || status === "confirmed") && status !== booking.status) {
      const when = new Date(booking.start_at).toLocaleString("en-US", { timeZone: booking.customer_timezone, dateStyle: "full", timeStyle: "short" });
      await sendEmail(
        booking.customer_email,
        `Booking ${status}: ${booking.service_name}`,
        `<p>Hi ${escapeHtml(booking.customer_name)}, your booking for <strong>${escapeHtml(booking.service_name)}</strong> on ${escapeHtml(when)} (${escapeHtml(booking.customer_timezone)}) has been ${status} by the provider.</p>`,
      );
    }

    return json({ ok: true });
  } catch (error) {
    console.error("booking-owner-action", error);
    return json({ error: "Could not update the booking." }, 500);
  }
});
