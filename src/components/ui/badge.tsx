import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent px-2 py-0.5 whitespace-nowrap transition-all focus-visible:ring-[3px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-2.5!",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a]:hover:bg-primary/80 rounded-full text-[0.625rem] font-medium",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80 rounded-full text-[0.625rem] font-medium",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20 rounded-full text-[0.625rem] font-medium",
        outline:
          "border-border bg-input/20 text-foreground dark:bg-input/30 [a]:hover:bg-muted [a]:hover:text-muted-foreground rounded-full text-[0.625rem] font-medium",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50 rounded-full text-[0.625rem] font-medium",
        link: "text-primary rounded-full text-[0.625rem] font-medium underline-offset-4 hover:underline",
        success:
          "text-label-caps bg-badge-success-bg text-badge-success-text rounded-sm",
        warning:
          "text-label-caps bg-badge-warning-bg text-badge-warning-text rounded-sm",
        error:
          "text-label-caps bg-badge-error-bg text-badge-error-text rounded-sm",
        info: "text-label-caps bg-badge-info-bg text-badge-info-text rounded-sm",
        social:
          "text-label-caps bg-badge-social-bg text-badge-social-text rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean };

export { Badge, badgeVariants };
