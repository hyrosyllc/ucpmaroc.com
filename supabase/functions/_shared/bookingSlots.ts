// Pure slot computation shared by the booking Edge Functions. No I/O, so it can be unit-tested directly.

export interface AvailabilityRule {
  weekday: number; // 0 = Sunday
  start_time: string; // "HH:MM" or "HH:MM:SS", local to `timezone`
  end_time: string;
}

export interface AvailabilityException {
  on_date: string; // "YYYY-MM-DD"
  is_closed: boolean;
  start_time?: string | null;
  end_time?: string | null;
}

export interface SlotService {
  duration_min: number;
  buffer_before_min: number;
  buffer_after_min: number;
}

export interface SlotSettings {
  timezone: string;
  min_notice_hours: number;
  max_days_ahead: number;
  slot_step_min: number;
}

export interface BusyRange {
  start: number; // epoch ms
  end: number;
}

export interface Slot {
  start: string; // ISO UTC
  end: string;
}

const MINUTE = 60_000;
const DAY = 86_400_000;

function tzOffsetMs(epochMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(epochMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(epochMs / 1000) * 1000;
}

/** Converts a wall-clock date/time in `timeZone` to epoch ms, correct across DST changes. */
export function zonedToEpoch(date: string, time: string, timeZone: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  let result = naive - tzOffsetMs(naive, timeZone);
  result = naive - tzOffsetMs(result, timeZone);
  return result;
}

/** The "YYYY-MM-DD" calendar date of an instant in `timeZone`. */
export function localDateOf(epochMs: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(epochMs));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function hhmm(value: string): string {
  return value.slice(0, 5);
}

export interface ComputeSlotsInput {
  from: string;
  to: string;
  now: number;
  service: SlotService;
  settings: SlotSettings;
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  busy: BusyRange[];
}

export const MAX_RANGE_DAYS = 45;

export function computeSlots(input: ComputeSlotsInput): Slot[] {
  const { from, to, now, service, settings, rules, exceptions, busy } = input;
  const tz = settings.timezone;
  const step = Math.max(5, settings.slot_step_min) * MINUTE;
  const duration = service.duration_min * MINUTE;
  const before = service.buffer_before_min * MINUTE;
  const after = service.buffer_after_min * MINUTE;
  const earliest = now + settings.min_notice_hours * 60 * MINUTE;
  const latest = now + settings.max_days_ahead * DAY;

  const slots = new Map<number, Slot>();

  for (let date = from, i = 0; date <= to && i < MAX_RANGE_DAYS; date = addDays(date, 1), i++) {
    const exception = exceptions.find((e) => e.on_date === date);
    let windows: Array<{ start: string; end: string }>;
    if (exception) {
      windows =
        exception.is_closed || !exception.start_time || !exception.end_time
          ? []
          : [{ start: hhmm(exception.start_time), end: hhmm(exception.end_time) }];
    } else {
      const weekday = weekdayOf(date);
      windows = rules
        .filter((r) => r.weekday === weekday)
        .map((r) => ({ start: hhmm(r.start_time), end: hhmm(r.end_time) }));
    }

    for (const w of windows) {
      const windowStart = zonedToEpoch(date, w.start, tz);
      const windowEnd = zonedToEpoch(date, w.end, tz);
      for (let t = windowStart; t + duration <= windowEnd; t += step) {
        if (t < earliest || t > latest) continue;
        const blockedStart = t - before;
        const blockedEnd = t + duration + after;
        if (busy.some((b) => b.start < blockedEnd && b.end > blockedStart)) continue;
        slots.set(t, { start: new Date(t).toISOString(), end: new Date(t + duration).toISOString() });
      }
    }
  }

  return [...slots.entries()].sort((a, b) => a[0] - b[0]).map(([, s]) => s);
}

/** True when `startIso` is one of the bookable slots for its local date. */
export function isSlotAvailable(startIso: string, input: Omit<ComputeSlotsInput, "from" | "to">): boolean {
  const start = Date.parse(startIso);
  if (Number.isNaN(start)) return false;
  const date = localDateOf(start, input.settings.timezone);
  return computeSlots({ ...input, from: date, to: date }).some((s) => Date.parse(s.start) === start);
}
