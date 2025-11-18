"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { SubmissionsDataTable } from "@/components/submissions/submissions-data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // Redirect if not tournament manager or admin
  const isAuthorized =
    user?.publicMetadata?.roleNames &&
    Array.isArray(user.publicMetadata.roleNames) &&
    (user.publicMetadata.roleNames.includes("tournament_manager") ||
      user.publicMetadata.roleNames.includes("admin"));

  if (user && !isAuthorized) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl">Submission Management</h1>
        <p className="text-muted-foreground">
          Review and approve submissions from all tournaments
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {/* Tournament filter */}
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

          {/* Status filter */}
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
        </CardContent>
      </Card>

      {/* Submissions Table */}
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
    </div>
  );
}
