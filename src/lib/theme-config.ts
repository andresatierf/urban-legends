import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react";

import type { Theme } from "@/hooks/use-theme";

export const THEME_OPTIONS: Record<
  Theme,
  { icon: LucideIcon; label: string; description: string }
> = {
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
};
