import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  type DateFormat,
  type FormatLength,
  formatDate,
  formatRelativeDate,
  getDateFormatPreference,
} from "@/lib/dates";

/**
 * Subscribe to localStorage changes for date format preferences
 */
function subscribeDateFormatChange(callback: () => void) {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "dateFormatShort" || e.key === "dateFormatLong") {
      callback();
    }
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}

/**
 * Get current date format preferences from localStorage
 */
function getSnapshot(): { short: DateFormat; long: DateFormat } {
  return {
    short: getDateFormatPreference("short"),
    long: getDateFormatPreference("long"),
  };
}

/**
 * Server-side snapshot (returns defaults)
 */
function getServerSnapshot(): { short: DateFormat; long: DateFormat } {
  return {
    short: "MM/dd/yyyy",
    long: "MMM dd, yyyy",
  };
}

/**
 * Hook to get user's date format preferences and format dates consistently
 */
export function useFormattedDate() {
  const userFormats = useSyncExternalStore(
    subscribeDateFormatChange,
    getSnapshot,
    getServerSnapshot,
  );

  const format = useCallback(
    (
      isoString: string | undefined | null,
      formatLength: FormatLength = "long",
      options?: {
        includeTime?: boolean;
        timezone?: string;
      },
    ) => {
      return formatDate(isoString, formatLength, options);
    },
    [],
  );

  const formatRelative = useCallback(
    (
      isoString: string | undefined | null,
      formatLength: FormatLength = "long",
    ) => {
      return formatRelativeDate(isoString, formatLength);
    },
    [],
  );

  return useMemo(
    () => ({
      format,
      formatRelative,
      shortFormat: userFormats.short,
      longFormat: userFormats.long,
    }),
    [format, formatRelative, userFormats],
  );
}
