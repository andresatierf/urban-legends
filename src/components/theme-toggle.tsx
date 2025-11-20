"use client";

import { type Theme, useTheme } from "@/hooks/use-theme";
import { THEME_OPTIONS } from "@/lib/theme-config";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border bg-background p-1">
      {Object.entries(THEME_OPTIONS).map(([value, { icon: Icon, label }]) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value as Theme)}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-colors",
            "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            theme === value
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/80"
              : "text-muted-foreground",
          )}
          aria-pressed={theme === value}
          aria-label={`${label} theme`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
