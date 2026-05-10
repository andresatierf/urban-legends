import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import {
  Calendar,
  ChevronRight,
  Clock,
  Crown,
  Pencil,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

import { useFormattedDate } from "@/hooks/useFormattedDate";

import type { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { JoinTeamFormButton } from "../form/join-team-form-button";
import { UpsertTeamFormDialog } from "../form/upsert-team-form";
import { UpsertTournamentFormDialog } from "../form/upsert-tournament-form";
import { SectionHeader } from "../section-header";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import {
  SidebarCard,
  type SidebarCardAction,
  type SidebarCardBadge,
  type SidebarCardStat,
} from "../ui/sidebar-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { getInitials } from "../users/utils";

type TournamentDetails = NonNullable<
  FunctionReturnType<typeof api.tournaments.getDetails>
>;
type Team = TournamentDetails["teams"][number];

function TournamentTimeline({ data }: { data: TournamentDetails }) {
  const { format } = useFormattedDate();
  const start = new Date(data.tournament.startDate).getTime();
  const end = new Date(data.tournament.endDate).getTime();
  const now = Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;
  const total = end - start;
  const elapsed = Math.max(0, Math.min(now - start, total));
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((end - now) / msPerDay));
  const totalDays = Math.max(1, Math.floor(total / msPerDay) + 1);
  const currentDay = Math.min(totalDays, Math.floor(elapsed / msPerDay) + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4" />
        Timeline
      </div>
      <div className="text-muted-foreground space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Start</span>
          <span>{format(data.tournament.startDate, "short")}</span>
        </div>
        <div className="flex justify-between">
          <span>End</span>
          <span>{format(data.tournament.endDate, "short")}</span>
        </div>
      </div>
      <Progress
        aria-label="Tournament progress"
        value={
          data.status === "ended" ? 100 : data.status === "upcoming" ? 0 : pct
        }
        className="h-2"
      />
      <div className="text-muted-foreground text-center text-xs">
        {data.status === "active" && (
          <>
            Day {currentDay} of {totalDays} · {daysLeft} day
            {daysLeft === 1 ? "" : "s"} left
          </>
        )}
        {data.status === "upcoming" && (
          <>Starts in {Math.ceil((start - now) / msPerDay)} days</>
        )}
        {data.status === "ended" && "Tournament complete"}
      </div>
    </div>
  );
}

function TeamRankRow({
  team,
  rank,
  isUserTeam,
  maxPoints,
}: {
  team: Team;
  rank: number;
  isUserTeam: boolean;
  maxPoints: number;
}) {
  const barWidth = maxPoints > 0 ? (team.points / maxPoints) * 100 : 0;

  const podiumColors: Record<number, string> = {
    1: "text-podium-gold",
    2: "text-podium-silver",
    3: "text-podium-bronze",
  };

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
            <Badge variant="outline" className="text-xs">
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
          <span className="w-14 text-right text-sm font-bold">
            {team.points}
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

type Props = {
  data: TournamentDetails;
  tournamentId: Id<"tournaments">;
};

export function TournamentDetailsLayout({ data, tournamentId }: Props) {
  const sortedTeams = [...data.teams].sort((a, b) => b.points - a.points);
  const maxPoints = sortedTeams[0]?.points ?? 0;
  const winnerTeam =
    data.status === "ended" && data.tournament.winnerId
      ? data.teams.find((t) => t._id === data.tournament.winnerId)
      : undefined;
  const [editTournamentDialogOpen, setEditTournamentDialogOpen] =
    useState(false);

  const sidebarBadges: SidebarCardBadge[] = [
    {
      label:
        data.status === "active"
          ? "Active"
          : data.status === "upcoming"
            ? "Upcoming"
            : "Ended",
      variant:
        data.status === "active"
          ? "default"
          : data.status === "upcoming"
            ? "outline"
            : "secondary",
    },
  ];

  const sidebarStats: SidebarCardStat[] = [
    { label: "Teams", value: String(data.statistics.totalTeams) },
    { label: "Players", value: String(data.statistics.totalParticipants) },
  ];

  const sidebarActions: SidebarCardAction[] = [];
  if (data.canViewLeaderboard) {
    sidebarActions.push({
      label: "Leaderboard",
      icon: Trophy,
      link: {
        to: "/tournaments/$tournamentId/leaderboard",
        params: { tournamentId },
      },
    });
  }
  if (data.canEdit) {
    sidebarActions.push({
      label: "Edit Tournament",
      icon: Pencil,
      onClick: () => setEditTournamentDialogOpen(true),
    });
  }

  return (
    <>
      <UpsertTournamentFormDialog
        open={editTournamentDialogOpen}
        onOpenChange={setEditTournamentDialogOpen}
        tournament={data.tournament}
      />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <SidebarCard
            icon={Swords}
            badges={sidebarBadges}
            title={data.tournament.name}
            description={data.tournament.description}
            stats={sidebarStats}
            actions={sidebarActions}
          >
            <TournamentTimeline data={data} />
          </SidebarCard>

          {data.userTeam && (
            <Card className="border-card-info-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="text-primary h-4 w-4" />
                  <CardTitle>Your Team</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{data.userTeam.name}</span>
                  <span className="text-sm font-bold">
                    {data.userTeam.points} pts
                  </span>
                </div>
                <div className="space-y-1.5">
                  {data.userTeam.members.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{m.name}</span>
                      {m.memberRole === "captain" && (
                        <Crown className="h-3 w-3 shrink-0 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full" asChild>
                  <Link
                    to="/teams/$teamId"
                    params={{ teamId: data.userTeam._id }}
                  >
                    View Team
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Team size</span>
                <span>
                  {data.tournament.teamMinSize ?? "—"}–
                  {data.tournament.teamMaxSize ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily limit</span>
                <span>{data.tournament.maxSubmissionsPerDay ?? "∞"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Individual</span>
                <span>
                  {data.tournament.scoringConfig.individualPoints.base}/
                  {data.tournament.scoringConfig.individualPoints.advanced}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Team exercise</span>
                <span>
                  {data.tournament.scoringConfig.teamExercisePoints.base}/
                  {data.tournament.scoringConfig.teamExercisePoints.advanced}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader as="h2" title="Standings" Icon={Trophy} />
            {!data.userTeam && data.status !== "ended" && (
              <UpsertTeamFormDialog tournamentId={tournamentId}>
                <Button size="sm">Create Team</Button>
              </UpsertTeamFormDialog>
            )}
          </div>

          {winnerTeam && (
            <Card className="border-podium-gold bg-podium-gold-bg">
              <CardContent className="flex items-center gap-3">
                <Trophy className="text-podium-gold h-8 w-8" />
                <div>
                  <div className="font-bold">Tournament Champion</div>
                  <div className="text-muted-foreground text-sm">
                    {winnerTeam.name} — {winnerTeam.points} pts
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {sortedTeams.length > 0 ? (
            <Card>
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

          {sortedTeams.length > 0 && (
            <>
              <SectionHeader as="h2" title="Team Rosters" Icon={Users} />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {sortedTeams.map((team) => {
                  const isUserTeam = data.userTeam?._id === team._id;
                  return (
                    <Card
                      key={team._id}
                      size="sm"
                      className={
                        isUserTeam ? "border-card-info-border" : undefined
                      }
                    >
                      <CardContent className="flex flex-1 flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {team.name}
                          </span>
                          <Badge
                            variant={
                              team.joinPolicy === "open"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {team.joinPolicy === "open" ? "Open" : "Closed"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {team.members.map((m) => (
                            <div
                              key={m._id}
                              className="flex items-center gap-2 text-xs"
                            >
                              <Avatar size="sm">
                                <AvatarFallback>
                                  {getInitials(m.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex-1 truncate">{m.name}</span>
                              {m.memberRole === "captain" && (
                                <Crown className="h-3 w-3 shrink-0 text-amber-500" />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                          <span className="text-muted-foreground text-xs">
                            {team.memberCount}
                            {team.maxMembers && `/${team.maxMembers}`} members
                          </span>
                          <div className="flex items-center gap-1">
                            {!data.userTeam && data.status !== "ended" && (
                              <JoinTeamFormButton
                                teamId={team._id}
                                team={team}
                                currentMemberCount={team.memberCount}
                                isUserMember={isUserTeam}
                                isUserInTeam={false}
                                size="xs"
                              />
                            )}
                            <Button size="xs" variant="outline" asChild>
                              <Link
                                to="/teams/$teamId"
                                params={{ teamId: team._id }}
                              >
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
