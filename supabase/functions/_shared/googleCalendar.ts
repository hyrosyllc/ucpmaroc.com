import type { BusyRange } from "./bookingSlots.ts";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
export const GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/userinfo.email";

const encoder = new TextEncoder();

function b64encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function b64decode(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function encryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("CALENDAR_TOKEN_KEY");
  if (!secret) throw new Error("CALENDAR_TOKEN_KEY is not configured.");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptToken(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), encoder.encode(plain)));
  return `${b64encode(iv)}.${b64encode(cipher)}`;
}

export async function decryptToken(stored: string): Promise<string> {
  const [iv, cipher] = stored.split(".");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64decode(iv) }, await encryptionKey(), b64decode(cipher));
  return new TextDecoder().decode(plain);
}

export function googleClientConfig() {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured.");
  return { clientId, clientSecret };
}

export function redirectUri(): string {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar`;
}

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.error || "Google token request failed.");
  return json as { access_token: string; refresh_token?: string; expires_in: number };
}

export function exchangeCode(code: string) {
  const { clientId, clientSecret } = googleClientConfig();
  return tokenRequest({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = googleClientConfig();
  const json = await tokenRequest({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
  return json.access_token;
}

export async function fetchAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()).email ?? null;
}

export async function revokeToken(token: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => {});
}

export interface CalendarAccess {
  accessToken: string;
  calendarId: string;
}

/** Returns a ready-to-use access token for a portfolio, or null when sync is off or broken. */
export async function getCalendarAccess(admin: any, portfolioId: string): Promise<CalendarAccess | null> {
  const { data: connection } = await admin
    .from("calendar_connections")
    .select("calendar_id, sync_enabled")
    .eq("portfolio_id", portfolioId)
    .maybeSingle();
  if (!connection?.sync_enabled) return null;

  const { data: secret } = await admin
    .from("calendar_connection_secrets")
    .select("refresh_token_enc")
    .eq("portfolio_id", portfolioId)
    .maybeSingle();
  if (!secret) return null;

  try {
    const accessToken = await refreshAccessToken(await decryptToken(secret.refresh_token_enc));
    return { accessToken, calendarId: connection.calendar_id };
  } catch (error) {
    await admin.from("calendar_connections").update({ last_error: String((error as Error).message).slice(0, 300) }).eq("portfolio_id", portfolioId);
    return null;
  }
}

export async function fetchBusy(access: CalendarAccess, timeMin: string, timeMax: string): Promise<BusyRange[]> {
  const res = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: access.calendarId }] }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  const busy: Array<{ start: string; end: string }> = json.calendars?.[access.calendarId]?.busy ?? [];
  return busy.map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
}

export interface CalendarSummary {
  id: string;
  name: string;
  primary: boolean;
}

/** Calendars the connected account can write events to. */
export async function listWritableCalendars(accessToken: string): Promise<CalendarSummary[]> {
  const res = await fetch(`${CALENDAR_API}/users/me/calendarList?minAccessRole=writer`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items ?? []).map((c: any) => ({ id: c.id, name: c.summaryOverride || c.summary || c.id, primary: !!c.primary }));
}

export interface EventInput {
  summary: string;
  description?: string;
  location?: string;
  startIso: string;
  endIso: string;
  attendeeEmail?: string;
}

export async function createEvent(access: CalendarAccess, event: EventInput): Promise<string | null> {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(access.calendarId)}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: event.startIso },
      end: { dateTime: event.endIso },
    }),
  });
  if (!res.ok) return null;
  return (await res.json()).id ?? null;
}

export async function updateEventTime(access: CalendarAccess, eventId: string, startIso: string, endIso: string) {
  await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(access.calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${access.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ start: { dateTime: startIso }, end: { dateTime: endIso } }),
  }).catch(() => {});
}

export async function deleteEvent(access: CalendarAccess, eventId: string) {
  await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(access.calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${access.accessToken}` },
  }).catch(() => {});
}
