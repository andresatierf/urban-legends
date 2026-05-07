import type { ColumnDef } from "@tanstack/react-table";
import { useMutation } from "convex/react";
import { capitalize } from "lodash";
import { Check, Pencil, Trash, X } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { tryMutate } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import {
  DataTableSection,
  type DataTableSectionProps,
} from "../data-table-section";
import { Badge } from "../ui/badge";
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
  const { isAdmin } = useUser();
  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);
  const removeSubmission = useMutation(api.submissions.remove);

  const columns: ColumnDef<(typeof submissions)[number]>[] = useMemo(() => {
    const cols: ColumnDef<(typeof submissions)[number]>[] = [
      { accessorKey: "date", header: "Date" },
      {
        accessorKey: "state",
        header: "State",
        cell: (props) => {
          const state = props.getValue() as Doc<"submissions">["state"];
          return (
            <Badge
              variant={
                state === "approved"
                  ? "default"
                  : state === "rejected"
                    ? "destructive"
                    : state === "deleted"
                      ? "secondary"
                      : "outline"
              }
            >
              {state}
            </Badge>
          );
        },
      },
      { accessorKey: "team.name", header: "Team" },
      { accessorKey: "user.email", header: "Submitted by" },
      { accessorKey: "description", header: "Description" },
      {
        accessorKey: "submissionType",
        header: "Submission Type",
        cell: ({ cell }) => capitalize(cell.getValue() as string),
      },
    ];

    if (showActions) {
      cols.push({
        id: "actions",
        cell: ({ row }) => {
          const submission = row.original;
          return (
            <div className="flex justify-end gap-2">
              {submission.state === "pending" && isAdmin && (
                <>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      await tryMutate({
                        fn: () =>
                          approveSubmission({ submissionId: submission._id }),
                        successToast: `The submission by '${submission.user?.email}' on '${submission.date}' has been approved`,
                        defaultFailureToast: "Failed to approve submission",
                      });
                    }}
                    className="z-10 bg-green-600 hover:bg-green-700"
                  >
                    <Check />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      await tryMutate({
                        fn: () =>
                          rejectSubmission({ submissionId: submission._id }),
                        successToast: `The submission by '${submission.user?.email}' on '${submission.date}' has been rejected`,
                        defaultFailureToast: "Failed to reject submission",
                      });
                    }}
                    className="z-10 bg-orange-500 hover:bg-orange-600"
                  >
                    <X />
                  </Button>
                </>
              )}
              <Button variant="outline" size="icon" className="z-10" asChild>
                <Link href={`/submissions/${submission._id}/edit`}>
                  <Pencil />
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  await tryMutate({
                    fn: () =>
                      removeSubmission({ submissionId: submission._id }),
                    successToast: `The submission by '${submission.user?.email}' on '${submission.date}' has been removed`,
                    defaultFailureToast: "Failed to remove submission",
                  });
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
  }, [
    showActions,
    removeSubmission,
    approveSubmission,
    rejectSubmission,
    isAdmin,
  ]);

  return (
    <DataTableSection
      {...props}
      title={title}
      columns={columns}
      data={submissions}
      hrefFn={(row) => `/submissions/${row.original._id}`}
      emptyMessage="No submissions yet."
    />
  );
}
