"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { Pencil, Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTableSection } from "@/components/data-table-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function Submissions() {
  const teams = useQuery(api.teams.listByUser) || [];
  const [selectedTeam, setSelectedTeam] = useState<Id<"teams"> | null>(null);

  const selectedTeamData = teams.find((team) => team._id === selectedTeam);

  // Get completions for the selected team and date range
  const startDate = selectedTeamData?.tournament?.startDate;
  const endDate = selectedTeamData?.tournament?.endDate;

  const submissions =
    useQuery(
      api.submissions.getUserSubmissions,
      selectedTeam ? { teamId: selectedTeam, startDate, endDate } : "skip",
    ) || [];

  const generateDateRange = (start: string, end: string) => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(new Date(d).toISOString().split("T")[0]);
    }

    return dates;
  };

  const pendingSubmissions = useQuery(api.submissions.listUserSubmissions, {
    state: "pending",
  });
  const pendingSubmissionsTableData =
    pendingSubmissions?.map((submission) => ({
      ...submission,
      team: teams.find((team) => team._id === submission.teamId)?.name,
    })) || [];

  useEffect(() => {
    if (selectedTeam || teams.length === 0) return;
    setSelectedTeam(teams[0]._id);
  }, [selectedTeam, teams]);

  const columns: ColumnDef<
    NonNullable<typeof pendingSubmissionsTableData>[number]
  >[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
      },
      {
        accessorKey: "state",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="State" />
        ),
        enableSorting: false,
      },
      { accessorKey: "team", header: "Team" },
      { accessorKey: "description", header: "Description" },
      {
        id: "actions",
        cell: ({ row }) => {
          const submission = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                href={`/submissions/${submission._id}/edit`}
                variant="secondary"
                size="icon"
              >
                <Pencil />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteSubmission(submission._id)}
              >
                <Trash />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <DataTableSection
        as="h1"
        title="Submissions"
        columns={columns}
        data={pendingSubmissionsTableData}
      />

      {teams.length !== 0 ? (
        selectedTeam &&
        selectedTeamData && (
          <Card>
            <CardHeader>
              <CardTitle>Your Progress Calendar</CardTitle>
              <label
                htmlFor="team-selector"
                className="mb-2 block font-medium text-gray-700 text-sm"
              >
                Select Team
              </label>
              {/** biome-ignore lint/correctness/useUniqueElementIds: id */}
              <select
                id="team-selector"
                value={selectedTeam || ""}
                onChange={(e) =>
                  setSelectedTeam((e.target.value as Id<"teams">) || null)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select a team...
                </option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} - {team.tournament?.name}
                  </option>
                ))}
              </select>
            </CardHeader>
            <CardContent>
              {selectedTeamData.tournament && (
                <div className="grid grid-cols-7 gap-2">
                  {generateDateRange(
                    selectedTeamData.tournament.startDate,
                    selectedTeamData.tournament.endDate,
                  ).map((date) => {
                    const completion = submissions.find((c) => c.date === date);
                    const isToday =
                      date === new Date().toISOString().split("T")[0];

                    return (
                      <div
                        key={date}
                        className={cn(
                          "rounded border border-gray-200 bg-gray-50 p-2 text-center text-gray-600 text-xs",
                          {
                            "border-blue-300 bg-blue-100 text-blue-800":
                              isToday,
                            "border-red-300 bg-red-100 text-red-800":
                              completion?.state === "rejected",
                            "border-yellow-300 bg-yellow-100 text-yellow-800":
                              completion?.state === "pending",
                            "border-green-300 bg-green-100 text-green-800":
                              completion?.state === "approved",
                          },
                        )}
                      >
                        {new Date(date).getDate()}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      ) : (
        <div className="rounded-lg bg-white p-6 text-center shadow">
          <p className="text-gray-500">
            You're not part of any active teams. Contact an admin to be added to
            a team.
          </p>
        </div>
      )}
    </div>
  );
}
