import { cn } from "@/lib/utils";

const SLOT_CLASSES = {
  topLeft: "-top-3 left-4",
  topCenter: "-top-3 left-1/2 -translate-x-1/2",
  topRight: "-top-3 right-6",
  bottomLeft: "-bottom-3 left-4",
  bottomCenter: "-bottom-3 left-1/2 -translate-x-1/2",
  bottomRight: "right-4 -bottom-3",
} as const;

type SlotKey = keyof typeof SLOT_CLASSES;

type Props = {
  children: React.ReactNode;
  className?: string;
} & Partial<Record<SlotKey, React.ReactNode>>;

export function EdgeOverlay({ children, className, ...slots }: Props) {
  return (
    <div className={cn("relative grid", className)}>
      {children}
      {(Object.keys(SLOT_CLASSES) as SlotKey[]).map((key) => {
        const node = slots[key];
        if (!node) return null;
        return (
          <div key={key} className={cn("absolute z-10", SLOT_CLASSES[key])}>
            {node}
          </div>
        );
      })}
    </div>
  );
}
