import { cn } from "@/lib/utils";

type Props<T> = {
  data: T[];
  empty?: React.ReactNode;
  className?: string;
  children: (item: T, index: number, array: T[]) => React.ReactNode;
};

export function CardGrid<T>({ data, empty, className, children }: Props<T>) {
  if (!data || data.length === 0) return empty;

  return (
    <div className={cn("grid grid-cols-1 gap-2 lg:grid-cols-2", className)}>
      {data.map((item, i, arr) => children(item, i, arr))}
    </div>
  );
}
