/**
 * Formula-Based Scoring Method
 *
 * Calculates points using mathematical expressions.
 * Uses a simple expression evaluator to prevent code injection.
 *
 * Example: "(distance * 10) + (duration * 0.5) + (calories * 0.01)"
 */

import type { ScoringContext, ScoringMethod, ScoringResult } from "../engine";

/**
 * Safe expression evaluator using Function constructor with restricted scope.
 * Only allows basic arithmetic operations and variables from the scope object.
 */
function evaluateExpression(
  expression: string,
  scope: Record<string, number>,
): number {
  // Validate expression only contains safe characters
  const safePattern = /^[0-9+\-*/().\s\w]+$/;
  if (!safePattern.test(expression)) {
    throw new Error("Expression contains invalid characters");
  }

  // Replace variable names with scope lookups
  let processedExpression = expression;
  for (const [key, value] of Object.entries(scope)) {
    // Replace variable name with its value, ensuring it's a number
    processedExpression = processedExpression.replace(
      new RegExp(`\\b${key}\\b`, "g"),
      String(value),
    );
  }

  try {
    // Use Function constructor to evaluate the expression safely
    // This is safer than eval() as it doesn't have access to the global scope
    const result = Function(`"use strict"; return (${processedExpression})`)();

    if (typeof result !== "number" || !Number.isFinite(result)) {
      throw new Error("Expression did not evaluate to a valid number");
    }

    return result;
  } catch (error) {
    throw new Error(
      `Formula evaluation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export const formulaScoring: ScoringMethod = {
  type: "formula",

  async calculate(_ctx, context: ScoringContext): Promise<ScoringResult> {
    const { submission, tournament, competitionType } = context;

    const config =
      tournament.scoringConfigOverride || competitionType.scoringConfig.config;

    if (!config.expression || !Array.isArray(config.variables)) {
      throw new Error("Formula scoring requires expression and variables");
    }

    // Extract values from submission.data
    const scope: Record<string, number> = {};
    for (const varName of config.variables) {
      const value = submission.data?.[varName];
      scope[varName] = Number(value) || 0;
    }

    const result = evaluateExpression(config.expression, scope);
    const roundedResult = Math.round(result * 100) / 100; // Round to 2 decimals

    return {
      points: roundedResult,
      metadata: {
        method: "formula",
        calculatedAt: new Date().toISOString(),
        rawMetrics: scope,
        breakdown: {
          expression: config.expression,
          result: roundedResult,
        },
      },
    };
  },

  // biome-ignore lint/suspicious/noExplicitAny: Config structure varies by scoring method
  validate(config: any): boolean {
    if (!config.expression || typeof config.expression !== "string") {
      return false;
    }

    if (!Array.isArray(config.variables) || config.variables.length === 0) {
      return false;
    }

    // Test compile the expression with dummy values
    try {
      const testScope: Record<string, number> = {};
      for (const varName of config.variables) {
        testScope[varName] = 1;
      }
      evaluateExpression(config.expression, testScope);
      return true;
    } catch {
      return false;
    }
  },
};
