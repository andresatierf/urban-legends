import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";
import { Card } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type Props<T> = {
  title: string;
  actions?: React.ReactNode;
  columns: {
    key: keyof T;
    title: string;
    className?: string;
    headerClassName?: string;
    rowClassName?: string;
  }[];
  rows: T[];
  emptyMessage?: string;
};

export function TableSection<T extends { _id: string }>({
  title,
  actions,
  columns,
  rows = [],
  emptyMessage,
}: Props<T>) {
  return (
    <>
      <SectionHeader text={title}>{actions}</SectionHeader>

      <Card className="overflow-clip">
        <Table className="w-full border-collapse text-left">
          <TableHeader className="bg-gray-50 text-gray-600 text-sm uppercase">
            <TableRow>
              {columns.map((column) => {
                const key = column.key as string;
                const name = column.title;

                return (
                  <TableHead
                    key={key}
                    className={cn(
                      "p-3",
                      column.className,
                      column.headerClassName,
                    )}
                  >
                    {name}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row._id}
                  className="border-t transition hover:bg-gray-50"
                >
                  {columns.map((column) => {
                    const key = column.key as string;
                    const value = key.includes(".")
                      ? key.split(".").reduce((acc, k) => acc?.[k], row)
                      : row[column.key];

                    return (
                      <TableCell
                        key={key}
                        className={cn(
                          "p-3",
                          column.className,
                          column.rowClassName,
                        )}
                      >
                        {value as string}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="p-4 text-center text-gray-500 italic"
                >
                  {emptyMessage || "No data yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
