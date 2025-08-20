import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const userRole = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (userRole?.role !== "admin") {
    throw new Error("Admin access required");
  }

  return userId;
}

export const listByCompetition = query({
  args: { competitionId: v.id("competitions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_competition", (q) => q.eq("competitionId", args.competitionId))
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
    competitionId: v.id("competitions"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);

    return await ctx.db.insert("teams", {
      name: args.name,
      competitionId: args.competitionId,
      createdBy: userId,
    });
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
        q.eq("teamId", args.teamId).eq("userId", user._id)
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
        q.eq("teamId", args.teamId).eq("userId", args.userId)
      )
      .first();

    if (member) {
      await ctx.db.delete(member._id);
    }
  },
});

export const getUserTeams = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const teams = [];
    for (const membership of memberships) {
      const team = await ctx.db.get(membership.teamId);
      if (team) {
        const competition = await ctx.db.get(team.competitionId);
        teams.push({
          ...team,
          competition,
          role: membership.role,
        });
      }
    }

    return teams;
  },
});
