import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardTitle } from "./ui/card";

const headerVariants = cva("pb-0 font-normal text-gray-600", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

const contentVariants = cva("", {
  variants: {
    color: {
      default: "text-primary",
      purple: "text-purple-600",
      green: "text-green-600",
      yellow: "text-yellow-500",
      blue: "text-blue-500",
    },
  },
  defaultVariants: {
    color: "default",
  },
});

export interface StatCardProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof headerVariants>,
    VariantProps<typeof contentVariants> {
  title: string;
  value: number | string;
  link?: string;
  linkText?: string;
}

export function StatCard({
  title,
  value,
  color,
  size,
  className,
  children,
}: StatCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <CardContent className="flex h-full items-center justify-between p-0">
        <div className="h-full">
          <CardTitle className={headerVariants({ size })}>{title}</CardTitle>
          <p className={cn("text-2xl font-bold", contentVariants({ color }))}>
            {value}
          </p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
