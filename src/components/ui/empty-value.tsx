import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"span"> & {
  label?: string;
};

export function EmptyValue({ className, label = "No value", ...props }: Props) {
  return (
    <span
      data-slot="empty-value"
      className={cn("text-muted-foreground font-mono", className)}
      {...props}
    >
      <span aria-hidden="true">—</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
