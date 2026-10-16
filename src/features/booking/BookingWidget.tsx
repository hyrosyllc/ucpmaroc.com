import React from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingService, ManagedBooking, formatPrice } from "./api";
import { BookingPayment } from "./BookingPayment";
import { useBookingFlow } from "./useBookingFlow";

const LOCATION_LABEL = { in_person: "In person", online: "Online", phone: "Phone" } as const;

interface Props {
  portfolioId: string;
  /** Builder preview: no real bookings are created. */
  isPreview?: boolean;
  /** Preselect a service (e.g., from a per-service link). */
  serviceId?: string | null;
  /** Move an existing booking instead of creating one. */
  reschedule?: { token: string; serviceId: string; onDone: (booking: ManagedBooking) => void };
}

export const BookingWidget: React.FC<Props> = ({ portfolioId, isPreview, serviceId, reschedule }) => {
  const f = useBookingFlow({ portfolioId, isPreview, serviceId, reschedule });
  const { services, service, slot, form, result, payment } = f;

  if (services === null) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="Loading booking">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (services.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Online booking is not available yet.</p>;
  }

  if (payment && !result) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-6">
        <h3 className="mb-1 text-lg font-semibold">{payment.serviceName}</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {new Date(payment.start).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
        </p>
        <BookingPayment
          clientSecret={payment.clientSecret!}
          connectedAccountId={payment.connectedAccountId!}
          amountDueCents={payment.amountDueCents ?? 0}
          currency={service?.currency ?? "USD"}
          holdMinutes={payment.holdExpiresMinutes ?? 15}
          onPaid={f.markPaid}
        />
      </div>
    );
  }

  if (result) {
    const when = new Date(result.start).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center" role="status">
        <CalendarCheck className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden />
        <h3 className="text-xl font-semibold">
          {f.paid ? "Payment received" : result.status === "confirmed" ? "You're booked" : "Request received"}
        </h3>
        <p className="mt-2 text-muted-foreground">
          {result.serviceName}
          <br />
          {when}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {f.paid ? "Your booking is being confirmed; you will get an email shortly." : `A confirmation was sent to ${form.email}.`}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground" onClick={f.addToCalendar}>
            Add to calendar
          </button>
          <a href={f.manageUrl ?? "#"} className="text-sm text-primary underline">
            Reschedule or cancel
          </a>
        </div>
      </div>
    );
  }

  const confirmLabel = reschedule
    ? "Move booking"
    : service && service.payment_mode !== "none" && service.price_cents > 0
      ? "Continue to payment"
      : "Confirm booking";

  const renderService = (s: BookingService) => (
    <button
      key={s.id}
      type="button"
      aria-pressed={service?.id === s.id}
      onClick={() => f.selectService(s)}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        service?.id === s.id && "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium">{s.name}</span>
        <span className="shrink-0 text-sm font-semibold">{formatPrice(s.price_cents, s.currency)}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden /> {s.duration_min} min
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" aria-hidden /> {LOCATION_LABEL[s.location_type]}
        </span>
        {s.payment_mode === "deposit" && s.deposit_cents > 0 && <span>Deposit {formatPrice(s.deposit_cents, s.currency)}</span>}
      </div>
      {s.description && <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>}
    </button>
  );

  return (
    <div className={cn("mx-auto grid max-w-4xl gap-8", !reschedule && "md:grid-cols-[1fr_1.2fr]")}>
      {!reschedule && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Service</h3>
          {services.map(renderService)}
        </div>
      )}

      <div className="rounded-2xl border bg-card p-5">
        {!service ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Choose a service to see available times.</p>
        ) : slot ? (
          <form onSubmit={f.submit} className="space-y-3">
            <button type="button" className="text-sm text-primary underline" onClick={f.clearSlot}>
              Change time
            </button>
            <p className="font-medium">
              {new Date(slot.start).toLocaleDateString(undefined, { dateStyle: "full" })},{" "}
              {new Date(slot.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </p>
            {!reschedule && (
              <>
                <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={(e) => f.setForm({ ...form, website: e.target.value })} />
                {(["name", "email", "phone"] as const).map((field) => (
                  <label key={field} className="block text-sm">
                    <span className="mb-1 block capitalize">{field}{field === "phone" ? " (optional)" : ""}</span>
                    <input
                      required={field !== "phone"}
                      type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                      autoComplete={field === "name" ? "name" : field}
                      value={form[field]}
                      onChange={(e) => f.setForm({ ...form, [field]: e.target.value })}
                      className="w-full rounded-lg border bg-background px-3 py-2"
                    />
                  </label>
                ))}
                <label className="block text-sm">
                  <span className="mb-1 block">Notes (optional)</span>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => f.setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />
                </label>
              </>
            )}
            {f.error && <p role="alert" className="text-sm text-destructive">{f.error}</p>}
            <button
              type="submit"
              disabled={f.submitting}
              className="w-full rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-60"
            >
              {f.submitting ? "Please wait…" : confirmLabel}
            </button>
          </form>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <button type="button" aria-label="Previous month" className="rounded-full p-2 hover:bg-muted" onClick={f.prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium">{f.monthLabel}</span>
              <button type="button" aria-label="Next month" className="rounded-full p-2 hover:bg-muted" onClick={f.nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className={cn("grid grid-cols-7 gap-1 text-center text-sm", f.loadingSlots && "opacity-50")}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i} className="py-1 text-xs text-muted-foreground" aria-hidden>{d}</span>
              ))}
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
                    "aspect-square rounded-lg text-sm transition-colors",
                    d.available ? "font-medium hover:bg-primary/10" : "text-muted-foreground/40",
                    f.selectedDay === d.key && "bg-primary text-primary-foreground hover:bg-primary"
                  )}
                >
                  {d.day}
                </button>
              ))}
            </div>
            {f.error && <p role="alert" className="mt-3 text-sm text-destructive">{f.error}</p>}
            {f.selectedDay && (
              <div className="mt-5">
                <p className="mb-2 text-xs text-muted-foreground">Times shown in {f.timeZone}</p>
                <div className="grid grid-cols-3 gap-2">
                  {f.timesForSelectedDay.map(({ slot: s, label }) => (
                    <button key={s.start} type="button" onClick={() => f.pickSlot(s)} className="rounded-lg border px-2 py-2 text-sm hover:border-primary hover:bg-primary/5">
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

export default BookingWidget;
