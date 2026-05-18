import { cn } from "@/lib/utils";

const SLOT_CLASSES = {
  topLeft: "top-0 left-4 -translate-y-1/2",
  topCenter: "-top-3 left-1/2 -translate-x-1/2",
  topRight: "top-0 right-6 -translate-y-1/2",
  bottomLeft: "bottom-0 left-5 translate-y-1/2",
  bottomCenter: "-bottom-3 left-1/2 -translate-x-1/2",
  bottomRight: "right-5 bottom-0 translate-y-1/2",
} as const;

type SlotKey = keyof typeof SLOT_CLASSES;

type Props = {
  children: React.ReactNode;
  className?: string;
} & Partial<Record<SlotKey, React.ReactNode>>;

export function EdgeOverlay({ children, className, ...slots }: Props) {
  return (
    <div
      className={cn(
        "relative grid min-w-0 grid-cols-[minmax(0,1fr)]",
        className,
      )}
    >
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
