import type { FunctionReturnType } from "convex/server";
import { Trophy, Users } from "lucide-react";
import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { getTournamentStatus } from "../tournaments/utils";
import { Skeleton } from "../ui/skeleton";
import { JoinTeamCard } from "./join-team-card";
import { TeamCard, TeamCardSkeleton } from "./team-card";

type TeamWithMembers = FunctionReturnType<
  typeof api.teams.listWithMembers
>[number];
type TournamentMap = Record<Id<"tournaments">, Doc<"tournaments">>;

const STATUS_ORDER: Record<ReturnType<typeof getTournamentStatus>, number> = {
  active: 0,
  upcoming: 1,
  ended: 2,
};

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function SectionLabel({
  tone,
  children,
}: {
  tone: "your" | "rest";
  children: React.ReactNode;
}) {
  return (
    <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          tone === "your" ? "bg-emerald-500" : "bg-blue-500",
        )}
      />
      {children}
    </h3>
  );
}

function renderTeamCard(
  team: TeamWithMembers,
  {
    tournament,
    isUserMember,
    isUserInTeam,
  }: {
    tournament?: Doc<"tournaments">;
    isUserMember: boolean;
    isUserInTeam: boolean;
  },
) {
  return (
    <TeamCard
      key={team._id}
      team={team}
      tournament={tournament}
      memberCount={team.members.length}
      members={team.members}
      isUserMember={isUserMember}
      isUserInTeam={isUserInTeam}
    />
  );
}

function TournamentGroup({
  tournament,
  teams,
  isUserInTournament,
}: {
  tournament: Doc<"tournaments">;
  teams: TeamWithMembers[];
  isUserInTournament: boolean;
}) {
  if (teams.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Trophy className="text-muted-foreground size-3.5 shrink-0" />
        <span className="text-sm font-medium">{tournament.name}</span>
        <Badge variant="outline">{getTournamentStatus(tournament)}</Badge>
        <span className="text-muted-foreground text-xs">
          {teams.length} team{teams.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) =>
          renderTeamCard(team, {
            tournament: undefined,
            isUserMember: false,
            isUserInTeam: isUserInTournament,
          }),
        )}
      </div>
    </div>
  );
}

type Props = {
  userTeams: TeamWithMembers[];
  allTeams: TeamWithMembers[];
  tournamentMap: TournamentMap;
  headerActions?: React.ReactNode;
};

export function TeamListing({
  userTeams,
  allTeams,
  tournamentMap,
  headerActions,
}: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [includeEnded, setIncludeEnded] = useState(false);

  const userTeamIds = new Set(userTeams.map((t) => t._id));
  const userTournamentIds = new Set(userTeams.map((t) => t.tournamentId));

  const tournamentsWithTeams = Array.from(
    new Set(allTeams.map((t) => t.tournamentId)),
  )
    .map((id) => tournamentMap[id])
    .filter((t): t is Doc<"tournaments"> => Boolean(t))
    .sort((a, b) => {
      const sa = STATUS_ORDER[getTournamentStatus(a)];
      const sb = STATUS_ORDER[getTournamentStatus(b)];
      if (sa !== sb) return sa - sb;
      return b.startDate.localeCompare(a.startDate);
    });

  const visibleTournaments = tournamentsWithTeams.filter(
    (t) => includeEnded || getTournamentStatus(t) !== "ended",
  );

  const filterIsHidden =
    filter !== "all" && !visibleTournaments.some((t) => t._id === filter);
  const effectiveFilter = filterIsHidden ? "all" : filter;

  const isEndedTeam = (team: TeamWithMembers) => {
    const t = tournamentMap[team.tournamentId];
    return t ? getTournamentStatus(t) === "ended" : false;
  };

  const matchesFilter = (team: TeamWithMembers) =>
    effectiveFilter === "all"
      ? includeEnded || !isEndedTeam(team)
      : team.tournamentId === effectiveFilter;

  const filteredYourTeams = userTeams.filter(matchesFilter);
  const filteredOtherTeams = allTeams.filter(
    (t) => !userTeamIds.has(t._id) && matchesFilter(t),
  );

  const otherTournaments = visibleTournaments.filter((t) =>
    filteredOtherTeams.some((team) => team.tournamentId === t._id),
  );

  const hasAnyTeams = allTeams.length > 0;

  return (
    <div className="space-y-6">
      <SectionHeader as="h1" title="Teams" Icon={Users}>
        <div className="flex items-center gap-2">
          {visibleTournaments.length > 0 ||
          tournamentsWithTeams.some(
            (t) => getTournamentStatus(t) === "ended",
          ) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncludeEnded((v) => !v)}
            >
              {includeEnded ? "Hide past tournaments" : "Show past tournaments"}
            </Button>
          ) : null}
          {headerActions}
        </div>
      </SectionHeader>

      {!hasAnyTeams ? (
        <JoinTeamCard first />
      ) : (
        <>
          {visibleTournaments.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                active={effectiveFilter === "all"}
                onClick={() => setFilter("all")}
              >
                All tournaments
              </FilterChip>
              {visibleTournaments.map((t) => (
                <FilterChip
                  key={t._id}
                  active={effectiveFilter === t._id}
                  onClick={() => setFilter(t._id)}
                >
                  {t.name}
                </FilterChip>
              ))}
            </div>
          )}

          <div className="space-y-8">
            <section className="space-y-4">
              <SectionLabel tone="your">
                Your teams ({filteredYourTeams.length})
              </SectionLabel>
              {filteredYourTeams.length === 0 ? (
                <p className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-xs">
                  {effectiveFilter === "all"
                    ? "You haven't joined any teams yet."
                    : "You don't have a team in this tournament."}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredYourTeams.map((team) =>
                    renderTeamCard(team, {
                      tournament:
                        effectiveFilter === "all"
                          ? tournamentMap[team.tournamentId]
                          : undefined,
                      isUserMember: true,
                      isUserInTeam: true,
                    }),
                  )}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <SectionLabel tone="rest">
                {effectiveFilter === "all" ? "All other teams" : "Other teams"}{" "}
                ({filteredOtherTeams.length})
              </SectionLabel>
              {filteredOtherTeams.length === 0 ? (
                <p className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-xs">
                  No other teams to show.
                </p>
              ) : (
                <div className="space-y-5">
                  {otherTournaments.map((tournament) => (
                    <TournamentGroup
                      key={tournament._id}
                      tournament={tournament}
                      teams={filteredOtherTeams.filter(
                        (team) => team.tournamentId === tournament._id,
                      )}
                      isUserInTournament={userTournamentIds.has(tournament._id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export function TeamListingSkeleton({
  headerActions,
}: {
  headerActions?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader as="h1" title="Teams" Icon={Users}>
        {headerActions}
      </SectionHeader>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-28 rounded-full" />
        ))}
      </div>
      <section className="space-y-4">
        <Skeleton className="h-3 w-32" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-3 w-32" />
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((__, j) => (
                  <TeamCardSkeleton key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
