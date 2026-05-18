import { useMemo, useState } from "react";

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
  type DashboardLifecycle,
  type DashboardTeamRow,
} from "@/components/dashboard/sections";
import {
  buildStandingsChartData,
  buildStandingsGroups,
  toIsoDate,
} from "@/components/dashboard/utils";

import {
  MOCK_INBOX,
  MOCK_TEAMS_BY_TOURNAMENT,
  MOCK_TIMELINES_BY_TOURNAMENT,
  MOCK_TOURNAMENTS,
  MOCK_VIEWER,
  type MockViewMode,
} from "./fixtures";

// ─── view-mode driver ───────────────────────────────────────────────────────

export type MockViewModeConfig = {
  mode: MockViewMode;
  label: string;
  description: string;
};

export const VIEW_MODES: MockViewModeConfig[] = [
  {
    mode: "active-no-submission",
    label: "Active · unsubmitted",
    description: "Mid-tournament, no log today yet. Banner prompts to log.",
  },
  {
    mode: "active-default",
    label: "Active · 1 of 2 logged",
    description:
      "Mid-tournament, one submission in, cap=2. Banner offers another.",
  },
  {
    mode: "active-at-limit",
    label: "Active · at cap",
    description: "Daily cap met. Banner hidden.",
  },
  {
    mode: "urgent-ending",
    label: "Urgent · 2 days left",
    description:
      "≤3 days remain. Timeline caption promotes to final-whistle banner.",
  },
  {
    mode: "ended-recent",
    label: "Ended · within grace",
    description: "Tournament ended 3 days ago. Standings render as final.",
  },
  {
    mode: "empty",
    label: "Empty · no team",
    description: "Viewer on no team. Directed prompt to find a tournament.",
  },
];

type ResolvedMode = {
  tournamentIdx: number;
  todaySubmissions: number;
  isEmpty: boolean;
};

function resolveMode(mode: MockViewMode): ResolvedMode {
  switch (mode) {
    case "active-no-submission":
      return { tournamentIdx: 0, todaySubmissions: 0, isEmpty: false };
    case "active-default":
      return { tournamentIdx: 0, todaySubmissions: 1, isEmpty: false };
    case "active-at-limit":
      return { tournamentIdx: 0, todaySubmissions: 2, isEmpty: false };
    case "urgent-ending":
      return { tournamentIdx: 1, todaySubmissions: 0, isEmpty: false };
    case "ended-recent":
      return { tournamentIdx: 2, todaySubmissions: 0, isEmpty: false };
    case "empty":
      return { tournamentIdx: 0, todaySubmissions: 0, isEmpty: true };
  }
}

function isWithinGrace(endDate: string): boolean {
  const endMs = new Date(endDate).getTime();
  return Date.now() - endMs < 7 * 86_400_000;
}

// ─── main page ──────────────────────────────────────────────────────────────

export function DashboardSandboxPage({
  mode = "active-no-submission",
}: {
  mode?: MockViewMode;
}) {
  const resolved = resolveMode(mode);
  const initialTournamentId = MOCK_TOURNAMENTS[resolved.tournamentIdx]
    ._id as string;
  const [selectedId, setSelectedId] = useState<string>(initialTournamentId);

  const tournament = useMemo(
    () =>
      MOCK_TOURNAMENTS.find((t) => t._id === selectedId) ??
      MOCK_TOURNAMENTS[resolved.tournamentIdx],
    [selectedId, resolved.tournamentIdx],
  );

  if (resolved.isEmpty) {
    return (
      <DashboardShell>
        <EmptyState viewerFirstName={MOCK_VIEWER.firstName} />
      </DashboardShell>
    );
  }

  const teams = MOCK_TEAMS_BY_TOURNAMENT[tournament._id];
  const timelines = MOCK_TIMELINES_BY_TOURNAMENT[tournament._id];

  const sorted = [...teams].sort((a, b) => b.team.points - a.team.points);
  const myTeam = sorted.find((t) => t.userRole !== "rival") ?? sorted[0];
  const myRank = sorted.findIndex((t) => t.team._id === myTeam.team._id) + 1;
  const above = myRank > 1 ? sorted[myRank - 2] : null;
  const below = myRank < sorted.length ? sorted[myRank] : null;
  const comparison: "ahead" | "tied" | "behind" =
    above === null
      ? "ahead"
      : above.team.points === myTeam.team.points
        ? "tied"
        : "behind";
  const comparedTo = above ?? below;
  const gap =
    above === null
      ? below
        ? myTeam.team.points - below.team.points
        : 0
      : above.team.points - myTeam.team.points;

  const today = new Date();
  const todayStr = toIsoDate(today);
  const groups = buildStandingsGroups(teams, todayStr);
  const chart = groups[0]
    ? buildStandingsChartData(groups[0], timelines, today)
    : null;

  const startMs = new Date(tournament.startDate).getTime();
  const endMs = new Date(tournament.endDate).getTime();
  const totalDays = Math.max(Math.round((endMs - startMs) / 86_400_000), 1);
  const dayNumber = Math.min(
    Math.max(Math.round((Date.now() - startMs) / 86_400_000) + 1, 1),
    totalDays,
  );
  const daysRemaining = Math.max(
    Math.ceil((endMs - Date.now()) / 86_400_000),
    0,
  );

  const lifecycle: DashboardLifecycle =
    tournament.__state === "ended"
      ? "ended"
      : tournament.__state === "urgent" || daysRemaining <= 3
        ? "urgent"
        : "active";

  const teamRows: DashboardTeamRow[] = sorted.map((t) => ({
    team: { _id: t.team._id, name: t.team.name, points: t.team.points },
    memberCount: t.memberCount,
    userRole: t.userRole,
  }));

  const inboxItems: DashboardInboxItem[] = MOCK_INBOX;

  return (
    <DashboardShell>
      <TournamentContextHeader
        viewerFirstName={MOCK_VIEWER.firstName}
        tournaments={MOCK_TOURNAMENTS.filter(
          (t) => t.__state !== "ended" || isWithinGrace(t.endDate),
        ).map((t) => ({ _id: t._id, name: t.name }))}
        selectedTournamentId={tournament._id}
        onSelect={setSelectedId}
        state={lifecycle}
        dayNumber={dayNumber}
        totalDays={totalDays}
        daysRemaining={daysRemaining}
        endDateLabel={formatEndDate(tournament.endDate)}
      />

      {lifecycle !== "ended" && (
        <SubmitTodayBanner
          todaySubmissions={resolved.todaySubmissions}
          limit={tournament.maxSubmissionsPerDay}
          teamName={myTeam.team.name}
        />
      )}

      <MyTeamHeader
        teamId={myTeam.team._id}
        teamName={myTeam.team.name}
        isCaptain={myTeam.userRole === "captain"}
        memberCount={myTeam.memberCount}
        rank={myRank}
        totalTeams={sorted.length}
        points={myTeam.team.points}
        gap={Math.abs(gap)}
        comparison={comparison}
        comparedToTeamName={comparedTo?.team.name ?? null}
      />

      {chart && (
        <StandingsCard
          teams={teamRows}
          userTeamId={myTeam.team._id}
          chartDays={chart.days}
          chartSeries={chart.series}
          isEnded={lifecycle === "ended"}
        />
      )}

      <Inbox items={inboxItems} />
    </DashboardShell>
  );
}
