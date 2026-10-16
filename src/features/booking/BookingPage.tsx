import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { BookingApiError, ManagedBooking, manageBooking } from "./api";
import { BookingWidget } from "./BookingWidget";

function ManageBooking({ token }: { token: string }) {
  const [booking, setBooking] = useState<ManagedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    manageBooking(token, "get").then(setBooking).catch((e: BookingApiError) => setError(e.message));
  }, [token]);

  const cancel = async () => {
    if (!window.confirm("Cancel this booking?")) return;
    setBusy(true);
    try {
      setBooking(await manageBooking(token, "cancel"));
      setError(null);
    } catch (e) {
      setError((e as BookingApiError).message);
    } finally {
      setBusy(false);
    }
  };

  if (!booking && !error) return <Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading" />;
  if (!booking) return <p role="alert" className="text-center text-destructive">{error}</p>;

  const when = new Date(booking.start).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
  const canCancel = ["pending", "confirmed"].includes(booking.status) && Date.parse(booking.start) > Date.now();

  if (rescheduling && booking.serviceId) {
    return (
      <div className="space-y-4">
        <p className="text-center text-muted-foreground">
          Choose a new time for {booking.serviceName} (currently {when}).
        </p>
        <BookingWidget
          portfolioId={booking.portfolioId}
          reschedule={{
            token,
            serviceId: booking.serviceId,
            onDone: (updated) => {
              setBooking(updated);
              setRescheduling(false);
            },
          }}
        />
        <button type="button" className="mx-auto block text-sm text-primary underline" onClick={() => setRescheduling(false)}>
          Keep current time
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-3 rounded-2xl border bg-card p-8 text-center">
      <h2 className="text-xl font-semibold">{booking.serviceName}</h2>
      <p className="text-muted-foreground">{when}</p>
      <p className="text-sm capitalize">Status: {booking.status.replace("_", " ")}</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {canCancel && (
        <div className="flex flex-col gap-2">
          {booking.serviceId && (
            <button type="button" onClick={() => setRescheduling(true)} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              Reschedule
            </button>
          )}
          <button type="button" disabled={busy} onClick={cancel} className="rounded-full border px-5 py-2 text-sm hover:bg-muted disabled:opacity-60">
            Cancel booking
          </button>
        </div>
      )}
      {booking.status === "cancelled" || canCancel ? <p className="text-xs text-muted-foreground">Paid bookings are refunded by the provider on request.</p> : null}
    </div>
  );
}

/** Public booking page at /pro/:slug/book (also handles ?manage=token links from emails). */
export default function BookingPage() {
  const { portfolio } = useOutletContext<{ portfolio: { id: string } | null }>();
  const [params] = useSearchParams();
  const manageToken = params.get("manage");

  if (!portfolio) return null;

  return (
    <main className="px-6 py-16 md:py-24">
      <h1 className="mb-10 text-center text-3xl font-bold tracking-tight md:text-4xl">
        {manageToken ? "Manage your booking" : "Book an appointment"}
      </h1>
      {manageToken ? (
        <ManageBooking token={manageToken} />
      ) : (
        <BookingWidget portfolioId={portfolio.id} serviceId={params.get("service")} />
      )}
    </main>
  );
}
