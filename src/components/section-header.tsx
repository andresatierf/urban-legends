import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Eyebrow } from "./ui/eyebrow";

type Props = {
  as?: keyof React.JSX.IntrinsicElements;
  title: string;
  description?: string;
  eyebrow?: string;
  Icon?: LucideIcon;
  children?: React.ReactNode;
};

export function SectionHeader({
  as: Comp = "h2",
  title,
  description,
  eyebrow,
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
          {eyebrow && <Eyebrow className="mb-1 block">{eyebrow}</Eyebrow>}
          <Comp
            className={cn("text-foreground", {
              "text-h1": Comp === "h1",
              "text-h2": Comp === "h2",
            })}
          >
            {title}
          </Comp>
          {description && (
            <p className="text-body-md text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-3">{children}</div>
    </div>
  );
}
