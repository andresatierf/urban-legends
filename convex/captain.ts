import { query } from "./_generated/server";
import { enrichWithRelations } from "./lib/helpers";
import { getCurrentUserOrThrow } from "./users";

/**
 * Get the count of pending actions for the captain's teams.
 * This includes:
 * - Pending join requests across all teams the user captains
 * - Pending invitations sent by the user
 */
export const getPendingActionsCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const captainedTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainedTeams.map((tm) => tm.teamId);
    const teamIdsSet = new Set(teamIds);

    if (teamIds.length === 0) {
      return 0;
    }

    // Filter A: incoming user-direction requests for my captained teams
    const allPending = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const incomingCount = allPending.filter(
      (jr) => teamIdsSet.has(jr.teamId) && jr.initiator === "user",
    ).length;

    // Filter B: outgoing team-direction invitations I created (tighter index)
    const outgoingPending = await ctx.db
      .query("joinRequests")
      .withIndex("by_createdBy_and_status", (q) =>
        q.eq("createdBy", user._id).eq("status", "pending"),
      )
      .filter((q) => q.eq(q.field("initiator"), "team"))
      .collect();

    return incomingCount + outgoingPending.length;
  },
});

/**
 * Get the count of teams the current user captains.
 * Used for sidebar conditional rendering.
 */
export const getCaptainedTeamsCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx, { throw: false });
    if (!user) return 0;

    const captainedTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    return captainedTeams.length;
  },
});

/**
 * Get comprehensive dashboard data for the captain.
 * Returns all teams user captains with pending actions and statistics.
 */
export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const captainedTeamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainedTeamMembers.map((tm) => tm.teamId);

    if (teamIds.length === 0) {
      return {
        teams: [],
        joinRequests: [],
        invitations: [],
      };
    }

    const teams = await ctx.db
      .query("teams")
      .filter((q) =>
        q.or(...teamIds.map((id) => q.eq(q.field("_id"), id as string))),
      )
      .collect();

    const enrichedTeams = await enrichWithRelations(ctx, teams, {
      tournament: {
        table: "tournaments",
        foreignKey: (team) => team.tournamentId,
      },
      members: { table: "teamMembers", foreignKeyField: "teamId" },
      activities: { table: "activities", foreignKeyField: "teamId" },
    });

    const teamsWithData = enrichedTeams.map((enrichedTeam) => {
      const activeActivities = enrichedTeam.activities.filter(
        (a) => a.state !== "deleted",
      );
      const approvedActivities = activeActivities.filter(
        (a) => a.state === "approved",
      );

      const { tournament, members, activities, ...team } = enrichedTeam;
      void activities;

      return {
        team,
        tournament,
        membersCount: members.length,
        activitiesCount: activeActivities.length,
        approvedCount: approvedActivities.length,
        points: team.points,
      };
    });

    const teamIdsSet = new Set(teamIds);
    const allJoinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const relevantJoinRequests = allJoinRequests.filter((jr) =>
      teamIdsSet.has(jr.teamId),
    );

    const enrichedJoinRequests = await enrichWithRelations(
      ctx,
      relevantJoinRequests,
      {
        user: {
          table: "users",
          foreignKey: (jr) => jr.userId,
        },
        team: {
          table: "teams",
          foreignKey: (jr) => jr.teamId,
        },
      },
    );

    const allPendingJR = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const relevantInvitations = allPendingJR.filter(
      (jr) => jr.initiator === "team" && jr.createdBy === user._id,
    );

    const enrichedInvitations = await enrichWithRelations(
      ctx,
      relevantInvitations,
      {
        invitedUser: {
          table: "users",
          foreignKey: (inv) => inv.userId,
        },
        team: {
          table: "teams",
          foreignKey: (inv) => inv.teamId,
        },
      },
    );

    return {
      teams: teamsWithData,
      joinRequests: enrichedJoinRequests,
      invitations: enrichedInvitations,
    };
  },
});

/**
 * Get comparison metrics for all teams the user captains.
 */
export const getTeamsComparison = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const captainedTeamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainedTeamMembers.map((tm) => tm.teamId);

    if (teamIds.length === 0) {
      return [];
    }

    const teams = await ctx.db
      .query("teams")
      .filter((q) => q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))))
      .collect();

    const enrichedTeams = await enrichWithRelations(ctx, teams, {
      tournament: {
        table: "tournaments",
        foreignKey: (team) => team.tournamentId,
      },
      members: { table: "teamMembers", foreignKeyField: "teamId" },
      activities: { table: "activities", foreignKeyField: "teamId" },
    });

    const tournamentIds = Array.from(new Set(teams.map((t) => t.tournamentId)));
    const tournaments = await ctx.db
      .query("tournaments")
      .filter((q) =>
        q.or(...tournamentIds.map((id) => q.eq(q.field("_id"), id))),
      )
      .collect();

    const enrichedTournaments = await enrichWithRelations(ctx, tournaments, {
      teams: { table: "teams", foreignKeyField: "tournamentId" },
    });

    const tournamentTeamsByTournamentIdMap = new Map(
      enrichedTournaments.map((t) => [t._id, t.teams]),
    );

    const teamsComparison = enrichedTeams.map((enrichedTeam) => {
      const activeActivities = enrichedTeam.activities.filter(
        (a) => a.state !== "deleted",
      );
      const approvedActivities = activeActivities.filter(
        (a) => a.state === "approved",
      );
      const pendingActivities = activeActivities.filter(
        (a) => a.state === "pending" || a.state === "incomplete",
      );

      const totalReviewed =
        approvedActivities.length +
        activeActivities.filter((a) => a.state === "rejected").length;
      const approvalRate =
        totalReviewed > 0
          ? Math.round((approvedActivities.length / totalReviewed) * 100)
          : 0;

      const allTeamsInTournament =
        tournamentTeamsByTournamentIdMap.get(enrichedTeam.tournamentId) || [];

      const rank =
        allTeamsInTournament.filter((t) => t.points > enrichedTeam.points)
          .length + 1;

      const { tournament, members, activities, ...team } = enrichedTeam;
      void activities;

      return {
        team,
        tournament,
        membersCount: members.length,
        totalActivities: activeActivities.length,
        approvedActivities: approvedActivities.length,
        pendingActivities: pendingActivities.length,
        approvalRate,
        points: team.points,
        rank,
        totalTeamsInTournament: allTeamsInTournament.length,
      };
    });

    return teamsComparison;
  },
});
