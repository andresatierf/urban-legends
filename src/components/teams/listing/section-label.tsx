import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

export function SectionLabel({
  tone,
  children,
}: {
  tone: "your" | "rest";
  children: React.ReactNode;
}) {
  return (
    <Eyebrow as="div" className="flex items-center gap-2">
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          tone === "your" ? "bg-success" : "bg-info",
        )}
      />
      {children}
    </Eyebrow>
  );
}
