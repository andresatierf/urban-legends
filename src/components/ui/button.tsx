import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-clip-padding font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        solid: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      color: {
        default: "",
        destructive: "",
        secondary: "",
        purple: "",
        blue: "",
        green: "",
        orange: "",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),10px)] px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),12px)]",
        "icon-md": "size-8",
        "icon-lg": "size-9",
      },
      shape: {
        default: "",
        rounded: "rounded-lg",
        squared: "rounded-none",
        pill: "rounded-full",
      },
    },
    compoundVariants: [
      {
        variant: "solid",
        color: "destructive",
        className:
          "bg-destructive/80 text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
      },
      {
        variant: "solid",
        color: "secondary",
        className:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      {
        variant: "solid",
        color: "purple",
        className:
          "bg-button-purple text-white hover:bg-button-purple-hover focus-visible:ring-purple-600/20 dark:focus-visible:ring-purple-600/40",
      },
      {
        variant: "solid",
        color: "blue",
        className:
          "bg-button-blue text-white hover:bg-button-blue-hover focus-visible:ring-blue-600/20 dark:focus-visible:ring-blue-600/40",
      },
      {
        variant: "solid",
        color: "green",
        className:
          "bg-button-green text-white hover:bg-button-green-hover focus-visible:ring-green-600/20 dark:focus-visible:ring-green-600/40",
      },
      {
        variant: "solid",
        color: "orange",
        className:
          "bg-button-orange text-white hover:bg-button-orange-hover focus-visible:ring-orange-600/20 dark:focus-visible:ring-orange-600/40",
      },
      {
        variant: "outline",
        color: "destructive",
        className:
          "border-destructive text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20",
      },
      {
        variant: "outline",
        color: "secondary",
        className: "text-secondary-foreground hover:bg-background/80",
      },
      {
        variant: "outline",
        color: "purple",
        className:
          "border-button-purple-border bg-button-purple-bg-light text-button-purple-text shadow-sm transition-shadow hover:border-button-purple-border-hover hover:text-button-purple-text-hover hover:shadow-md focus-visible:ring-purple-600/20",
      },
      {
        variant: "outline",
        color: "blue",
        className:
          "border-button-blue-border text-button-blue-text hover:border-button-blue-border-hover hover:bg-button-blue-bg-light hover:text-button-blue-text-hover",
      },
      {
        variant: "outline",
        color: "green",
        className:
          "border-button-green-border text-button-green-text hover:border-button-green-border-hover hover:bg-button-green-bg-light hover:text-button-green-text-hover",
      },
      {
        variant: "outline",
        color: "orange",
        className:
          "border-button-orange-border text-button-orange-text hover:border-button-orange-border-hover hover:bg-button-orange-bg-light hover:text-button-orange-text-hover",
      },
      {
        variant: "ghost",
        color: "destructive",
        className:
          "text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20",
      },
      {
        variant: "ghost",
        color: "secondary",
        className: "text-secondary-foreground hover:bg-secondary/20",
      },
      {
        variant: "ghost",
        color: "purple",
        className:
          "text-button-purple-text hover:bg-button-purple-bg-light hover:text-button-purple-text-hover",
      },
      {
        variant: "ghost",
        color: "blue",
        className:
          "text-button-blue-text hover:bg-button-blue-bg-light hover:text-button-blue-text-hover",
      },
      {
        variant: "ghost",
        color: "green",
        className:
          "text-button-green-text hover:bg-button-green-bg-light hover:text-button-green-text-hover",
      },
      {
        variant: "ghost",
        color: "orange",
        className:
          "text-button-orange-text hover:bg-button-orange-bg-light hover:text-button-orange-text-hover",
      },
      {
        variant: "link",
        color: "destructive",
        className: "text-destructive",
      },
      {
        variant: "link",
        color: "secondary",
        className: "text-secondary-foreground",
      },
      {
        variant: "link",
        color: "purple",
        className:
          "text-button-purple-text hover:text-button-purple-text-hover",
      },
      {
        variant: "link",
        color: "blue",
        className: "text-button-blue-text hover:text-button-blue-text-hover",
      },
      {
        variant: "link",
        color: "green",
        className: "text-button-green-text hover:text-button-green-text-hover",
      },
      {
        variant: "link",
        color: "orange",
        className:
          "text-button-orange-text hover:text-button-orange-text-hover",
      },
    ],
    defaultVariants: {
      variant: "default",
      color: "default",
      size: "default",
      shape: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  color = "default",
  size = "default",
  shape = "default",
  asChild = false,
  ...props
}: Omit<React.ComponentProps<"button">, "color"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, color, size, shape, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
