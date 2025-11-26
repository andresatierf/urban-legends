import { useCallback, useEffect, useState } from "react";
import {
  type DateFormat,
  type FormatLength,
  formatDate,
  formatRelativeDate,
  getDateFormatPreference,
} from "@/lib/dates";

/**
 * Hook to format dates consistently using user preferences
 */
export function useFormattedDate() {
  const [shortFormat, setShortFormat] = useState<DateFormat>(() =>
    getDateFormatPreference("short"),
  );
  const [longFormat, setLongFormat] = useState<DateFormat>(() =>
    getDateFormatPreference("long"),
  );
  const [fullFormat, setFullFormat] = useState<DateFormat>(() =>
    getDateFormatPreference("full"),
  );

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "dateFormatShort") {
        setShortFormat(getDateFormatPreference("short"));
      } else if (e.key === "dateFormatLong") {
        setLongFormat(getDateFormatPreference("long"));
      } else if (e.key === "dateFormatFull") {
        setFullFormat(getDateFormatPreference("full"));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const format = useCallback(
    (
      isoString: string | undefined | null,
      formatLength: FormatLength = "long",
      options?: {
        includeTime?: boolean;
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

  return {
    format,
    formatRelative,
    shortFormat,
    longFormat,
    fullFormat,
  };
}
