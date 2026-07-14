import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation } from "./_generated/server";
import { canManageChallenge } from "./authority/core";
import { extractDateFromISO, nowUTC, toUTCDateString } from "./lib/dates";
import { updateTeamPoints } from "./lifecycle/activities";
import { getCurrentUserOrThrow } from "./users";

const DEFAULT_THRESHOLD = 1;

function validateAmount(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }
}

function validateThreshold(value: number): void {
  if (!Number.isFinite(value) || value <= 0 || value > 1) {
    throw new Error("Threshold must be in (0, 1]");
  }
}

async function normalizeChallengeDate(
  ctx: MutationCtx,
  tournamentId: Id<"tournaments">,
  date: string,
): Promise<string> {
  const trimmed = date.trim();
  if (trimmed.length === 0) {
    throw new Error("Date is required");
  }
  let normalized: string;
  try {
    normalized = toUTCDateString(trimmed);
  } catch {
    throw new Error("Date is invalid");
  }
  const tournament = await ctx.db.get(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  const dateOnly = extractDateFromISO(normalized);
  const startOnly = extractDateFromISO(tournament.startDate);
  const endOnly = extractDateFromISO(tournament.endDate);
  if (dateOnly < startOnly || dateOnly > endOnly) {
    throw new Error("Date must be within the tournament window");
  }
  return normalized;
}

export const create = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    description: v.string(),
    date: v.string(),
    individualAmount: v.number(),
    teamAmount: v.number(),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await canManageChallenge.require(ctx, user._id, {
      tournamentId: args.tournamentId,
    });

    const description = args.description.trim();
    if (description.length === 0) {
      throw new Error("Description can't be empty");
    }
    validateAmount(args.individualAmount, "Individual amount");
    validateAmount(args.teamAmount, "Team amount");
    const threshold = args.threshold ?? DEFAULT_THRESHOLD;
    validateThreshold(threshold);
    const date = await normalizeChallengeDate(
      ctx,
      args.tournamentId,
      args.date,
    );

    const now = nowUTC();
    return await ctx.db.insert("challenges", {
      tournamentId: args.tournamentId,
      createdBy: user._id,
      description,
      date,
      individualAmount: args.individualAmount,
      teamAmount: args.teamAmount,
      threshold,
      state: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

async function requirePendingChallenge(
  ctx: MutationCtx,
  challengeId: Id<"challenges">,
) {
  const user = await getCurrentUserOrThrow(ctx);
  const challenge = await ctx.db.get(challengeId);
  if (!challenge) throw new Error("Challenge not found");
  await canManageChallenge.require(ctx, user._id, {
    tournamentId: challenge.tournamentId,
  });
  if (challenge.state !== "pending") {
    throw new Error("Only pending Challenges can be modified");
  }
  return { user, challenge };
}

export const addToRoster = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user, challenge } = await requirePendingChallenge(
      ctx,
      args.challengeId,
    );

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const teamsInTournament = await Promise.all(
      membership.map((m) => ctx.db.get(m.teamId)),
    );
    const isInTournament = teamsInTournament.some(
      (t) => t?.tournamentId === challenge.tournamentId,
    );
    if (!isInTournament) {
      throw new Error("User is not a Player of this Tournament");
    }

    const existing = await ctx.db
      .query("challengeRosterEntries")
      .withIndex("by_challenge_and_user", (q) =>
        q.eq("challengeId", args.challengeId).eq("userId", args.userId),
      )
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("challengeRosterEntries", {
      challengeId: args.challengeId,
      userId: args.userId,
      tournamentId: challenge.tournamentId,
      addedBy: user._id,
      createdAt: nowUTC(),
    });
  },
});

export const removeFromRoster = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requirePendingChallenge(ctx, args.challengeId);

    const existing = await ctx.db
      .query("challengeRosterEntries")
      .withIndex("by_challenge_and_user", (q) =>
        q.eq("challengeId", args.challengeId).eq("userId", args.userId),
      )
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const edit = mutation({
  args: {
    challengeId: v.id("challenges"),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    individualAmount: v.optional(v.number()),
    teamAmount: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { challenge } = await requirePendingChallenge(ctx, args.challengeId);

    const patch: Partial<typeof challenge> = {};
    if (args.description !== undefined) {
      const description = args.description.trim();
      if (description.length === 0) {
        throw new Error("Description can't be empty");
      }
      patch.description = description;
    }
    if (args.date !== undefined) {
      patch.date = await normalizeChallengeDate(
        ctx,
        challenge.tournamentId,
        args.date,
      );
    }
    if (args.individualAmount !== undefined) {
      validateAmount(args.individualAmount, "Individual amount");
      patch.individualAmount = args.individualAmount;
    }
    if (args.teamAmount !== undefined) {
      validateAmount(args.teamAmount, "Team amount");
      patch.teamAmount = args.teamAmount;
    }
    if (args.threshold !== undefined) {
      validateThreshold(args.threshold);
      patch.threshold = args.threshold;
    }
    patch.updatedAt = nowUTC();
    await ctx.db.patch(args.challengeId, patch);
    return args.challengeId;
  },
});

export const remove = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    await canManageChallenge.require(ctx, user._id, {
      tournamentId: challenge.tournamentId,
    });

    const roster = await ctx.db
      .query("challengeRosterEntries")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    for (const entry of roster) {
      await ctx.db.delete(entry._id);
    }

    const wasApproved = challenge.state === "approved";
    await ctx.db.delete(args.challengeId);

    if (wasApproved) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) =>
          q.eq("tournamentId", challenge.tournamentId),
        )
        .collect();
      // Snapshot isolation: the deleted challenge is still visible to reads
      // within this transaction, so exclude it explicitly when recomputing.
      for (const team of teams) {
        await updateTeamPoints(ctx, team._id, {
          excludeChallengeId: args.challengeId,
        });
      }
    }
  },
});

export const approve = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const { challenge } = await requirePendingChallenge(ctx, args.challengeId);

    await ctx.db.patch(args.challengeId, {
      state: "approved",
      updatedAt: nowUTC(),
    });

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", challenge.tournamentId),
      )
      .collect();
    for (const team of teams) {
      await updateTeamPoints(ctx, team._id);
    }
    return args.challengeId;
  },
});
