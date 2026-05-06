import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../../schema";
import { previewIsTeamExercise, score } from "../submissions";
import { assertSubmissionInvariant } from "./invariants";

// convex-test@0.0.1 accesses tableDefinition.documentType which was renamed to
// .validator in convex@1.25. Disabling schema validation is the minimal workaround.
const schemaForTest = Object.assign(Object.create(schema), {
  schemaValidation: false,
}) as typeof schema;

const scoringConfig = {
  individualPoints: { base: 1, advanced: 2 },
  teamExercisePoints: { base: 3, advanced: 4 },
  teamExerciseThreshold: 0.5,
};

describe("score", () => {
  test("returns individualPoints.base for base non-team-exercise", () => {
    expect(score(scoringConfig, "base", false)).toBe(1);
  });

  test("returns individualPoints.advanced for advanced non-team-exercise", () => {
    expect(score(scoringConfig, "advanced", false)).toBe(2);
  });

  test("returns teamExercisePoints.base for base team exercise", () => {
    expect(score(scoringConfig, "base", true)).toBe(3);
  });

  test("returns teamExercisePoints.advanced for advanced team exercise", () => {
    expect(score(scoringConfig, "advanced", true)).toBe(4);
  });
});

describe("previewIsTeamExercise", () => {
  test("returns true when participation exactly meets threshold", () => {
    expect(
      previewIsTeamExercise({
        participantCount: 5,
        totalTeamMembers: 10,
        threshold: 0.5,
      }),
    ).toBe(true);
  });

  test("returns true when participation exceeds threshold", () => {
    expect(
      previewIsTeamExercise({
        participantCount: 6,
        totalTeamMembers: 10,
        threshold: 0.5,
      }),
    ).toBe(true);
  });

  test("returns false when participation is below threshold", () => {
    expect(
      previewIsTeamExercise({
        participantCount: 4,
        totalTeamMembers: 10,
        threshold: 0.5,
      }),
    ).toBe(false);
  });

  test("returns false when team has zero members", () => {
    expect(
      previewIsTeamExercise({
        participantCount: 0,
        totalTeamMembers: 0,
        threshold: 0.5,
      }),
    ).toBe(false);
  });

  test("returns true for solo team where sole member participates", () => {
    expect(
      previewIsTeamExercise({
        participantCount: 1,
        totalTeamMembers: 1,
        threshold: 0.5,
      }),
    ).toBe(true);
  });
});

describe("invariant contract (smoke test)", () => {
  test("holds on freshly seeded tournament and team with no submissions", async () => {
    const t = convexTest(schemaForTest);

    const { teamId, tournamentId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "test@example.com",
        name: "Test User",
        externalId: "external_test",
      });

      const tournamentId = await ctx.db.insert("tournaments", {
        name: "Test Tournament",
        description: "Test",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig,
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Test Team",
        tournamentId,
        createdBy: userId,
        visibility: "public",
        points: 0,
      });

      return { teamId, tournamentId };
    });

    await t.run(async (ctx) => {
      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });
});
