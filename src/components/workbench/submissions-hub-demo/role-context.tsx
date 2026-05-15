"use client";

import { Eye, Gavel, ShieldCheck, User } from "lucide-react";

import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

export type DemoRole = "player" | "reviewer" | "manager";

export const DEMO_ROLES: {
  value: DemoRole;
  label: string;
  description: string;
  Icon: typeof User;
}[] = [
  {
    value: "player",
    label: "Player",
    description: "Logs activities for their team.",
    Icon: User,
  },
  {
    value: "reviewer",
    label: "Reviewer",
    description: "Triages a queue of pending team activities.",
    Icon: Gavel,
  },
  {
    value: "manager",
    label: "Tournament Manager",
    description: "All-tabs view with search, sort, filters.",
    Icon: ShieldCheck,
  },
];

type Props = {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  className?: string;
};

export function DemoRoleSwitcher({ role, setRole, className }: Props) {
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-lg p-[3px]",
        className,
      )}
      role="radiogroup"
      aria-label="Viewing as"
    >
      {DEMO_ROLES.map(({ value, label, Icon }) => {
        const active = role === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setRole(value)}
            className={cn(
              "hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-md border-2 border-transparent px-3 text-xs font-medium whitespace-nowrap transition-colors",
              active &&
                "border-foreground bg-background text-foreground shadow-[2px_2px_0_var(--color-shadow)]",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function DemoHeader({
  variant,
  blurb,
}: {
  variant: string;
  blurb: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Eye className="text-primary size-6" />
      <div>
        <Eyebrow color="sunset">Submissions hub · {variant}</Eyebrow>
        <p className="text-muted-foreground text-sm">{blurb}</p>
      </div>
    </div>
  );
}
