import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  type DateFormat,
  formatDate,
  formatRelativeDate,
  getDateFormatPreference,
} from "@/lib/dates";

/**
 * Subscribe to localStorage changes for date format preference
 */
function subscribeDateFormatChange(callback: () => void) {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "dateFormat") {
      callback();
    }
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}

/**
 * Get current date format preference from localStorage
 */
function getSnapshot(): DateFormat {
  return getDateFormatPreference();
}

/**
 * Server-side snapshot (returns default)
 */
function getServerSnapshot(): DateFormat {
  return "MM/dd/yyyy";
}

/**
 * Hook to get user's date format preference and format dates consistently
 */
export function useFormattedDate() {
  const userFormat = useSyncExternalStore(
    subscribeDateFormatChange,
    getSnapshot,
    getServerSnapshot,
  );

  const format = useCallback(
    (
      isoString: string | undefined | null,
      options?: {
        includeTime?: boolean;
        timezone?: string;
      },
    ) => {
      return formatDate(isoString, userFormat, options);
    },
    [userFormat],
  );

  const formatRelative = useCallback(
    (isoString: string | undefined | null) => {
      return formatRelativeDate(isoString, userFormat);
    },
    [userFormat],
  );

  return useMemo(
    () => ({
      format,
      formatRelative,
      userFormat,
    }),
    [format, formatRelative, userFormat],
  );
}
