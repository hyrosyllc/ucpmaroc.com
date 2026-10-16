import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BookingApiError,
  BookingResult,
  BookingService,
  ManagedBooking,
  Slot,
  createBooking,
  fetchAvailability,
  fetchServices,
  rescheduleBooking,
} from "./api";
import { downloadIcs } from "./ics";

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export interface UseBookingFlowOptions {
  portfolioId?: string;
  /** Builder preview: no real bookings are created. */
  isPreview?: boolean;
  /** Preselect a service. */
  serviceId?: string | null;
  /** Move an existing booking instead of creating a new one. */
  reschedule?: { token: string; serviceId: string; onDone: (booking: ManagedBooking) => void };
}

export interface BookingForm {
  name: string;
  email: string;
  phone: string;
  notes: string;
  website: string; // honeypot, must stay empty
}

export interface CalendarDay {
  key: string;
  day: number;
  available: boolean;
}

/** Booking state machine shared by the platform widget and SDK themes. All rules are enforced server-side. */
export function useBookingFlow({ portfolioId, isPreview, serviceId, reschedule }: UseBookingFlowOptions) {
  const [services, setServices] = useState<BookingService[] | null>(null);
  const [service, setService] = useState<BookingService | null>(null);
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState<BookingForm>({ name: "", email: "", phone: "", notes: "", website: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [payment, setPayment] = useState<BookingResult | null>(null);
  const [paid, setPaid] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const presetId = reschedule?.serviceId ?? serviceId;
  const rescheduleToken = reschedule?.token;

  useEffect(() => {
    if (!portfolioId) {
      setServices([]);
      return;
    }
    let active = true;
    fetchServices(portfolioId)
      .then((list) => {
        if (!active) return;
        setServices(list);
        setService(list.find((s) => s.id === presetId) ?? (list.length === 1 ? list[0] : null));
      })
      .catch(() => active && setServices([]));
    return () => {
      active = false;
    };
  }, [portfolioId, presetId]);

  useEffect(() => {
    if (!portfolioId || !service) return;
    let active = true;
    setLoadingSlots(true);
    setAvailError(null);
    const first = new Date(cursor);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    // Pad by a day so provider/visitor timezone differences never hide edge slots.
    const from = new Date(first.getTime() - 86_400_000);
    const to = new Date(last.getTime() + 86_400_000);
    fetchAvailability(portfolioId, service.id, isoDate(from), isoDate(to), rescheduleToken)
      .then((res) => active && setSlots(res.slots))
      .catch((e: BookingApiError) => active && (setSlots([]), setAvailError(e.message)))
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [portfolioId, service, cursor, reloadKey, rescheduleToken]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = dayKey(new Date(s.start));
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [slots]);

  const days: CalendarDay[] = useMemo(() => {
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => {
      const key = dayKey(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1));
      return { key, day: i + 1, available: slotsByDay.has(key) };
    });
  }, [cursor, slotsByDay]);

  const selectService = useCallback((s: BookingService) => {
    setService(s);
    setSelectedDay(null);
    setSlot(null);
    setError(null);
  }, []);

  const shiftMonth = useCallback((delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }, []);

  const submit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      if (!portfolioId || !service || !slot) return;
      if (isPreview) {
        setError("Bookings are disabled in the editor preview.");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        if (reschedule) {
          reschedule.onDone(await rescheduleBooking(reschedule.token, slot.start));
          return;
        }
        const created = await createBooking({ portfolioId, serviceId: service.id, start: slot.start, ...form });
        if (created.requiresPayment && created.clientSecret) setPayment(created);
        else setResult(created);
      } catch (err) {
        const apiError = err as BookingApiError;
        setError(apiError.message);
        if (apiError.code === "slot_unavailable") {
          setSlot(null);
          setReloadKey((k) => k + 1);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [portfolioId, service, slot, isPreview, reschedule, form]
  );

  const markPaid = useCallback(() => {
    setPaid(true);
    setResult(payment);
  }, [payment]);

  const addToCalendar = useCallback(() => {
    if (result) downloadIcs({ id: result.bookingId, title: result.serviceName, start: result.start, end: result.end });
  }, [result]);

  const timeFormat = useMemo(() => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }), []);

  return {
    // data
    services,
    service,
    loadingSlots,
    // calendar
    monthLabel: cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    leadingBlanks: cursor.getDay(),
    days,
    prevMonth: () => shiftMonth(-1),
    nextMonth: () => shiftMonth(1),
    selectedDay,
    selectDay: setSelectedDay,
    timesForSelectedDay: (selectedDay ? slotsByDay.get(selectedDay) ?? [] : []).map((s) => ({
      slot: s,
      label: timeFormat.format(new Date(s.start)),
    })),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // selection
    selectService,
    slot,
    pickSlot: setSlot,
    clearSlot: () => setSlot(null),
    // form + submit
    form,
    setForm,
    submit,
    submitting,
    error: availError || error,
    // outcome
    payment,
    paid,
    markPaid,
    result,
    addToCalendar,
    manageUrl: result ? `${window.location.pathname}?manage=${result.manageToken}` : null,
  };
}

export type BookingFlow = ReturnType<typeof useBookingFlow>;
