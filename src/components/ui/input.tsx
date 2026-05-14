import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-border bg-card file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:border-muted-foreground/30 disabled:bg-muted disabled:text-muted-foreground h-7 w-full min-w-0 rounded-md border-2 px-2 py-0.5 text-sm transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs/relaxed file:font-medium focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:ring-[3px] md:text-xs/relaxed",
        className,
      )}
      {...props}
    />
  );
}

export type InputProps = React.ComponentProps<"input">;
export { Input };
