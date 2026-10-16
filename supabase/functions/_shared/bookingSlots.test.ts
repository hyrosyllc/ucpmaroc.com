// Run with: node --test supabase/functions/_shared/bookingSlots.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { computeSlots, isSlotAvailable, zonedToEpoch } from "./bookingSlots.ts";

const base = {
  now: Date.parse("2027-03-01T00:00:00Z"),
  service: { duration_min: 30, buffer_before_min: 0, buffer_after_min: 15 },
  settings: { timezone: "America/New_York", min_notice_hours: 12, max_days_ahead: 60, slot_step_min: 30 },
  rules: [{ weekday: 0, start_time: "09:00:00", end_time: "11:00:00" }],
  exceptions: [] as any[],
  busy: [] as any[],
};

test("converts local time across the DST change", () => {
  assert.equal(new Date(zonedToEpoch("2027-03-13", "09:00", "America/New_York")).toISOString(), "2027-03-13T14:00:00.000Z");
  assert.equal(new Date(zonedToEpoch("2027-03-14", "09:00", "America/New_York")).toISOString(), "2027-03-14T13:00:00.000Z");
});

test("generates slots inside the window", () => {
  assert.equal(computeSlots({ ...base, from: "2027-03-14", to: "2027-03-14" }).length, 4);
});

test("busy time removes slots whose buffered range overlaps", () => {
  const busy = [{ start: Date.parse("2027-03-14T13:30:00Z"), end: Date.parse("2027-03-14T14:00:00Z") }];
  const starts = computeSlots({ ...base, from: "2027-03-14", to: "2027-03-14", busy }).map((s) => s.start);
  assert.deepEqual(starts, ["2027-03-14T14:00:00.000Z", "2027-03-14T14:30:00.000Z"]);
});

test("closed exception removes the day", () => {
  const exceptions = [{ on_date: "2027-03-14", is_closed: true }];
  assert.equal(computeSlots({ ...base, from: "2027-03-14", to: "2027-03-14", exceptions }).length, 0);
});

test("minimum notice hides near-term slots", () => {
  const now = Date.parse("2027-03-14T12:00:00Z");
  assert.equal(computeSlots({ ...base, now, from: "2027-03-14", to: "2027-03-14" }).length, 0);
});

test("isSlotAvailable only accepts generated starts", () => {
  assert.ok(isSlotAvailable("2027-03-14T13:00:00.000Z", base));
  assert.ok(!isSlotAvailable("2027-03-14T13:10:00.000Z", base));
});
