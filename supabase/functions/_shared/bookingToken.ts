const encoder = new TextEncoder();

/** Deterministic per-booking token, so server code can rebuild the customer's manage link later. */
export async function manageTokenFor(bookingId: string): Promise<string> {
  const secret = Deno.env.get("BOOKING_TOKEN_SECRET");
  if (!secret) throw new Error("BOOKING_TOKEN_SECRET is not configured.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`booking:${bookingId}`)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 48);
}
