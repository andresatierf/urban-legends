import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "../button";

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  const iconClass = "ml-1 h-3.5 w-3.5";

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
    return <div className={cn(className)}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8", sorted && "text-primary", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      <SortIcon direction={sorted} />
    </Button>
  );
}
