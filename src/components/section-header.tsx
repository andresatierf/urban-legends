import { cn } from "@/lib/utils";

type Props = {
  as?: keyof JSX.IntrinsicElements;
  text: string;
  children?: React.ReactNode;
};

export function SectionHeader({ as: Comp = "h2", text, children }: Props) {
  return (
    <div className="flex items-center justify-between">
      <Comp
        className={cn("font-semibold text-gray-800", {
          "text-2xl": Comp === "h1",
          "text-lg": Comp === "h2",
        })}
      >
        {text}
      </Comp>
      {children}
    </div>
  );
}
