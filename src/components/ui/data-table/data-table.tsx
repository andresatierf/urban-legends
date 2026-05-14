"use client";

import { Link } from "@tanstack/react-router";
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
import { useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { Checkbox } from "../checkbox";
import { Input } from "../input";
import { DataTablePagination } from "./pagination";

export interface DataTableProps<TData, TValue> extends Partial<
  TableOptions<TData>
> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableSearch?: boolean;
  emptyMessage?: string;
  rowClassNameFn?: (row: Row<TData>) => string;
  hrefFn?: (row: Row<TData>) => string;
}

export function DataTable<TData, TValue>({
  columns = [],
  data = [],
  enableSearch,
  emptyMessage = "No results.",
  rowClassNameFn,
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
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="flex flex-col gap-3">
      {enableSearch && (
        <div className="flex items-center">
          <Input
            type="search"
            placeholder="Search..."
            value={table.getState().globalFilter}
            onChange={(e) => table.setGlobalFilter(String(e.target.value))}
            className="max-w-sm"
          />
          {/* <DataTableViewOptions table={table} /> */}
        </div>
      )}
      <div className="border-border bg-card overflow-hidden rounded-xl border-2 shadow-[4px_4px_0_var(--shadow)]">
        <Table className="w-full border-collapse text-left">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  <Link key={row.id} to={hrefFn(row)} className="contents">
                    <InnerTableRow
                      row={row}
                      className={rowClassNameFn?.(row)}
                    />
                  </Link>
                ) : (
                  <InnerTableRow
                    key={row.id}
                    row={row}
                    className={rowClassNameFn?.(row)}
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
        <DataTablePagination table={table} />
      </div>
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
      className={className}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
