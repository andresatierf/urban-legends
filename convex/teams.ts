import { getAuthUserId } from "@convex-dev/auth/server";
import type { GenericMutationCtx } from "convex/server";
import { v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

async function requireAdmin(ctx: GenericMutationCtx<DataModel>) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const userRoles = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const roles = await Promise.all(
    userRoles.map(({ roleId }) => ctx.db.get(roleId)),
  );

  if (!roles.map((r) => r?.name).includes("admin")) {
    throw new Error("Admin access required");
  }

  return userId;
}

export const getById = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db.get(args.teamId);
  },
});

export const getUserTeamByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    const userTeam = await ctx.db
      .query("teamMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.or(...teams.map(({ _id }) => q.eq(q.field("teamId"), _id))),
        ),
      )
      .first();

    return teams.find(({ _id }) => userTeam?.teamId === _id);
  },
});

export const listTeamMembers = query({
  args: { teamId: v.id("teams"), excludeSelf: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          ...teamMembers.map((member) => q.eq(q.field("_id"), member.userId)),
        ),
      )
      .collect();
    const userIdMap = users.reduce((acc, user) => {
      if (!acc.get(user._id)) acc.set(user._id, user);
      return acc;
    }, new Map());

    return teamMembers
      .map((m) => ({
        ...m,
        email: userIdMap.get(m.userId)?.email,
      }))
      .filter((m) => !args.excludeSelf || m.userId !== userId);
  },
});

export const listByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    const teamsWithMembers = [];
    for (const team of teams) {
      const members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();

      const membersWithUsers = [];
      for (const member of members) {
        const user = await ctx.db.get(member.userId);
        if (user) {
          membersWithUsers.push({
            ...member,
            user,
          });
        }
      }

      teamsWithMembers.push({
        ...team,
        members: membersWithUsers,
      });
    }

    return teamsWithMembers;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    tournamentId: v.id("tournaments"),
    members: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);

    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_tournament_and_name", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("name", args.name),
      )
      .first();
    if (existingTeam) {
      throw new Error("Team name already exists");
    }

    const team = await ctx.db.insert("teams", {
      name: args.name,
      tournamentId: args.tournamentId,
      createdBy: userId,
    });

    // TODO: add members if provided

    return team;
  },
});

export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    userEmail: v.string(),
    role: v.union(v.literal("member"), v.literal("captain")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Find user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userEmail))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    if (existingMember) {
      throw new Error("User is already a member of this team");
    }

    await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      userId: user._id,
      role: args.role,
    });
  },
});

export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.userId),
      )
      .first();

    if (member) {
      await ctx.db.delete(member._id);
    }
  },
});

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const allTournaments = await ctx.db.query("tournaments").collect();
    const allTournamentMap = allTournaments.reduce((acc, t) => {
      if (!acc.get(t._id)) acc.set(t._id, t);
      return acc;
    }, new Map());

    const teamMembers = await ctx.db.query("teamMembers").collect();
    const teamMembersMapByTeamId = teamMembers.reduce<
      Record<string, typeof teamMembers>
    >((acc, tm) => {
      if (!acc[tm.teamId]) acc[tm.teamId] = [];
      acc[tm.teamId].push(tm);
      return acc;
    }, {});

    const teams = await ctx.db.query("teams").collect();

    return teams.map((team) => ({
      ...team,
      tournament: allTournamentMap.get(team.tournamentId),
      members: teamMembersMapByTeamId[team._id],
    }));
  },
});

export const listByUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const membershipMapByTeamId = memberships.reduce<
      Map<string, (typeof memberships)[number]>
    >((acc, m) => {
      if (!acc.get(m.teamId)) acc.set(m.teamId, m);
      return acc;
    }, new Map());

    const teamIds = memberships.map((m) => m.teamId);
    const teams = await ctx.db
      .query("teams")
      .filter((q) =>
        q.or(...teamIds.map((id) => q.eq(q.field("_id"), id as string))),
      )
      .collect();

    const tournamentIds = teams.map((t) => t.tournamentId);
    const tournaments = await ctx.db
      .query("tournaments")
      .filter((q) =>
        q.or(...tournamentIds.map((id) => q.eq(q.field("_id"), id as string))),
      )
      .collect();
    const tournamentMap = tournaments.reduce((acc, t) => {
      if (!acc.get(t._id)) acc.set(t._id, t);
      return acc;
    }, new Map());

    const members = await ctx.db
      .query("teamMembers")
      .filter((q) =>
        q.or(...teamIds.map((id) => q.eq(q.field("teamId"), id as string))),
      )
      .collect();
    const memberMapByTeamId = members.reduce<Record<string, typeof members>>(
      (acc, m) => {
        if (!acc[m.teamId]) acc[m.teamId] = [];
        acc[m.teamId].push(m);
        return acc;
      },
      {},
    );

    const memberIds = members.map((m) => m.userId);
    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(...memberIds.map((id) => q.eq(q.field("_id"), id as string))),
      )
      .collect();
    const userMap = users.reduce((acc, u) => {
      if (!acc.get(u._id)) acc.set(u._id, u);
      return acc;
    }, new Map());

    return teams.map((t) => ({
      ...t,
      tournament: tournamentMap.get(t.tournamentId),
      members: memberMapByTeamId[t._id].map((m) => ({
        ...m,
        email: userMap.get(m.userId)?.email,
      })),
      role: membershipMapByTeamId.get(t._id)?.role,
    }));
  },
});
