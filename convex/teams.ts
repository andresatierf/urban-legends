import { getAuthUserId } from "@convex-dev/auth/server";
import type { GenericMutationCtx } from "convex/server";
import { v } from "convex/values";
import type { DataModel, Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

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
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);
    return await getTeams(ctx, args);
  },
});

export const listByUser = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await getTeams(ctx, { userId: user._id });
  },
});

type GetTeamsArgs = { userId?: Id<"users">; tournamentId?: Id<"tournaments"> };

export async function getTeams(
  ctx: QueryCtx,
  { userId, tournamentId }: GetTeamsArgs,
) {
  if (!userId && !tournamentId) return await ctx.db.query("teams").collect();

  const filter: { teamIds: Id<"teams">[]; tournamentId?: Id<"tournaments"> } = {
    teamIds: [],
  };

  if (userId) {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    filter.teamIds.push(...memberships.map((m) => m.teamId));
  }

  if (tournamentId) {
    filter.tournamentId = tournamentId;
  }

  const teams = await ctx.db
    .query("teams")
    .filter((q) =>
      q.and(
        q.or(...filter.teamIds.map((id) => q.eq(q.field("_id"), id as string))),
        // q.eq(q.field("tournamentId"), filter.tournamentId),
      ),
    )
    .collect();

  return teams;
}
