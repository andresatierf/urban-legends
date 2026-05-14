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
      {sorted === "desc" ? (
        <ArrowDown
          className={cn("ml-1 h-3.5 w-3.5", sorted && "text-primary")}
        />
      ) : sorted === "asc" ? (
        <ArrowUp className={cn("ml-1 h-3.5 w-3.5", sorted && "text-primary")} />
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
      )}
    </Button>
  );
}
