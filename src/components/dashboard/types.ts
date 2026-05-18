import type { FunctionReturnType } from "convex/server";

import type { api } from "../../../convex/_generated/api";

export type DashboardView = FunctionReturnType<
  typeof api.views.dashboard.getDashboardView
>;

export type DashboardLifecycle = "active" | "urgent" | "ended";

export type DashboardSwitchableTournament = {
  _id: string;
  name: string;
};

export type DashboardTeamRow = {
  team: {
    _id: string;
    name: string;
    points: number;
  };
  memberCount: number;
  userRole: "captain" | "member" | "rival";
};

export type DashboardChartSeries = {
  teamId: string;
  teamName: string;
  points: number[];
  total: number;
};

export type DashboardMyTeam = {
  teamId: string;
  teamName: string;
  isCaptain: boolean;
  memberCount: number;
  rank: number;
  totalTeams: number;
  points: number;
  gap: number;
  comparison: "ahead" | "tied" | "behind";
  comparedToTeamName: string | null;
};

export type DashboardInboxItem =
  | {
      kind: "invitation";
      id: string;
      teamName: string;
      tournamentName: string;
      invitedBy: string;
      timestamp: number;
    }
  | {
      kind: "joinRequest";
      id: string;
      userName: string;
      teamName: string;
      timestamp: number;
    };
