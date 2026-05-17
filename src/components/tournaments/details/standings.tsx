import { Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, Trophy, Users } from "lucide-react";
import type { ReactNode } from "react";

import { SectionHeader } from "../../section-header";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import type { TournamentDetails, TournamentTeam } from "./types";

type Props = {
  data: TournamentDetails;
  sortedTeams: TournamentTeam[];
  maxPoints: number;
  headerAction?: ReactNode;
};

export function Standings({
  data,
  sortedTeams,
  maxPoints,
  headerAction,
}: Props) {
  const winnerTeam =
    data.status === "ended" && data.tournament.winnerId
      ? data.teams.find((t) => t._id === data.tournament.winnerId)
      : undefined;

  return (
    <>
      <div className="flex items-center justify-between">
        <SectionHeader as="h2" title="Standings" Icon={Trophy} />
        {headerAction}
      </div>

      {winnerTeam && (
        <Card className="border-podium-gold bg-podium-gold-bg">
          <CardContent className="flex items-center gap-3">
            <Trophy className="text-podium-gold h-8 w-8" />
            <div>
              <div className="font-bold">Tournament Champion</div>
              <div className="text-muted-foreground text-sm">
                {winnerTeam.name}: {winnerTeam.points} pts
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sortedTeams.length > 0 ? (
        <Card className="gap-0 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">
                    <Users className="mx-auto h-3.5 w-3.5" />
                  </TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeams.map((team, i) => (
                  <TeamRankRow
                    key={team._id}
                    team={team}
                    rank={i + 1}
                    isUserTeam={data.userTeam?._id === team._id}
                    maxPoints={maxPoints}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground flex items-center gap-3 py-6 text-sm">
            <Calendar className="h-4 w-4" />
            No teams yet. Be the first to create one for this tournament.
          </CardContent>
        </Card>
      )}
    </>
  );
}

const podiumColors: Record<number, string> = {
  1: "text-podium-gold",
  2: "text-podium-silver",
  3: "text-podium-bronze",
};

function TeamRankRow({
  team,
  rank,
  isUserTeam,
  maxPoints,
}: {
  team: TournamentTeam;
  rank: number;
  isUserTeam: boolean;
  maxPoints: number;
}) {
  const barWidth = maxPoints > 0 ? (team.points / maxPoints) * 100 : 0;

  return (
    <TableRow className={isUserTeam ? "bg-card-info-from/40" : undefined}>
      <TableCell className="w-12 text-center">
        {rank <= 3 ? (
          <div
            className={`flex items-center justify-center gap-0.5 font-bold ${podiumColors[rank]}`}
          >
            <Trophy className="h-3.5 w-3.5" />
            {rank}
          </div>
        ) : (
          <span className="text-muted-foreground">#{rank}</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{team.name}</span>
          {isUserTeam && (
            <Badge variant="warning" className="text-xs">
              You
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-center">
        {team.memberCount}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="w-14 text-right text-sm font-bold tabular-nums">
            {Math.round(team.points)}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-20">
        <Button size="xs" variant="ghost" asChild>
          <Link to="/teams/$teamId" params={{ teamId: team._id }}>
            View
            <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
