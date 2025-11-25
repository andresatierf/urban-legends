import { query } from "./_generated/server";
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

    // Get all teams user captains
    const captainedTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainedTeams.map((tm) => tm.teamId);
    const teamIdsSet = new Set(teamIds);

    // If user doesn't captain any teams, return 0
    if (teamIds.length === 0) {
      return 0;
    }

    // Count pending join requests for all teams the user captains
    const joinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Filter join requests to only those for captain's teams
    const relevantJoinRequests = joinRequests.filter((jr) =>
      teamIdsSet.has(jr.teamId),
    );

    // Count pending invitations sent by the user
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

    // Get all teams user captains
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

    // Get team details with enriched data
    const teamsWithData = await Promise.all(
      teamIds.map(async (teamId) => {
        const team = await ctx.db.get(teamId);
        if (!team) return null;

        // Get tournament
        const tournament = await ctx.db.get(team.tournamentId);

        // Get team members count
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .collect();

        // Get submissions count
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .collect();

        const approvedSubmissions = submissions.filter(
          (s) => s.state === "approved",
        );

        return {
          team,
          tournament,
          membersCount: members.length,
          submissionsCount: submissions.length,
          approvedCount: approvedSubmissions.length,
          points: team.points,
        };
      }),
    );

    const teams = teamsWithData.filter((t) => t !== null);

    // Get pending join requests for captain's teams
    const teamIdsSet = new Set(teamIds);
    const allJoinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const relevantJoinRequests = allJoinRequests.filter((jr) =>
      teamIdsSet.has(jr.teamId),
    );

    // Enrich join requests with user and team data
    const enrichedJoinRequests = await Promise.all(
      relevantJoinRequests.map(async (jr) => {
        const [requestUser, team] = await Promise.all([
          ctx.db.get(jr.userId),
          ctx.db.get(jr.teamId),
        ]);

        return {
          ...jr,
          user: requestUser,
          team,
        };
      }),
    );

    // Get pending invitations sent by this captain
    const allPendingInvitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const relevantInvitations = allPendingInvitations.filter(
      (inv) => inv.invitedBy === user._id,
    );

    // Enrich invitations with team data
    const enrichedInvitations = await Promise.all(
      relevantInvitations.map(async (inv) => {
        const [invitedUser, team] = await Promise.all([
          ctx.db.get(inv.invitedUserId),
          ctx.db.get(inv.teamId),
        ]);

        return {
          ...inv,
          invitedUser,
          team,
        };
      }),
    );

    return {
      teams,
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

    // Get all teams user captains
    const captainedTeamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainedTeamMembers.map((tm) => tm.teamId);

    if (teamIds.length === 0) {
      return [];
    }

    // Get detailed metrics for each team
    const teamsComparison = await Promise.all(
      teamIds.map(async (teamId) => {
        const team = await ctx.db.get(teamId);
        if (!team) return null;

        // Get tournament
        const tournament = await ctx.db.get(team.tournamentId);

        // Get members
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .collect();

        // Get all submissions
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .collect();

        const approvedSubmissions = submissions.filter(
          (s) => s.state === "approved",
        );
        const pendingSubmissions = submissions.filter(
          (s) => s.state === "pending",
        );

        // Calculate approval rate
        const totalReviewed =
          approvedSubmissions.length +
          submissions.filter((s) => s.state === "rejected").length;
        const approvalRate =
          totalReviewed > 0
            ? Math.round((approvedSubmissions.length / totalReviewed) * 100)
            : 0;

        // Get tournament rank (simplified - just count teams with more points)
        const allTeamsInTournament = await ctx.db
          .query("teams")
          .withIndex("by_tournament", (q) =>
            q.eq("tournamentId", team.tournamentId),
          )
          .collect();

        const rank =
          allTeamsInTournament.filter((t) => t.points > team.points).length + 1;

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
      }),
    );

    return teamsComparison.filter((t) => t !== null);
  },
});
