/**
 * Scoring Method Registry
 *
 * Central registry for all available scoring methods.
 * Scoring methods are registered at initialization and can be looked up by type.
 */

import type { ScoringMethod } from "./engine";

const SCORING_METHODS = new Map<string, ScoringMethod>();

/**
 * Get a scoring method by its type
 * @throws Error if scoring method is not registered
 */
export function getScoringMethod(type: string): ScoringMethod {
  const method = SCORING_METHODS.get(type);
  if (!method) {
    throw new Error(`Unknown scoring method: ${type}`);
  }
  return method;
}

/**
 * Register a new scoring method
 */
export function registerScoringMethod(method: ScoringMethod): void {
  SCORING_METHODS.set(method.type, method);
}

/**
 * Get all registered scoring method types
 */
export function getAvailableScoringMethods(): string[] {
  return Array.from(SCORING_METHODS.keys());
}
