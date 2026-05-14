"use client";

import { Button } from "@/components/ui/button";
import { type Theme, useTheme } from "@/hooks/use-theme";
import { THEME_OPTIONS } from "@/lib/theme-config";

const CYCLE: Theme[] = ["light", "dark", "system"];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { icon: Icon, label } = THEME_OPTIONS[theme];

  const next = () => {
    const idx = CYCLE.indexOf(theme);
    setTheme(CYCLE[(idx + 1) % CYCLE.length]);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={next}
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label}`}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}
