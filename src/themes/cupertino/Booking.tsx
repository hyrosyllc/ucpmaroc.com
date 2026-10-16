import React from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk";
import { SectionTitle } from "./SectionTitle";

export const schema = [
  { id: "cardStyle", type: "select", label: "Card Style", options: ["elevated", "glass", "flat-bordered"], defaultValue: "elevated" },
];

const LOCATION = { in_person: "In person", online: "Online", phone: "Phone" } as const;

export default function CupertinoBooking({ data = {}, settings = {}, id, isPreview, portfolioId }: any) {
  const f = UCP.useBookingFlow({ portfolioId, isPreview, serviceId: data.serviceId || null });
  const card =
    settings.cardStyle === "glass" ? "bg-white/50 backdrop-blur-xl border border-white shadow-lg"
    : settings.cardStyle === "flat-bordered" ? "bg-white border border-slate-200"
    : "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]";
  const primaryBtn = "w-full rounded-full bg-slate-900 px-6 py-3.5 font-bold text-white transition hover:scale-[1.01] active:scale-95 disabled:opacity-60";

  const body = () => {
    if (!portfolioId) return null;
    if (f.services === null) return <p className="py-12 text-center text-slate-400" role="status">Loading…</p>;
    if (f.services.length === 0) return <p className="py-12 text-center text-slate-400">Online booking is not available yet.</p>;

    if (f.payment && !f.result) {
      return (
        <div className={cn("mx-auto max-w-md rounded-[2rem] p-8", card)}>
          <h3 className="text-2xl font-[800] tracking-tight text-slate-900">{f.payment.serviceName}</h3>
          <p className="mb-6 mt-1 text-slate-500">{new Date(f.payment.start).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</p>
          <UCP.BookingPayment
            clientSecret={f.payment.clientSecret}
            connectedAccountId={f.payment.connectedAccountId}
            amountDueCents={f.payment.amountDueCents ?? 0}
            currency={f.service?.currency ?? "USD"}
            holdMinutes={f.payment.holdExpiresMinutes ?? 15}
            onPaid={f.markPaid}
          />
        </div>
      );
    }

    if (f.result) {
      return (
        <div className={cn("mx-auto max-w-md rounded-[2rem] p-10 text-center", card)} role="status">
          <CalendarCheck className="mx-auto mb-5 h-12 w-12 text-blue-600" aria-hidden />
          <h3 className="text-3xl font-[800] tracking-tight text-slate-900">
            {f.paid ? "Payment received" : f.result.status === "confirmed" ? "You're booked" : "Request received"}
          </h3>
          <p className="mt-3 font-medium text-slate-500">
            {f.result.serviceName}<br />
            {new Date(f.result.start).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
          </p>
          <div className="mt-8 space-y-3">
            <button type="button" className={primaryBtn} onClick={f.addToCalendar}>Add to calendar</button>
            <a href={f.manageUrl ?? "#"} className="block text-sm font-semibold text-blue-600">Reschedule or cancel</a>
          </div>
        </div>
      );
    }

    const needsPayment = f.service && f.service.payment_mode !== "none" && f.service.price_cents > 0;

    return (
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          {f.services.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={f.service?.id === s.id}
              onClick={() => f.selectService(s)}
              className={cn("w-full rounded-[1.5rem] p-5 text-left transition-all", card, f.service?.id === s.id && "ring-2 ring-slate-900")}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-lg font-bold text-slate-900">{s.name}</span>
                <span className="font-bold text-slate-900">{UCP.formatPrice(s.price_cents, s.currency)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 text-xs font-medium text-slate-400">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden /> {s.duration_min} min</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden /> {LOCATION[s.location_type]}</span>
              </div>
              {s.description && <p className="mt-2 text-sm text-slate-500">{s.description}</p>}
            </button>
          ))}
        </div>

        <div className={cn("rounded-[2rem] p-6 md:p-8", card)}>
          {!f.service ? (
            <p className="py-12 text-center text-slate-400">Choose a service to see available times.</p>
          ) : f.slot ? (
            <form onSubmit={f.submit} className="space-y-4">
              <button type="button" className="text-sm font-semibold text-blue-600" onClick={f.clearSlot}>Change time</button>
              <p className="text-lg font-bold text-slate-900">
                {new Date(f.slot.start).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
              </p>
              <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden value={f.form.website} onChange={(e) => f.setForm({ ...f.form, website: e.target.value })} />
              {(["name", "email", "phone"] as const).map((field) => (
                <label key={field} className="block text-sm font-semibold text-slate-600">
                  <span className="mb-1 block capitalize">{field}{field === "phone" ? " (optional)" : ""}</span>
                  <input
                    required={field !== "phone"}
                    type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                    autoComplete={field === "name" ? "name" : field}
                    value={f.form[field]}
                    onChange={(e) => f.setForm({ ...f.form, [field]: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900"
                  />
                </label>
              ))}
              <label className="block text-sm font-semibold text-slate-600">
                <span className="mb-1 block">Notes (optional)</span>
                <textarea rows={3} value={f.form.notes} onChange={(e) => f.setForm({ ...f.form, notes: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900" />
              </label>
              {f.error && <p role="alert" className="text-sm font-medium text-red-600">{f.error}</p>}
              <button type="submit" disabled={f.submitting} className={primaryBtn}>
                {f.submitting ? "Please wait…" : needsPayment ? "Continue to payment" : "Confirm booking"}
              </button>
            </form>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <button type="button" aria-label="Previous month" className="rounded-full p-2 hover:bg-slate-100" onClick={f.prevMonth}><ChevronLeft className="h-5 w-5" /></button>
                <span className="text-lg font-bold text-slate-900">{f.monthLabel}</span>
                <button type="button" aria-label="Next month" className="rounded-full p-2 hover:bg-slate-100" onClick={f.nextMonth}><ChevronRight className="h-5 w-5" /></button>
              </div>
              <div className={cn("grid grid-cols-7 gap-1.5 text-center", f.loadingSlots && "opacity-50")}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="py-1 text-xs font-bold text-slate-300" aria-hidden>{d}</span>)}
                {Array.from({ length: f.leadingBlanks }).map((_, i) => <span key={`b${i}`} />)}
                {f.days.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    disabled={!d.available}
                    aria-pressed={f.selectedDay === d.key}
                    aria-label={new Date(`${d.key}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "full" })}
                    onClick={() => f.selectDay(d.key)}
                    className={cn(
                      "aspect-square rounded-full text-sm transition-colors",
                      d.available ? "font-bold text-slate-900 hover:bg-slate-100" : "text-slate-300",
                      f.selectedDay === d.key && "bg-slate-900 text-white hover:bg-slate-900"
                    )}
                  >
                    {d.day}
                  </button>
                ))}
              </div>
              {f.error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{f.error}</p>}
              {f.selectedDay && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-medium text-slate-400">Times shown in {f.timeZone}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {f.timesForSelectedDay.map(({ slot, label }) => (
                      <button key={slot.start} type="button" onClick={() => f.pickSlot(slot)} className="rounded-full border border-slate-200 px-2 py-2.5 text-sm font-bold text-slate-700 hover:border-slate-900">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50 text-slate-900">
      <SectionTitle data={data} id={id} isPreview={isPreview} fallback="Book an appointment" />
      {body()}
    </section>
  );
}
