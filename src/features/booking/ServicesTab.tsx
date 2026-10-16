import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/supabaseClient";
import { BookingService, formatPrice } from "./api";

const blank = {
  name: "",
  description: "",
  duration_min: 30,
  buffer_before_min: 0,
  buffer_after_min: 0,
  price: 0,
  currency: "USD",
  location_type: "online",
  location_details: "",
  payment_mode: "none",
  deposit: 0,
  active: true,
};

type Draft = typeof blank & { id?: string };

export function ServicesTab({ portfolioId }: { portfolioId: string }) {
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeConnected, setStripeConnected] = useState(false);

  useEffect(() => {
    supabase.from("portfolios").select("stripe_account_id").eq("id", portfolioId).maybeSingle()
      .then(({ data }) => setStripeConnected(!!data?.stripe_account_id));
  }, [portfolioId]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("booking_services").select("*").eq("portfolio_id", portfolioId).order("sort_order").order("created_at");
    setServices((data as BookingService[]) ?? []);
    setLoading(false);
  }, [portfolioId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) return setError("Name is required.");
    if (draft.payment_mode !== "none" && draft.price <= 0) return setError("Set a price above 0 to charge online.");
    if (draft.payment_mode === "deposit" && (draft.deposit <= 0 || draft.deposit > draft.price)) {
      return setError("The deposit must be above 0 and not more than the price.");
    }
    setSaving(true);
    setError(null);
    const { id, price, deposit, ...rest } = draft;
    const row = {
      ...rest,
      portfolio_id: portfolioId,
      price_cents: Math.round(price * 100),
      deposit_cents: draft.payment_mode === "deposit" ? Math.round(deposit * 100) : 0,
      name: draft.name.trim(),
    };
    const { error: err } = id
      ? await supabase.from("booking_services").update(row).eq("id", id)
      : await supabase.from("booking_services").insert({ ...row, sort_order: services.length });
    setSaving(false);
    if (err) return setError(err.message);
    setDraft(null);
    load();
  };

  const remove = async (s: BookingService) => {
    if (!window.confirm(`Delete "${s.name}"? Existing bookings keep their record.`)) return;
    await supabase.from("booking_services").delete().eq("id", s.id);
    load();
  };

  const edit = (s: BookingService) =>
    setDraft({ ...s, price: s.price_cents / 100, deposit: s.deposit_cents / 100, description: s.description ?? "", location_details: s.location_details ?? "" });

  if (loading) return <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin" />;

  if (draft) {
    const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
    return (
      <div className="max-w-xl space-y-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea rows={3} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Duration (min)</Label>
            <Input type="number" min={5} max={1440} value={draft.duration_min} onChange={(e) => set({ duration_min: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Buffer before</Label>
            <Input type="number" min={0} max={240} value={draft.buffer_before_min} onChange={(e) => set({ buffer_before_min: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Buffer after</Label>
            <Input type="number" min={0} max={240} value={draft.buffer_after_min} onChange={(e) => set({ buffer_after_min: Number(e.target.value) })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Price (0 = free)</Label>
            <Input type="number" min={0} step="0.01" value={draft.price} onChange={(e) => set({ price: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input maxLength={3} value={draft.currency} onChange={(e) => set({ currency: e.target.value.toUpperCase() })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Online payment</Label>
            <Select value={draft.payment_mode} onValueChange={(v) => set({ payment_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (pay outside the platform)</SelectItem>
                <SelectItem value="deposit" disabled={!stripeConnected}>Deposit</SelectItem>
                <SelectItem value="full" disabled={!stripeConnected}>Full price</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {draft.payment_mode === "deposit" && (
            <div className="space-y-1.5">
              <Label>Deposit amount</Label>
              <Input type="number" min={0} step="0.01" value={draft.deposit} onChange={(e) => set({ deposit: Number(e.target.value) })} />
            </div>
          )}
        </div>
        {!stripeConnected && (
          <p className="text-xs text-muted-foreground">Connect Stripe under Payments & Integrations to accept deposits or full payment online.</p>
        )}
        <p className="text-xs text-muted-foreground">Paid slots are held for 15 minutes. Refunds are issued from your Stripe dashboard.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select value={draft.location_type} onValueChange={(v) => set({ location_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="in_person">In person</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Location details / link</Label>
            <Input value={draft.location_details} onChange={(e) => set({ location_details: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={draft.active} onCheckedChange={(v) => set({ active: v })} id="svc-active" />
          <Label htmlFor="svc-active">Active (visible to visitors)</Label>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save service"}</Button>
          <Button variant="ghost" onClick={() => { setDraft(null); setError(null); }}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={() => setDraft({ ...blank })}><Plus className="mr-1.5 h-4 w-4" /> Add service</Button>
      {services.length === 0 && <p className="text-sm text-muted-foreground">No services yet. Add one to start accepting bookings.</p>}
      {services.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => edit(s)}>
            <div className="font-medium">{s.name} {!s.active && <span className="text-xs text-muted-foreground">(hidden)</span>}</div>
            <div className="text-xs text-muted-foreground">{s.duration_min} min · {formatPrice(s.price_cents, s.currency)}</div>
          </button>
          <Button variant="ghost" size="icon" aria-label={`Delete ${s.name}`} onClick={() => remove(s)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
