import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  DashboardShell,
  EmptyState,
  formatEndDate,
  Inbox,
  MyTeamHeader,
  StandingsCard,
  SubmitTodayBanner,
  TournamentContextHeader,
  type DashboardInboxItem,
  type DashboardTeamRow,
} from "./sections";

type DashboardViewData = FunctionReturnType<
  typeof api.views.dashboard.getDashboardView
>;

const DAY_MS = 86_400_000;

export function DashboardPage() {
  const [selectedId, setSelectedId] = useState<Id<"tournaments"> | undefined>(
    undefined,
  );

  const data = useQuery(api.views.dashboard.getDashboardView, {
    tournamentId: selectedId,
  });

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
        {data.inbox.length > 0 && <Inbox items={data.inbox.map(toInboxItem)} />}
      </DashboardShell>
    );
  }

  return <DashboardLoaded data={data} onSelect={setSelectedId} />;
}

function DashboardLoaded({
  data,
  onSelect,
}: {
  data: DashboardViewData & {
    selected: NonNullable<DashboardViewData["selected"]>;
  };
  onSelect: (id: Id<"tournaments">) => void;
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
  const inboxItems = data.inbox.map(toInboxItem);

  // ── inbox mutations ──────────────────────────────────────────────────
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
        items={inboxItems}
        onRespondInvitation={respondInvitation}
        onRespondJoinRequest={respondJoinRequest}
        pendingId={pendingId}
      />
    </DashboardShell>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────

function toInboxItem(
  raw: DashboardViewData["inbox"][number],
): DashboardInboxItem {
  return raw;
}

function buildChartData(
  selected: NonNullable<DashboardViewData["selected"]>,
  nowMs: number,
) {
  const startMs = new Date(selected.tournament.startDate).getTime();
  const endMs = Math.min(
    new Date(selected.tournament.endDate).getTime(),
    nowMs,
  );
  const totalDays = Math.max(Math.ceil((endMs - startMs) / DAY_MS), 1);
  const days = Array.from(
    { length: totalDays + 1 },
    (_, i) => startMs + i * DAY_MS,
  );

  const timelinesByTeam = new Map(
    selected.timeline.map((tl) => [tl.teamId, tl.events]),
  );

  const series = selected.teams.map((t) => {
    const events = (timelinesByTeam.get(t.team._id) ?? []).filter(
      (e) => e.timestamp >= startMs && e.timestamp <= endMs,
    );
    const points = days.map((d) =>
      events.reduce((sum, e) => (e.timestamp <= d ? sum + e.points : sum), 0),
    );
    if (points.length > 0 && events.length > 0) {
      points[points.length - 1] = t.team.points;
    }
    return {
      teamId: t.team._id,
      teamName: t.team.name,
      points,
      total: t.team.points,
    };
  });

  return { days, series };
}
