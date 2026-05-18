import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

const gridVariants = cva("grid grid-cols-3", {
  variants: {
    variant: {
      divided: "divide-x rounded-md border",
      tiles: "gap-2",
      strip: "border-ink/15 gap-2 rounded-md border border-dashed p-2",
    },
  },
  defaultVariants: { variant: "divided" },
});

const cellVariants = cva("flex flex-col items-center text-center", {
  variants: {
    variant: {
      divided: "py-2",
      tiles:
        "border-ink bg-card rounded-xl border-2 px-2 py-2 shadow-sm transition-shadow duration-[120ms] ease-linear hover:shadow-md",
      strip: "gap-0.5",
    },
  },
  defaultVariants: { variant: "divided" },
});

const valueVariants = cva("text-sm font-semibold", {
  variants: {
    variant: {
      divided: "tabular-nums",
      tiles: "text-metric",
      strip: "flex items-baseline gap-0.5 leading-none",
    },
  },
  defaultVariants: { variant: "divided" },
});

export type StatItem = {
  icon?: React.ComponentType<{ className?: string }>;
  value: React.ReactNode;
  label: React.ReactNode;
};

type Props = VariantProps<typeof gridVariants> & {
  items: StatItem[];
  className?: string;
};

export function StatsGrid({ items, variant, className }: Props) {
  return (
    <div className={cn(gridVariants({ variant }), className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        const labelNode =
          variant === "tiles" ? (
            <Eyebrow>{item.label}</Eyebrow>
          ) : variant === "strip" ? (
            <span className="text-muted-foreground text-[0.6rem] tracking-[0.15em] uppercase">
              {item.label}
            </span>
          ) : (
            <div className="text-muted-foreground text-[0.625rem]">
              {item.label}
            </div>
          );
        const valueNode = (
          <div className={valueVariants({ variant })}>{item.value}</div>
        );
        return (
          <div key={i} className={cellVariants({ variant })}>
            {Icon && <Icon className="text-muted-foreground mb-1 size-3.5" />}
            {variant === "strip" ? labelNode : valueNode}
            {variant === "strip" ? valueNode : labelNode}
          </div>
        );
      })}
    </div>
  );
}
