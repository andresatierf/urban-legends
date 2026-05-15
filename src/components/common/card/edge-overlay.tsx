import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const edgeOverlayVariants = cva("absolute z-10", {
  variants: {
    position: {
      "top-left": "-top-2 -left-2",
      "top-center": "-top-2 left-1/2 -translate-x-1/2",
      "top-right": "-top-3 right-6",
      "bottom-left": "-bottom-3 left-4",
      "bottom-center": "-bottom-2 left-1/2 -translate-x-1/2",
      "bottom-right": "right-4 -bottom-3",
    },
  },
});

type Props = VariantProps<typeof edgeOverlayVariants> & {
  className?: string;
  children: React.ReactNode;
};

export function EdgeOverlay({ position, className, children }: Props) {
  return (
    <div className={cn(edgeOverlayVariants({ position }), className)}>
      {children}
    </div>
  );
}
