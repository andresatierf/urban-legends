import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { enrichWithRelations, groupBy, toIdMap } from "./lib/helpers";
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

    const teams = await ctx.db
      .query("teams")
      .filter((q) =>
        q.or(...teamIds.map((id) => q.eq(q.field("_id"), id as string))),
      )
      .collect();
    const teamsMap = toIdMap(teams);

    const tournamentIds = teams.map((team) => team.tournamentId);

    const tournaments = await ctx.db
      .query("tournaments")
      .filter((q) =>
        q.or(...tournamentIds.map((id) => q.eq(q.field("_id"), id as string))),
      )
      .collect();
    const tournamentsMap = toIdMap(tournaments);

    const teamMembers = await ctx.db
      .query("teamMembers")
      .filter((q) =>
        q.or(
          ...Array.from(teamsMap.keys()).map((id) =>
            q.eq(q.field("teamId"), id as string),
          ),
        ),
      )
      .collect();
    const teamMembersMap = groupBy(teamMembers, (tm) => tm.teamId);

    const submissions = await ctx.db
      .query("submissions")
      .filter((q) =>
        q.or(
          ...Array.from(teamsMap.keys()).map((id) =>
            q.eq(q.field("teamId"), id as string),
          ),
        ),
      )
      .collect();
    const submissionsMap = groupBy(submissions, (s) => s.teamId);

    const teamsWithData = teams
      .map((team) => {
        const tournament = tournamentsMap.get(team.tournamentId);

        const members = teamMembersMap.get(team._id) || [];

        const submissions = submissionsMap.get(team._id) || [];

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
      })
      .filter((t) => t !== null);

    // Get pending join requests for captain's teams
    const teamIdsSet = new Set(teamIds);
    const allJoinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const relevantJoinRequests = allJoinRequests.filter((jr) =>
      teamIdsSet.has(jr.teamId),
    );

    // Enrich join requests with user and team data in parallel
    const enrichedJoinRequests: Array<
      Doc<"joinRequests"> & {
        user: Doc<"users"> | null;
        team: Doc<"teams"> | null;
      }
    > = await enrichWithRelations(ctx, relevantJoinRequests, {
      user: {
        table: "users",
        foreignKey: (jr) => jr.userId,
      },
      team: {
        table: "teams",
        foreignKey: (jr) => jr.teamId,
      },
    });

    // Get pending invitations sent by this captain
    const allPendingInvitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const relevantInvitations = allPendingInvitations.filter(
      (inv) => inv.invitedBy === user._id,
    );

    // Enrich invitations with invitedUser and team data in parallel
    const enrichedInvitations: Array<
      Doc<"teamInvitations"> & {
        invitedUser: Doc<"users"> | null;
        team: Doc<"teams"> | null;
      }
    > = await enrichWithRelations(ctx, relevantInvitations, {
      invitedUser: {
        table: "users",
        foreignKey: (inv) => inv.invitedUserId,
      },
      team: {
        table: "teams",
        foreignKey: (inv) => inv.teamId,
      },
    });

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

    const teams = await ctx.db
      .query("teams")
      .filter((q) => q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))))
      .collect();

    const tournamentIds = Array.from(new Set(teams.map((t) => t.tournamentId)));

    const tournaments = await ctx.db
      .query("tournaments")
      .filter((q) =>
        q.or(...tournamentIds.map((id) => q.eq(q.field("_id"), id))),
      )
      .collect();

    const tournamentMap = toIdMap(tournaments);

    const tournamentTeams = await ctx.db
      .query("teams")
      .filter((q) =>
        q.or(...tournamentIds.map((id) => q.eq(q.field("tournamentId"), id))),
      )
      .collect();
    const tournamentTeamsByTournamentIdMap = groupBy(
      tournamentTeams,
      (t) => t.tournamentId,
    );

    const members = await ctx.db
      .query("teamMembers")
      .filter((q) => q.or(...teamIds.map((id) => q.eq(q.field("teamId"), id))))
      .collect();

    const membersByTeamIdMap = groupBy(members, (m) => m.teamId);

    const submissions = await ctx.db
      .query("submissions")
      .filter((q) => q.or(...teamIds.map((id) => q.eq(q.field("teamId"), id))))
      .collect();

    const submissionsByTeamIdMap = groupBy(submissions, (s) => s.teamId);

    // Get detailed metrics for each team
    const teamsComparison = await Promise.all(
      teams.map(async (team) => {
        // Get tournament
        const tournament = tournamentMap.get(team.tournamentId);

        // Get members
        const members = membersByTeamIdMap.get(team._id) || [];

        // Get all submissions
        const submissions = submissionsByTeamIdMap.get(team._id) || [];

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
        const allTeamsInTournament =
          tournamentTeamsByTournamentIdMap.get(team.tournamentId) || [];

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
