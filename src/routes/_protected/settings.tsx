import { useClerk } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedSelect } from "@/components/ui/composed-select";
import {
  FULL_DATE_FORMATS,
  type FormatLength,
  LONG_DATE_FORMATS,
  SHORT_DATE_FORMATS,
  getDateFormatPreference,
  getFormatPreview,
  setDateFormatPreference,
} from "@/lib/dates";

export const Route = createFileRoute("/_protected/settings")({
  component: SettingsPage,
});

const WEEKDAY_LABELS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEK_START_STORAGE_KEY = "calendarWeekStartsOn";

function SettingsPage() {
  const { signOut } = useClerk();

  const [weekStartsOn, setWeekStartsOn] = useState<number>(0);
  const [dateFormatShort, setDateFormatShort] = useState<string>("MM/dd/yyyy");
  const [dateFormatLong, setDateFormatLong] = useState<string>("MMM dd, yyyy");
  const [dateFormatFull, setDateFormatFull] = useState<string>(
    "EEEE, MMMM dd, yyyy",
  );
  const weekStartSelectId = useId();
  const dateFormatShortSelectId = useId();
  const dateFormatLongSelectId = useId();
  const dateFormatFullSelectId = useId();

  useEffect(() => {
    const stored = localStorage.getItem(WEEK_START_STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number.parseInt(stored, 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 6) {
        setWeekStartsOn(parsed);
      }
    }
    const storedShortFormat = getDateFormatPreference("short");
    const storedLongFormat = getDateFormatPreference("long");
    const storedFullFormat = getDateFormatPreference("full");
    setDateFormatShort(storedShortFormat);
    setDateFormatLong(storedLongFormat);
    setDateFormatFull(storedFullFormat);
  }, []);

  const handleWeekStartChange = (value: string) => {
    const newStart = Number.parseInt(value, 10);
    setWeekStartsOn(newStart);
    localStorage.setItem(WEEK_START_STORAGE_KEY, value);
  };

  const handleDateFormatChange = (value: string, length: FormatLength) => {
    if (length === "short") {
      setDateFormatShort(value);
      setDateFormatPreference(value as keyof typeof SHORT_DATE_FORMATS, length);
    } else if (length === "long") {
      setDateFormatLong(value);
      setDateFormatPreference(value as keyof typeof LONG_DATE_FORMATS, length);
    } else {
      setDateFormatFull(value);
      setDateFormatPreference(value as keyof typeof FULL_DATE_FORMATS, length);
    }
    // Dispatch storage event for other tabs/windows
    const storageKey =
      length === "short"
        ? "dateFormatShort"
        : length === "long"
          ? "dateFormatLong"
          : "dateFormatFull";
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: storageKey,
        newValue: value,
      }),
    );
  };

  return (
    <>
      <SectionHeader as="h1" title="Settings">
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </SectionHeader>

      <div className="space-y-8">
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="text-muted-foreground h-5 w-5" />
                Calendar Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={weekStartSelectId}
                    className="block text-sm font-medium"
                  >
                    Week starts on
                  </label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Choose which day your calendar week begins
                  </p>
                </div>
                <ComposedSelect
                  id={weekStartSelectId}
                  className="w-full sm:w-[180px]"
                  value={weekStartsOn.toString()}
                  onValueChange={handleWeekStartChange}
                  options={WEEKDAY_LABELS_FULL.map((day, index) => ({
                    value: index.toString(),
                    label: day,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={dateFormatShortSelectId}
                    className="block text-sm font-medium"
                  >
                    Short date format
                  </label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Compact numeric formats for lists and cards
                  </p>
                </div>
                <ComposedSelect
                  id={dateFormatShortSelectId}
                  className="w-full sm:w-[220px]"
                  value={dateFormatShort}
                  onValueChange={(value) =>
                    handleDateFormatChange(value, "short")
                  }
                  options={Object.keys(SHORT_DATE_FORMATS).map((format) => ({
                    value: format,
                    label: (
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-sm">{format}</span>
                        <span className="text-muted-foreground text-xs">
                          {getFormatPreview(
                            format as keyof typeof SHORT_DATE_FORMATS,
                          )}
                        </span>
                      </div>
                    ),
                  }))}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={dateFormatLongSelectId}
                    className="block text-sm font-medium"
                  >
                    Long date format
                  </label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Verbose text-based formats for headers and announcements
                  </p>
                </div>
                <ComposedSelect
                  id={dateFormatLongSelectId}
                  className="w-full sm:w-[220px]"
                  value={dateFormatLong}
                  onValueChange={(value) =>
                    handleDateFormatChange(value, "long")
                  }
                  options={Object.keys(LONG_DATE_FORMATS).map((format) => ({
                    value: format,
                    label: (
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-sm">{format}</span>
                        <span className="text-muted-foreground text-xs">
                          {getFormatPreview(
                            format as keyof typeof LONG_DATE_FORMATS,
                          )}
                        </span>
                      </div>
                    ),
                  }))}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={dateFormatFullSelectId}
                    className="block text-sm font-medium"
                  >
                    Full date format
                  </label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Includes day of week for detailed displays (e.g., titles)
                  </p>
                </div>
                <ComposedSelect
                  id={dateFormatFullSelectId}
                  className="w-full sm:w-[280px]"
                  value={dateFormatFull}
                  onValueChange={(value) =>
                    handleDateFormatChange(value, "full")
                  }
                  options={Object.keys(FULL_DATE_FORMATS).map((format) => ({
                    value: format,
                    label: (
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-sm">{format}</span>
                        <span className="text-muted-foreground text-xs">
                          {getFormatPreview(
                            format as keyof typeof FULL_DATE_FORMATS,
                          )}
                        </span>
                      </div>
                    ),
                  }))}
                />
              </div>

              <Card className="rounded-md">
                <CardContent>
                  <p className="text-sm">
                    <strong>Note:</strong> Short formats use compact numeric
                    styles for cards and lists, long formats use verbose text
                    styles for headers and announcements, and full formats
                    include the day of week for detailed displays. Your
                    preferences are saved locally and will persist across
                    sessions.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
