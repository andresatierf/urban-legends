import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-visible:ring-ring/60 focus-visible:ring-offset-background aria-invalid:ring-destructive/40 inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] outline-none select-none focus-visible:ring-[3px] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-[3px] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-primary text-primary-foreground border-2 shadow-[3px_3px_0_var(--color-shadow)] hover:brightness-110 active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_var(--color-shadow)]",
        secondary:
          "border-foreground bg-card text-foreground hover:bg-accent border-2 shadow-[3px_3px_0_var(--color-shadow)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_var(--color-shadow)]",
        destructive:
          "border-foreground bg-destructive text-destructive-foreground border-2 shadow-[3px_3px_0_var(--color-shadow)] hover:brightness-110 active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_var(--color-shadow)]",
        outline:
          "border-foreground text-foreground hover:bg-accent border-2 bg-transparent",
        ghost:
          "text-foreground hover:bg-muted aria-expanded:bg-muted dark:hover:bg-muted/50",
        link: "text-primary underline underline-offset-4 hover:brightness-110",
        icon: "text-foreground hover:bg-muted aria-expanded:bg-muted",
      },
      size: {
        default:
          "h-9 gap-1.5 px-4 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
