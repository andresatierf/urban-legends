import { Link } from "@tanstack/react-router";
import { ArrowRight, Crown, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { TournamentSwitcher } from "@/components/common/tournament-switcher";
import { SectionHeader } from "@/components/section-header";
import { getTournamentStatus } from "@/components/tournaments/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useUser } from "@/hooks/useUser";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { Skeleton } from "../../ui/skeleton";
import { TeamCard, TeamCardSkeleton } from "../card/layout";
import { JoinTeamCard } from "../join-team-card";
import { useTeamCardActions } from "../use-team-card-actions";
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
  const getCardActions = useTeamCardActions();

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

  const hasAnyTeams = allTeams.length > 0;
  const hasEndedTournaments = tournamentsWithTeams.some(
    (t) => getTournamentStatus(t) === "ended",
  );

  const renderCard = (
    team: TeamWithMembers,
    showTournamentEyebrow: boolean,
  ) => {
    const isUserMember = userTeamIds.has(team._id);
    const role =
      isUserMember && currentUserId
        ? (team.members.find((m) => m._id === currentUserId)?.memberRole ??
          null)
        : null;
    const actions = getCardActions(team._id);
    return (
      <TeamCard
        key={team._id}
        data={{
          team,
          tournament: showTournamentEyebrow
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
        joinRequest={actions.joinRequest}
        onRequestJoin={actions.onRequestJoin}
        onCancelRequest={actions.onCancelRequest}
        onLeave={actions.onLeave}
      />
    );
  };

  const showFilterBar =
    hasAnyTeams && (visibleTournaments.length > 1 || hasEndedTournaments);

  return (
    <div className="space-y-6">
      <SectionHeader as="h1" title="Teams" Icon={Users}>
        {headerActions}
      </SectionHeader>

      {showFilterBar && (
        <div className="flex flex-wrap items-center gap-2">
          {visibleTournaments.length > 1 && (
            <TournamentSwitcher
              tournaments={visibleTournaments}
              selectedTournamentId={effectiveFilter}
              onSelect={setFilter}
              label="Tournament"
              allOption={{ value: "all", label: "All tournaments" }}
            />
          )}
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
          {hasEndedTournaments && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncludeEnded((v) => !v)}
            >
              {includeEnded ? "Hide past" : "Show past"}
            </Button>
          )}
        </div>
      )}

      {!hasAnyTeams ? (
        <JoinTeamCard first />
      ) : (
        <div className="space-y-8">
          {visibleUserTeams.length > 0 && (
            <section className="border-ink bg-paper-deep rounded-2xl border-2 p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Eyebrow color="sunset">Your roster</Eyebrow>
                  <h2 className="text-h2 text-foreground mt-1">
                    {visibleUserTeams.length === 1 ? "Your team" : "Your teams"}
                  </h2>
                </div>
                <Badge variant="info" className="gap-1">
                  <Crown className="size-3" />
                  {visibleUserTeams.length}{" "}
                  {visibleUserTeams.length === 1 ? "team" : "teams"}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleUserTeams.map((team) => renderCard(team, true))}
              </div>
            </section>
          )}

          <section className="space-y-4 pb-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Eyebrow>Browse</Eyebrow>
                <h2 className="text-h2 text-foreground mt-1">
                  {visibleUserTeams.length > 0 ? "Other teams" : "All teams"}
                </h2>
              </div>
            </div>

            {browseTeams.length === 0 ? (
              <p className="border-ink-soft text-muted-foreground text-body-sm rounded-xl border-2 border-dashed py-8 text-center">
                No other teams to show.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
                {browseTeams.map((team) =>
                  renderCard(team, effectiveFilter === "all"),
                )}
              </div>
            )}
          </section>
        </div>
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
    <div className="space-y-8">
      <SectionHeader as="h1" title="Teams" Icon={Users}>
        {headerActions}
      </SectionHeader>

      <section className="border-ink bg-paper-deep rounded-2xl border-2 p-5 sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-36" />
          </div>
          <Skeleton className="h-8 w-44 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
