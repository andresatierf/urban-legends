import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const eyebrowVariants = cva("text-label-caps", {
  variants: {
    color: {
      mute: "text-muted-foreground",
      sunset: "text-primary",
      grass: "text-success",
      sky: "text-info",
      plum: "text-social",
      gold: "text-warning",
    },
  },
  defaultVariants: {
    color: "mute",
  },
});

type EyebrowProps = Omit<React.ComponentProps<"span">, "ref"> &
  VariantProps<typeof eyebrowVariants> & {
    as?: "span" | "div" | "p" | "label";
  };

function Eyebrow({
  className,
  color,
  as: Comp = "span",
  children,
  ...props
}: EyebrowProps) {
  return (
    <Comp
      className={cn(eyebrowVariants({ color }), className)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Comp>
  );
}

export { Eyebrow, eyebrowVariants };
