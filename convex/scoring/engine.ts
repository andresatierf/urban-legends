/**
 * Scoring Engine Interface
 *
 * This module defines the core interfaces for the pluggable scoring system.
 * Each competition type can use different scoring methods to calculate points.
 */

import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Context provided to scoring methods for calculating points
 */
export interface ScoringContext {
  submission: Doc<"submissions">;
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  competitionType: Doc<"competitionTypes">;
  teamMembers: Doc<"teamMembers">[];
  allTeamSubmissions?: Doc<"submissions">[]; // For relative/ranked scoring
}

/**
 * Result returned by scoring method calculations
 */
export interface ScoringResult {
  points: number;
  metadata: {
    method: string;
    calculatedAt: string;
    breakdown?: Record<string, number | string | boolean>; // For debugging/transparency
    rawMetrics?: Record<string, number>;
  };
}

/**
 * Interface that all scoring methods must implement
 */
export interface ScoringMethod {
  type: string;
  calculate(
    ctx: QueryCtx | MutationCtx,
    context: ScoringContext,
  ): Promise<ScoringResult>;
  // biome-ignore lint/suspicious/noExplicitAny: Config structure varies by scoring method
  validate(config: any): boolean;
}
