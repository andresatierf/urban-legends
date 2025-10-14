import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// .auth-input-field {
// 	width: 100%;
// 	border-radius: 12px;
// 	border-width: 1px;
// 	--tw-border-opacity: 1;
// 	border-color: rgb(229 231 235 / var(--tw-border-opacity, 1));
// 	--tw-bg-opacity: 1;
// 	background-color: rgb(255 255 255 / var(--tw-bg-opacity, 1));
// 	--tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
// 	--tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
// 	box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
// 	outline: 2px solid transparent;
// 	outline-offset: 2px;
// 	transition-property: box-shadow;
// 	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
// 	transition-duration: 150ms;
// }

const inputVariants = cva(
  cn(
    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  ),
  {
    variants: {
      size: {
        default: "h-9 px-4 py-3 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function Input({
  className,
  type,
  size,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
