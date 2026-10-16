import { supabase } from "@/supabaseClient";

export interface BookingService {
  id: string;
  portfolio_id: string;
  name: string;
  description: string | null;
  duration_min: number;
  buffer_before_min: number;
  buffer_after_min: number;
  price_cents: number;
  currency: string;
  location_type: "in_person" | "online" | "phone";
  location_details: string | null;
  payment_mode: "none" | "deposit" | "full";
  deposit_cents: number;
  active: boolean;
  sort_order: number;
}

export interface Slot {
  start: string;
  end: string;
}

export interface BookingResult {
  bookingId: string;
  status: "pending" | "confirmed";
  start: string;
  end: string;
  manageToken: string;
  serviceName: string;
  requiresPayment?: boolean;
  clientSecret?: string;
  connectedAccountId?: string;
  amountDueCents?: number;
  holdExpiresMinutes?: number;
}

export interface ManagedBooking {
  portfolioId: string;
  serviceId: string | null;
  serviceName: string;
  customerName: string;
  start: string;
  end: string;
  status: string;
  timezone: string;
}

export class BookingApiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

async function invoke<T>(name: string, body: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let payload: any = null;
    try {
      payload = await (error as any).context?.json();
    } catch {
      // Network failure or non-JSON body.
    }
    throw new BookingApiError(payload?.error || "Something went wrong. Please try again.", payload?.code);
  }
  return data as T;
}

export async function fetchServices(portfolioId: string): Promise<BookingService[]> {
  const { data, error } = await supabase
    .from("booking_services")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .eq("active", true)
    .order("sort_order")
    .order("created_at");
  if (error) throw new BookingApiError(error.message);
  return data ?? [];
}

export function fetchAvailability(portfolioId: string, serviceId: string, from: string, to: string, manageToken?: string) {
  return invoke<{ timezone: string; slots: Slot[] }>("booking-availability", { portfolioId, serviceId, from, to, manageToken });
}

export function createBooking(input: {
  portfolioId: string;
  serviceId: string;
  start: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  website?: string;
}) {
  return invoke<BookingResult>("booking-create", {
    ...input,
    customerTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

export function manageBooking(token: string, action: "get" | "cancel") {
  return invoke<ManagedBooking>("booking-manage", { token, action });
}

export function rescheduleBooking(token: string, start: string) {
  return invoke<ManagedBooking>("booking-manage", { token, action: "reschedule", start });
}

export function formatPrice(cents: number, currency: string) {
  if (cents <= 0) return "Free";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}
