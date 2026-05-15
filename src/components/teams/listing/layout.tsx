import { Link } from "@tanstack/react-router";
import { ArrowRight, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { TournamentSwitcher } from "../../dashboard/tournament-switcher";
import { getTournamentStatus } from "../../tournaments/utils";
import { Skeleton } from "../../ui/skeleton";
import { TeamCard, TeamCardSkeleton } from "../card/layout";
import { JoinTeamCard } from "../join-team-card";
import type { TeamWithMembers, TournamentMap } from "./types";

const STATUS_ORDER: Record<ReturnType<typeof getTournamentStatus>, number> = {
  active: 0,
  upcoming: 1,
  ended: 2,
};

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
  const { user } = useUser({ shouldThrow: false });
  const currentUserId = user?._id;
  const [filter, setFilter] = useState<string>(() => {
    const tournamentIds = Array.from(
      new Set(allTeams.map((t) => t.tournamentId)),
    );
    const active = tournamentIds
      .map((id) => tournamentMap[id])
      .find((t) => t && getTournamentStatus(t) === "active");
    return active?._id ?? "all";
  });
  const [includeEnded, setIncludeEnded] = useState(false);

  const userTeamIds = useMemo(
    () => new Set(userTeams.map((t) => t._id)),
    [userTeams],
  );
  const userTournamentIds = useMemo(
    () => new Set(userTeams.map((t) => t.tournamentId)),
    [userTeams],
  );

  const tournamentsWithTeams = useMemo(
    () =>
      Array.from(new Set(allTeams.map((t) => t.tournamentId)))
        .map((id) => tournamentMap[id])
        .filter((t): t is Doc<"tournaments"> => Boolean(t))
        .sort((a, b) => {
          const sa = STATUS_ORDER[getTournamentStatus(a)];
          const sb = STATUS_ORDER[getTournamentStatus(b)];
          if (sa !== sb) return sa - sb;
          return b.startDate.localeCompare(a.startDate);
        }),
    [allTeams, tournamentMap],
  );

  const visibleTournaments = useMemo(
    () =>
      tournamentsWithTeams.filter(
        (t) => includeEnded || getTournamentStatus(t) !== "ended",
      ),
    [tournamentsWithTeams, includeEnded],
  );

  const effectiveFilter = useMemo(() => {
    const hidden =
      filter !== "all" && !visibleTournaments.some((t) => t._id === filter);
    return hidden ? "all" : filter;
  }, [filter, visibleTournaments]);

  const visibleTeams = useMemo(() => {
    const isEndedTeam = (team: TeamWithMembers) => {
      const t = tournamentMap[team.tournamentId];
      return t ? getTournamentStatus(t) === "ended" : false;
    };

    const matchesFilter = (team: TeamWithMembers) =>
      effectiveFilter === "all"
        ? includeEnded || !isEndedTeam(team)
        : team.tournamentId === effectiveFilter;

    return allTeams.filter(matchesFilter).sort((a, b) => {
      const aMine = userTeamIds.has(a._id) ? 0 : 1;
      const bMine = userTeamIds.has(b._id) ? 0 : 1;
      return aMine - bMine;
    });
  }, [allTeams, tournamentMap, userTeamIds, effectiveFilter, includeEnded]);

  const hasAnyTeams = allTeams.length > 0;
  const hasEndedTournaments = tournamentsWithTeams.some(
    (t) => getTournamentStatus(t) === "ended",
  );

  return (
    <div className="space-y-6">
      <SectionHeader as="h1" title="Teams" Icon={Users}>
        <div className="flex items-center gap-2">
          {(visibleTournaments.length > 0 || hasEndedTournaments) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncludeEnded((v) => !v)}
            >
              {includeEnded ? "Hide past tournaments" : "Show past tournaments"}
            </Button>
          )}
          {headerActions}
        </div>
      </SectionHeader>

      {!hasAnyTeams ? (
        <JoinTeamCard first />
      ) : visibleTeams.length === 0 ? (
        <>
          {visibleTournaments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <TournamentSwitcher
                tournaments={visibleTournaments}
                selectedTournamentId={effectiveFilter}
                onSelect={setFilter}
                label="Tournament"
                allOption={{ value: "all", label: "All tournaments" }}
              />
              {effectiveFilter !== "all" && (
                <Button size="sm" asChild>
                  <Link
                    to="/tournaments/$tournamentId"
                    params={{ tournamentId: effectiveFilter }}
                  >
                    View tournament
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          )}
          <p className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-xs">
            No teams to show.
          </p>
        </>
      ) : (
        <>
          {visibleTournaments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <TournamentSwitcher
                tournaments={visibleTournaments}
                selectedTournamentId={effectiveFilter}
                onSelect={setFilter}
                label="Tournament"
                allOption={{ value: "all", label: "All tournaments" }}
              />
              {effectiveFilter !== "all" && (
                <Button size="sm" asChild>
                  <Link
                    to="/tournaments/$tournamentId"
                    params={{ tournamentId: effectiveFilter }}
                  >
                    View tournament
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleTeams.map((team) => {
              const isUserMember = userTeamIds.has(team._id);
              const role =
                isUserMember && currentUserId
                  ? (team.members.find((m) => m._id === currentUserId)
                      ?.memberRole ?? null)
                  : null;
              return (
                <TeamCard
                  key={team._id}
                  data={{
                    team,
                    tournament:
                      effectiveFilter === "all"
                        ? tournamentMap[team.tournamentId]
                        : undefined,
                    members: team.members,
                    memberCount: team.members.length,
                    isUserMember,
                    isUserInTeam: userTournamentIds.has(team.tournamentId),
                    userRole: role,
                    rank: team.rank,
                    totalTeams: team.totalTeams,
                  }}
                />
              );
            })}
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
      <Skeleton className="h-8 w-44 rounded-full" />
      <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TeamCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
