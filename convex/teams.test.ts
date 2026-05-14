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

async function makeUser(ctx: Ctx, externalId: string) {
  return ctx.db.insert("users", {
    email: `${externalId}@test.com`,
    name: externalId,
    externalId,
  });
}

async function makeTeam(
  ctx: Ctx,
  tournamentId: Id<"tournaments">,
  creatorId: Id<"users">,
  name = "Team A",
) {
  return ctx.db.insert("teams", {
    name,
    tournamentId,
    createdBy: creatorId,
    joinPolicy: "open",
    points: 0,
  });
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split("T")[0];
}

async function addSubmission(
  ctx: Ctx,
  opts: {
    userId: Id<"users">;
    teamId: Id<"teams">;
    tournamentId: Id<"tournaments">;
    date: string;
    state: "pending" | "approved" | "rejected" | "deleted";
  },
) {
  return ctx.db.insert("submissions", {
    userId: opts.userId,
    teamId: opts.teamId,
    tournamentId: opts.tournamentId,
    date: opts.date,
    submissionType: "individual",
    state: opts.state,
    createdBy: opts.userId,
    tier: "base",
    pointsEarned: opts.state === "approved" ? 1 : 0,
  });
}

describe("teams.getCardSummaries", () => {
  test("returns empty object for empty teamIds array", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      await makeUser(ctx, "viewer");
    });

    const result = await t
      .withIdentity({ subject: "viewer" })
      .query(api.teams.getCardSummaries, { teamIds: [] });

    expect(result).toEqual({});
  });

  test("returns 7 days with zero counts for a team with no submissions", async () => {
    const t = convexTest(schemaForTest);
    const { teamId } = await t.run(async (ctx) => {
      const userId = await makeUser(ctx, "player");
      const tournamentId = await ctx.db.insert("tournaments", {
        name: "T1",
        description: "Test",
        startDate: "2020-01-01",
        endDate: "2099-12-31",
        createdBy: userId,
        scoringConfig,
      });
      const teamId = await makeTeam(ctx, tournamentId, userId);
      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "captain",
      });
      return { teamId };
    });

    const result = await t
      .withIdentity({ subject: "player" })
      .query(api.teams.getCardSummaries, { teamIds: [teamId] });

    expect(result[teamId]).toBeDefined();
    expect(result[teamId].approved).toBe(0);
    expect(result[teamId].pending).toBe(0);
    expect(result[teamId].days).toHaveLength(7);
    for (const day of result[teamId].days) {
      expect(day.approved).toBe(0);
      expect(day.pending).toBe(0);
    }
  });

  test("counts approved and pending submissions in the last 7 days", async () => {
    const t = convexTest(schemaForTest);
    const { teamId } = await t.run(async (ctx) => {
      const userId = await makeUser(ctx, "player");
      const tournamentId = await ctx.db.insert("tournaments", {
        name: "T1",
        description: "Test",
        startDate: "2020-01-01",
        endDate: "2099-12-31",
        createdBy: userId,
        scoringConfig,
      });
      const teamId = await makeTeam(ctx, tournamentId, userId);
      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "captain",
      });

      await addSubmission(ctx, {
        userId,
        teamId,
        tournamentId,
        date: daysAgo(0),
        state: "approved",
      });
      await addSubmission(ctx, {
        userId,
        teamId,
        tournamentId,
        date: daysAgo(0),
        state: "pending",
      });
      await addSubmission(ctx, {
        userId,
        teamId,
        tournamentId,
        date: daysAgo(3),
        state: "approved",
      });

      return { teamId };
    });

    const result = await t
      .withIdentity({ subject: "player" })
      .query(api.teams.getCardSummaries, { teamIds: [teamId] });

    expect(result[teamId].approved).toBe(2);
    expect(result[teamId].pending).toBe(1);
  });

  test("excludes deleted and rejected submissions from counts", async () => {
    const t = convexTest(schemaForTest);
    const { teamId } = await t.run(async (ctx) => {
      const userId = await makeUser(ctx, "player");
      const tournamentId = await ctx.db.insert("tournaments", {
        name: "T1",
        description: "Test",
        startDate: "2020-01-01",
        endDate: "2099-12-31",
        createdBy: userId,
        scoringConfig,
      });
      const teamId = await makeTeam(ctx, tournamentId, userId);
      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "captain",
      });

      await addSubmission(ctx, {
        userId,
        teamId,
        tournamentId,
        date: daysAgo(1),
        state: "deleted",
      });
      await addSubmission(ctx, {
        userId,
        teamId,
        tournamentId,
        date: daysAgo(1),
        state: "rejected",
      });
      await addSubmission(ctx, {
        userId,
        teamId,
        tournamentId,
        date: daysAgo(1),
        state: "approved",
      });

      return { teamId };
    });

    const result = await t
      .withIdentity({ subject: "player" })
      .query(api.teams.getCardSummaries, { teamIds: [teamId] });

    expect(result[teamId].approved).toBe(1);
    expect(result[teamId].pending).toBe(0);
  });

  test("excludes submissions older than 7 days", async () => {
    const t = convexTest(schemaForTest);
    const { teamId } = await t.run(async (ctx) => {
      const userId = await makeUser(ctx, "player");
      const tournamentId = await ctx.db.insert("tournaments", {
        name: "T1",
        description: "Test",
        startDate: "2020-01-01",
        endDate: "2099-12-31",
        createdBy: userId,
        scoringConfig,
      });
      const teamId = await makeTeam(ctx, tournamentId, userId);
      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "captain",
      });

      await addSubmission(ctx, {
        userId,
        teamId,
        tournamentId,
        date: daysAgo(10),
        state: "approved",
      });

      return { teamId };
    });

    const result = await t
      .withIdentity({ subject: "player" })
      .query(api.teams.getCardSummaries, { teamIds: [teamId] });

    expect(result[teamId].approved).toBe(0);
    expect(result[teamId].pending).toBe(0);
  });

  test("returns summaries for multiple teams", async () => {
    const t = convexTest(schemaForTest);
    const { teamAId, teamBId } = await t.run(async (ctx) => {
      const userId = await makeUser(ctx, "player");
      const tournamentId = await ctx.db.insert("tournaments", {
        name: "T1",
        description: "Test",
        startDate: "2020-01-01",
        endDate: "2099-12-31",
        createdBy: userId,
        scoringConfig,
      });
      const teamAId = await makeTeam(ctx, tournamentId, userId, "Team A");
      const teamBId = await makeTeam(ctx, tournamentId, userId, "Team B");
      await ctx.db.insert("teamMembers", {
        teamId: teamAId,
        userId,
        role: "captain",
      });
      await ctx.db.insert("teamMembers", {
        teamId: teamBId,
        userId,
        role: "captain",
      });

      await addSubmission(ctx, {
        userId,
        teamId: teamAId,
        tournamentId,
        date: daysAgo(0),
        state: "approved",
      });
      await addSubmission(ctx, {
        userId,
        teamId: teamBId,
        tournamentId,
        date: daysAgo(1),
        state: "pending",
      });

      return { teamAId, teamBId };
    });

    const result = await t
      .withIdentity({ subject: "player" })
      .query(api.teams.getCardSummaries, { teamIds: [teamAId, teamBId] });

    expect(result[teamAId].approved).toBe(1);
    expect(result[teamAId].pending).toBe(0);
    expect(result[teamBId].approved).toBe(0);
    expect(result[teamBId].pending).toBe(1);
  });
});
