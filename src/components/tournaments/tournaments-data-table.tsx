import type { ColumnDef } from "@tanstack/react-table";
import { useMutation } from "convex/react";
import { Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  tournaments: Doc<"tournaments">[];
  showActions?: boolean;
};

export function TournamentsDataTable<T, V>({
  title = "Tournaments",
  tournaments,
  showActions,
  ...props
}: Props<T, V>) {
  const now = new Date();
  const isoNow = now.toISOString();
  const removeTournament = useMutation(api.tournaments.remove);

  const columns: ColumnDef<(typeof tournaments)[number]>[] = useMemo(() => {
    const cols: ColumnDef<(typeof tournaments)[number]>[] = [
      { accessorKey: "name", header: "Name" },
      {
        accessorKey: "startDate",
        header: "Start Date",
        cell: (props) => (
          <div className="text-gray-600">{props.getValue() as string}</div>
        ),
      },
      {
        accessorKey: "endDate",
        header: "End Date",
        cell: (props) => (
          <div className="text-gray-600">{props.getValue() as string}</div>
        ),
      },
      {
        accessorKey: "teamMaxSize",
        header: () => <div className="text-right">Max Team Size</div>,
        cell: (props) => (
          <div className="text-right text-gray-600">
            {props.getValue() as string}
          </div>
        ),
      },
    ];

    if (showActions) {
      cols.push({
        id: "actions",
        cell: ({ row }) => {
          const tournament = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="icon" className="z-10" asChild>
                <Link href={`/tournaments/${tournament._id}/edit`}>
                  <Pencil />
                </Link>
              </Button>
              <Button
                color="destructive"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeTournament({ tournamentId: tournament._id });
                  toast(`The tournament '${tournament.name}' has been removed`);
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
  }, [showActions, removeTournament]);

  return (
    <DataTableSection
      {...props}
      title={title}
      columns={columns}
      data={tournaments}
      hrefFn={(row) => `/tournaments/${row.original._id}`}
      rowClassNameFn={(row) => {
        const startDate = row.getValue("startDate") as string;
        const endDate = row.getValue("endDate") as string;

        return cn("border-t transition", {
          "bg-green-50 hover:bg-green-100":
            startDate <= isoNow && endDate >= isoNow,
          "bg-yellow-50 hover:bg-yellow-100": startDate > isoNow,
          "bg-red-50 hover:bg-red-100": endDate < isoNow,
        });
      }}
      emptyMessage="No tournaments yet."
    />
  );
}
