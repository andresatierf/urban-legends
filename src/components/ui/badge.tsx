import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent whitespace-nowrap transition-all focus-visible:ring-[3px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-2.5!",
  {
    variants: {
      variant: {
        success:
          "text-label-caps bg-badge-success-bg text-badge-success-text border-badge-success-border rounded-full border-2 tracking-[0.16em]",
        warning:
          "text-label-caps bg-badge-warning-bg text-badge-warning-text border-badge-warning-border rounded-full border-2 tracking-[0.16em]",
        error:
          "text-label-caps bg-badge-error-bg text-badge-error-text border-badge-error-border rounded-full border-2 tracking-[0.16em]",
        info: "text-label-caps bg-badge-info-bg text-badge-info-text border-badge-info-border rounded-full border-2 tracking-[0.16em]",
        social:
          "text-label-caps bg-badge-social-bg text-badge-social-text border-badge-social-border rounded-full border-2 tracking-[0.16em]",
        neutral:
          "text-label-caps bg-badge-neutral-bg text-badge-neutral-text border-badge-neutral-border rounded-full border-2 tracking-[0.16em]",
      },
      size: {
        xs: "h-[1.05rem] px-[0.45rem] py-[0.05rem] text-[0.55rem]!",
        sm: "h-[1.25rem] px-[0.6rem] py-[0.15rem] text-[0.6rem]!",
        default:
          "h-auto px-[0.75rem] pt-[0.18rem] pb-[0.26rem] text-[0.65rem]!",
        lg: "h-auto px-[0.95rem] pt-[0.38rem] pb-[0.5rem] text-[0.85rem]! leading-none",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "sm",
    },
  },
);

function Badge({
  className,
  variant = "neutral",
  size = "sm",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean };

export { Badge, badgeVariants };
