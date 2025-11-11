import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { getTeams } from "./teams";
import { getCurrentUserOrThrow } from "./users";

export const list = query({
  args: {
    userId: v.optional(v.id("users")),
    tournamentIds: v.optional(v.array(v.id("tournaments"))),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (args.tournamentIds)
      return await ctx.db
        .query("tournaments")
        .filter((q) =>
          q.or(
            ...args.tournamentIds!.map((tournamentId) =>
              q.eq(q.field("_id"), tournamentId),
            ),
          ),
        )
        .collect();

    let tournaments: Doc<"tournaments">[];
    if (args.userId) {
      const teams = await getTeams(ctx, { userId: args.userId });
      const tournamentIds = teams.map((team) => team.tournamentId);
      tournaments = await ctx.db
        .query("tournaments")
        .filter((q) =>
          q.or(...tournamentIds.map((id) => q.eq(q.field("_id"), id))),
        )
        .collect();
    } else {
      tournaments = await ctx.db.query("tournaments").collect();
    }

    const nowIso = new Date().toISOString();

    return tournaments.toSorted((a, b) => {
      const isActive = (x: typeof a) =>
        x.startDate <= nowIso && x.endDate >= nowIso;
      const isFuture = (x: typeof a) => x.startDate > nowIso;
      const isEnded = (x: typeof a) => x.endDate < nowIso;

      if (
        (isActive(a) && isActive(b)) ||
        (isFuture(a) && isFuture(b)) ||
        (isEnded(a) && isEnded(b))
      )
        return b.startDate.localeCompare(a.startDate);

      if (isActive(a)) return -1;
      if (isActive(b)) return 1;
      if (isFuture(a)) return -1;
      if (isFuture(b)) return 1;

      return 0;
    });
  },
});

export const get = query({
  args: {
    tournamentId: v.optional(v.id("tournaments")),
    tournamentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    if (!args.tournamentId && !args.tournamentName)
      throw new Error("Must provide either id or name");

    if (args.tournamentId && args.tournamentName)
      throw new Error("Must provide only id or name");

    if (args.tournamentName)
      return await ctx.db
        .query("tournaments")
        .withIndex("by_name", (q) => q.eq("name", args.tournamentName!))
        .unique();

    return await ctx.db.get(args.tournamentId!);
  },
});

export const upsert = mutation({
  args: {
    _id: v.optional(v.id("tournaments")),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    teamMinSize: v.number(),
    teamMaxSize: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    const data = {
      name: args.name,
      description: args.description || "",
      startDate: args.startDate,
      endDate: args.endDate,
      teamMinSize: args.teamMinSize,
      teamMaxSize: args.teamMaxSize,
    };

    if (args._id) {
      const tournament = await ctx.db.get(args._id);

      if (!tournament) throw new Error("Tournament not found");

      return await ctx.db.patch(args._id, data);
    }

    return await ctx.db.insert("tournaments", { ...data, createdBy: user._id });
  },
});

export const remove = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    await ctx.db.delete(args.tournamentId);
  },
});

// Get users not in any team for a given tournament
export const getAvailableUsersForTournament = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    // Get all teams in this tournament
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    // Get all team members in this tournament
    const teamMembers = await Promise.all(
      teams.map((team) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect(),
      ),
    );

    const allTeamMembers = teamMembers.flat();
    const userIdsInTeams = new Set(allTeamMembers.map((m) => m.userId));

    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    // Filter out users who are already in a team
    const availableUsers = allUsers.filter(
      (user) => !userIdsInTeams.has(user._id),
    );

    return availableUsers;
  },
});

type ValidateUserInTournamentTeamArgs = {
  userId: Id<"users">;
  tournamentId: Id<"tournaments">;
};

export async function validateUserNotInTournamentTeam(
  ctx: QueryCtx,
  args: ValidateUserInTournamentTeamArgs,
) {
  // Check if user already has a team in this tournament
  const userTeams = await ctx.db
    .query("teamMembers")
    .withIndex("by_user", (q) => q.eq("userId", args.userId))
    .collect();

  if (userTeams.length === 0) {
    return;
  }

  const teamIds = userTeams.map((m) => m.teamId);

  const existingTeamInTournament = await ctx.db
    .query("teams")
    .filter((q) =>
      q.and(
        q.eq(q.field("tournamentId"), args.tournamentId),
        q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))),
      ),
    )
    .first();

  if (existingTeamInTournament) {
    throw new Error("You already have a team in this tournament");
  }
}
