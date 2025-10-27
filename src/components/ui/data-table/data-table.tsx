"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  type TableOptions,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Card } from "../card";
import { Checkbox } from "../checkbox";
import { Input } from "../input";
import { DataTablePagination } from "./pagination";
import { DataTableViewOptions } from "./view-options";

export interface DataTableProps<TData, TValue>
  extends Partial<TableOptions<TData>> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableSearch?: boolean;
  emptyMessage?: string;
  rowClassName?: (row: Row<TData>) => string;
  hrefFn?: (row: Row<TData>) => string;
}

export function DataTable<TData, TValue>({
  columns = [],
  data = [],
  enableSearch,
  emptyMessage = "No results.",
  rowClassName,
  hrefFn,
  ...props
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columnDef: ColumnDef<TData, TValue>[] = useMemo(() => {
    if (!props.enableRowSelection) return columns;

    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
      },
      ...columns,
    ];
  }, [columns, props.enableRowSelection]);

  const table = useReactTable({
    data,
    columns: columnDef,
    enableRowSelection: false,
    ...props,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div>
      {enableSearch && (
        <div className="flex items-center py-4">
          <Input
            type="search"
            placeholder="Filter by description..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DataTableViewOptions table={table} />
        </div>
      )}
      <Card className="overflow-hidden">
        <Table className="w-full border-collapse text-left">
          <TableCaption className="m-0 flex-1 bg-gray-50 py-2 text-muted-foreground text-sm">
            {table.options.enableRowSelection
              ? `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected`
              : `${data.length} rows`}
          </TableCaption>
          <TableHeader className="bg-gray-50 text-gray-600 text-sm uppercase">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="p-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) =>
                hrefFn ? (
                  <Link key={row.id} href={hrefFn(row)} className="contents">
                    <InnerTableRow row={row} className={rowClassName?.(row)} />
                  </Link>
                ) : (
                  <InnerTableRow
                    key={row.id}
                    row={row}
                    className={rowClassName?.(row)}
                  />
                ),
              )
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <DataTablePagination table={table} />
    </div>
  );
}

type InnerTableRowProps<TData> = {
  row: Row<TData>;
  className?: string;
};

function InnerTableRow<TData>({ row, className }: InnerTableRowProps<TData>) {
  return (
    <TableRow
      key={row.id}
      data-state={row.getIsSelected() && "selected"}
      className={cn("border-t transition hover:bg-gray-50", className)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="p-3">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
