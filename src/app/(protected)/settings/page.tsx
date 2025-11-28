"use client";

import { useClerk } from "@clerk/nextjs";
import { Calendar, Palette } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type FormatLength,
  FULL_DATE_FORMATS,
  getDateFormatPreference,
  getFormatPreview,
  LONG_DATE_FORMATS,
  SHORT_DATE_FORMATS,
  setDateFormatPreference,
} from "@/lib/dates";

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

export default function SettingsPage() {
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

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(WEEK_START_STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number.parseInt(stored, 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 6) {
        setWeekStartsOn(parsed);
      }
    }
    // Load date format preferences
    const storedShortFormat = getDateFormatPreference("short");
    const storedLongFormat = getDateFormatPreference("long");
    const storedFullFormat = getDateFormatPreference("full");
    setDateFormatShort(storedShortFormat);
    setDateFormatLong(storedLongFormat);
    setDateFormatFull(storedFullFormat);
  }, []);

  // Save week start preference to localStorage
  const handleWeekStartChange = (value: string) => {
    const newStart = Number.parseInt(value, 10);
    setWeekStartsOn(newStart);
    localStorage.setItem(WEEK_START_STORAGE_KEY, value);
  };

  // Save date format preference to localStorage
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
        <ThemeSwitcher />
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </SectionHeader>

      <div className="space-y-8">
        {/* Theme Preferences Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold text-lg">
                <Palette className="h-5 w-5 text-muted-foreground" />
                Theme Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="block font-medium text-sm">Color scheme</div>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Choose how the site looks to you
                  </p>
                </div>
                <ThemeToggle />
              </div>
              <Card variant="info" className="rounded-md">
                <CardContent>
                  <p className="text-sm">
                    <strong>Note:</strong> Your theme preference is saved
                    locally and will persist across sessions. System mode
                    automatically adjusts based on your device settings.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </section>

        {/* Calendar Preferences Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold text-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Calendar Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={weekStartSelectId}
                    className="block font-medium text-sm"
                  >
                    Week starts on
                  </label>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Choose which day your calendar week begins
                  </p>
                </div>
                <Select
                  value={weekStartsOn.toString()}
                  onValueChange={handleWeekStartChange}
                >
                  <SelectTrigger
                    id={weekStartSelectId}
                    className="w-full sm:w-[180px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_LABELS_FULL.map((day, index) => (
                      <SelectItem key={day} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Short Date Format Preference */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={dateFormatShortSelectId}
                    className="block font-medium text-sm"
                  >
                    Short date format
                  </label>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Compact numeric formats for lists and cards
                  </p>
                </div>
                <Select
                  value={dateFormatShort}
                  onValueChange={(value) =>
                    handleDateFormatChange(value, "short")
                  }
                >
                  <SelectTrigger
                    id={dateFormatShortSelectId}
                    className="w-full sm:w-[220px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(SHORT_DATE_FORMATS).map((format) => (
                      <SelectItem key={format} value={format}>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-mono text-sm">{format}</span>
                          <span className="text-muted-foreground text-xs">
                            {getFormatPreview(
                              format as keyof typeof SHORT_DATE_FORMATS,
                            )}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Long Date Format Preference */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={dateFormatLongSelectId}
                    className="block font-medium text-sm"
                  >
                    Long date format
                  </label>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Verbose text-based formats for headers and announcements
                  </p>
                </div>
                <Select
                  value={dateFormatLong}
                  onValueChange={(value) =>
                    handleDateFormatChange(value, "long")
                  }
                >
                  <SelectTrigger
                    id={dateFormatLongSelectId}
                    className="w-full sm:w-[220px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(LONG_DATE_FORMATS).map((format) => (
                      <SelectItem key={format} value={format}>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-mono text-sm">{format}</span>
                          <span className="text-muted-foreground text-xs">
                            {getFormatPreview(
                              format as keyof typeof LONG_DATE_FORMATS,
                            )}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Full Date Format Preference */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={dateFormatFullSelectId}
                    className="block font-medium text-sm"
                  >
                    Full date format
                  </label>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Includes day of week for detailed displays (e.g., titles)
                  </p>
                </div>
                <Select
                  value={dateFormatFull}
                  onValueChange={(value) =>
                    handleDateFormatChange(value, "full")
                  }
                >
                  <SelectTrigger
                    id={dateFormatFullSelectId}
                    className="w-full sm:w-[280px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(FULL_DATE_FORMATS).map((format) => (
                      <SelectItem key={format} value={format}>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-mono text-sm">{format}</span>
                          <span className="text-muted-foreground text-xs">
                            {getFormatPreview(
                              format as keyof typeof FULL_DATE_FORMATS,
                            )}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card variant="info" className="rounded-md">
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
