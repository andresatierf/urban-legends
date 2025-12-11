/**
 * Fixed Points Scoring Method
 *
 * Awards fixed points based on submission type and tier.
 * This is the default scoring method and maintains backward compatibility
 * with the existing daily activity tracking system.
 */

import type { ScoringContext, ScoringMethod, ScoringResult } from "../engine";

export const fixedPointsScoring: ScoringMethod = {
  type: "fixed",

  async calculate(ctx, context: ScoringContext): Promise<ScoringResult> {
    const { submission, tournament, competitionType } = context;

    // Get scoring config (use override if present, otherwise use competition type config)
    const config =
      tournament.scoringConfigOverride || competitionType.scoringConfig.config;

    // Check if this is a team exercise submission
    let isTeamExercise = false;
    if (submission.submissionGroupId) {
      const group = await ctx.db.get(submission.submissionGroupId);
      if (group) {
        isTeamExercise = group.isTeamExercise;
      }
    }

    // Calculate points based on tier and submission type
    const tier = submission.tier || submission.data?.tier || "base";
    let points: number;

    if (config.individualPoints && config.teamExercisePoints) {
      // Legacy format: separate individual and team exercise points
      points = isTeamExercise
        ? config.teamExercisePoints[tier]
        : config.individualPoints[tier];
    } else if (config.points) {
      // New format: flat points or tier-based
      points =
        typeof config.points === "number"
          ? config.points
          : config.points[tier] || 1;
    } else {
      // Fallback: 1 point
      points = 1;
    }

    return {
      points,
      metadata: {
        method: "fixed",
        calculatedAt: new Date().toISOString(),
        breakdown: {
          tier: String(tier),
          isTeamExercise,
          basePoints: points,
        },
      },
    };
  },

  // biome-ignore lint/suspicious/noExplicitAny: Config structure varies by scoring method
  validate(config: any): boolean {
    // Config must have either the legacy format or new format
    const hasLegacyFormat =
      config.individualPoints &&
      config.teamExercisePoints &&
      typeof config.teamExerciseThreshold === "number";

    const hasNewFormat =
      config.points !== undefined &&
      (typeof config.points === "number" ||
        (typeof config.points === "object" &&
          (config.points.base !== undefined ||
            config.points.advanced !== undefined)));

    return hasLegacyFormat || hasNewFormat;
  },
};
