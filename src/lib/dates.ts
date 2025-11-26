/**
 * Frontend date formatting utilities
 */

import { format as formatDateFns, formatDistanceToNow } from "date-fns";

export const SHORT_DATE_FORMATS = {
  "MM/dd/yyyy": "MM/dd/yyyy",
  "dd/MM/yyyy": "dd/MM/yyyy",
  "yyyy-MM-dd": "yyyy-MM-dd",
  "M/d/yyyy": "M/d/yyyy",
  "d/M/yyyy": "d/M/yyyy",
} as const;

export const LONG_DATE_FORMATS = {
  "MMM dd, yyyy": "MMM dd, yyyy",
  "dd MMM yyyy": "dd MMM yyyy",
  "MMMM dd, yyyy": "MMMM dd, yyyy",
  "dd MMMM yyyy": "dd MMMM yyyy",
  "MMMM d, yyyy": "MMMM d, yyyy",
} as const;

export const FULL_DATE_FORMATS = {
  "EEEE, MMMM dd, yyyy": "EEEE, MMMM dd, yyyy",
  "EEEE, dd MMMM yyyy": "EEEE, dd MMMM yyyy",
  "EEE, MMM dd, yyyy": "EEE, MMM dd, yyyy",
  "EEE, dd MMM yyyy": "EEE, dd MMM yyyy",
  "EEEE, MMMM d, yyyy": "EEEE, MMMM d, yyyy",
} as const;

export const DATE_FORMATS = {
  ...SHORT_DATE_FORMATS,
  ...LONG_DATE_FORMATS,
  ...FULL_DATE_FORMATS,
} as const;

export type ShortDateFormat = keyof typeof SHORT_DATE_FORMATS;
export type LongDateFormat = keyof typeof LONG_DATE_FORMATS;
export type FullDateFormat = keyof typeof FULL_DATE_FORMATS;
export type DateFormat = keyof typeof DATE_FORMATS;
export type FormatLength = "short" | "long" | "full";

export const DEFAULT_DATE_FORMAT_SHORT: DateFormat = "MM/dd/yyyy";
export const DEFAULT_DATE_FORMAT_LONG: DateFormat = "MMM dd, yyyy";
export const DEFAULT_DATE_FORMAT_FULL: DateFormat = "EEEE, MMMM dd, yyyy";
export const DATE_FORMAT_SHORT_STORAGE_KEY = "dateFormatShort";
export const DATE_FORMAT_LONG_STORAGE_KEY = "dateFormatLong";
export const DATE_FORMAT_FULL_STORAGE_KEY = "dateFormatFull";

/**
 * Format a UTC ISO string to user's preferred format.
 * @param isoString - UTC ISO date string
 * @param formatLength - Use "short" or "long" format preference (defaults to "long")
 * @param options - Additional formatting options
 * @returns Formatted date string
 */
export function formatDate(
  isoString: string | undefined | null,
  formatLength: FormatLength = "long",
  options?: {
    includeTime?: boolean;
  },
): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  // Get user's preferred format for the specified length
  const userFormat = getDateFormatPreference(formatLength);

  // Build format string with optional time
  let formatString: string = userFormat;
  if (options?.includeTime) {
    formatString = `${userFormat} h:mm a`;
  }

  // Use date-fns format function
  return formatDateFns(date, formatString);
}

/**
 * Format a date for relative display (e.g., "2 days ago")
 * @param isoString - UTC ISO date string
 * @param formatLength - Use "short" or "long" format for fallback (defaults to "long")
 * @returns Relative time string or formatted date if too old
 */
export function formatRelativeDate(
  isoString: string | undefined | null,
  formatLength: FormatLength = "long",
): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDay = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  // Use relative format for recent dates (within 7 days)
  if (diffDay < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  // Use formatted date for older dates
  return formatDate(isoString, formatLength);
}

/**
 * Extract date-only portion from UTC ISO string (YYYY-MM-DD)
 * @param isoString - UTC ISO string
 * @returns Date portion in YYYY-MM-DD format
 */
export function extractDateOnly(isoString: string): string {
  return isoString.split("T")[0];
}

/**
 * Convert local date input (YYYY-MM-DD) to UTC ISO string at midnight
 * This is used when sending dates from date pickers to the backend
 * @param dateString - Local date string (YYYY-MM-DD)
 * @returns UTC ISO string at midnight
 */
export function localDateToUTC(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return utcDate.toISOString();
}

/**
 * Convert UTC ISO string to local date format (YYYY-MM-DD) for date inputs
 * @param isoString - UTC ISO string
 * @returns Local date string (YYYY-MM-DD)
 */
export function utcToLocalDateInput(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a UTC ISO string represents today in local timezone
 * @param isoString - UTC ISO string
 * @returns true if date is today
 */
export function isToday(isoString: string): boolean {
  const date = new Date(isoString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * Get preview text for a date format
 * @param format - Date format to preview
 * @returns Example date string in that format
 */
export function getFormatPreview(format: DateFormat): string {
  const exampleDate = new Date(2025, 10, 18); // November 18, 2025
  return formatDateFns(exampleDate, format);
}

/**
 * Get user's date format preference from localStorage
 * @param length - "short", "long", or "full" format preference
 * @returns User's preferred date format or default
 */
export function getDateFormatPreference(length: FormatLength): DateFormat {
  if (typeof window === "undefined") {
    if (length === "short") return DEFAULT_DATE_FORMAT_SHORT;
    if (length === "long") return DEFAULT_DATE_FORMAT_LONG;
    return DEFAULT_DATE_FORMAT_FULL;
  }

  const storageKey =
    length === "short"
      ? DATE_FORMAT_SHORT_STORAGE_KEY
      : length === "long"
        ? DATE_FORMAT_LONG_STORAGE_KEY
        : DATE_FORMAT_FULL_STORAGE_KEY;

  const defaultFormat =
    length === "short"
      ? DEFAULT_DATE_FORMAT_SHORT
      : length === "long"
        ? DEFAULT_DATE_FORMAT_LONG
        : DEFAULT_DATE_FORMAT_FULL;

  const stored = localStorage.getItem(storageKey);
  if (stored && stored in DATE_FORMATS) {
    return stored as DateFormat;
  }
  return defaultFormat;
}

/**
 * Save user's date format preference to localStorage
 * @param format - Date format to save
 * @param length - "short", "long", or "full" format preference
 */
export function setDateFormatPreference(
  format: DateFormat,
  length: FormatLength,
): void {
  if (typeof window === "undefined") return;
  const storageKey =
    length === "short"
      ? DATE_FORMAT_SHORT_STORAGE_KEY
      : length === "long"
        ? DATE_FORMAT_LONG_STORAGE_KEY
        : DATE_FORMAT_FULL_STORAGE_KEY;
  localStorage.setItem(storageKey, format);
}
