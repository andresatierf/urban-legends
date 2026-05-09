import {
  Calendar,
  ChevronRight,
  Clock,
  Edit,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { SectionHeader } from "@/components/section-header";
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

import type { TournamentWithAuthority } from "../../../convex/tournaments";
import {
  DEMO_TOURNAMENTS,
  daysUntil,
  getTournamentStatus,
  partitionTournaments,
  tournamentProgress,
} from "./tournament-listing-fixtures";

const STATUS_STYLES = {
  active: {
    accent: "bg-emerald-500/10 border-emerald-500/30",
    dot: "bg-emerald-500",
    label: "Active",
    badgeVariant: "default" as const,
  },
  upcoming: {
    accent: "bg-blue-500/10 border-blue-500/30",
    dot: "bg-blue-500",
    label: "Upcoming",
    badgeVariant: "outline" as const,
  },
  ended: {
    accent: "bg-muted border-border",
    dot: "bg-muted-foreground/40",
    label: "Ended",
    badgeVariant: "secondary" as const,
  },
};

function ImmersiveCard({
  tournament,
}: {
  tournament: TournamentWithAuthority;
}) {
  const status = getTournamentStatus(tournament);
  const style = STATUS_STYLES[status];
  const progress = tournamentProgress(tournament);
  const { authority, teamCount } = tournament;

  const startDate = new Date(tournament.startDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const endDate = new Date(tournament.endDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className={`border ${style.accent}`}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${style.dot}`}
              />
              <CardTitle className="text-base">{tournament.name}</CardTitle>
            </div>
            <Badge variant={style.badgeVariant} className="w-fit">
              {style.label}
            </Badge>
          </div>
          {authority.canManage && (
            <Button variant="ghost" size="icon-sm">
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {tournament.description && (
          <CardDescription className="line-clamp-2">
            {tournament.description}
          </CardDescription>
        )}

        {status === "active" && (
          <div className="flex flex-col gap-1.5">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Tournament progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
            <p className="text-muted-foreground text-xs">
              {daysUntil(tournament.endDate)} days remaining
            </p>
          </div>
        )}

        {status === "upcoming" && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
            <Clock className="h-3.5 w-3.5" />
            Starts in {daysUntil(tournament.startDate)} days
          </div>
        )}

        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {teamCount} team{teamCount === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {startDate} – {endDate}
          </span>
        </div>

        {authority.canReview && authority.pendingReviewCount > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            <Trophy className="h-3.5 w-3.5 shrink-0" />
            {authority.pendingReviewCount} submissions awaiting review
          </div>
        )}

        {authority.team && (
          <div className="bg-card rounded-md border px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span>{authority.team.name}</span>
              {authority.team.isCaptain && (
                <Badge variant="secondary" className="gap-0.5 text-[0.6rem]">
                  <Shield className="h-2.5 w-2.5" />
                  Captain
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-baseline gap-3 text-xs">
              <span className="text-foreground font-semibold">
                {authority.team.points} pts
              </span>
              <span>
                {authority.team.approvedSubmissions}/
                {authority.team.totalSubmissions} approved
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        {authority.canManage ? (
          <Button variant="outline" size="sm" className="ml-auto">
            Manage
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm" className="ml-auto">
            {authority.team ? "View Tournament" : "Browse Teams"}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function TournamentListingVariantA() {
  const { yours, discover } = partitionTournaments(DEMO_TOURNAMENTS);

  return (
    <div className="space-y-6">
      <SectionHeader
        as="h1"
        title="Tournaments"
        description="Variant A — Immersive single-column cards with progress indicators, status accents, and inline team context."
      />

      {yours.length > 0 && (
        <section>
          <SectionHeader title="Your Tournaments" />
          <div className="mt-2 grid grid-cols-1 gap-3">
            {yours.map((t) => (
              <ImmersiveCard key={t._id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {discover.length > 0 && (
        <section>
          <SectionHeader title="Discover" />
          <div className="mt-2 grid grid-cols-1 gap-3">
            {discover.map((t) => (
              <ImmersiveCard key={t._id} tournament={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
