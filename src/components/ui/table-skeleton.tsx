import { Card } from "./card";
import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

type Props = {
  columns: number;
  rows?: number;
  headers?: string[];
  className?: string;
};

export function TableSkeleton({
  columns,
  rows = 5,
  headers,
  className,
}: Props) {
  return (
    <Card className={className} role="status" aria-busy="true">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            {headers
              ? headers.map((header) => (
                  <TableHead key={header} className="p-3">
                    {header}
                  </TableHead>
                ))
              : Array.from({ length: columns }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton placeholder - order never changes
                  <TableHead key={i} className="p-3">
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton placeholder - order never changes
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton placeholder - order never changes
                <TableCell key={colIndex} className="p-3">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
