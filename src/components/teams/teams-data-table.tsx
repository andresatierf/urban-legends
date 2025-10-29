import type { ColumnDef } from "@tanstack/react-table";
import { useMutation } from "convex/react";
import { capitalize } from "lodash";
import { Pencil, Trash } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import {
  DataTableSection,
  type DataTableSectionProps,
} from "../data-table-section";
import { Button } from "../ui/button";

type Props<T, V> = Pick<
  DataTableSectionProps<T, V>,
  "as" | "title" | "description" | "enableSearch"
> & {
  title: string;
  teams: (Doc<"teams"> & {
    role?: "member" | "captain";
    tournament?: Doc<"tournaments">;
    members?: (Doc<"teamMembers"> & { user?: Doc<"users"> })[];
  })[];
  showActions?: boolean;
  showRole?: boolean;
};

export function TeamsDataTable<T, V>({
  title = "Teams",
  teams,
  showActions,
  showRole,
  ...props
}: Props<T, V>) {
  const removeTeam = useMutation(api.teams.remove);

  const columns: ColumnDef<(typeof teams)[number]>[] = useMemo(() => {
    const cols: ColumnDef<(typeof teams)[number]>[] = [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "tournament.name", header: "Tournament" },
      {
        accessorKey: "members",
        header: "Members",
        cell: (cell) => {
          return (
            <ul>
              {cell.getValue()?.map((x) => (
                <li key={x.userId}>
                  {x.user?.email} {x.role === "captain" && "🎖"}
                </li>
              ))}
            </ul>
          );
        },
      },
      { header: "Points" },
    ];

    if (showRole)
      cols.splice(1, 0, {
        accessorFn: ({ role }) => capitalize(role),
        header: "Role",
      });

    if (showActions) {
      cols.push({
        id: "actions",
        cell: ({ row }) => {
          const team = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                href={`/teams/${team._id}/edit`}
                variant="secondary"
                size="icon"
                className="z-10"
              >
                <Pencil />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeTeam({ teamId: team._id });
                  toast(`The team '${team.name}' has been removed`);
                }}
                className="z-10"
              >
                <Trash />
              </Button>
            </div>
          );
        },
      });
    }

    return cols;
  }, [showActions, removeTeam, showRole]);

  return (
    <DataTableSection
      {...props}
      title={title}
      columns={columns}
      data={teams}
      hrefFn={(row) => `/teams/${row.original._id}`}
      emptyMessage="No teams yet."
    />
  );
}
