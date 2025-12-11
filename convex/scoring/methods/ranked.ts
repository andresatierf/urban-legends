/**
 * Ranked Scoring Method
 *
 * Awards points based on ranking compared to other submissions.
 * Useful for competitive scenarios like photo contests or leaderboards.
 *
 * Example: 1st place = 100pts, 2nd = 80pts, 3rd = 60pts, others = 10pts
 */

import type { ScoringContext, ScoringMethod, ScoringResult } from "../engine";

export const rankedScoring: ScoringMethod = {
  type: "ranked",

  async calculate(ctx, context: ScoringContext): Promise<ScoringResult> {
    const { submission, tournament, competitionType, allTeamSubmissions } =
      context;

    const config =
      tournament.scoringConfigOverride || competitionType.scoringConfig.config;

    if (!config.sortBy || !Array.isArray(config.positions)) {
      throw new Error(
        "Ranked scoring requires sortBy and positions configuration",
      );
    }

    // Get all approved submissions for the same date/tournament
    let samePeriodSubmissions: typeof allTeamSubmissions;

    if (allTeamSubmissions) {
      samePeriodSubmissions = allTeamSubmissions.filter(
        (s) =>
          s.date === submission.date &&
          s.state === "approved" &&
          s._id !== submission._id,
      );
    } else {
      samePeriodSubmissions = await ctx.db
        .query("submissions")
        .withIndex("by_tournament_and_date", (q) =>
          q
            .eq("tournamentId", submission.tournamentId)
            .eq("date", submission.date),
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("state"), "approved"),
            q.neq(q.field("_id"), submission._id),
          ),
        )
        .collect();
    }

    // Add current submission to the list
    const allSubmissions = [...samePeriodSubmissions, submission];

    // Sort by the specified metric
    const sortOrder = config.sortOrder || "desc";
    const sorted = allSubmissions.sort((a, b) => {
      const aVal = Number(a.data?.[config.sortBy]) || 0;
      const bVal = Number(b.data?.[config.sortBy]) || 0;
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });

    // Find rank (1-indexed)
    const rank = sorted.findIndex((s) => s._id === submission._id) + 1;

    // Lookup points for this rank
    let points = config.defaultPoints || 0;
    for (const position of config.positions) {
      if (position.rank === rank) {
        points = position.points;
        break;
      }
    }

    return {
      points,
      metadata: {
        method: "ranked",
        calculatedAt: new Date().toISOString(),
        breakdown: {
          rank,
          totalSubmissions: sorted.length,
          sortBy: config.sortBy,
          sortOrder,
          metric: Number(submission.data?.[config.sortBy]) || 0,
        },
      },
    };
  },

  // biome-ignore lint/suspicious/noExplicitAny: Config structure varies by scoring method
  validate(config: any): boolean {
    if (!config.sortBy || typeof config.sortBy !== "string") {
      return false;
    }

    if (!Array.isArray(config.positions) || config.positions.length === 0) {
      return false;
    }

    // Verify all positions have rank and points
    for (const position of config.positions) {
      if (
        typeof position.rank !== "number" ||
        typeof position.points !== "number"
      ) {
        return false;
      }
    }

    return typeof config.defaultPoints === "number";
  },
};
