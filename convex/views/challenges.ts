import { v } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import { type QueryCtx, query } from "../_generated/server";
import { canManageChallenge } from "../authority/core";
import { getCurrentUserOrThrow } from "../users";

type RosterMember = {
  userId: Id<"users">;
  name: string;
  email: string;
  imageUrl: string | undefined;
  teamId: Id<"teams"> | undefined;
  teamName: string | undefined;
  addedAt: string;
};

async function loadRoster(
  ctx: QueryCtx,
  challenge: Doc<"challenges">,
): Promise<RosterMember[]> {
  const entries = await ctx.db
    .query("challengeRosterEntries")
    .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
    .collect();

  const members = await Promise.all(
    entries.map(async (entry) => {
      const [user, memberships] = await Promise.all([
        ctx.db.get(entry.userId),
        ctx.db
          .query("teamMembers")
          .withIndex("by_user", (q) => q.eq("userId", entry.userId))
          .collect(),
      ]);
      if (!user) return null;
      const teams = await Promise.all(
        memberships.map((m) => ctx.db.get(m.teamId)),
      );
      const team = teams.find(
        (t) => t?.tournamentId === challenge.tournamentId,
      );
      return {
        userId: entry.userId,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        teamId: team?._id,
        teamName: team?.name,
        addedAt: entry.createdAt,
      };
    }),
  );

  return members
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt));
}

export const listByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await canManageChallenge.require(ctx, user._id, {
      tournamentId: args.tournamentId,
    });
    const rows = await ctx.db
      .query("challenges")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();
    const sorted = rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Promise.all(
      sorted.map(async (challenge) => ({
        ...challenge,
        roster: await loadRoster(ctx, challenge),
      })),
    );
  },
});

export const tournamentPlayers = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await canManageChallenge.require(ctx, user._id, {
      tournamentId: args.tournamentId,
    });
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();
    const rows = await Promise.all(
      teams.map(async (team) => {
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        const users = await Promise.all(
          members.map((m) => ctx.db.get(m.userId)),
        );
        return users
          .filter((u): u is NonNullable<typeof u> => u !== null)
          .map((u) => ({
            userId: u._id,
            name: u.name,
            email: u.email,
            imageUrl: u.imageUrl,
            teamId: team._id,
            teamName: team.name,
          }));
      }),
    );
    return rows.flat().sort((a, b) => a.name.localeCompare(b.name));
  },
});
