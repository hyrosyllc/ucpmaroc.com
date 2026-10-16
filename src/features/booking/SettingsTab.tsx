import React, { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/supabaseClient";

const DEFAULTS = { timezone: "UTC", min_notice_hours: 12, max_days_ahead: 60, slot_step_min: 15, auto_confirm: true };

const CALENDAR_MESSAGES: Record<string, string> = {
  connected: "Google Calendar connected.",
  denied: "Google access was not granted.",
  invalid: "The connection link was invalid. Please try again.",
  expired: "The connection link expired. Please try again.",
  no_refresh_token: "Google did not return offline access. Remove the app in your Google account and reconnect.",
  error: "Could not connect Google Calendar.",
};

export function SettingsTab({ portfolioId, publicSlug }: { portfolioId: string; publicSlug?: string }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [connection, setConnection] = useState<{ account_email: string | null; last_error: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(() => CALENDAR_MESSAGES[new URLSearchParams(window.location.search).get("calendar") ?? ""] ?? null);
  const [busy, setBusy] = useState(false);
  const [calendars, setCalendars] = useState<Array<{ id: string; name: string; primary: boolean }>>([]);
  const [calendarId, setCalendarId] = useState("");

  const timezones: string[] = (Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf("timeZone") : ["UTC"];

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from("booking_settings").select("*").eq("portfolio_id", portfolioId).maybeSingle(),
      supabase.from("calendar_connections").select("account_email, last_error").eq("portfolio_id", portfolioId).maybeSingle(),
    ]);
    setSettings(s ? { ...DEFAULTS, ...s } : { ...DEFAULTS, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    setConnection(c);
    setLoading(false);
  }, [portfolioId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!connection) return setCalendars([]);
    supabase.functions.invoke("google-calendar", { body: { action: "list_calendars", portfolioId } }).then(({ data }) => {
      setCalendars(data?.calendars ?? []);
      setCalendarId(data?.selected ?? "");
    });
  }, [connection, portfolioId]);

  const chooseCalendar = async (value: string) => {
    setCalendarId(value);
    const { error } = await supabase.functions.invoke("google-calendar", { body: { action: "set_calendar", portfolioId, calendarId: value } });
    setMessage(error ? "Could not change the calendar." : "Calendar updated. New bookings will be added to it.");
  };

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("booking_settings").upsert({
      portfolio_id: portfolioId,
      ...settings,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    setMessage(error ? error.message : "Settings saved.");
  };

  const calendarAction = async (action: "start" | "disconnect") => {
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.functions.invoke("google-calendar", { body: { action, portfolioId } });
    setBusy(false);
    if (error) return setMessage("Google Calendar is not available right now.");
    if (action === "start" && data?.url) {
      window.location.href = data.url;
      return;
    }
    load();
  };

  if (loading) return <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin" />;

  const num = (key: keyof typeof DEFAULTS) => (e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, [key]: Number(e.target.value) });

  return (
    <div className="max-w-xl space-y-8">
      <section className="space-y-4">
        <h3 className="font-semibold">Scheduling rules</h3>
        <div className="space-y-1.5">
          <Label htmlFor="bk-tz">Your time zone</Label>
          <Input id="bk-tz" list="bk-tz-list" value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
          <datalist id="bk-tz-list">{timezones.map((tz) => <option key={tz} value={tz} />)}</datalist>
          <p className="text-xs text-muted-foreground">Weekly hours are interpreted in this time zone; visitors see their own.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Minimum notice (hours)</Label>
            <Input type="number" min={0} value={settings.min_notice_hours} onChange={num("min_notice_hours")} />
          </div>
          <div className="space-y-1.5">
            <Label>Book up to (days)</Label>
            <Input type="number" min={1} max={365} value={settings.max_days_ahead} onChange={num("max_days_ahead")} />
          </div>
          <div className="space-y-1.5">
            <Label>Slot interval (min)</Label>
            <Input type="number" min={5} max={240} step={5} value={settings.slot_step_min} onChange={num("slot_step_min")} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="bk-auto" checked={settings.auto_confirm} onCheckedChange={(v) => setSettings({ ...settings, auto_confirm: v })} />
          <Label htmlFor="bk-auto">Confirm bookings automatically</Label>
        </div>
        <Button onClick={save} disabled={busy}>Save settings</Button>
        {publicSlug && (
          <p className="text-sm text-muted-foreground">
            Public booking page: <a className="text-primary underline" href={`/pro/${publicSlug}/book`} target="_blank" rel="noreferrer">/pro/{publicSlug}/book</a>
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Google Calendar</h3>
        <p className="text-sm text-muted-foreground">
          Busy times on your Google Calendar block booking slots, and confirmed bookings are added to it.
        </p>
        {connection ? (
          <>
            <p className="text-sm">Connected{connection.account_email ? ` as ${connection.account_email}` : ""}.</p>
            {calendars.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="bk-cal">Calendar to use</Label>
                <select id="bk-cal" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={calendarId} onChange={(e) => chooseCalendar(e.target.value)}>
                  {calendars.map((c) => <option key={c.id} value={c.id}>{c.name}{c.primary ? " (primary)" : ""}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Busy times on this calendar block your slots, and bookings are added to it. Only your own Google account is used.</p>
              </div>
            )}
            {connection.last_error && <p role="alert" className="text-sm text-destructive">Last sync error: {connection.last_error}. Try reconnecting.</p>}
            <div className="flex gap-2">
              <Button variant="outline" disabled={busy} onClick={() => calendarAction("start")}>Reconnect</Button>
              <Button variant="ghost" disabled={busy} onClick={() => calendarAction("disconnect")}>Disconnect</Button>
            </div>
          </>
        ) : (
          <Button disabled={busy} onClick={() => calendarAction("start")}>Connect Google Calendar</Button>
        )}
      </section>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
