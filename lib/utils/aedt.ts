/**
 * Australian Eastern (Sydney) timezone utilities.
 * Meta/Facebook APIs default to AEDT; all app date logic should use this zone.
 * Uses Australia/Sydney so AEDT/AEST (DST) is handled automatically.
 */

import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export const APP_TIMEZONE = "Australia/Sydney";

/**
 * Parse a date-only string (YYYY-MM-DD) as midnight on that day in Sydney.
 * Use for Meta API date_start and any date-only values that are in AEDT.
 */
export function parseDateOnlyInAEDT(isoDateStr: string): Date {
  const trimmed = String(isoDateStr ?? "").trim();
  if (!trimmed) return new Date(0);
  const withTime = trimmed.length === 10 ? `${trimmed} 00:00:00` : trimmed;
  const d = fromZonedTime(withTime, APP_TIMEZONE);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

/**
 * Return the given date (or now) as "local" date/time in Sydney.
 * Use getFullYear(), getMonth(), getDate() etc. on the result for Sydney calendar values.
 */
export function inSydney(date: Date = new Date()): Date {
  return toZonedTime(date, APP_TIMEZONE);
}

function toSydneyDateString(d: Date, hour: number, min: number, sec: number, ms: number): string {
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day} ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

/**
 * Start of the given day in Sydney (00:00:00 Sydney time as a UTC Date).
 * If no date given, uses "today" in Sydney.
 */
export function startOfDayInSydney(date?: Date): Date {
  const d = date ? toZonedTime(date, APP_TIMEZONE) : toZonedTime(new Date(), APP_TIMEZONE);
  const str = toSydneyDateString(d, 0, 0, 0, 0);
  return fromZonedTime(str, APP_TIMEZONE);
}

/**
 * End of the given day in Sydney (23:59:59.999 Sydney time as a UTC Date).
 */
export function endOfDayInSydney(date?: Date): Date {
  const d = date ? toZonedTime(date, APP_TIMEZONE) : toZonedTime(new Date(), APP_TIMEZONE);
  const str = toSydneyDateString(d, 23, 59, 59, 999);
  return fromZonedTime(str, APP_TIMEZONE);
}

/**
 * First moment of the given month in Sydney (or current month if no date).
 */
export function startOfMonthInSydney(date?: Date): Date {
  const d = date ? toZonedTime(date, APP_TIMEZONE) : toZonedTime(new Date(), APP_TIMEZONE);
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0");
  return fromZonedTime(`${y}-${m}-01 00:00:00.000`, APP_TIMEZONE);
}

/**
 * Start of month in Sydney, offset by N months (e.g. -1 = last month, 1 = next month).
 */
export function startOfMonthOffsetInSydney(monthOffset: number, from?: Date): Date {
  const d = from ? toZonedTime(from, APP_TIMEZONE) : toZonedTime(new Date(), APP_TIMEZONE);
  let y = d.getFullYear();
  let m = d.getMonth() + monthOffset;
  while (m > 11) {
    m -= 12;
    y += 1;
  }
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  const ms = String(m + 1).padStart(2, "0");
  return fromZonedTime(`${y}-${ms}-01 00:00:00.000`, APP_TIMEZONE);
}

/**
 * Format a date as YYYY-MM-DD in Sydney (for Meta API time_range, etc.).
 */
export function formatDateInAEDT(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd");
}

/**
 * Add N calendar days in Sydney and return the resulting Date (start of that day in Sydney).
 */
export function addDaysInSydney(date: Date, days: number): Date {
  const d = toZonedTime(date, APP_TIMEZONE);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  const str = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")} 00:00:00.000`;
  return fromZonedTime(str, APP_TIMEZONE);
}

/**
 * Day key (YYYY-MM-DD) using Sydney date parts. Use for bucketing/keys.
 */
export function dayKeyAEDT(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd");
}

/**
 * Month key (YYYY-M) using Sydney date parts.
 */
export function monthKeyAEDT(date: Date): string {
  const d = toZonedTime(date, APP_TIMEZONE);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/**
 * Sydney year, month, date for a given Date (for comparisons like "current month").
 */
export function getSydneyDateParts(date: Date): { year: number; month: number; date: number } {
  const d = toZonedTime(date, APP_TIMEZONE);
  return { year: d.getFullYear(), month: d.getMonth(), date: d.getDate() };
}
