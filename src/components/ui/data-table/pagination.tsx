import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "../button";
import { ComposedSelect } from "../composed-select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const isSinglePage = table.getPageCount() < 2;
  return (
    <div className="bg-secondary/50 border-border/40 flex items-center justify-between border-t px-4 py-1.5">
      <div className="text-label-caps text-muted-foreground flex-1">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-label-caps text-muted-foreground">Rows per page</p>
          <ComposedSelect
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
            side="top"
            className="h-8 min-w-[70px]"
            options={[10, 20, 25, 30, 40, 50].map((n) => ({
              value: `${n}`,
              label: `${n}`,
            }))}
          />
        </div>
        {!isSinglePage && (
          <>
            <div className="text-label-caps text-muted-foreground flex min-w-[100px] items-center justify-center">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
