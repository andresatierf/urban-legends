import { cn } from "@/lib/utils";

export function SectionLabel({
  tone,
  children,
}: {
  tone: "your" | "rest";
  children: React.ReactNode;
}) {
  return (
    <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          tone === "your" ? "bg-success" : "bg-info",
        )}
      />
      {children}
    </h3>
  );
}
