import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../../schema";
import {
  approve,
  IllegalTransition,
  previewIsTeamExercise,
  score,
  submit,
} from "../submissions";
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

describe("submit", () => {
  async function seedWorld(
    ctx: Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0],
  ) {
    const userId = await ctx.db.insert("users", {
      email: "player@example.com",
      name: "Player One",
      externalId: "ext_player_1",
    });

    const tournamentId = await ctx.db.insert("tournaments", {
      name: "Lifecycle Tournament",
      description: "For lifecycle tests",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      createdBy: userId,
      scoringConfig,
    });

    const teamId = await ctx.db.insert("teams", {
      name: "Lifecycle Team",
      tournamentId,
      createdBy: userId,
      visibility: "public",
      points: 0,
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "captain",
    });

    return { userId, teamId, tournamentId };
  }

  test("individual submit creates a pending submission with zero points and no group", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      return await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-15",
        type: "individual",
      });
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub).not.toBeNull();
      expect(sub?.state).toBe("pending");
      expect(sub?.pointsEarned).toBe(0);
      expect(sub?.submissionType).toBe("individual");
      expect(sub?.submissionGroupId).toBeUndefined();
      expect(sub?.tier).toBe("base");
      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("team-type submit creates a pending submission and a new SubmissionGroup", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      return await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-15",
        type: "team",
      });
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.submissionType).toBe("team");
      expect(sub?.state).toBe("pending");
      expect(sub?.submissionGroupId).toBeDefined();

      const group = await ctx.db.get(sub?.submissionGroupId!);
      expect(group).not.toBeNull();
      expect(group?.state).toBe("pending");
      expect(group?.participantCount).toBe(1);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("second team member's team submit joins the existing SubmissionGroup", async () => {
    const t = convexTest(schemaForTest);

    const { userId: captainId, teamId, tournamentId } = await t.run(seedWorld);

    const memberId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", {
        email: "member@example.com",
        name: "Member",
        externalId: "ext_member",
      });
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: id,
        role: "member",
      });
      return id;
    });

    await t.run(async (ctx) => {
      await submit(ctx, {
        userId: captainId,
        teamId,
        date: "2024-01-15",
        type: "team",
      });
    });

    await t.run(async (ctx) => {
      await submit(ctx, {
        userId: memberId,
        teamId,
        date: "2024-01-15",
        type: "team",
      });
    });

    await t.run(async (ctx) => {
      const groups = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect();

      expect(groups).toHaveLength(1);
      expect(groups[0].participantCount).toBe(2);

      const subs = await ctx.db
        .query("submissions")
        .withIndex("by_group", (q) => q.eq("submissionGroupId", groups[0]._id))
        .collect();
      expect(subs).toHaveLength(2);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("throws when per-tournament daily submission limit is reached", async () => {
    const t = convexTest(schemaForTest);

    const { userId, teamId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "limited@example.com",
        name: "Limited User",
        externalId: "ext_limited",
      });
      const tournamentId = await ctx.db.insert("tournaments", {
        name: "Limited Tournament",
        description: "Has a daily cap",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig,
        maxSubmissionsPerDay: 1,
      });
      const teamId = await ctx.db.insert("teams", {
        name: "Limited Team",
        tournamentId,
        createdBy: userId,
        visibility: "public",
        points: 0,
      });
      await ctx.db.insert("teamMembers", { teamId, userId, role: "captain" });
      return { userId, teamId };
    });

    await t.run(async (ctx) => {
      await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-15",
        type: "individual",
      });
    });

    await expect(
      t.run(async (ctx) => {
        await submit(ctx, {
          userId,
          teamId,
          date: "2024-01-15",
          type: "individual",
        });
      }),
    ).rejects.toThrow("Daily submission limit reached");
  });

  test("throws when user already has a team-type submission for the same team-day", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId } = await t.run(seedWorld);

    await t.run(async (ctx) => {
      await submit(ctx, { userId, teamId, date: "2024-01-15", type: "team" });
    });

    await expect(
      t.run(async (ctx) => {
        await submit(ctx, { userId, teamId, date: "2024-01-15", type: "team" });
      }),
    ).rejects.toThrow(
      "You have already submitted for this team activity today",
    );
  });
});

describe("approve", () => {
  async function seedWorld(
    ctx: Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0],
  ) {
    const userId = await ctx.db.insert("users", {
      email: "player@example.com",
      name: "Player One",
      externalId: "ext_player_1",
    });

    const tournamentId = await ctx.db.insert("tournaments", {
      name: "Approve Tournament",
      description: "For approve tests",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      createdBy: userId,
      scoringConfig,
    });

    const teamId = await ctx.db.insert("teams", {
      name: "Approve Team",
      tournamentId,
      createdBy: userId,
      visibility: "public",
      points: 0,
    });

    await ctx.db.insert("teamMembers", { teamId, userId, role: "captain" });

    return { userId, teamId, tournamentId };
  }

  test("individual pending submission transitions to approved with correct pointsEarned and team.points", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      return await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-15",
        type: "individual",
      });
    });

    const result = await t.run(async (ctx) => {
      return await approve(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      expect(result.affected).toContain(submissionId);
      expect(result.pointsDelta).toBeGreaterThan(0);

      const sub = await ctx.db.get(submissionId);
      expect(sub?.state).toBe("approved");
      // base individual = 1
      expect(sub?.pointsEarned).toBe(scoringConfig.individualPoints.base);

      const team = await ctx.db.get(teamId);
      expect(team?.points).toBe(scoringConfig.individualPoints.base);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("team-type approve fans out to all non-terminal group siblings and updates group metrics", async () => {
    const t = convexTest(schemaForTest);
    const { userId: captainId, teamId, tournamentId } = await t.run(seedWorld);

    const memberId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", {
        email: "member@example.com",
        name: "Member",
        externalId: "ext_member",
      });
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: id,
        role: "member",
      });
      return id;
    });

    const [sub1Id, sub2Id] = await t.run(async (ctx) => {
      const s1 = await submit(ctx, {
        userId: captainId,
        teamId,
        date: "2024-01-15",
        type: "team",
      });
      const s2 = await submit(ctx, {
        userId: memberId,
        teamId,
        date: "2024-01-15",
        type: "team",
      });
      return [s1, s2];
    });

    const result = await t.run(async (ctx) => {
      return await approve(ctx, sub1Id, captainId);
    });

    await t.run(async (ctx) => {
      // Both affected
      expect(result.affected).toContain(sub1Id);
      expect(result.affected).toContain(sub2Id);

      // Both approved
      const s1 = await ctx.db.get(sub1Id);
      const s2 = await ctx.db.get(sub2Id);
      expect(s1?.state).toBe("approved");
      expect(s2?.state).toBe("approved");

      // 2 of 2 members = 100% >= 50% threshold → isTeamExercise = true
      // groupPoints = teamExercisePoints.base = 3
      // pointsPerSub = 3 / 2 = 1.5
      expect(s1?.pointsEarned).toBeCloseTo(1.5, 5);
      expect(s2?.pointsEarned).toBeCloseTo(1.5, 5);

      // Group approved with correct totals
      const group = s1?.submissionGroupId
        ? await ctx.db.get(s1.submissionGroupId)
        : null;
      expect(group?.state).toBe("approved");
      expect(group?.pointsEarned).toBe(scoringConfig.teamExercisePoints.base);
      expect(group?.participantCount).toBe(2);
      expect(group?.isTeamExercise).toBe(true);

      // Team points = 3 (sum of 1.5 + 1.5)
      const team = await ctx.db.get(teamId);
      expect(team?.points).toBeCloseTo(
        scoringConfig.teamExercisePoints.base,
        5,
      );

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("re-approving an already-approved submission is idempotent: returns pointsDelta 0 and no writes", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      return await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-15",
        type: "individual",
      });
    });

    await t.run(async (ctx) => {
      await approve(ctx, submissionId, userId);
    });

    const result = await t.run(async (ctx) => {
      return await approve(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      expect(result.pointsDelta).toBe(0);
      expect(result.affected).toHaveLength(0);
      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("approving a rejected submission throws IllegalTransition", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-01-15T00:00:00.000Z",
        submissionType: "individual",
        state: "rejected",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
      });
    });

    await expect(
      t.run(async (ctx) => {
        await approve(ctx, submissionId, userId);
      }),
    ).rejects.toThrow(IllegalTransition);
  });

  test("approving a deleted submission throws IllegalTransition", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-01-15T00:00:00.000Z",
        submissionType: "individual",
        state: "deleted",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
      });
    });

    await expect(
      t.run(async (ctx) => {
        await approve(ctx, submissionId, userId);
      }),
    ).rejects.toThrow(IllegalTransition);
  });
});
