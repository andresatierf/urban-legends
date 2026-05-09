"use client";

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Trophy, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { TableSkeleton } from "../ui/table-skeleton";

const getRankBadge = (rank: number, _isWinner: boolean) => {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center gap-1 font-bold text-podium-gold">
        <Trophy className="h-4 w-4" />
        {rank}
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center gap-1 font-bold text-podium-silver">
        <Trophy className="h-4 w-4" />
        {rank}
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center gap-1 font-bold text-podium-bronze">
        <Trophy className="h-4 w-4" />
        {rank}
      </div>
    );
  }
  return (
    <div className="text-center font-medium text-muted-foreground">#{rank}</div>
  );
};

const getRowClassName = (rank: number, _isWinner: boolean) => {
  if (rank === 1) {
    return "bg-podium-gold-bg hover:bg-podium-gold-bg/80";
  }
  if (rank === 2) {
    return "bg-podium-silver-bg hover:bg-podium-silver-bg/80";
  }
  if (rank === 3) {
    return "bg-podium-bronze-bg hover:bg-podium-bronze-bg/80";
  }
  return "hover:bg-muted/50";
};

type Props = {
  tournamentId: Id<"tournaments">;
  limit?: number;
};

export function TournamentLeaderboard({ tournamentId, limit }: Props) {
  const leaderboard = useQuery(api.tournaments.getLeaderboard, {
    tournamentId,
    limit,
  });

  if (leaderboard === undefined) {
    return (
      <TableSkeleton
        columns={4}
        headers={["Rank", "Team Name", "Points", "Members"]}
        rows={5}
        className="overflow-hidden"
      />
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border p-12 text-center">
        <Trophy className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-semibold text-lg">No teams yet</h3>
        <p className="text-muted-foreground text-sm">
          Be the first to create a team and start competing!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Team Name</TableHead>
            <TableHead className="w-24 text-right">Points</TableHead>
            <TableHead className="w-24 text-right">Members</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.map((team) => (
            <TableRow
              key={team.teamId}
              className={getRowClassName(team.rank, team.isWinner)}
            >
              <TableCell>{getRankBadge(team.rank, team.isWinner)}</TableCell>
              <TableCell>
                <Link
                  to="/teams/$teamId"
                  params={{ teamId: team.teamId }}
                  className="font-medium hover:underline"
                  aria-label={`View ${team.teamName} team profile - Rank ${team.rank}${team.isWinner ? " - Tournament Winner" : ""}`}
                >
                  {team.teamName}
                  {team.isWinner && (
                    <span className="ml-2 text-podium-gold text-xs">
                      <Trophy className="h-3 w-3" />
                      Winner
                    </span>
                  )}
                </Link>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {team.points}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                <div className="flex items-center justify-end gap-1">
                  <Users className="h-3 w-3" />
                  {team.memberCount}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
