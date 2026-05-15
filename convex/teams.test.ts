import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const schemaForTest = Object.assign(Object.create(schema), {
  schemaValidation: false,
}) as typeof schema;

const scoringConfig = {
  individualPoints: { base: 1, advanced: 2 },
  teamExercisePoints: { base: 3, advanced: 4 },
  teamExerciseThreshold: 0.5,
};

describe("teams.getStatistics", () => {
  test("rank and totalTeams scoped to team's tournament only", async () => {
    const t = convexTest(schemaForTest);

    const { teamAId, teamBId, teamCId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "player@example.com",
        name: "Player One",
        externalId: "ext_player_1",
      });

      const tournament1 = await ctx.db.insert("tournaments", {
        name: "Tournament 1",
        description: "First",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig,
      });

      const tournament2 = await ctx.db.insert("tournaments", {
        name: "Tournament 2",
        description: "Second",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig,
      });

      const teamAId = await ctx.db.insert("teams", {
        name: "Team A",
        tournamentId: tournament1,
        createdBy: userId,
        joinPolicy: "open",
        points: 100,
      });

      const teamBId = await ctx.db.insert("teams", {
        name: "Team B",
        tournamentId: tournament1,
        createdBy: userId,
        joinPolicy: "open",
        points: 50,
      });

      const teamCId = await ctx.db.insert("teams", {
        name: "Team C",
        tournamentId: tournament2,
        createdBy: userId,
        joinPolicy: "open",
        points: 200,
      });

      await ctx.db.insert("teamMembers", {
        teamId: teamAId,
        userId,
        role: "captain",
      });

      return { teamAId, teamBId, teamCId };
    });

    const asUser = t.withIdentity({ subject: "ext_player_1" });

    const statsA = await asUser.query(api.teams.getStatistics, {
      teamId: teamAId,
    });
    expect(statsA).not.toBeNull();
    expect(statsA!.totalTeams).toBe(2);
    expect(statsA!.rank).toBe(1);

    const statsB = await asUser.query(api.teams.getStatistics, {
      teamId: teamBId,
    });
    expect(statsB).not.toBeNull();
    expect(statsB!.totalTeams).toBe(2);
    expect(statsB!.rank).toBe(2);

    const statsC = await asUser.query(api.teams.getStatistics, {
      teamId: teamCId,
    });
    expect(statsC).not.toBeNull();
    expect(statsC!.totalTeams).toBe(1);
    expect(statsC!.rank).toBe(1);
  });
});

describe("teams.listWithMembers", () => {
  // enrichWithRelations uses $or filters on _id which convex-test doesn't support
  test.skip("rank and totalTeams scoped to each team's tournament", async () => {
    const t = convexTest(schemaForTest);

    const { tournamentId, teamAId, teamBId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "player@example.com",
        name: "Player One",
        externalId: "ext_player_1",
      });

      const tournament1 = await ctx.db.insert("tournaments", {
        name: "Tournament 1",
        description: "First",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig,
      });

      const tournament2 = await ctx.db.insert("tournaments", {
        name: "Tournament 2",
        description: "Second",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig,
      });

      const teamAId = await ctx.db.insert("teams", {
        name: "Team A",
        tournamentId: tournament1,
        createdBy: userId,
        joinPolicy: "open",
        points: 100,
      });

      const teamBId = await ctx.db.insert("teams", {
        name: "Team B",
        tournamentId: tournament1,
        createdBy: userId,
        joinPolicy: "open",
        points: 50,
      });

      await ctx.db.insert("teams", {
        name: "Team C",
        tournamentId: tournament2,
        createdBy: userId,
        joinPolicy: "open",
        points: 200,
      });

      await ctx.db.insert("teamMembers", {
        teamId: teamAId,
        userId,
        role: "captain",
      });
      await ctx.db.insert("teamMembers", {
        teamId: teamBId,
        userId,
        role: "member",
      });

      return { tournamentId: tournament1, teamAId, teamBId };
    });

    const results = await t
      .withIdentity({ subject: "ext_player_1" })
      .query(api.teams.listWithMembers, { tournamentId });

    const resultA = results.find((r) => r._id === teamAId);
    const resultB = results.find((r) => r._id === teamBId);

    expect(results).toHaveLength(2);
    expect(resultA?.totalTeams).toBe(2);
    expect(resultA?.rank).toBe(1);

    expect(resultB?.totalTeams).toBe(2);
    expect(resultB?.rank).toBe(2);
  });
});
