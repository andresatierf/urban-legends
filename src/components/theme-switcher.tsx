"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";

const THEME_CONFIG = {
  light: {
    icon: Sun,
    label: "Light",
    description: "Use light theme",
  },
  dark: {
    icon: Moon,
    label: "Dark",
    description: "Use dark theme",
  },
  system: {
    icon: Monitor,
    label: "System",
    description: "Follow system preference",
  },
} as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const CurrentIcon = THEME_CONFIG[theme].icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Toggle theme">
          <CurrentIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(
          Object.entries(THEME_CONFIG) as [
            keyof typeof THEME_CONFIG,
            (typeof THEME_CONFIG)[keyof typeof THEME_CONFIG],
          ][]
        ).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{config.label}</span>
                <span className="text-muted-foreground text-xs">
                  {config.description}
                </span>
              </div>
              {theme === key && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
