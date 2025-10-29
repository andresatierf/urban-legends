import type { ColumnDef } from "@tanstack/react-table";
import { useMutation } from "convex/react";
import { Check, Pencil, Trash, X } from "lucide-react";
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
  submissions: (Doc<"submissions"> & {
    team?: Doc<"teams">;
    user?: Doc<"users">;
  })[];
  showActions?: boolean;
};

export function SubmissionsDataTable<T, V>({
  title = "Teams",
  submissions,
  showActions,
  ...props
}: Props<T, V>) {
  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);
  const removeSubmission = useMutation(api.submissions.remove);

  const columns: ColumnDef<(typeof submissions)[number]>[] = useMemo(() => {
    const cols: ColumnDef<(typeof submissions)[number]>[] = [
      { accessorKey: "date", header: "Date" },
      { accessorKey: "state", header: "State" },
      { accessorKey: "team.name", header: "Team" },
      { accessorKey: "user.email", header: "Submitted by" },
      { accessorKey: "description", header: "Description" },
    ];

    if (showActions) {
      cols.push({
        id: "actions",
        cell: ({ row }) => {
          const submission = row.original;
          return (
            <div className="flex justify-end gap-2">
              {submission.state === "pending" && (
                <>
                  <Button
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      approveSubmission({ submissionId: submission._id });
                      toast(
                        `The submission by '${submission.user?.email}' on '${submission.date}' has been approved`,
                      );
                    }}
                    className="z-10 bg-green-500"
                  >
                    <Check />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      rejectSubmission({ submissionId: submission._id });
                      toast(
                        `The submission by '${submission.user?.email}' on '${submission.date}' has been rejected`,
                      );
                    }}
                    className="z-10"
                  >
                    <X />
                  </Button>
                </>
              )}
              <Button
                href={`/submissions/${submission._id}/edit`}
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
                  removeSubmission({ submissionId: submission._id });
                  toast(
                    `The submission by '${submission.user?.email}' on '${submission.date}' has been removed`,
                  );
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
  }, [showActions, removeSubmission, approveSubmission, rejectSubmission]);

  return (
    <DataTableSection
      {...props}
      title={title}
      columns={columns}
      data={submissions}
      hrefFn={(row) => `/submissions/${row.original._id}`}
      rowClassName={(row) => {
        return cn("border-t transition", {
          "bg-green-50 hover:bg-green-100":
            row.getValue("state") === "approved",
          "bg-yellow-50 hover:bg-yellow-100":
            row.getValue("state") === "pending",
          "bg-red-50 hover:bg-red-100": row.getValue("state") === "rejected",
        });
      }}
      emptyMessage="No submissions yet."
    />
  );
}
