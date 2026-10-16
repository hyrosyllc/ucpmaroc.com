import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/supabaseClient";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Rule { weekday: number; start_time: string; end_time: string }
interface Exception { id: string; on_date: string; is_closed: boolean; start_time: string | null; end_time: string | null; note: string | null }

const hhmm = (v: string) => v.slice(0, 5);

export function AvailabilityTab({ portfolioId }: { portfolioId: string }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newEx, setNewEx] = useState({ on_date: "", is_closed: true, start_time: "09:00", end_time: "13:00" });

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: r }, { data: e }] = await Promise.all([
      supabase.from("booking_availability_rules").select("weekday, start_time, end_time").eq("portfolio_id", portfolioId).order("start_time"),
      supabase.from("booking_availability_exceptions").select("*").eq("portfolio_id", portfolioId).order("on_date"),
    ]);
    setRules((r ?? []).map((x: any) => ({ ...x, start_time: hhmm(x.start_time), end_time: hhmm(x.end_time) })));
    setExceptions((e as Exception[]) ?? []);
    setLoading(false);
  }, [portfolioId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRule = (index: number, patch: Partial<Rule>) => setRules(rules.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const saveRules = async () => {
    if (rules.some((r) => r.end_time <= r.start_time)) return setMessage("End time must be after start time.");
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.rpc("replace_booking_rules", { p_portfolio_id: portfolioId, p_rules: rules });
    setSaving(false);
    setMessage(error?.message || "Weekly hours saved.");
  };

  const addException = async () => {
    if (!newEx.on_date) return setMessage("Pick a date.");
    if (!newEx.is_closed && newEx.end_time <= newEx.start_time) return setMessage("End time must be after start time.");
    const { error } = await supabase.from("booking_availability_exceptions").insert({
      portfolio_id: portfolioId,
      on_date: newEx.on_date,
      is_closed: newEx.is_closed,
      start_time: newEx.is_closed ? null : newEx.start_time,
      end_time: newEx.is_closed ? null : newEx.end_time,
    });
    setMessage(error?.message ?? null);
    if (!error) {
      setNewEx({ ...newEx, on_date: "" });
      load();
    }
  };

  const removeException = async (id: string) => {
    await supabase.from("booking_availability_exceptions").delete().eq("id", id);
    load();
  };

  if (loading) return <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin" />;

  return (
    <div className="max-w-2xl space-y-8">
      <section className="space-y-3">
        <h3 className="font-semibold">Weekly hours</h3>
        {DAYS.map((day, weekday) => (
          <div key={day} className="flex flex-wrap items-start gap-3 border-b pb-3">
            <span className="w-24 pt-2 text-sm">{day}</span>
            <div className="space-y-2">
              {rules.map((r, index) =>
                r.weekday !== weekday ? null : (
                  <div key={index} className="flex items-center gap-2">
                    <Input type="time" aria-label={`${day} start`} className="w-32" value={r.start_time} onChange={(e) => updateRule(index, { start_time: e.target.value })} />
                    <span>–</span>
                    <Input type="time" aria-label={`${day} end`} className="w-32" value={r.end_time} onChange={(e) => updateRule(index, { end_time: e.target.value })} />
                    <Button variant="ghost" size="icon" aria-label="Remove hours" onClick={() => setRules(rules.filter((_, i) => i !== index))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              )}
              {!rules.some((r) => r.weekday === weekday) && <span className="text-sm text-muted-foreground">Unavailable</span>}
            </div>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setRules([...rules, { weekday, start_time: "09:00", end_time: "17:00" }])}>
              <Plus className="mr-1 h-3 w-3" /> Add hours
            </Button>
          </div>
        ))}
        <Button onClick={saveRules} disabled={saving}>{saving ? "Saving…" : "Save weekly hours"}</Button>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Days off and special hours</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={newEx.on_date} onChange={(e) => setNewEx({ ...newEx, on_date: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Switch id="ex-closed" checked={newEx.is_closed} onCheckedChange={(v) => setNewEx({ ...newEx, is_closed: v })} />
            <Label htmlFor="ex-closed">Closed all day</Label>
          </div>
          {!newEx.is_closed && (
            <>
              <Input type="time" aria-label="Special start" className="w-32" value={newEx.start_time} onChange={(e) => setNewEx({ ...newEx, start_time: e.target.value })} />
              <Input type="time" aria-label="Special end" className="w-32" value={newEx.end_time} onChange={(e) => setNewEx({ ...newEx, end_time: e.target.value })} />
            </>
          )}
          <Button onClick={addException}>Add</Button>
        </div>
        {exceptions.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            <span>{e.on_date}: {e.is_closed ? "Closed" : `${hhmm(e.start_time!)}–${hhmm(e.end_time!)}`}</span>
            <Button variant="ghost" size="icon" aria-label="Remove exception" onClick={() => removeException(e.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </section>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
