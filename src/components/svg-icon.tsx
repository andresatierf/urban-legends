import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva("h-min rounded-full p-3", {
  variants: {
    variant: {
      blue: "bg-blue-100",
      green: "bg-green-100",
      yellow: "bg-yellow-100 ",
      purple: "",
    },
  },
});

const svgVariants = cva("h-6 w-6", {
  variants: {
    variant: {
      blue: "text-blue-600",
      green: "text-green-600",
      yellow: "text-yellow-600",
      purple: "text-purple-600",
    },
  },
});

export function SvgIcon({
  variant,
  className,
  children,
  ariaLabel,
}: {
  children: React.ReactElement<SVGPathElement>;
  className?: string;
  ariaLabel?: string;
} & VariantProps<typeof containerVariants> &
  VariantProps<typeof svgVariants>) {
  return (
    <div className={cn(containerVariants({ variant }), className)}>
      <svg
        className={svgVariants({ variant })}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        role="img"
        aria-label={ariaLabel || "Icon"}
      >
        {children}
      </svg>
    </div>
  );
}
