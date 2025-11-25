/**
 * Frontend date formatting utilities
 */

export const DATE_FORMATS = {
  "MM/dd/yyyy": "MM/dd/yyyy",
  "dd/MM/yyyy": "dd/MM/yyyy",
  "yyyy-MM-dd": "yyyy-MM-dd",
  "dd MMM yyyy": "dd MMM yyyy",
  "MMM dd, yyyy": "MMM dd, yyyy",
  "dd MMMM yyyy": "dd MMMM yyyy",
} as const;

export type DateFormat = keyof typeof DATE_FORMATS;

export const DEFAULT_DATE_FORMAT: DateFormat = "MM/dd/yyyy";
export const DATE_FORMAT_STORAGE_KEY = "dateFormat";

/**
 * Parse format string to determine month style
 */
function parseFormatString(format: DateFormat): {
  month: "numeric" | "2-digit" | "short" | "long";
} {
  if (format.includes("MMMM")) return { month: "long" };
  if (format.includes("MMM")) return { month: "short" };
  if (format.includes("MM")) return { month: "2-digit" };
  return { month: "numeric" };
}

/**
 * Format date according to pattern
 */
function formatWithPattern(
  date: Date,
  format: DateFormat,
  formatter: Intl.DateTimeFormat,
): string {
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};

  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  // Map format tokens to values
  let result: string = format;

  // Replace year
  result = result.replace("yyyy", partMap.year || "");

  // Replace month
  if (format.includes("MMMM")) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    result = result.replace("MMMM", monthNames[date.getMonth()]);
  } else if (format.includes("MMM")) {
    const monthNamesShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    result = result.replace("MMM", monthNamesShort[date.getMonth()]);
  } else if (format.includes("MM")) {
    result = result.replace("MM", String(date.getMonth() + 1).padStart(2, "0"));
  } else if (format.includes("M")) {
    result = result.replace("M", String(date.getMonth() + 1));
  }

  // Replace day
  result = result.replace("dd", String(date.getDate()).padStart(2, "0"));
  result = result.replace("d", String(date.getDate()));

  return result;
}

/**
 * Format a UTC ISO string to user's preferred format.
 * @param isoString - UTC ISO date string
 * @param format - Desired format (defaults to "MM/dd/yyyy")
 * @param options - Additional formatting options
 * @returns Formatted date string
 */
export function formatDate(
  isoString: string | undefined | null,
  format: DateFormat = DEFAULT_DATE_FORMAT,
  options?: {
    includeTime?: boolean;
    timezone?: string;
  },
): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  // Use Intl.DateTimeFormat for consistent formatting
  const formatParts = parseFormatString(format);

  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: formatParts.month,
    day: "numeric",
    ...(options?.includeTime && {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    ...(options?.timezone && { timeZone: options.timezone }),
  });

  return formatWithPattern(date, format, formatter);
}

/**
 * Format a date for relative display (e.g., "2 days ago")
 * @param isoString - UTC ISO date string
 * @returns Relative time string or formatted date if too old
 */
export function formatRelativeDate(
  isoString: string | undefined | null,
  fallbackFormat: DateFormat = DEFAULT_DATE_FORMAT,
): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  // Use relative format for recent dates
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;

  // Use formatted date for older dates
  return formatDate(isoString, fallbackFormat);
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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
  return formatWithPattern(
    exampleDate,
    format,
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: parseFormatString(format).month,
      day: "numeric",
    }),
  );
}

/**
 * Get user's date format preference from localStorage
 * @returns User's preferred date format or default
 */
export function getDateFormatPreference(): DateFormat {
  if (typeof window === "undefined") return DEFAULT_DATE_FORMAT;

  const stored = localStorage.getItem(DATE_FORMAT_STORAGE_KEY);
  if (stored && stored in DATE_FORMATS) {
    return stored as DateFormat;
  }
  return DEFAULT_DATE_FORMAT;
}

/**
 * Save user's date format preference to localStorage
 * @param format - Date format to save
 */
export function setDateFormatPreference(format: DateFormat): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DATE_FORMAT_STORAGE_KEY, format);
}
