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
  const weekStartSelectId = useId();

  // Load week start preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(WEEK_START_STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number.parseInt(stored, 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 6) {
        setWeekStartsOn(parsed);
      }
    }
  }, []);

  // Save week start preference to localStorage
  const handleWeekStartChange = (value: string) => {
    const newStart = Number.parseInt(value, 10);
    setWeekStartsOn(newStart);
    localStorage.setItem(WEEK_START_STORAGE_KEY, value);
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
              <Card variant="info" className="rounded-md">
                <CardContent>
                  <p className="text-sm">
                    <strong>Note:</strong> This setting affects how dates are
                    displayed in the submission calendar. Your preference is
                    saved locally and will persist across sessions.
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
