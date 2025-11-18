"use client";

import { BarChart3, Calendar, Edit, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doc } from "../../../convex/_generated/dataModel";

interface ManagedTournamentsListProps {
  tournaments: Array<Doc<"tournaments">>;
}

type TournamentStatus = "all" | "active" | "upcoming" | "ended";

export function ManagedTournamentsList({
  tournaments,
}: ManagedTournamentsListProps) {
  const [statusFilter, setStatusFilter] = useState<TournamentStatus>("all");
  const [sortBy, setSortBy] = useState<"name" | "startDate" | "status">(
    "startDate",
  );

  // Calculate status for each tournament
  const now = new Date().toISOString().split("T")[0];

  const tournamentsWithStatus = tournaments.map((tournament) => {
    let status: "active" | "upcoming" | "ended";
    if (tournament.startDate <= now && tournament.endDate >= now) {
      status = "active";
    } else if (tournament.startDate > now) {
      status = "upcoming";
    } else {
      status = "ended";
    }
    return { ...tournament, status };
  });

  // Filter tournaments
  const filteredTournaments =
    statusFilter === "all"
      ? tournamentsWithStatus
      : tournamentsWithStatus.filter((t) => t.status === statusFilter);

  // Sort tournaments
  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "startDate") {
      return b.startDate.localeCompare(a.startDate);
    }
    // Sort by status: active > upcoming > ended
    const statusOrder: Record<"active" | "upcoming" | "ended", number> = {
      active: 0,
      upcoming: 1,
      ended: 2,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const getStatusBadgeVariant = (status: "active" | "upcoming" | "ended") => {
    switch (status) {
      case "active":
        return "default";
      case "upcoming":
        return "secondary";
      case "ended":
        return "outline";
    }
  };

  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Trophy className="mb-4 h-12 w-12 opacity-50" />
        <p className="font-medium text-lg">No tournaments yet</p>
        <p className="text-sm">Create your first tournament to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as TournamentStatus)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tournaments</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) =>
            setSortBy(value as "name" | "startDate" | "status")
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="startDate">Start Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty State for Filtered Results */}
      {sortedTournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p>No tournaments match the selected filters.</p>
        </div>
      ) : (
        /* Tournament Cards */
        <div className="grid grid-cols-1 gap-4">
          {sortedTournaments.map((tournament) => (
            <Card key={tournament._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {tournament.name}
                      <Badge variant={getStatusBadgeVariant(tournament.status)}>
                        {tournament.status}
                      </Badge>
                    </CardTitle>
                    <p className="mt-2 text-muted-foreground text-sm">
                      {tournament.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 opacity-70" />
                      <span className="text-sm">
                        {tournament.startDate} to {tournament.endDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tournaments/${tournament._id}`}>
                        <Trophy className="mr-2 h-4 w-4" />
                        Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tournaments/${tournament._id}/leaderboard`}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Leaderboard
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/tournaments?edit=${tournament._id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
