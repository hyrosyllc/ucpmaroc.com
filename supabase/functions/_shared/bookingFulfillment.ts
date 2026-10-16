import { escapeHtml, sendEmail } from "./bookingData.ts";
import { manageTokenFor } from "./bookingToken.ts";
import { createEvent, getCalendarAccess } from "./googleCalendar.ts";

/** Side effects of a confirmed booking: Google event and notification emails. Safe to call once per confirmation. */
export async function finalizeBooking(admin: any, bookingId: string) {
  const { data: booking } = await admin
    .from("bookings")
    .select("id, portfolio_id, service_id, service_name, customer_name, customer_email, customer_phone, notes, customer_timezone, start_at, end_at, status, google_event_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return;

  const [{ data: service }, { data: portfolio }] = await Promise.all([
    booking.service_id
      ? admin.from("booking_services").select("location_details").eq("id", booking.service_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from("portfolios").select("public_slug, actor_id").eq("id", booking.portfolio_id).maybeSingle(),
  ]);
  const { data: actor } = portfolio
    ? await admin.from("actors").select("ActorEmail").eq("id", portfolio.actor_id).maybeSingle()
    : { data: null };

  if (booking.status === "confirmed" && !booking.google_event_id) {
    const access = await getCalendarAccess(admin, booking.portfolio_id);
    if (access) {
      const eventId = await createEvent(access, {
        summary: `${booking.service_name}: ${booking.customer_name}`,
        description: [
          `Email: ${booking.customer_email}`,
          booking.customer_phone && `Phone: ${booking.customer_phone}`,
          booking.notes && `Notes: ${booking.notes}`,
        ].filter(Boolean).join("\n"),
        location: service?.location_details ?? undefined,
        startIso: booking.start_at,
        endIso: booking.end_at,
      });
      if (eventId) await admin.from("bookings").update({ google_event_id: eventId }).eq("id", booking.id);
    }
  }

  const tz = booking.customer_timezone;
  const when = new Date(booking.start_at).toLocaleString("en-US", { timeZone: tz, dateStyle: "full", timeStyle: "short" });
  const appUrl = Deno.env.get("APP_URL");
  const manageUrl = appUrl && portfolio?.public_slug
    ? `${appUrl}/pro/${portfolio.public_slug}/book?manage=${await manageTokenFor(bookingId)}`
    : null;

  await sendEmail(
    booking.customer_email,
    `Booking ${booking.status === "confirmed" ? "confirmed" : "received"}: ${booking.service_name}`,
    `<p>Hi ${escapeHtml(booking.customer_name)},</p><p>Your booking for <strong>${escapeHtml(booking.service_name)}</strong> on ${escapeHtml(when)} (${escapeHtml(tz)}) is ${booking.status}.</p>${manageUrl ? `<p><a href="${manageUrl}">Reschedule or cancel</a></p>` : ""}`,
    actor?.ActorEmail,
  );
  if (actor?.ActorEmail) {
    await sendEmail(
      actor.ActorEmail,
      `New booking: ${booking.service_name}`,
      `<p>${escapeHtml(booking.customer_name)} (${escapeHtml(booking.customer_email)}) booked <strong>${escapeHtml(booking.service_name)}</strong> for ${escapeHtml(when)} (${escapeHtml(tz)}).</p>`,
      booking.customer_email,
    );
  }
}
