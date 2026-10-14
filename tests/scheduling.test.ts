import test from "node:test";
import assert from "node:assert/strict";
import { availableSlots, daySchema, overlaps, slotDate } from "../app/_lib/scheduling";
const schedule = { timezone: "America/Sao_Paulo", workingDays: [1,2,3,4,5,6], openingMinute: 540, closingMinute: 720, minimumNoticeMinutes: 60, bookingHorizonDays: 60 };
const now = new Date("2026-10-14T10:00:00Z");
test("uses the shop timezone and leaves enough time to finish", () => {
  const slots = availableSlots("2026-10-14",60,schedule,[],now);
  assert.equal(slots[0].date,"2026-10-14T12:00:00.000Z");
  assert.equal(slots.at(-1)?.label,"11:00");
});
test("blocks intervals that overlap any part of a service, keeping adjacent slots", () => {
  const slots = availableSlots("2026-10-14",60,schedule,[{start:new Date("2026-10-14T13:00:00Z"),end:new Date("2026-10-14T14:00:00Z")}],now);
  assert.deepEqual(slots.map(s=>s.label),["09:00","11:00"]);
});
test("rejects impossible dates, closed days, notice violations and distant dates", () => {
  assert.equal(daySchema.safeParse("2026-02-30").success,false);
  assert.deepEqual(availableSlots("2026-10-18",45,schedule,[],now),[]);
  assert.deepEqual(availableSlots("2027-10-14",45,schedule,[],now),[]);
  assert.equal(availableSlots("2026-10-14",45,schedule,[],new Date("2026-10-14T12:00:00Z"))[0].label,"10:00");
});
test("adjacent appointments do not overlap", () => {
  assert.equal(overlaps({start:new Date(0),end:new Date(1000)},{start:new Date(1000),end:new Date(2000)}),false);
  assert.equal(slotDate("2026-10-14",540,"America/Sao_Paulo").toISOString(),"2026-10-14T12:00:00.000Z");
});
