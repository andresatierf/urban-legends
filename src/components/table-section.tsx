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
  columns: { key: keyof T; name: string; align?: string; color?: string }[];
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
                const name = column.name;
                const align = column?.align || "";

                return (
                  <TableHead
                    key={key}
                    className={cn("p-3", {
                      "text-right": align === "right",
                      "text-center": align === "center",
                      "text-left": align === "left",
                    })}
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
                    const align = column?.align || "";
                    const value = key.includes(".")
                      ? key.split(".").reduce((acc, k) => acc?.[k], row)
                      : row[column.key];
                    const color = column.color || "";

                    return (
                      <TableCell
                        key={key}
                        className={cn(`p-3 ${color}`, {
                          "text-right": align === "right",
                          "text-center": align === "center",
                          "text-left": align === "left",
                        })}
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
