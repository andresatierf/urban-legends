"use client";

import { Link } from "@tanstack/react-router";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type TableOptions,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
    <div>
      {enableSearch && (
        <div className="flex items-center py-4">
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
      <div className="overflow-hidden">
        <Table className="w-full border-collapse text-left">
          <TableCaption className="text-label-caps text-muted-foreground m-0 flex-1 py-2">
            {table.options.enableRowSelection
              ? `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected`
              : `${data.length} rows`}
          </TableCaption>
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
      </div>
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
