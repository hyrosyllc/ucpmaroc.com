import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/supabaseClient";
import { formatPrice } from "./api";
import { ServicesTab } from "./ServicesTab";
import { AvailabilityTab } from "./AvailabilityTab";
import { SettingsTab } from "./SettingsTab";

interface BookingRow {
  id: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  notes: string | null;
  start_at: string;
  end_at: string;
  status: string;
  price_cents: number;
  currency: string;
  payment_status: string;
  amount_due_cents: number;
}

type Filter = "upcoming" | "past" | "cancelled";

function BookingsList({ portfolioId }: { portfolioId: string }) {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date().toISOString();
    let q = supabase.from("bookings").select("*").eq("portfolio_id", portfolioId);
    if (filter === "upcoming") q = q.in("status", ["pending", "confirmed"]).gte("end_at", now).order("start_at");
    else if (filter === "past") q = q.in("status", ["pending", "confirmed", "completed", "no_show"]).lt("end_at", now).order("start_at", { ascending: false });
    else q = q.eq("status", "cancelled").order("start_at", { ascending: false });
    const { data } = await q.limit(200);
    setRows((data as BookingRow[]) ?? []);
    setLoading(false);
  }, [portfolioId, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, status: string) => {
    if (status === "cancelled" && !window.confirm("Cancel this booking?")) return;
    setError(null);
    const { error: err } = await supabase.functions.invoke("booking-owner-action", { body: { bookingId: id, status } });
    if (err) setError("Could not update the booking.");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="group" aria-label="Filter bookings">
        {(["upcoming", "past", "cancelled"] as Filter[]).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="capitalize" onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading ? (
        <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {filter} bookings.</p>
      ) : (
        rows.map((b) => (
          <div key={b.id} className="space-y-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">{b.service_name}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(b.start_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">{b.status.replace("_", " ")}</Badge>
            </div>
            {b.price_cents > 0 && (
              <div className="text-xs text-muted-foreground">
                {formatPrice(b.price_cents, b.currency)} · payment {b.payment_status.replace("_", " ")}
                {b.amount_due_cents > 0 && b.amount_due_cents < b.price_cents ? ` (deposit ${formatPrice(b.amount_due_cents, b.currency)})` : ""}
              </div>
            )}
            <div className="text-sm">
              {b.customer_name} · <a className="text-primary underline" href={`mailto:${b.customer_email}`}>{b.customer_email}</a>
              {b.customer_phone && ` · ${b.customer_phone}`}
            </div>
            {b.notes && <p className="whitespace-pre-line text-sm text-muted-foreground">{b.notes}</p>}
            <div className="flex flex-wrap gap-2">
              {b.status === "pending" && !(b.amount_due_cents > 0 && b.payment_status === "unpaid") && <Button size="sm" onClick={() => act(b.id, "confirmed")}>Confirm</Button>}
              {b.status === "pending" && b.amount_due_cents > 0 && b.payment_status === "unpaid" && <span className="self-center text-xs text-muted-foreground">Awaiting payment</span>}
              {["pending", "confirmed"].includes(b.status) && new Date(b.end_at) < new Date() && (
                <>
                  <Button size="sm" variant="outline" onClick={() => act(b.id, "completed")}>Mark completed</Button>
                  <Button size="sm" variant="outline" onClick={() => act(b.id, "no_show")}>No-show</Button>
                </>
              )}
              {["pending", "confirmed"].includes(b.status) && new Date(b.start_at) > new Date() && (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => act(b.id, "cancelled")}>Cancel</Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function BookingsDashboardPage() {
  const { actorData, selectedSiteId } = useOutletContext<ActorDashboardContextType>();
  const [sites, setSites] = useState<Array<{ id: string; site_name: string; public_slug: string }>>([]);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!actorData?.id) return;
    supabase
      .from("portfolios")
      .select("id, site_name, public_slug")
      .eq("actor_id", actorData.id)
      .then(({ data }) => {
        setSites(data ?? []);
        setLoaded(true);
      });
  }, [actorData?.id]);

  useEffect(() => {
    if (!loaded) return;
    setSiteId(selectedSiteId !== "all" && sites.some((s) => s.id === selectedSiteId) ? selectedSiteId : sites[0]?.id ?? null);
  }, [loaded, selectedSiteId, sites]);

  if (!loaded) return <Loader2 className="mx-auto my-20 h-6 w-6 animate-spin" />;
  if (!siteId) return <p className="p-8 text-muted-foreground">Create a website first to accept bookings.</p>;

  const site = sites.find((s) => s.id === siteId);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Bookings</h1>
        {sites.length > 1 && (
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.site_name || "Untitled Site"}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      <Tabs defaultValue={new URLSearchParams(window.location.search).get("calendar") ? "settings" : "bookings"}>
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="settings">Settings & Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings" className="pt-4"><BookingsList key={siteId} portfolioId={siteId} /></TabsContent>
        <TabsContent value="services" className="pt-4"><ServicesTab key={siteId} portfolioId={siteId} /></TabsContent>
        <TabsContent value="availability" className="pt-4"><AvailabilityTab key={siteId} portfolioId={siteId} /></TabsContent>
        <TabsContent value="settings" className="pt-4"><SettingsTab key={siteId} portfolioId={siteId} publicSlug={site?.public_slug} /></TabsContent>
      </Tabs>
    </div>
  );
}
