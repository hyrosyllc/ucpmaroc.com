import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  encryptToken,
  exchangeCode,
  fetchAccountEmail,
  GOOGLE_SCOPES,
  getCalendarAccess,
  googleClientConfig,
  listWritableCalendars,
  redirectUri,
  revokeToken,
  decryptToken,
} from "../_shared/googleCalendar.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const admin = () => createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

async function requirePortfolioOwner(req: Request, db: any, portfolioId: string) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) throw new Error("Authentication is required.");
  const userClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) throw new Error("Authentication is required.");

  const { data: portfolio } = await db.from("portfolios").select("actor_id").eq("id", portfolioId).maybeSingle();
  const { data: actor } = portfolio
    ? await db.from("actors").select("user_id").eq("id", portfolio.actor_id).maybeSingle()
    : { data: null };
  if (!actor || actor.user_id !== user.id) throw new Error("You do not own this site.");
}

function redirectToApp(status: string) {
  const appUrl = Deno.env.get("APP_URL");
  if (!appUrl) return new Response(`Google Calendar: ${status}. You can close this tab.`, { status: 200 });
  return Response.redirect(`${appUrl}/dashboard/bookings?calendar=${status}`, 302);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const db = admin();

  // OAuth callback from Google.
  if (req.method === "GET") {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (url.searchParams.get("error") || !code || !state) return redirectToApp("denied");

    try {
      const { data: saved } = await db.from("calendar_oauth_states").select("portfolio_id, created_at").eq("state", state).maybeSingle();
      if (!saved) return redirectToApp("invalid");
      await db.from("calendar_oauth_states").delete().eq("state", state);
      if (Date.now() - Date.parse(saved.created_at) > 10 * 60_000) return redirectToApp("expired");

      const tokens = await exchangeCode(code);
      if (!tokens.refresh_token) return redirectToApp("no_refresh_token");
      const email = await fetchAccountEmail(tokens.access_token);

      await db.from("calendar_connection_secrets").upsert({
        portfolio_id: saved.portfolio_id,
        refresh_token_enc: await encryptToken(tokens.refresh_token),
        updated_at: new Date().toISOString(),
      });
      await db.from("calendar_connections").upsert({
        portfolio_id: saved.portfolio_id,
        provider: "google",
        account_email: email,
        sync_enabled: true,
        last_error: null,
        connected_at: new Date().toISOString(),
      });
      return redirectToApp("connected");
    } catch (error) {
      console.error("google-calendar callback", error);
      return redirectToApp("error");
    }
  }

  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const body = await req.json();
    const { action, portfolioId } = body;
    if (!UUID.test(portfolioId ?? "")) return json({ error: "Invalid request." }, 400);
    await requirePortfolioOwner(req, db, portfolioId);

    if (action === "start") {
      const { clientId } = googleClientConfig();
      const state = [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, "0")).join("");
      await db.from("calendar_oauth_states").insert({ state, portfolio_id: portfolioId });
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri(),
        response_type: "code",
        scope: GOOGLE_SCOPES,
        access_type: "offline",
        prompt: "consent",
        state,
      });
      return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    if (action === "list_calendars" || action === "set_calendar") {
      const access = await getCalendarAccess(db, portfolioId);
      if (!access) return json({ error: "Google Calendar is not connected." }, 409);
      const calendars = await listWritableCalendars(access.accessToken);
      if (action === "list_calendars") return json({ calendars, selected: access.calendarId });

      const calendarId = body.calendarId;
      if (typeof calendarId !== "string" || !calendars.some((c) => c.id === calendarId)) {
        return json({ error: "Unknown calendar." }, 400);
      }
      await db.from("calendar_connections").update({ calendar_id: calendarId }).eq("portfolio_id", portfolioId);
      return json({ ok: true });
    }

    if (action === "disconnect") {
      const { data: secret } = await db.from("calendar_connection_secrets").select("refresh_token_enc").eq("portfolio_id", portfolioId).maybeSingle();
      if (secret) {
        try {
          await revokeToken(await decryptToken(secret.refresh_token_enc));
        } catch {
          // Token already unreadable or revoked; still remove our copy.
        }
      }
      await db.from("calendar_connection_secrets").delete().eq("portfolio_id", portfolioId);
      await db.from("calendar_connections").delete().eq("portfolio_id", portfolioId);
      return json({ ok: true });
    }

    return json({ error: "Invalid action." }, 400);
  } catch (error) {
    const message = (error as Error).message;
    const status = /Authentication|own this/.test(message) ? 403 : 500;
    console.error("google-calendar", error);
    return json({ error: status === 403 ? message : "Request failed." }, status);
  }
});
