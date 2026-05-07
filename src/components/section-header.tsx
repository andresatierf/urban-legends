import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  as?: keyof React.JSX.IntrinsicElements;
  title: string;
  description?: string;
  Icon?: LucideIcon;
  children?: React.ReactNode;
};

export function SectionHeader({
  as: Comp = "h2",
  title,
  description,
  Icon,
  children,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            className={cn({
              "h-8 w-8": Comp === "h1",
              "h-4 w-4": Comp === "h2",
            })}
          />
        )}
        <div>
          <Comp
            className={cn("font-semibold text-foreground", {
              "font-bold text-3xl": Comp === "h1",
              "text-lg": Comp === "h2",
            })}
          >
            {title}
          </Comp>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-3">{children}</div>
    </div>
  );
}
