"use client";

import { useQuery } from "convex/react";
import { Trophy, Users } from "lucide-react";
import Link from "next/link";
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
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-5 w-8 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="ml-auto h-5 w-12 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="ml-auto h-5 w-12 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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

  const getRankBadge = (rank: number, isWinner: boolean) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center gap-1 font-bold text-yellow-600">
          <Trophy className="h-4 w-4" />
          {rank}
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center gap-1 font-bold text-gray-400">
          <Trophy className="h-4 w-4" />
          {rank}
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center gap-1 font-bold text-orange-600">
          <Trophy className="h-4 w-4" />
          {rank}
        </div>
      );
    }
    return (
      <div className="text-center font-medium text-muted-foreground">
        #{rank}
      </div>
    );
  };

  const getRowClassName = (rank: number, isWinner: boolean) => {
    if (rank === 1) {
      return "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/30";
    }
    if (rank === 2) {
      return "bg-gray-50 hover:bg-gray-100 dark:bg-gray-950/20 dark:hover:bg-gray-950/30";
    }
    if (rank === 3) {
      return "bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/30";
    }
    return "hover:bg-muted/50";
  };

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
                  href={`/teams/${team.teamId}`}
                  className="font-medium hover:underline"
                >
                  {team.teamName}
                  {team.isWinner && (
                    <span className="ml-2 text-xs text-yellow-600">
                      🏆 Winner
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
