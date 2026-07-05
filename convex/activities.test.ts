import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const schemaForTest = Object.assign(Object.create(schema), {
  schemaValidation: false,
}) as typeof schema;

const scoringConfig = {
  individualPoints: { base: 1, advanced: 2 },
  teamExercisePoints: { base: 3, advanced: 4 },
  teamExerciseThreshold: 0.5,
};

type Ctx = Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0];

async function seedReviewerWorld(ctx: Ctx) {
  const playerId = await ctx.db.insert("users", {
    email: "player@test.com",
    name: "Player",
    externalId: "ext_player",
  });
  const reviewerId = await ctx.db.insert("users", {
    email: "reviewer@test.com",
    name: "Reviewer",
    externalId: "ext_reviewer",
  });

  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Reviewer Queue Tournament",
    description: "For reviewerQueue tests",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    createdBy: playerId,
    scoringConfig,
  });

  const teamId = await ctx.db.insert("teams", {
    name: "Queue Team",
    tournamentId,
    createdBy: playerId,
    joinPolicy: "open" as const,
    points: 0,
  });

  await ctx.db.insert("teamMembers", {
    teamId,
    userId: playerId,
    role: "captain" as const,
  });

  await ctx.db.insert("tournamentRoles", {
    userId: reviewerId,
    tournamentId,
    role: "reviewer" as const,
  });

  return { playerId, reviewerId, tournamentId, teamId };
}

async function insertActivity(
  ctx: Ctx,
  args: {
    tournamentId: Id<"tournaments">;
    teamId: Id<"teams">;
    userId: Id<"users">;
    state: "incomplete" | "pending" | "approved" | "rejected";
    date?: string;
  },
) {
  return ctx.db.insert("activities", {
    tournamentId: args.tournamentId,
    teamId: args.teamId,
    createdBy: args.userId,
    type: "individual",
    date: args.date ?? "2024-06-01",
    state: args.state,
    tier: "base",
    isTeamExercise: false,
    participationRate: args.state === "incomplete" ? 0 : 1,
    pointsEarned: 0,
  });
}

describe("activities.reviewerQueue", () => {
  test("defaults to pending only — incomplete Activities are hidden", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { playerId, tournamentId, teamId } = await seedReviewerWorld(ctx);
      await insertActivity(ctx, {
        tournamentId,
        teamId,
        userId: playerId,
        state: "pending",
      });
      await insertActivity(ctx, {
        tournamentId,
        teamId,
        userId: playerId,
        state: "incomplete",
      });
    });

    const results = await t
      .withIdentity({ subject: "ext_reviewer" })
      .query(api.activities.reviewerQueue, {});

    expect(results).toHaveLength(1);
    expect(results[0].state).toBe("pending");
  });

  test("includeIncomplete surfaces incomplete alongside pending", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { playerId, tournamentId, teamId } = await seedReviewerWorld(ctx);
      await insertActivity(ctx, {
        tournamentId,
        teamId,
        userId: playerId,
        state: "pending",
      });
      await insertActivity(ctx, {
        tournamentId,
        teamId,
        userId: playerId,
        state: "incomplete",
      });
      await insertActivity(ctx, {
        tournamentId,
        teamId,
        userId: playerId,
        state: "approved",
      });
      await insertActivity(ctx, {
        tournamentId,
        teamId,
        userId: playerId,
        state: "rejected",
      });
    });

    const results = await t
      .withIdentity({ subject: "ext_reviewer" })
      .query(api.activities.reviewerQueue, { includeIncomplete: true });

    const states = results.map((r) => r.state).toSorted();
    expect(states).toEqual(["incomplete", "pending"]);
  });

  test("includeIncomplete respects tournamentId scope", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { playerId, reviewerId, tournamentId, teamId } =
        await seedReviewerWorld(ctx);

      // A second tournament the reviewer also reviews.
      const otherTournamentId = await ctx.db.insert("tournaments", {
        name: "Other Tournament",
        description: "second",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: playerId,
        scoringConfig,
      });
      const otherTeamId = await ctx.db.insert("teams", {
        name: "Other Team",
        tournamentId: otherTournamentId,
        createdBy: playerId,
        joinPolicy: "open" as const,
        points: 0,
      });
      await ctx.db.insert("teamMembers", {
        teamId: otherTeamId,
        userId: playerId,
        role: "captain" as const,
      });
      await ctx.db.insert("tournamentRoles", {
        userId: reviewerId,
        tournamentId: otherTournamentId,
        role: "reviewer" as const,
      });

      await insertActivity(ctx, {
        tournamentId,
        teamId,
        userId: playerId,
        state: "incomplete",
      });
      await insertActivity(ctx, {
        tournamentId: otherTournamentId,
        teamId: otherTeamId,
        userId: playerId,
        state: "incomplete",
      });
    });

    // Pull the first tournament's id back out.
    const [firstTournament] = await t.run(async (ctx) =>
      ctx.db
        .query("tournaments")
        .filter((q) => q.eq(q.field("name"), "Reviewer Queue Tournament"))
        .collect(),
    );

    const results = await t
      .withIdentity({ subject: "ext_reviewer" })
      .query(api.activities.reviewerQueue, {
        tournamentId: firstTournament._id,
        includeIncomplete: true,
      });

    expect(results).toHaveLength(1);
    expect(results[0].tournamentId).toBe(firstTournament._id);
  });
});
