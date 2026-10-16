import { fetchBusy, getCalendarAccess } from "./googleCalendar.ts";
import type { AvailabilityException, AvailabilityRule, BusyRange, SlotService, SlotSettings } from "./bookingSlots.ts";

export const DEFAULT_SETTINGS: SlotSettings & { auto_confirm: boolean } = {
  timezone: "UTC",
  min_notice_hours: 12,
  max_days_ahead: 60,
  slot_step_min: 15,
  auto_confirm: true,
};

export interface BookingContext {
  settings: SlotSettings & { auto_confirm: boolean };
  service: SlotService & { id: string; name: string; price_cents: number; currency: string; location_type: string; location_details: string | null; payment_mode: string; deposit_cents: number };
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  busy: BusyRange[];
}

/** Loads everything slot computation needs for one service. Returns null when the service is not bookable. */
export async function loadBookingContext(
  admin: any,
  portfolioId: string,
  serviceId: string,
  rangeStartIso: string,
  rangeEndIso: string,
  ignore?: { bookingId: string; startIso: string; endIso: string },
): Promise<BookingContext | null> {
  const { data: service } = await admin
    .from("booking_services")
    .select("id, name, duration_min, buffer_before_min, buffer_after_min, price_cents, currency, location_type, location_details, payment_mode, deposit_cents")
    .eq("id", serviceId)
    .eq("portfolio_id", portfolioId)
    .eq("active", true)
    .maybeSingle();
  if (!service) return null;

  const [{ data: settings }, { data: rules }, { data: exceptions }, { data: bookings }] = await Promise.all([
    admin.from("booking_settings").select("*").eq("portfolio_id", portfolioId).maybeSingle(),
    admin.from("booking_availability_rules").select("weekday, start_time, end_time").eq("portfolio_id", portfolioId),
    admin.from("booking_availability_exceptions").select("on_date, is_closed, start_time, end_time").eq("portfolio_id", portfolioId),
    admin
      .from("bookings")
      .select("id, blocked_start, blocked_end, status, hold_expires_at")
      .eq("portfolio_id", portfolioId)
      .in("status", ["pending", "confirmed"])
      .lt("blocked_start", rangeEndIso)
      .gt("blocked_end", rangeStartIso),
  ]);

  const busy: BusyRange[] = (bookings ?? [])
    .filter((b: any) => b.id !== ignore?.bookingId)
    // An unpaid hold that has expired no longer reserves its slot.
    .filter((b: any) => !(b.status === "pending" && b.hold_expires_at && Date.parse(b.hold_expires_at) < Date.now()))
    .map((b: any) => ({
      start: Date.parse(b.blocked_start),
      end: Date.parse(b.blocked_end),
    }));

  const access = await getCalendarAccess(admin, portfolioId);
  if (access) {
    const external = await fetchBusy(access, rangeStartIso, rangeEndIso);
    // The booking's own synced Google event must not block its new time.
    const own = ignore && { start: Date.parse(ignore.startIso), end: Date.parse(ignore.endIso) };
    busy.push(...external.filter((b) => !(own && b.start === own.start && b.end === own.end)));
  }

  return {
    settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
    service,
    rules: rules ?? [],
    exceptions: exceptions ?? [],
    busy,
  };
}

export async function sendEmail(to: string, subject: string, html: string, replyTo?: string | null) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key || !to.includes("@")) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("EMAIL_FROM") || "Bookings <orders@resend.dev>",
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  }).catch((e) => {
    console.error("sendEmail network error", e);
    return null;
  });
  if (res && !res.ok) console.error("sendEmail failed", res.status, await res.text());
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
