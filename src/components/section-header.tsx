import { cn } from "@/lib/utils";

type Props = {
  as?: keyof React.JSX.IntrinsicElements;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function SectionHeader({
  as: Comp = "h2",
  title,
  description,
  children,
}: Props) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <Comp
          className={cn("font-semibold text-foreground", {
            "font-bold text-3xl": Comp === "h1",
            "text-lg": Comp === "h2",
          })}
        >
          {title}
        </Comp>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="flex gap-3">{children}</div>
    </div>
  );
}
