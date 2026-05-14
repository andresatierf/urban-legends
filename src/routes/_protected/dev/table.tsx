import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { DataTable } from "@/components/ui/data-table/data-table";

export const Route = createFileRoute("/_protected/dev/table")({
  component: TableWorkbenchPage,
});

type SampleRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  status: "active" | "inactive" | "pending";
};

const STATUS_VARIANT: Record<
  SampleRow["status"],
  "success" | "neutral" | "warning"
> = {
  active: "success",
  inactive: "neutral",
  pending: "warning",
};

const columns: ColumnDef<SampleRow, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("email")}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "points",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Points" />
    ),
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.getValue("points")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as SampleRow["status"];
      return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
    },
  },
];

const data: SampleRow[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Captain",
    points: 142,
    status: "active",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    role: "Member",
    points: 98,
    status: "active",
  },
  {
    id: "3",
    name: "Charlie Davis",
    email: "charlie@example.com",
    role: "Member",
    points: 76,
    status: "pending",
  },
  {
    id: "4",
    name: "Diana Martinez",
    email: "diana@example.com",
    role: "Captain",
    points: 134,
    status: "active",
  },
  {
    id: "5",
    name: "Ethan Brown",
    email: "ethan@example.com",
    role: "Member",
    points: 51,
    status: "inactive",
  },
  {
    id: "6",
    name: "Fiona Wilson",
    email: "fiona@example.com",
    role: "Member",
    points: 89,
    status: "active",
  },
  {
    id: "7",
    name: "George Lee",
    email: "george@example.com",
    role: "Captain",
    points: 167,
    status: "active",
  },
  {
    id: "8",
    name: "Hannah Chen",
    email: "hannah@example.com",
    role: "Member",
    points: 43,
    status: "pending",
  },
  {
    id: "9",
    name: "Ivan Rodriguez",
    email: "ivan@example.com",
    role: "Member",
    points: 112,
    status: "active",
  },
  {
    id: "10",
    name: "Julia Kim",
    email: "julia@example.com",
    role: "Member",
    points: 65,
    status: "inactive",
  },
  {
    id: "11",
    name: "Kevin Park",
    email: "kevin@example.com",
    role: "Captain",
    points: 155,
    status: "active",
  },
  {
    id: "12",
    name: "Laura Thompson",
    email: "laura@example.com",
    role: "Member",
    points: 78,
    status: "active",
  },
  {
    id: "13",
    name: "Marco Rossi",
    email: "marco@example.com",
    role: "Member",
    points: 94,
    status: "pending",
  },
  {
    id: "14",
    name: "Nina Patel",
    email: "nina@example.com",
    role: "Member",
    points: 121,
    status: "active",
  },
  {
    id: "15",
    name: "Oscar Nguyen",
    email: "oscar@example.com",
    role: "Captain",
    points: 183,
    status: "active",
  },
];

function TableWorkbenchPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-h2">DataTable</h2>

      <section className="space-y-4">
        <h3 className="text-h3">Full treatment</h3>
        <p className="text-body-sm text-muted-foreground">
          Paper background, label-caps headers on paper-deep, 1px ink-alpha
          dividers, sunset hover, sunset sort indicator, 44px rows, outline
          pagination buttons.
        </p>
        <Card className="overflow-hidden">
          <DataTable
            columns={columns}
            data={data}
            enableSearch
            initialState={{ pagination: { pageSize: 5 } }}
          />
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Without search</h3>
        <Card className="overflow-hidden">
          <DataTable columns={columns} data={data.slice(0, 8)} />
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Empty state</h3>
        <Card className="overflow-hidden">
          <DataTable
            columns={columns}
            data={[]}
            emptyMessage="No participants found."
          />
        </Card>
      </section>
    </div>
  );
}
