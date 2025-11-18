"use client";

import { useQuery } from "convex/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { SubmissionsDataTable } from "@/components/submissions/submissions-data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function TournamentManagerSubmissions() {
  const { user } = useUser();
  const [tournamentFilter, setTournamentFilter] = useState<
    Id<"tournaments"> | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // Get all submissions (filter by tournament/status)
  const submissions = useQuery(api.submissions.list, {
    tournamentId: tournamentFilter === "all" ? undefined : tournamentFilter,
    state: statusFilter === "all" ? undefined : statusFilter,
  });

  const tournaments = useQuery(api.tournaments.list, {});

  if (
    user &&
    !["admin", "tournament_manager"].some((r) => user.roleNames?.includes(r))
  ) {
    redirect("/dashboard");
  }

  return (
    <>
      <SectionHeader
        as="h1"
        title="Submission Management"
        description="Review and approve submissions from all tournaments"
      />

      <div className="flex gap-4">
        <div className="flex flex-col gap-2">
          <Label>Filter</Label>
          <Select
            value={tournamentFilter}
            onValueChange={(value) =>
              setTournamentFilter(value as Id<"tournaments"> | "all")
            }
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select tournament" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tournaments</SelectItem>
              {tournaments?.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Sort</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as typeof statusFilter)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            {submissions?.length || 0} submission(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubmissionsDataTable
            title="All Submissions"
            submissions={submissions || []}
            showActions={true}
          />
        </CardContent>
      </Card>
    </>
  );
}
