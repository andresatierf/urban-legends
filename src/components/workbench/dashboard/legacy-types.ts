import type { FunctionReturnType } from "convex/server";

import type { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

export type DashboardData = FunctionReturnType<
  typeof api.dashboard.getDashboardData
>;

export type DashboardTeam =
  | DashboardData["teams"][number]
  | DashboardData["competingTeams"][number];

export type DashboardActivity = DashboardData["activities"][number];
export type DashboardDeadline = DashboardData["deadlines"][number];
export type DashboardInvitation = DashboardData["invitations"][number];
export type DashboardJoinRequest = DashboardData["joinRequests"][number];
export type DashboardAdminStats = NonNullable<DashboardData["adminStats"]>;
export type DashboardStandingsTimeline =
  DashboardData["standingsTimelines"][number];
export type DashboardTournament = Doc<"tournaments">;
