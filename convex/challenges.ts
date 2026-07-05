import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { canManageChallenge } from "./authority/core";
import { nowUTC } from "./lib/dates";
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

export const create = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    description: v.string(),
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

    const now = nowUTC();
    return await ctx.db.insert("challenges", {
      tournamentId: args.tournamentId,
      createdBy: user._id,
      description,
      individualAmount: args.individualAmount,
      teamAmount: args.teamAmount,
      threshold,
      state: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const edit = mutation({
  args: {
    challengeId: v.id("challenges"),
    description: v.optional(v.string()),
    individualAmount: v.optional(v.number()),
    teamAmount: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    await canManageChallenge.require(ctx, user._id, {
      tournamentId: challenge.tournamentId,
    });
    if (challenge.state !== "pending") {
      throw new Error("Only pending Challenges can be edited");
    }

    const patch: Partial<typeof challenge> = {};
    if (args.description !== undefined) {
      const description = args.description.trim();
      if (description.length === 0) {
        throw new Error("Description can't be empty");
      }
      patch.description = description;
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
