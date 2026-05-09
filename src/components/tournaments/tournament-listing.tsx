import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  Edit,
  Shield,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormattedDate } from "@/hooks/useFormattedDate";

import type { TournamentWithAuthority } from "../../../convex/tournaments";
import {
  daysUntil,
  getTournamentStatus,
  partitionTournaments,
  tournamentProgress,
} from "./utils";

function FeaturedCard({ tournament }: { tournament: TournamentWithAuthority }) {
  const { format } = useFormattedDate();
  const progress = tournamentProgress(tournament);
  const { authority, teamCount } = tournament;

  return (
    <Card className="border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-transparent">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="text-primary h-4 w-4" />
            <CardTitle className="text-lg">{tournament.name}</CardTitle>
            <Badge variant="default">Active</Badge>
          </div>

          {tournament.description && (
            <CardDescription className="text-sm">
              {tournament.description}
            </CardDescription>
          )}

          <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {teamCount} team{teamCount === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(tournament.startDate, "short")} –{" "}
              {format(tournament.endDate, "short")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {daysUntil(tournament.endDate)}d remaining
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1" />
            <span className="text-xs font-medium tabular-nums">
              {progress}%
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 sm:min-w-[160px]">
          {authority.team && (
            <Link
              to="/teams/$teamId"
              params={{ teamId: authority.team._id }}
              className="bg-card hover:bg-muted/50 w-full rounded-lg border p-3 text-center transition-colors"
            >
              <p className="text-muted-foreground text-xs">Your team</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-sm font-medium">
                {authority.team.name}
                {authority.team.isCaptain && (
                  <Shield className="text-primary h-3 w-3" />
                )}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums">
                {authority.team.points}
                <span className="text-muted-foreground ml-0.5 text-xs font-normal">
                  pts
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                {authority.team.approvedSubmissions}/
                {authority.team.totalSubmissions} approved
              </p>
            </Link>
          )}

          {authority.canManage && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1"
              asChild
            >
              <Link to={`/admin/tournaments?edit=${tournament._id}` as never}>
                <Edit className="h-3 w-3" />
                Manage
              </Link>
            </Button>
          )}

          {authority.canReview && authority.pendingReviewCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1"
              asChild
            >
              <Link to="/reviewer">
                <Trophy className="h-3 w-3" />
                Review ({authority.pendingReviewCount})
              </Link>
            </Button>
          )}

          <Button size="sm" className="w-full gap-1" asChild>
            <Link
              to="/tournaments/$tournamentId"
              params={{ tournamentId: tournament._id }}
            >
              {authority.team ? "View Tournament" : "Browse Teams"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompactCard({ tournament }: { tournament: TournamentWithAuthority }) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(tournament);
  const { authority, teamCount } = tournament;

  const statusConfig = {
    active: { label: "Active", variant: "default" as const },
    upcoming: { label: "Upcoming", variant: "outline" as const },
    ended: { label: "Ended", variant: "secondary" as const },
  }[status];

  let dateLabel: string;
  switch (status) {
    case "upcoming":
      dateLabel = `Starts ${format(tournament.startDate, "short")}`;
      break;
    case "active":
      dateLabel = `${daysUntil(tournament.endDate)}d left`;
      break;
    case "ended":
      dateLabel = "Ended";
      break;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-snug">
            {tournament.name}
          </CardTitle>
          <Badge variant={statusConfig.variant} className="shrink-0">
            {statusConfig.label}
          </Badge>
        </div>

        {tournament.description && (
          <CardDescription className="line-clamp-1">
            {tournament.description}
          </CardDescription>
        )}

        <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {teamCount}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {dateLabel}
          </span>
        </div>

        {authority.team && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">{authority.team.name}</span>
            {authority.team.isCaptain && (
              <Shield className="text-muted-foreground h-3 w-3" />
            )}
            <span className="ml-auto font-semibold tabular-nums">
              {authority.team.points} pts
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 border-t pt-3">
        {authority.canManage && (
          <Button variant="ghost" size="icon-sm" asChild>
            <Link to={`/admin/tournaments?edit=${tournament._id}` as never}>
              <Edit className="h-3 w-3" />
            </Link>
          </Button>
        )}
        {authority.canReview && authority.pendingReviewCount > 0 && (
          <Badge variant="destructive" className="gap-0.5 text-[0.6rem]">
            <Trophy className="h-2.5 w-2.5" />
            {authority.pendingReviewCount}
          </Badge>
        )}
        <Button size="sm" variant="outline" className="ml-auto gap-1" asChild>
          <Link
            to="/tournaments/$tournamentId"
            params={{ tournamentId: tournament._id }}
          >
            {authority.team ? "View" : "Explore"}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function EndedRow({ tournament }: { tournament: TournamentWithAuthority }) {
  const { format } = useFormattedDate();
  const { authority, teamCount } = tournament;

  return (
    <Link
      to="/tournaments/$tournamentId/leaderboard"
      params={{ tournamentId: tournament._id }}
      className="text-muted-foreground hover:bg-muted/30 flex items-center gap-3 rounded-md px-2 py-2 text-xs transition-colors"
    >
      <span className="text-foreground/70 min-w-0 flex-1 truncate font-medium">
        {tournament.name}
      </span>
      {authority.team && (
        <Badge variant="secondary" className="text-[0.6rem]">
          {authority.team.name} · {authority.team.points} pts
        </Badge>
      )}
      <span className="hidden shrink-0 items-center gap-1 sm:flex">
        <Users className="h-3 w-3" />
        {teamCount}
      </span>
      <span className="hidden shrink-0 sm:inline">
        {format(tournament.endDate, "short")}
      </span>
      <ChevronRight className="h-3 w-3 shrink-0" />
    </Link>
  );
}

export function TournamentListing({
  tournaments,
}: {
  tournaments: TournamentWithAuthority[];
}) {
  const { active, upcoming, ended } = partitionTournaments(tournaments);

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Now playing
          </h3>
          <div className="flex flex-col gap-3">
            {active.map((t) => (
              <FeaturedCard key={t._id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
            Coming soon
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((t) => (
              <CompactCard key={t._id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {ended.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
            <span className="bg-muted-foreground/40 inline-block h-1.5 w-1.5 rounded-full" />
            Past tournaments
          </h3>
          <div className="rounded-lg border p-1">
            <div className="divide-y">
              {ended.map((t) => (
                <EndedRow key={t._id} tournament={t} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export function TournamentListingSkeleton() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-2">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="flex flex-col gap-2 sm:min-w-[160px]">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
              <CardFooter className="gap-2 border-t pt-3">
                <Skeleton className="ml-auto h-7 w-16" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
