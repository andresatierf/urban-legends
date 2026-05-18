import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn, tryMutate } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { buildChartData, formatEndDate } from "./chart-data";
import { EmptyState } from "./empty-state";
import { Inbox } from "./inbox";
import { MyTeamHeader } from "./my-team-header";
import { DashboardShell } from "./shell";
import { StandingsCard } from "./standings-card";
import { SubmitTodayBanner } from "./submit-today-banner";
import { TournamentContextHeader } from "./tournament-context-header";
import type { DashboardTeamRow, DashboardView } from "./types";

export function DashboardLayout() {
  const [selectedId, setSelectedId] = useState<Id<"tournaments"> | undefined>(
    undefined,
  );

  const fresh = useQuery(api.views.dashboard.getDashboardView, {
    tournamentId: selectedId,
  });

  // Keep the previous data visible while a refetch (e.g. tournament switch)
  // is in flight so the screen doesn't flash to skeleton.
  const lastDataRef = useRef<DashboardView | undefined>(undefined);
  if (fresh !== undefined) lastDataRef.current = fresh;
  const data = fresh ?? lastDataRef.current;
  const isRefetching = fresh === undefined && lastDataRef.current !== undefined;

  if (data === undefined) {
    return (
      <DashboardShell>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-[28rem] w-full" />
      </DashboardShell>
    );
  }

  if (data.selected === null) {
    return (
      <DashboardShell>
        <EmptyState viewerFirstName={data.viewer.firstName} />
        {data.inbox.length > 0 && <Inbox items={data.inbox} />}
      </DashboardShell>
    );
  }

  return (
    <DashboardLoaded
      data={data}
      onSelect={setSelectedId}
      isRefetching={isRefetching}
    />
  );
}

function DashboardLoaded({
  data,
  onSelect,
  isRefetching,
}: {
  data: DashboardView & { selected: NonNullable<DashboardView["selected"]> };
  onSelect: (id: Id<"tournaments">) => void;
  isRefetching: boolean;
}) {
  const { selected } = data;
  const tournament = selected.tournament;
  const myTeamRow = selected.myTeam;

  const teamRows: DashboardTeamRow[] = selected.teams.map((t) => ({
    team: {
      _id: t.team._id,
      name: t.team.name,
      points: t.team.points,
    },
    memberCount: t.memberCount,
    userRole: t.userRole,
  }));

  const chartData = buildChartData(selected, Date.now());

  const acceptJoinRequest = useMutation(api.joinRequests.accept);
  const rejectJoinRequest = useMutation(api.joinRequests.reject);
  const [pendingId, setPendingId] = useState<Id<"joinRequests"> | null>(null);

  const respondInvitation = (id: string, accept: boolean) => {
    const requestId = id as Id<"joinRequests">;
    setPendingId(requestId);
    return tryMutate({
      fn: () =>
        accept
          ? acceptJoinRequest({ requestId })
          : rejectJoinRequest({ requestId }),
      onFinally: () => setPendingId(null),
      successToast: accept ? "Invitation accepted" : "Invitation declined",
      defaultFailureToast: accept
        ? "Failed to accept invitation"
        : "Failed to decline invitation",
    });
  };

  const respondJoinRequest = (id: string, approve: boolean) => {
    const requestId = id as Id<"joinRequests">;
    setPendingId(requestId);
    return tryMutate({
      fn: () =>
        approve
          ? acceptJoinRequest({ requestId })
          : rejectJoinRequest({ requestId }),
      onFinally: () => setPendingId(null),
      successToast: approve ? "Request approved" : "Request declined",
      defaultFailureToast: approve
        ? "Failed to approve request"
        : "Failed to decline request",
    });
  };

  return (
    <DashboardShell>
      <TournamentContextHeader
        viewerFirstName={data.viewer.firstName}
        tournaments={data.switchableTournaments.map((t) => ({
          _id: t._id,
          name: t.name,
        }))}
        selectedTournamentId={tournament._id}
        onSelect={(id) => onSelect(id as Id<"tournaments">)}
        state={selected.lifecycleState}
        dayNumber={selected.dayNumber}
        totalDays={selected.totalDays}
        daysRemaining={selected.daysRemaining}
        endDateLabel={formatEndDate(tournament.endDate)}
      />

      <div
        aria-busy={isRefetching}
        className={cn(
          "flex flex-col gap-7 transition-opacity duration-200 sm:gap-8",
          isRefetching && "opacity-60",
        )}
      >
        {selected.lifecycleState !== "ended" && (
          <SubmitTodayBanner
            todaySubmissions={selected.todaySubmissionCount}
            limit={tournament.maxSubmissionsPerDay}
            teamName={myTeamRow.team.name}
          />
        )}

        <MyTeamHeader
          teamId={myTeamRow.team._id}
          teamName={myTeamRow.team.name}
          isCaptain={myTeamRow.userRole === "captain"}
          memberCount={myTeamRow.memberCount}
          rank={myTeamRow.rank}
          totalTeams={selected.teams.length}
          points={myTeamRow.team.points}
          gap={myTeamRow.gap}
          comparison={myTeamRow.comparison}
          comparedToTeamName={myTeamRow.comparedToName}
        />

        {chartData.series.length > 0 && (
          <StandingsCard
            teams={teamRows}
            userTeamId={myTeamRow.team._id}
            chartDays={chartData.days}
            chartSeries={chartData.series}
            isEnded={selected.lifecycleState === "ended"}
          />
        )}

        <Inbox
          items={data.inbox}
          onRespondInvitation={respondInvitation}
          onRespondJoinRequest={respondJoinRequest}
          pendingId={pendingId}
        />
      </div>
    </DashboardShell>
  );
}
