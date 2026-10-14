import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { z } from "zod";
export const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const d = new Date(value + "T12:00:00Z"); return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value; }, "Data inválida.");
export type Schedule = { timezone: string; workingDays: number[]; openingMinute: number; closingMinute: number; minimumNoticeMinutes: number; bookingHorizonDays: number };
export type Interval = { start: Date; end: Date };
export function overlaps(a: Interval, b: Interval) { return a.start < b.end && a.end > b.start; }
export function slotDate(day: string, minute: number, timezone: string) {
  return fromZonedTime(`${day}T${String(Math.floor(minute / 60)).padStart(2,"0")}:${String(minute % 60).padStart(2,"0")}:00`, timezone);
}
export function availableSlots(day: string, duration: number, schedule: Schedule, occupied: Interval[], now = new Date()) {
  daySchema.parse(day);
  const weekday = new Date(day + "T12:00:00Z").getUTCDay();
  if (!schedule.workingDays.includes(weekday)) return [];
  const horizon = new Date(now.getTime() + schedule.bookingHorizonDays * 86400000);
  const earliest = new Date(now.getTime() + schedule.minimumNoticeMinutes * 60000);
  const slots: { date: string; label: string }[] = [];
  for (let minute = schedule.openingMinute; minute + duration <= schedule.closingMinute; minute += 15) {
    const start = slotDate(day, minute, schedule.timezone), end = new Date(start.getTime() + duration * 60000);
    if (start < earliest || start > horizon || occupied.some(i => overlaps({ start, end }, i))) continue;
    slots.push({ date: start.toISOString(), label: formatInTimeZone(start, schedule.timezone, "HH:mm") });
  }
  return slots;
}
export function displayBookingDate(date: Date | string, timezone = "America/Sao_Paulo") { return formatInTimeZone(date, timezone, "dd/MM/yyyy 'às' HH:mm"); }
