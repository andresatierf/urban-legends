import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  const iconClass = "ml-1 h-3 w-3";

  if (direction === "asc") return <ArrowUp className={iconClass} />;
  if (direction === "desc") return <ArrowDown className={iconClass} />;
  return <ArrowUpDown className={iconClass} />;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={cn(className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      className={cn(
        "hover:text-foreground inline-flex items-center font-[inherit]",
        sorted && "text-primary",
        className,
      )}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      <SortIcon direction={sorted} />
    </button>
  );
}
