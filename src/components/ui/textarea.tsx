import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-border bg-chip placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:border-muted-foreground/30 disabled:bg-muted disabled:text-muted-foreground flex field-sizing-content min-h-16 w-full resize-none rounded-md border-2 px-2 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed aria-invalid:ring-[3px] md:text-xs/relaxed",
        className,
      )}
      {...props}
    />
  );
}

export type TextareaProps = React.ComponentProps<"textarea">;
export { Textarea };
