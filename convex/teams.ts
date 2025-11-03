import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

export const list = query({
  args: {
    userId: v.optional(v.id("users")),
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!args.userId && !args.tournamentId)
      return await ctx.db.query("teams").collect();

    let query = ctx.db.query("teams");

    if (args.userId) {
      const memberships = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect();

      const teamIds = memberships.map((m) => m.teamId);

      query = query.filter((q) =>
        q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
      );
    }

    if (args.tournamentId) {
      query = query.filter((q) =>
        q.eq(q.field("tournamentId"), args.tournamentId),
      );
    }

    return await query.collect();
  },
});

export const listMembers = query({
  args: { teamIds: v.union(v.id("teams"), v.array(v.id("teams"))) },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!Array.isArray(args.teamIds)) {
      return await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) =>
          q.eq("teamId", args.teamIds as unknown as Id<"teams">),
        )
        .collect();
    }

    const teamMembersPerTeam = await Promise.all(
      args.teamIds.map((id) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", id))
          .collect(),
      ),
    );

    return teamMembersPerTeam.flat();
  },
});

export const get = query({
  args: {
    userId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
    teamName: v.optional(v.string()),
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!args.teamId && !args.teamName && !args.userId && !args.tournamentId)
      throw new Error(
        "Must provide either team id, team name and tournament id, or user and tournament ids",
      );

    if (
      (args.teamId && (args.teamName || args.userId || args.tournamentId)) ||
      (args.teamName && (args.userId || !args.tournamentId)) ||
      (args.userId && !args.tournamentId) ||
      (args.tournamentId && (!args.teamName || !args.userId))
    )
      throw new Error(
        "Must provide either team id, team name and tournament id, or user and tournament ids",
      );

    if (args.teamId) return await ctx.db.get(args.teamId);

    if (args.teamName && args.tournamentId)
      return await ctx.db
        .query("teams")
        .withIndex("by_tournament_and_name", (q) =>
          q.eq("tournamentId", args.tournamentId!).eq("name", args.teamName!),
        )
        .unique();

    if (args.userId && args.tournamentId) {
      const userTeams = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect();
      const teamIds = userTeams.map((m) => m.teamId);
      return await ctx.db
        .query("teams")
        .filter((q) =>
          q.and(
            q.eq(q.field("tournamentId"), args.tournamentId!),
            q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
          ),
        )
        .unique();
    }

    throw new Error("This should never happen");
  },
});

export const getUserTeamByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

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
          q.eq(q.field("userId"), user._id),
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
    const user = await getCurrentUserOrThrow(ctx);

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

    return users.filter((u) => !args.excludeSelf || u._id !== user._id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    tournamentId: v.id("tournaments"),
    members: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

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
      createdBy: user._id,
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
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    // Find user by email
    const userToAdd = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userEmail))
      .first();

    if (!userToAdd) {
      throw new Error("User not found");
    }

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", userToAdd._id),
      )
      .first();

    if (existingMember) {
      throw new Error("User is already a member of this team");
    }

    await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      userId: userToAdd._id,
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
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

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
