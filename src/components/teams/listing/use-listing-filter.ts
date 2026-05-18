import { useMemo, useState } from "react";

import { getTournamentStatus } from "@/components/tournaments/utils";

import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import type { TeamWithMembers, TournamentMap } from "./types";

const STATUS_ORDER: Record<ReturnType<typeof getTournamentStatus>, number> = {
  active: 0,
  upcoming: 1,
  ended: 2,
};

export type ListingFilter = {
  userTeamIds: Set<Id<"teams">>;
  userTournamentIds: Set<Id<"tournaments">>;
  tournamentsWithTeams: Doc<"tournaments">[];
  visibleTournaments: Doc<"tournaments">[];
  hasEndedTournaments: boolean;
  effectiveFilter: string;
  setFilter: (id: string) => void;
  includeEnded: boolean;
  setIncludeEnded: (next: boolean | ((v: boolean) => boolean)) => void;
  visibleUserTeams: TeamWithMembers[];
  browseTeams: TeamWithMembers[];
  showTournamentEyebrow: boolean;
};

export function useListingFilter({
  userTeams,
  allTeams,
  tournamentMap,
}: {
  userTeams: TeamWithMembers[];
  allTeams: TeamWithMembers[];
  tournamentMap: TournamentMap;
}): ListingFilter {
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

  const isEndedTeam = useMemo(() => {
    return (team: TeamWithMembers) => {
      const t = tournamentMap[team.tournamentId];
      return t ? getTournamentStatus(t) === "ended" : false;
    };
  }, [tournamentMap]);

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

  const matchesPageFilter = useMemo(() => {
    return (team: TeamWithMembers) =>
      effectiveFilter === "all"
        ? includeEnded || !isEndedTeam(team)
        : team.tournamentId === effectiveFilter;
  }, [effectiveFilter, includeEnded, isEndedTeam]);

  const visibleUserTeams = useMemo(
    () => userTeams.filter(matchesPageFilter),
    [userTeams, matchesPageFilter],
  );

  const browseTeams = useMemo(
    () =>
      allTeams.filter((t) => !userTeamIds.has(t._id)).filter(matchesPageFilter),
    [allTeams, userTeamIds, matchesPageFilter],
  );

  const hasEndedTournaments = tournamentsWithTeams.some(
    (t) => getTournamentStatus(t) === "ended",
  );

  return {
    userTeamIds,
    userTournamentIds,
    tournamentsWithTeams,
    visibleTournaments,
    hasEndedTournaments,
    effectiveFilter,
    setFilter,
    includeEnded,
    setIncludeEnded,
    visibleUserTeams,
    browseTeams,
    showTournamentEyebrow: effectiveFilter === "all",
  };
}
