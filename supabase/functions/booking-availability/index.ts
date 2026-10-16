import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { computeSlots, isValidDateString, MAX_RANGE_DAYS } from "../_shared/bookingSlots.ts";
import { loadBookingContext, sha256Hex } from "../_shared/bookingData.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const { portfolioId, serviceId, from, to, manageToken } = await req.json();
    if (!UUID.test(portfolioId ?? "") || !UUID.test(serviceId ?? "")) return json({ error: "Invalid request." }, 400);
    if (!isValidDateString(from) || !isValidDateString(to) || to < from) return json({ error: "Invalid date range." }, 400);
    const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 + 1;
    if (days > MAX_RANGE_DAYS) return json({ error: `Range cannot exceed ${MAX_RANGE_DAYS} days.` }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // When rescheduling, the customer's own booking must not block its replacement times.
    let ignore;
    if (typeof manageToken === "string" && /^[0-9a-f]{48}$/.test(manageToken)) {
      const { data: own } = await admin
        .from("bookings")
        .select("id, start_at, end_at")
        .eq("manage_token_hash", await sha256Hex(manageToken))
        .eq("portfolio_id", portfolioId)
        .maybeSingle();
      if (own) ignore = { bookingId: own.id, startIso: own.start_at, endIso: own.end_at };
    }

    // Pad by a day each side so timezone offsets never clip busy ranges.
    const rangeStart = new Date(Date.parse(`${from}T00:00:00Z`) - 86_400_000).toISOString();
    const rangeEnd = new Date(Date.parse(`${to}T00:00:00Z`) + 2 * 86_400_000).toISOString();

    const ctx = await loadBookingContext(admin, portfolioId, serviceId, rangeStart, rangeEnd, ignore);
    if (!ctx) return json({ error: "Service not available." }, 404);

    const slots = computeSlots({ from, to, now: Date.now(), ...ctx });
    return json({ timezone: ctx.settings.timezone, slots });
  } catch (error) {
    console.error("booking-availability", error);
    return json({ error: "Could not load availability." }, 500);
  }
});
