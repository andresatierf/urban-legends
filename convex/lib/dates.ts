/**
 * Date utility functions for consistent UTC handling
 */

/**
 * Converts a date-only string (YYYY-MM-DD) or Date object to UTC ISO string at midnight.
 * @param dateInput - Date string (YYYY-MM-DD) or Date object
 * @returns UTC ISO string at midnight (e.g., "2025-11-18T00:00:00.000Z")
 */
export function toUTCDateString(dateInput: string | Date): string {
  if (typeof dateInput === "string") {
    let date = dateInput;
    if (date.includes("T")) date = date.split("T")[0];
    const [year, month, day] = date.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    return utcDate.toISOString();
  }
  const date = dateInput;
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
  );
  return utcDate.toISOString();
}

/**
 * Converts a date-only string (YYYY-MM-DD) to UTC ISO string at end of day.
 * @param dateInput - Date string (YYYY-MM-DD) or Date object
 * @returns UTC ISO string at 23:59:59.999 (e.g., "2025-11-18T23:59:59.999Z")
 */
export function toUTCEndOfDayString(dateInput: string | Date): string {
  if (typeof dateInput === "string") {
    let date = dateInput;
    if (date.includes("T")) date = date.split("T")[0];
    const [year, month, day] = date.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    return utcDate.toISOString();
  }
  const date = dateInput;
  const utcDate = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    ),
  );
  return utcDate.toISOString();
}

/**
 * Gets current timestamp as UTC ISO string.
 * @returns UTC ISO timestamp (e.g., "2025-11-18T14:32:15.123Z")
 */
export function nowUTC(): string {
  return new Date().toISOString();
}

/**
 * Extracts date portion from UTC ISO string (YYYY-MM-DD).
 * @param isoString - UTC ISO string
 * @returns Date portion (YYYY-MM-DD)
 */
export function extractDateFromISO(isoString: string): string {
  return isoString.split("T")[0];
}

/**
 * Compares two UTC date strings (ignores time portion).
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareDatesOnly(a: string, b: string): number {
  const dateA = extractDateFromISO(a);
  const dateB = extractDateFromISO(b);
  return dateA.localeCompare(dateB);
}

/**
 * Checks if a UTC ISO string represents today (in user's timezone).
 * @param isoString - UTC ISO string
 * @param timezone - User's timezone (e.g., "America/New_York")
 * @returns true if date is today in user's timezone
 */
export function isToday(isoString: string, timezone?: string): boolean {
  const date = new Date(isoString);
  const now = new Date();

  // If timezone provided, use Intl.DateTimeFormat
  if (timezone) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dateStr = formatter.format(date);
    const nowStr = formatter.format(now);
    return dateStr === nowStr;
  }

  // Otherwise use local timezone
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
