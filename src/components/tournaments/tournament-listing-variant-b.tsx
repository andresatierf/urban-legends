import {
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { TournamentWithAuthority } from "../../../convex/tournaments";
import {
  DEMO_TOURNAMENTS,
  daysUntil,
  getTournamentStatus,
  partitionTournaments,
} from "./tournament-listing-fixtures";

function StatusIndicator({
  status,
}: {
  status: "active" | "upcoming" | "ended";
}) {
  const config = {
    active: { color: "bg-emerald-500", label: "Active" },
    upcoming: { color: "bg-blue-500", label: "Upcoming" },
    ended: { color: "bg-muted-foreground/40", label: "Ended" },
  }[status];

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${config.color}`}
      />
      {config.label}
    </span>
  );
}

function TournamentRow({
  tournament,
}: {
  tournament: TournamentWithAuthority;
}) {
  const status = getTournamentStatus(tournament);
  const { authority, teamCount } = tournament;

  let dateLabel: string;
  switch (status) {
    case "upcoming":
      dateLabel = `Starts in ${daysUntil(tournament.startDate)}d`;
      break;
    case "active":
      dateLabel = `${daysUntil(tournament.endDate)}d left`;
      break;
    case "ended":
      dateLabel = `Ended ${Math.abs(daysUntil(tournament.endDate))}d ago`;
      break;
  }

  return (
    <div
      className={`group hover:bg-muted/50 flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${status === "ended" ? "opacity-60" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="truncate text-sm font-medium">
            {tournament.name}
          </span>
          <StatusIndicator status={status} />
          {authority.team && (
            <Badge variant="secondary" className="gap-0.5 text-[0.6rem]">
              {authority.team.isCaptain && <Shield className="h-2.5 w-2.5" />}
              {authority.team.name}
            </Badge>
          )}
          {authority.canManage && (
            <Badge variant="outline" className="text-[0.6rem]">
              Manager
            </Badge>
          )}
          {authority.canReview && authority.pendingReviewCount > 0 && (
            <Badge variant="destructive" className="gap-0.5 text-[0.6rem]">
              <Trophy className="h-2.5 w-2.5" />
              {authority.pendingReviewCount}
            </Badge>
          )}
        </div>
        <div className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-4 text-xs">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {teamCount}
          </span>
          <span className="flex items-center gap-1">
            {status === "upcoming" ? (
              <Clock className="h-3 w-3" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
            {dateLabel}
          </span>
          {authority.team && (
            <span className="text-foreground font-medium">
              {authority.team.points} pts
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {authority.canManage && (
          <>
            <Button variant="ghost" size="icon-sm">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <BarChart3 className="h-3 w-3" />
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" className="text-xs">
          {authority.team ? "View" : "Browse"}
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-muted flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs">
      <Icon className="text-muted-foreground h-3 w-3" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function TournamentListingVariantB() {
  const { active, upcoming, ended } = partitionTournaments(DEMO_TOURNAMENTS);

  const totalTeams = DEMO_TOURNAMENTS.reduce((s, t) => s + t.teamCount, 0);
  const pendingReviews = DEMO_TOURNAMENTS.reduce(
    (s, t) => s + t.authority.pendingReviewCount,
    0,
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        as="h1"
        title="Tournaments"
        description="Variant B — Compact, scannable rows with inline badges and one-click actions. Optimised for users tracking many tournaments."
      />

      <div className="flex flex-wrap gap-2">
        <StatPill icon={Trophy} label="Active" value={active.length} />
        <StatPill icon={Clock} label="Upcoming" value={upcoming.length} />
        <StatPill icon={Users} label="Teams" value={totalTeams} />
        {pendingReviews > 0 && (
          <StatPill icon={Eye} label="To review" value={pendingReviews} />
        )}
      </div>

      {active.length > 0 && (
        <section>
          <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Active ({active.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {active.map((t) => (
              <TournamentRow key={t._id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Upcoming ({upcoming.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {upcoming.map((t) => (
              <TournamentRow key={t._id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {ended.length > 0 && (
        <section>
          <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Ended ({ended.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {ended.map((t) => (
              <TournamentRow key={t._id} tournament={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
