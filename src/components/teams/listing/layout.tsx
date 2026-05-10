import { Users } from "lucide-react";
import { useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { getTournamentStatus } from "../../tournaments/utils";
import { Skeleton } from "../../ui/skeleton";
import { TeamCardSkeleton } from "../card/layout";
import { JoinTeamCard } from "../join-team-card";
import { FilterBar } from "./filter-bar";
import { OtherTeams } from "./other-teams";
import type { TeamWithMembers, TournamentMap } from "./types";
import { YourTeams } from "./your-teams";

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
  const [filter, setFilter] = useState<string>("all");
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

  const { filteredYourTeams, filteredOtherTeams } = useMemo(() => {
    const isEndedTeam = (team: TeamWithMembers) => {
      const t = tournamentMap[team.tournamentId];
      return t ? getTournamentStatus(t) === "ended" : false;
    };

    const matchesFilter = (team: TeamWithMembers) =>
      effectiveFilter === "all"
        ? includeEnded || !isEndedTeam(team)
        : team.tournamentId === effectiveFilter;

    return {
      filteredYourTeams: userTeams.filter(matchesFilter),
      filteredOtherTeams: allTeams.filter(
        (t) => !userTeamIds.has(t._id) && matchesFilter(t),
      ),
    };
  }, [
    userTeams,
    allTeams,
    tournamentMap,
    userTeamIds,
    effectiveFilter,
    includeEnded,
  ]);

  const otherTournaments = useMemo(
    () =>
      visibleTournaments.filter((t) =>
        filteredOtherTeams.some((team) => team.tournamentId === t._id),
      ),
    [visibleTournaments, filteredOtherTeams],
  );

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
      ) : (
        <>
          <FilterBar
            tournaments={visibleTournaments}
            activeFilter={effectiveFilter}
            onFilterChange={setFilter}
          />

          <div className="space-y-8">
            <YourTeams
              teams={filteredYourTeams}
              effectiveFilter={effectiveFilter}
              tournamentMap={tournamentMap}
              currentUserId={currentUserId}
            />
            <OtherTeams
              teams={filteredOtherTeams}
              tournaments={otherTournaments}
              effectiveFilter={effectiveFilter}
              userTournamentIds={userTournamentIds}
            />
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
