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

    const joinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const relevantJoinRequests = joinRequests.filter((jr) =>
      teamIdsSet.has(jr.teamId),
    );

    const allPendingInvitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const invitations = allPendingInvitations.filter(
      (inv) => inv.invitedBy === user._id,
    );

    return relevantJoinRequests.length + invitations.length;
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
      submissions: { table: "submissions", foreignKeyField: "teamId" },
    });

    const teamsWithData = enrichedTeams.map((enrichedTeam) => {
      const approvedSubmissions = enrichedTeam.submissions.filter(
        (s) => s.state === "approved",
      );

      const { tournament, members, submissions, ...team } = enrichedTeam;

      return {
        team,
        tournament,
        membersCount: members.length,
        submissionsCount: submissions.length,
        approvedCount: approvedSubmissions.length,
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

    const allPendingInvitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const relevantInvitations = allPendingInvitations.filter(
      (inv) => inv.invitedBy === user._id,
    );

    const enrichedInvitations = await enrichWithRelations(
      ctx,
      relevantInvitations,
      {
        invitedUser: {
          table: "users",
          foreignKey: (inv) => inv.invitedUserId,
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
      submissions: { table: "submissions", foreignKeyField: "teamId" },
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
      const approvedSubmissions = enrichedTeam.submissions.filter(
        (s) => s.state === "approved",
      );
      const pendingSubmissions = enrichedTeam.submissions.filter(
        (s) => s.state === "pending",
      );

      const totalReviewed =
        approvedSubmissions.length +
        enrichedTeam.submissions.filter((s) => s.state === "rejected").length;
      const approvalRate =
        totalReviewed > 0
          ? Math.round((approvedSubmissions.length / totalReviewed) * 100)
          : 0;

      const allTeamsInTournament =
        tournamentTeamsByTournamentIdMap.get(enrichedTeam.tournamentId) || [];

      const rank =
        allTeamsInTournament.filter((t) => t.points > enrichedTeam.points)
          .length + 1;

      const { tournament, members, submissions, ...team } = enrichedTeam;

      return {
        team,
        tournament,
        membersCount: members.length,
        totalSubmissions: submissions.length,
        approvedSubmissions: approvedSubmissions.length,
        pendingSubmissions: pendingSubmissions.length,
        approvalRate,
        points: team.points,
        rank,
        totalTeamsInTournament: allTeamsInTournament.length,
      };
    });

    return teamsComparison;
  },
});
