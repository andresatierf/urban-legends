import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  cn(
    "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-semibold text-xs transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    "[&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        approved:
          "border-transparent bg-badge-approved-bg text-badge-approved-text shadow hover:bg-badge-approved-bg/80",
        pending:
          "border-transparent bg-badge-pending-bg text-badge-pending-text shadow hover:bg-badge-pending-bg/80",
        rejected:
          "border-transparent bg-badge-rejected-bg text-badge-rejected-text shadow hover:bg-badge-rejected-bg/80",
        deleted:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
