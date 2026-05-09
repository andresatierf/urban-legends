"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { THEME_OPTIONS } from "@/lib/theme-config";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const CurrentIcon = THEME_OPTIONS[theme].icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Toggle theme">
          <CurrentIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        {(
          Object.entries(THEME_OPTIONS) as [
            keyof typeof THEME_OPTIONS,
            (typeof THEME_OPTIONS)[keyof typeof THEME_OPTIONS],
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

              {theme === key && (
                <Check className="text-primary ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
