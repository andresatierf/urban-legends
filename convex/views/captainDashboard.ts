import { query } from "../_generated/server";
import { enrichWithRelations } from "../lib/helpers";
import { getCurrentUserOrThrow } from "../users";

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

    const allPending = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const incomingCount = allPending.filter(
      (jr) => teamIdsSet.has(jr.teamId) && jr.initiator === "user",
    ).length;

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

export const get = query({
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
