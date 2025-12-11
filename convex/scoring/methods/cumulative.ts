/**
 * Cumulative Scoring Method
 *
 * Sums multiple metrics with optional weighting.
 * Useful for competitions that track multiple dimensions.
 *
 * Example: (distance * 1.0) + (duration * 0.5) + (calories * 0.1)
 */

import type { ScoringContext, ScoringMethod, ScoringResult } from "../engine";

export const cumulativeScoring: ScoringMethod = {
  type: "cumulative",

  async calculate(_ctx, context: ScoringContext): Promise<ScoringResult> {
    const { submission, tournament, competitionType } = context;

    const config =
      tournament.scoringConfigOverride || competitionType.scoringConfig.config;

    if (!Array.isArray(config.metrics) || !Array.isArray(config.weights)) {
      throw new Error("Cumulative scoring requires metrics and weights arrays");
    }

    if (config.metrics.length !== config.weights.length) {
      throw new Error("Metrics and weights arrays must have the same length");
    }

    let totalPoints = 0;
    const breakdown: Record<string, number> = {};

    for (let i = 0; i < config.metrics.length; i++) {
      const metric = config.metrics[i];
      const weight = config.weights[i] || 1.0;
      const value = Number(submission.data?.[metric]) || 0;
      const contribution = value * weight;

      totalPoints += contribution;
      breakdown[metric] = contribution;
    }

    const roundedTotal = Math.round(totalPoints * 100) / 100; // Round to 2 decimals

    return {
      points: roundedTotal,
      metadata: {
        method: "cumulative",
        calculatedAt: new Date().toISOString(),
        breakdown,
      },
    };
  },

  // biome-ignore lint/suspicious/noExplicitAny: Config structure varies by scoring method
  validate(config: any): boolean {
    if (!Array.isArray(config.metrics) || config.metrics.length === 0) {
      return false;
    }

    if (!Array.isArray(config.weights) || config.weights.length === 0) {
      return false;
    }

    if (config.metrics.length !== config.weights.length) {
      return false;
    }

    // Verify all weights are numbers
    for (const weight of config.weights) {
      if (typeof weight !== "number") {
        return false;
      }
    }

    return true;
  },
};
