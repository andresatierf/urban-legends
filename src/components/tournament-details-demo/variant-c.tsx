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

import { useFormattedDate } from "@/hooks/useFormattedDate";

import { SectionHeader } from "../section-header";
import type {
  DemoTeam,
  DemoTournamentDetails,
} from "../tournament-details-demo-fixtures";
import { ALL_SCENARIOS } from "../tournament-details-demo-fixtures";
import { TournamentDetailsDemoNav } from "../tournament-details-demo-nav";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { getInitials } from "../users/utils";

function StatusBadge({ status }: { status: "active" | "upcoming" | "ended" }) {
  switch (status) {
    case "active":
      return <Badge variant="default">Active</Badge>;
    case "upcoming":
      return <Badge variant="outline">Upcoming</Badge>;
    case "ended":
      return <Badge variant="secondary">Ended</Badge>;
  }
}

function TournamentTimeline({ data }: { data: DemoTournamentDetails }) {
  const { format } = useFormattedDate();
  const start = new Date(data.tournament.startDate).getTime();
  const end = new Date(data.tournament.endDate).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = Math.max(0, Math.min(now - start, total));
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.ceil(total / (1000 * 60 * 60 * 24));

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
        value={
          data.status === "ended" ? 100 : data.status === "upcoming" ? 0 : pct
        }
        className="h-2"
      />
      <div className="text-muted-foreground text-center text-xs">
        {data.status === "active" && (
          <>
            Day {totalDays - daysLeft} of {totalDays} · {daysLeft} day
            {daysLeft === 1 ? "" : "s"} left
          </>
        )}
        {data.status === "upcoming" && (
          <>Starts in {Math.ceil((start - now) / (1000 * 60 * 60 * 24))} days</>
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
  team: DemoTeam;
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
    <TableRow
      className={isUserTeam ? "bg-blue-50/50 dark:bg-blue-950/20" : undefined}
    >
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
            <Badge variant="outline" className="text-[0.6rem]">
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
        <Button size="xs" variant="ghost">
          View
          <ChevronRight className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function SidebarLayout({ data }: { data: DemoTournamentDetails }) {
  const { format } = useFormattedDate();
  const sortedTeams = [...data.teams].sort((a, b) => b.points - a.points);
  const maxPoints = sortedTeams[0]?.points ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Left sidebar */}
      <div className="space-y-4">
        {/* Tournament identity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Swords className="text-primary h-5 w-5" />
              <StatusBadge status={data.status} />
            </div>
            <CardTitle className="text-lg">{data.tournament.name}</CardTitle>
            <CardDescription className="line-clamp-3">
              {data.tournament.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TournamentTimeline data={data} />
            <Separator />

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold">
                  {data.statistics.totalTeams}
                </div>
                <div className="text-muted-foreground text-xs">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {data.statistics.totalParticipants}
                </div>
                <div className="text-muted-foreground text-xs">Players</div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              {data.canViewLeaderboard && (
                <Button variant="outline" size="sm" className="w-full">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Button>
              )}
              {data.canEdit && (
                <Button variant="outline" size="sm" className="w-full">
                  <Pencil className="h-4 w-4" />
                  Edit Tournament
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User team card */}
        {data.userTeam && (
          <Card className="border-blue-200 dark:border-blue-800">
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
                  <div key={m._id} className="flex items-center gap-2 text-xs">
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
              <Button size="sm" className="w-full">
                View Team
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Rules card */}
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

      {/* Main content: standings table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader as="h2" title="Standings" Icon={Trophy} />
          {!data.userTeam && data.status !== "ended" && (
            <Button size="sm">Create Team</Button>
          )}
        </div>

        {data.status === "ended" && data.tournament.winnerId && (
          <Card className="border-yellow-400 bg-yellow-50/50 dark:border-yellow-600 dark:bg-yellow-950/20">
            <CardContent className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="font-bold">Tournament Champion</div>
                <div className="text-muted-foreground text-sm">
                  {sortedTeams[0]?.name} — {sortedTeams[0]?.points} pts
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Team roster expansion below table */}
        <SectionHeader as="h2" title="Team Rosters" Icon={Users} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sortedTeams.map((team) => {
            const isUserTeam = data.userTeam?._id === team._id;
            return (
              <Card
                key={team._id}
                size="sm"
                className={
                  isUserTeam
                    ? "border-blue-200 dark:border-blue-800"
                    : undefined
                }
              >
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{team.name}</span>
                    <Badge
                      variant={
                        team.joinPolicy === "open" ? "default" : "secondary"
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
                          <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate">{m.name}</span>
                        {m.memberRole === "captain" && (
                          <Crown className="h-3 w-3 shrink-0 text-amber-500" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-muted-foreground text-xs">
                      {team.memberCount}
                      {team.maxMembers && `/${team.maxMembers}`} members
                    </span>
                    <Button size="xs" variant="outline">
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function VariantC() {
  return (
    <div>
      <TournamentDetailsDemoNav />
      <SectionHeader
        as="h1"
        title="Variant C — Sidebar"
        description="Fixed sidebar with tournament context and timeline. Main area uses a table for standings with bar-chart progress and roster cards."
      />
      {ALL_SCENARIOS.map(({ label, data }) => (
        <div key={label} className="mt-8">
          <SectionHeader as="h2" title={label} />
          <div className="mt-4">
            <SidebarLayout data={data} />
          </div>
        </div>
      ))}
    </div>
  );
}
