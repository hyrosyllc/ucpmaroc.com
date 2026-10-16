import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isSlotAvailable } from "../_shared/bookingSlots.ts";
import { loadBookingContext, sha256Hex } from "../_shared/bookingData.ts";
import { finalizeBooking } from "../_shared/bookingFulfillment.ts";
import { manageTokenFor } from "../_shared/bookingToken.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ACTIVE_PER_EMAIL = 5;
const HOLD_MINUTES = 15;

function validTimezone(tz: unknown): tz is string {
  if (typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Direct charge on the seller's connected account, confirmed by the Connect webhook. */
async function createPaymentIntent(opts: {
  amountCents: number;
  currency: string;
  connectedAccountId: string;
  bookingId: string;
  portfolioId: string;
  email: string;
}) {
  const secret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secret) throw new Error("Stripe is not configured.");
  const body = new URLSearchParams({
    amount: String(opts.amountCents),
    currency: opts.currency.toLowerCase(),
    "automatic_payment_methods[enabled]": "true",
    receipt_email: opts.email,
    "metadata[booking_checkout]": "true",
    "metadata[booking_id]": opts.bookingId,
    "metadata[portfolio_id]": opts.portfolioId,
    "metadata[connected_account_id]": opts.connectedAccountId,
  });
  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Stripe-Account": opts.connectedAccountId,
      "Idempotency-Key": `booking_${opts.bookingId}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Stripe request failed.");
  return data as { id: string; client_secret: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const body = await req.json();
    const { portfolioId, serviceId, start, name, email, phone, notes, customerTimezone, website } = body;

    if (website) return json({ ok: true }); // honeypot: pretend success to bots
    if (!UUID.test(portfolioId ?? "") || !UUID.test(serviceId ?? "")) return json({ error: "Invalid request." }, 400);
    const startMs = Date.parse(start);
    if (Number.isNaN(startMs)) return json({ error: "Invalid start time." }, 400);
    const cleanName = String(name ?? "").trim();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (cleanName.length < 1 || cleanName.length > 120) return json({ error: "Please enter your name." }, 400);
    if (!EMAIL.test(cleanEmail) || cleanEmail.length > 200) return json({ error: "Please enter a valid email." }, 400);
    const cleanPhone = phone ? String(phone).slice(0, 40) : null;
    const cleanNotes = notes ? String(notes).slice(0, 2000) : null;
    const tz = validTimezone(customerTimezone) ? customerTimezone : "UTC";

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Release expired unpaid holds so their slots can be booked again.
    await admin
      .from("bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("portfolio_id", portfolioId)
      .eq("status", "pending")
      .eq("payment_status", "unpaid")
      .lt("hold_expires_at", new Date().toISOString());

    const rangeStart = new Date(startMs - 2 * 86_400_000).toISOString();
    const rangeEnd = new Date(startMs + 2 * 86_400_000).toISOString();

    const ctx = await loadBookingContext(admin, portfolioId, serviceId, rangeStart, rangeEnd);
    if (!ctx) return json({ error: "Service not available." }, 404);
    if (!isSlotAvailable(new Date(startMs).toISOString(), { now: Date.now(), ...ctx })) {
      return json({ error: "That time is no longer available.", code: "slot_unavailable" }, 409);
    }

    const { count } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("portfolio_id", portfolioId)
      .eq("customer_email", cleanEmail)
      .in("status", ["pending", "confirmed"])
      .gt("start_at", new Date().toISOString());
    if ((count ?? 0) >= MAX_ACTIVE_PER_EMAIL) return json({ error: "Too many upcoming bookings for this email." }, 429);

    const s = ctx.service;
    const { data: portfolio } = await admin.from("portfolios").select("stripe_account_id").eq("id", portfolioId).maybeSingle();

    // Charge online only when the service asks for it and the seller can receive card payments.
    const amountDueCents =
      s.payment_mode === "full" ? s.price_cents : s.payment_mode === "deposit" ? Math.min(s.deposit_cents, s.price_cents) : 0;
    const needsPayment = amountDueCents > 0;
    if (needsPayment && !portfolio?.stripe_account_id) {
      return json({ error: "Online payment is not available for this service right now." }, 409);
    }

    const endMs = startMs + s.duration_min * 60_000;
    const bookingId = crypto.randomUUID();
    const manageToken = await manageTokenFor(bookingId);

    const { data: booking, error: insertError } = await admin
      .from("bookings")
      .insert({
        id: bookingId,
        portfolio_id: portfolioId,
        service_id: s.id,
        service_name: s.name,
        customer_name: cleanName,
        customer_email: cleanEmail,
        customer_phone: cleanPhone,
        notes: cleanNotes,
        customer_timezone: tz,
        start_at: new Date(startMs).toISOString(),
        end_at: new Date(endMs).toISOString(),
        blocked_start: new Date(startMs - s.buffer_before_min * 60_000).toISOString(),
        blocked_end: new Date(endMs + s.buffer_after_min * 60_000).toISOString(),
        status: needsPayment ? "pending" : ctx.settings.auto_confirm ? "confirmed" : "pending",
        price_cents: s.price_cents,
        currency: s.currency,
        amount_due_cents: amountDueCents,
        payment_status: needsPayment ? "unpaid" : s.price_cents > 0 ? "unpaid" : "not_required",
        hold_expires_at: needsPayment ? new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString() : null,
        manage_token_hash: await sha256Hex(manageToken),
      })
      .select("id, status, start_at, end_at")
      .single();

    if (insertError) {
      // 23P01 = exclusion_violation: another booking took the slot after we checked.
      if (insertError.code === "23P01") return json({ error: "That time was just taken.", code: "slot_unavailable" }, 409);
      throw insertError;
    }

    const result = {
      bookingId: booking.id,
      status: booking.status,
      start: booking.start_at,
      end: booking.end_at,
      manageToken,
      serviceName: s.name,
    };

    if (needsPayment) {
      try {
        const intent = await createPaymentIntent({
          amountCents: amountDueCents,
          currency: s.currency,
          connectedAccountId: portfolio!.stripe_account_id,
          bookingId: booking.id,
          portfolioId,
          email: cleanEmail,
        });
        await admin.from("bookings").update({ stripe_payment_intent_id: intent.id }).eq("id", booking.id);
        return json({
          ...result,
          requiresPayment: true,
          clientSecret: intent.client_secret,
          connectedAccountId: portfolio!.stripe_account_id,
          amountDueCents,
          holdExpiresMinutes: HOLD_MINUTES,
        });
      } catch (paymentError) {
        // Do not leave an unpayable hold behind.
        await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
        throw paymentError;
      }
    }

    await finalizeBooking(admin, booking.id);
    return json(result);
  } catch (error) {
    console.error("booking-create", error);
    return json({ error: "Could not create the booking." }, 500);
  }
});
