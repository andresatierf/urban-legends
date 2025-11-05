import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  BUTTON_COLORS,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  type ButtonColorValues,
  type ButtonSizeValues,
  type ButtonVariantValues,
} from "./button.types";

// Re-export for convenience
export { BUTTON_COLORS, BUTTON_SIZES, BUTTON_VARIANTS };
export type { ButtonColorValues, ButtonSizeValues, ButtonVariantValues };

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        solid: "shadow-xs",
        outline:
          "border bg-background shadow-xs hover:bg-accent dark:bg-input/30 dark:border-input",
        ghost: "",
        link: "underline-offset-4 hover:underline",
      } satisfies Record<ButtonVariantValues, string>,
      color: {
        default: "",
        destructive: "",
        secondary: "",
        purple: "",
      } satisfies Record<ButtonColorValues, string>,
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        md: "h-9 px-4 py-2 has-[>svg]:px-3",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-md": "size-9",
        "icon-lg": "size-10",
      } satisfies Record<ButtonSizeValues, string>,
    },
    compoundVariants: [
      // Solid + Default
      {
        variant: "solid",
        color: "default",
        className: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      // Solid + Destructive
      {
        variant: "solid",
        color: "destructive",
        className:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
      },
      // Solid + Secondary
      {
        variant: "solid",
        color: "secondary",
        className:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      // Solid + Purple
      {
        variant: "solid",
        color: "purple",
        className:
          "bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-600/20 dark:focus-visible:ring-purple-600/40",
      },
      // Outline + Default
      {
        variant: "outline",
        color: "default",
        className:
          "text-foreground hover:text-accent-foreground dark:hover:bg-input/50",
      },
      // Outline + Destructive
      {
        variant: "outline",
        color: "destructive",
        className:
          "border-destructive text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20",
      },
      // Outline + Secondary
      {
        variant: "outline",
        color: "secondary",
        className: "text-secondary-foreground hover:bg-secondary/20",
      },
      // Outline + Purple
      {
        variant: "outline",
        color: "purple",
        className:
          "bg-white text-purple-700 shadow-sm hover:shadow-md transition-shadow focus-visible:ring-purple-600/20",
      },
      // Ghost + Default
      {
        variant: "ghost",
        color: "default",
        className:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
      },
      // Ghost + Destructive
      {
        variant: "ghost",
        color: "destructive",
        className:
          "text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20",
      },
      // Ghost + Secondary
      {
        variant: "ghost",
        color: "secondary",
        className: "text-secondary-foreground hover:bg-secondary/20",
      },
      // Ghost + Purple
      {
        variant: "ghost",
        color: "purple",
        className:
          "text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-950",
      },
      // Link + Default
      {
        variant: "link",
        color: "default",
        className: "text-primary",
      },
      // Link + Destructive
      {
        variant: "link",
        color: "destructive",
        className: "text-destructive",
      },
      // Link + Secondary
      {
        variant: "link",
        color: "secondary",
        className: "text-secondary-foreground",
      },
      // Link + Purple
      {
        variant: "link",
        color: "purple",
        className: "text-purple-700",
      },
    ],
    defaultVariants: {
      variant: "solid",
      color: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends Omit<React.ComponentProps<"button">, "size">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  color,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, color, size, className }))}
      {...props}
    />
  );
}
