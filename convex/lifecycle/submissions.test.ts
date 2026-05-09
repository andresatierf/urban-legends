import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { assertSubmissionInvariant } from "./invariants.test";
import {
  IllegalTransition,
  approve,
  edit,
  previewIsTeamExercise,
  recompute,
  reject,
  score,
  softDelete,
  submit,
} from "./submissions";

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
        joinPolicy: "open",
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
      joinPolicy: "open",
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

      const group = await ctx.db.get(sub!.submissionGroupId!);
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
        joinPolicy: "open",
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

  test("rejects when evidenceStorageIds is an empty array", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId } = await t.run(seedWorld);

    await expect(
      t.run(async (ctx) => {
        await submit(ctx, {
          userId,
          teamId,
          date: "2024-01-20",
          type: "individual",
          evidenceStorageIds: [],
        });
      }),
    ).rejects.toThrow("at least 1 Evidence image");
  });

  test("rejects when evidenceStorageIds has more than 5 items", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId } = await t.run(seedWorld);

    const sixIds = Array.from(
      { length: 6 },
      (_, i) => `fake_over5_${i}` as unknown as Id<"_storage">,
    );

    // Pre-insert all 6 pendingUploads rows so the length check fires (not a claim error)
    await t.run(async (ctx) => {
      for (const storageId of sixIds) {
        await ctx.db.insert("pendingUploads", {
          storageId,
          userId,
          createdAt: new Date().toISOString(),
        });
      }
    });

    await expect(
      t.run(async (ctx) => {
        await submit(ctx, {
          userId,
          teamId,
          date: "2024-01-20",
          type: "individual",
          evidenceStorageIds: sixIds,
        });
      }),
    ).rejects.toThrow("maximum 5 Evidence images");
  });

  test("submit with evidenceStorageIds stores the IDs and claims the pending row", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    // schemaValidation is disabled — use a fake storage ID cast to the expected type
    const storageId = "fake_storage_evidence_1" as unknown as Id<"_storage">;

    // Pre-insert a pendingUploads row so claimUploads can find and delete it
    await t.run(async (ctx) => {
      await ctx.db.insert("pendingUploads", {
        storageId,
        userId,
        createdAt: new Date().toISOString(),
      });
    });

    const submissionId = await t.run(async (ctx) => {
      return submit(ctx, {
        userId,
        teamId,
        date: "2024-01-20",
        type: "individual",
        evidenceStorageIds: [storageId],
      });
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.evidenceStorageIds).toEqual([storageId]);

      // pendingUploads row was claimed (deleted)
      const pending = await ctx.db.query("pendingUploads").collect();
      expect(pending).toHaveLength(0);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
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
      joinPolicy: "open",
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

describe("reject", () => {
  async function seedWorld(
    ctx: Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0],
  ) {
    const userId = await ctx.db.insert("users", {
      email: "player@example.com",
      name: "Player One",
      externalId: "ext_player_1",
    });

    const tournamentId = await ctx.db.insert("tournaments", {
      name: "Reject Tournament",
      description: "For reject tests",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      createdBy: userId,
      scoringConfig,
    });

    const teamId = await ctx.db.insert("teams", {
      name: "Reject Team",
      tournamentId,
      createdBy: userId,
      joinPolicy: "open",
      points: 0,
    });

    await ctx.db.insert("teamMembers", { teamId, userId, role: "captain" });

    return { userId, teamId, tournamentId };
  }

  test("individual pending submission is rejected: state=rejected, pointsEarned=0, pointsDelta=0", async () => {
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
      return await reject(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      expect(result.pointsDelta).toBe(0);

      const sub = await ctx.db.get(submissionId);
      expect(sub?.state).toBe("rejected");
      expect(sub?.pointsEarned).toBe(0);

      const team = await ctx.db.get(teamId);
      expect(team?.points).toBe(0);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("team-type reject fans out to all non-terminal siblings: group state=rejected, pointsEarned=0", async () => {
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
      return await reject(ctx, sub1Id, captainId);
    });

    await t.run(async (ctx) => {
      expect(result.pointsDelta).toBe(0);

      const s1 = await ctx.db.get(sub1Id);
      const s2 = await ctx.db.get(sub2Id);
      expect(s1?.state).toBe("rejected");
      expect(s2?.state).toBe("rejected");
      expect(s1?.pointsEarned).toBe(0);
      expect(s2?.pointsEarned).toBe(0);

      const group = s1?.submissionGroupId
        ? await ctx.db.get(s1.submissionGroupId)
        : null;
      expect(group?.state).toBe("rejected");
      expect(group?.pointsEarned).toBe(0);

      const team = await ctx.db.get(teamId);
      expect(team?.points).toBe(0);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("rejecting an already-rejected submission is idempotent: returns pointsDelta: 0, no writes", async () => {
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
      await reject(ctx, submissionId, userId);
    });

    const result = await t.run(async (ctx) => {
      return await reject(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      expect(result.pointsDelta).toBe(0);
      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("rejecting a deleted submission throws IllegalTransition", async () => {
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
        await reject(ctx, submissionId, userId);
      }),
    ).rejects.toThrow(IllegalTransition);
  });

  test("previously approved individual submission can be rejected: removes points from team.points", async () => {
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
      return await reject(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      expect(result.pointsDelta).toBeLessThan(0);

      const sub = await ctx.db.get(submissionId);
      expect(sub?.state).toBe("rejected");
      expect(sub?.pointsEarned).toBe(0);

      const team = await ctx.db.get(teamId);
      expect(team?.points).toBe(0);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });
});

describe("softDelete", () => {
  async function seedWorld(
    ctx: Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0],
  ) {
    const userId = await ctx.db.insert("users", {
      email: "player@example.com",
      name: "Player One",
      externalId: "ext_player_1",
    });

    const tournamentId = await ctx.db.insert("tournaments", {
      name: "SoftDelete Tournament",
      description: "For softDelete tests",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      createdBy: userId,
      scoringConfig,
    });

    const teamId = await ctx.db.insert("teams", {
      name: "SoftDelete Team",
      tournamentId,
      createdBy: userId,
      joinPolicy: "open",
      points: 0,
    });

    await ctx.db.insert("teamMembers", { teamId, userId, role: "captain" });

    return { userId, teamId, tournamentId };
  }

  test("pending individual softDelete: state→deleted, pointsEarned=0, pointsDelta=0", async () => {
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
      return await softDelete(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      expect(result.pointsDelta).toBe(0);

      const sub = await ctx.db.get(submissionId);
      expect(sub?.state).toBe("deleted");
      expect(sub?.pointsEarned).toBe(0);

      const team = await ctx.db.get(teamId);
      expect(team?.points).toBe(0);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("approved individual softDelete: removes points from team.points, pointsDelta < 0", async () => {
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
      return await softDelete(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      expect(result.pointsDelta).toBeLessThan(0);

      const sub = await ctx.db.get(submissionId);
      expect(sub?.state).toBe("deleted");
      expect(sub?.pointsEarned).toBe(0);

      const team = await ctx.db.get(teamId);
      expect(team?.points).toBe(0);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("team-type softDelete with surviving sibling: group survives with participantCount=1", async () => {
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

    await t.run(async (ctx) => {
      await softDelete(ctx, sub1Id, captainId);
    });

    await t.run(async (ctx) => {
      const s1 = await ctx.db.get(sub1Id);
      const s2 = await ctx.db.get(sub2Id);

      expect(s1?.state).toBe("deleted");
      expect(s2?.state).toBe("pending");

      const groups = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect();

      expect(groups).toHaveLength(1);
      expect(groups[0].participantCount).toBe(1);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("team-type softDelete leaving empty group: group is deleted", async () => {
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
      await softDelete(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.state).toBe("deleted");

      const groups = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect();

      expect(groups).toHaveLength(0);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("idempotence: softDelete already-deleted submission returns pointsDelta: 0 with no error", async () => {
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
      await softDelete(ctx, submissionId, userId);
    });

    const result = await t.run(async (ctx) => {
      return await softDelete(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      expect(result.pointsDelta).toBe(0);
      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("softDelete a rejected submission throws IllegalTransition", async () => {
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
        await softDelete(ctx, submissionId, userId);
      }),
    ).rejects.toThrow(IllegalTransition);
  });

  test("soft-delete with evidence: propagates storage error (confirms releaseUploads is called)", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    // convex-test@0.0.1 throws when ctx.storage.delete is called with a fake ID.
    // The error propagating confirms that releaseUploads is invoked by softDelete.
    const storageId = "fake_storage_softdelete_55" as unknown as Id<"_storage">;

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-01-26",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
        evidenceStorageIds: [storageId],
      });
    });

    await expect(
      t.run(async (ctx) => {
        await softDelete(ctx, submissionId, userId);
      }),
    ).rejects.toThrow();
  });

  test("reject preserves evidenceStorageIds unchanged", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const storageId = "fake_storage_reject_55" as unknown as Id<"_storage">;

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-01-27",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
        evidenceStorageIds: [storageId],
      });
    });

    await t.run(async (ctx) => {
      await reject(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.state).toBe("rejected");
      // reject must not touch evidenceStorageIds — audit trail preserved for appeals
      expect(sub?.evidenceStorageIds).toEqual([storageId]);
    });
  });

  test("idempotent soft-delete: second call on already-deleted submission is noop on evidence", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      return await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-28",
        type: "individual",
      });
    });

    // First soft-delete: no evidence, so releaseUploads is a no-op and the call succeeds
    await t.run(async (ctx) => {
      await softDelete(ctx, submissionId, userId);
    });

    // Second soft-delete: returns early before calling releaseUploads
    const result = await t.run(async (ctx) => {
      return await softDelete(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      expect(result.pointsDelta).toBe(0);
      const sub = await ctx.db.get(submissionId);
      expect(sub?.state).toBe("deleted");
      expect(sub?.evidenceStorageIds).toEqual([]);
      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("soft-delete with no evidence: evidenceStorageIds is set to []", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    // Insert without evidenceStorageIds so the field starts as undefined
    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-01-25",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
      });
    });

    await t.run(async (ctx) => {
      await softDelete(ctx, submissionId, userId);
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.state).toBe("deleted");
      expect(sub?.evidenceStorageIds).toEqual([]);
    });
  });
});

describe("edit", () => {
  async function seedWorld(
    ctx: Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0],
  ) {
    const userId = await ctx.db.insert("users", {
      email: "player@example.com",
      name: "Player One",
      externalId: "ext_player_1",
    });

    const tournamentId = await ctx.db.insert("tournaments", {
      name: "Edit Tournament",
      description: "For edit tests",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      createdBy: userId,
      scoringConfig,
    });

    const teamId = await ctx.db.insert("teams", {
      name: "Edit Team",
      tournamentId,
      createdBy: userId,
      joinPolicy: "open",
      points: 0,
    });

    await ctx.db.insert("teamMembers", { teamId, userId, role: "captain" });

    return { userId, teamId, tournamentId };
  }

  test("description-only edit: description updated, state stays pending, group unchanged", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      return await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-15",
        type: "team",
        description: "original",
      });
    });

    await t.run(async (ctx) => {
      await edit(ctx, submissionId, { description: "updated" }, userId);
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.description).toBe("updated");
      expect(sub?.state).toBe("pending");
      expect(sub?.submissionGroupId).toBeDefined();

      const groups = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect();
      expect(groups).toHaveLength(1);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("editing a non-pending submission throws IllegalTransition", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-01-15T00:00:00.000Z",
        submissionType: "individual",
        state: "approved",
        tier: "base",
        pointsEarned: 1,
        createdBy: userId,
      });
    });

    await expect(
      t.run(async (ctx) => {
        await edit(ctx, submissionId, { description: "too late" }, userId);
      }),
    ).rejects.toThrow(IllegalTransition);
  });

  test("date change on team-type: moves between groups, old group deleted if empty", async () => {
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
      await edit(ctx, submissionId, { date: "2024-01-16" }, userId);
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.date).toBe("2024-01-16T00:00:00.000Z");
      expect(sub?.submissionGroupId).toBeDefined();

      const groups = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect();

      // Old group (Jan 15) deleted; new group (Jan 16) created
      expect(groups).toHaveLength(1);
      expect(groups[0].date).toBe("2024-01-16T00:00:00.000Z");

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("type change team→individual: evicts from group, group deleted if empty", async () => {
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
      await edit(ctx, submissionId, { type: "individual" }, userId);
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.submissionType).toBe("individual");
      // Note: submissionGroupId may retain a stale reference to the (now-deleted) group.
      // This is safe: approve/reject check submissionType first, and cascade filters by type.
      // Clearing to undefined is skipped here to avoid a convex-test $undefined patch bug.

      const groups = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect();
      expect(groups).toHaveLength(0);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("type change individual→team: joins or creates group for (team, date)", async () => {
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
      await edit(ctx, submissionId, { type: "team" }, userId);
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.submissionType).toBe("team");
      expect(sub?.submissionGroupId).toBeDefined();

      const groups = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect();
      expect(groups).toHaveLength(1);
      expect(groups[0].participantCount).toBe(1);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("date change on team-type with surviving sibling: old group recomputes with participantCount=1", async () => {
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

    const [sub1Id] = await t.run(async (ctx) => {
      const s1 = await submit(ctx, {
        userId: captainId,
        teamId,
        date: "2024-01-15",
        type: "team",
      });
      await submit(ctx, {
        userId: memberId,
        teamId,
        date: "2024-01-15",
        type: "team",
      });
      return [s1];
    });

    await t.run(async (ctx) => {
      await edit(ctx, sub1Id, { date: "2024-01-16" }, captainId);
    });

    await t.run(async (ctx) => {
      const jan15Groups = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team_and_date", (q) =>
          q.eq("teamId", teamId).eq("date", "2024-01-15T00:00:00.000Z"),
        )
        .collect();
      expect(jan15Groups).toHaveLength(1);
      expect(jan15Groups[0].participantCount).toBe(1);

      const jan16Groups = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team_and_date", (q) =>
          q.eq("teamId", teamId).eq("date", "2024-01-16T00:00:00.000Z"),
        )
        .collect();
      expect(jan16Groups).toHaveLength(1);
      expect(jan16Groups[0].participantCount).toBe(1);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("duplicate-team-submission rejection on type flip: throws when another team-type exists for same team-day", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    // Create a team-type submission, then an individual one for the same day
    await t.run(async (ctx) => {
      await submit(ctx, { userId, teamId, date: "2024-01-15", type: "team" });
    });

    const individualId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-01-15T00:00:00.000Z",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
      });
    });

    await expect(
      t.run(async (ctx) => {
        // Flip individual → team would create a duplicate team-type for this user+team+day
        await edit(ctx, individualId, { type: "team" }, userId);
      }),
    ).rejects.toThrow("already submitted for this team activity today");
  });

  test("evidence pure-add: new IDs are claimed and persisted", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const storageIdA = "fake_storage_edit_add_A" as unknown as Id<"_storage">;
    const storageIdB = "fake_storage_edit_add_B" as unknown as Id<"_storage">;
    const storageIdC = "fake_storage_edit_add_C" as unknown as Id<"_storage">;

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-02-01T00:00:00.000Z",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
        evidenceStorageIds: [storageIdA, storageIdB],
      });
    });

    // Pre-insert a pendingUploads row for the new upload C
    await t.run(async (ctx) => {
      await ctx.db.insert("pendingUploads", {
        storageId: storageIdC,
        userId,
        createdAt: new Date().toISOString(),
      });
    });

    await t.run(async (ctx) => {
      await edit(
        ctx,
        submissionId,
        { evidenceStorageIds: [storageIdA, storageIdB, storageIdC] },
        userId,
      );
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.evidenceStorageIds).toEqual([
        storageIdA,
        storageIdB,
        storageIdC,
      ]);
      // pendingUploads row for C was claimed (deleted)
      const pending = await ctx.db.query("pendingUploads").collect();
      expect(pending).toHaveLength(0);
    });
  });

  test("evidence pure-remove: removed IDs trigger storage error (confirming releaseUploads called)", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const storageIdA = "fake_storage_edit_rm_A" as unknown as Id<"_storage">;
    const storageIdB = "fake_storage_edit_rm_B" as unknown as Id<"_storage">;

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-02-02T00:00:00.000Z",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
        evidenceStorageIds: [storageIdA, storageIdB],
      });
    });

    // convex-test throws when ctx.storage.delete is called with a fake ID — confirms releaseUploads fires
    await expect(
      t.run(async (ctx) => {
        await edit(
          ctx,
          submissionId,
          { evidenceStorageIds: [storageIdA] },
          userId,
        );
      }),
    ).rejects.toThrow();
  });

  test("evidence mixed add/remove: claims additions and releases removals", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const storageIdA = "fake_storage_edit_mix_A" as unknown as Id<"_storage">;
    const storageIdB = "fake_storage_edit_mix_B" as unknown as Id<"_storage">;
    const storageIdC = "fake_storage_edit_mix_C" as unknown as Id<"_storage">;

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-02-03T00:00:00.000Z",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
        evidenceStorageIds: [storageIdA, storageIdB],
      });
    });

    // Pre-insert pendingUploads row for C (the addition)
    await t.run(async (ctx) => {
      await ctx.db.insert("pendingUploads", {
        storageId: storageIdC,
        userId,
        createdAt: new Date().toISOString(),
      });
    });

    // storageIdB is removed and storageIdC is added — convex-test throws on storage.delete(B)
    await expect(
      t.run(async (ctx) => {
        await edit(
          ctx,
          submissionId,
          { evidenceStorageIds: [storageIdA, storageIdC] },
          userId,
        );
      }),
    ).rejects.toThrow();
  });

  test("evidence add with foreign storageId rejects: claimUploads throws on ownership mismatch", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const storageIdA = "fake_storage_edit_fgn_A" as unknown as Id<"_storage">;
    const storageIdForeign =
      "fake_storage_edit_fgn_X" as unknown as Id<"_storage">;

    const otherUserId = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        email: "other@example.com",
        name: "Other",
        externalId: "ext_other_edit",
      }),
    );

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-02-04T00:00:00.000Z",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
        evidenceStorageIds: [storageIdA],
      });
    });

    // Pre-insert pendingUploads row owned by a DIFFERENT user
    await t.run(async (ctx) => {
      await ctx.db.insert("pendingUploads", {
        storageId: storageIdForeign,
        userId: otherUserId,
        createdAt: new Date().toISOString(),
      });
    });

    await expect(
      t.run(async (ctx) => {
        await edit(
          ctx,
          submissionId,
          { evidenceStorageIds: [storageIdA, storageIdForeign] },
          userId,
        );
      }),
    ).rejects.toThrow("does not belong to the current user");
  });

  test("evidence post-patch length 0 rejects", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const storageIdA = "fake_storage_edit_len0" as unknown as Id<"_storage">;

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-02-05T00:00:00.000Z",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
        evidenceStorageIds: [storageIdA],
      });
    });

    await expect(
      t.run(async (ctx) => {
        await edit(ctx, submissionId, { evidenceStorageIds: [] }, userId);
      }),
    ).rejects.toThrow("at least 1 Evidence image");
  });

  test("evidence post-patch length 6 rejects", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const existing = Array.from(
      { length: 5 },
      (_, i) => `fake_storage_edit_len6_${i}` as unknown as Id<"_storage">,
    );
    const extra = "fake_storage_edit_len6_extra" as unknown as Id<"_storage">;

    const submissionId = await t.run(async (ctx) => {
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-02-06T00:00:00.000Z",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        pointsEarned: 0,
        createdBy: userId,
        evidenceStorageIds: existing,
      });
    });

    // Pre-insert pendingUploads row for extra
    await t.run(async (ctx) => {
      await ctx.db.insert("pendingUploads", {
        storageId: extra,
        userId,
        createdAt: new Date().toISOString(),
      });
    });

    await expect(
      t.run(async (ctx) => {
        await edit(
          ctx,
          submissionId,
          { evidenceStorageIds: [...existing, extra] },
          userId,
        );
      }),
    ).rejects.toThrow("maximum 5 Evidence images");
  });
});

describe("recompute", () => {
  async function seedWorld(
    ctx: Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0],
  ) {
    const userId = await ctx.db.insert("users", {
      email: "recompute@example.com",
      name: "Recompute User",
      externalId: "ext_recompute",
    });
    const tournamentId = await ctx.db.insert("tournaments", {
      name: "Recompute Tournament",
      description: "For recompute tests",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      createdBy: userId,
      scoringConfig,
    });
    const teamId = await ctx.db.insert("teams", {
      name: "Recompute Team",
      tournamentId,
      createdBy: userId,
      joinPolicy: "open",
      points: 0,
    });
    await ctx.db.insert("teamMembers", { teamId, userId, role: "captain" });
    return { userId, teamId, tournamentId };
  }

  test("submission scope: retroactive scoring change updates individual submission", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      const id = await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-15",
        type: "individual",
        tier: "base",
      });
      await approve(ctx, id, userId);
      return id;
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.pointsEarned).toBe(1);
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(tournamentId, {
        scoringConfig: {
          individualPoints: { base: 5, advanced: 10 },
          teamExercisePoints: { base: 3, advanced: 4 },
          teamExerciseThreshold: 0.5,
        },
      });
    });

    await t.run(async (ctx) => {
      await recompute(ctx, { kind: "submission", id: submissionId }, userId);
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      expect(sub?.pointsEarned).toBe(5);
      expect(sub?.state).toBe("approved");
      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("group scope: retroactive scoring change updates approved team group", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const memberId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", {
        email: "member2@example.com",
        name: "Member2",
        externalId: "ext_member2",
      });
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: id,
        role: "member",
      });
      return id;
    });

    const sub1Id = await t.run(async (ctx) => {
      const s1 = await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-15",
        type: "team",
      });
      await submit(ctx, {
        userId: memberId,
        teamId,
        date: "2024-01-15",
        type: "team",
      });
      return s1;
    });

    const groupId = await t.run(async (ctx) => {
      await approve(ctx, sub1Id, userId);
      const sub = await ctx.db.get(sub1Id);
      if (!sub?.submissionGroupId)
        throw new Error("Group not found after approval");
      return sub.submissionGroupId;
    });

    // Initial: 2/2 members = team exercise, base = 3 points total → 1.5 each
    await t.run(async (ctx) => {
      const group = await ctx.db.get(groupId);
      expect(group?.pointsEarned).toBe(3);
      const sub = await ctx.db.get(sub1Id);
      expect(sub?.pointsEarned).toBeCloseTo(1.5, 5);
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(tournamentId, {
        scoringConfig: {
          individualPoints: { base: 1, advanced: 2 },
          teamExercisePoints: { base: 10, advanced: 20 },
          teamExerciseThreshold: 0.5,
        },
      });
    });

    await t.run(async (ctx) => {
      await recompute(ctx, { kind: "group", id: groupId }, userId);
    });

    await t.run(async (ctx) => {
      const group = await ctx.db.get(groupId);
      expect(group?.pointsEarned).toBe(10);
      const sub = await ctx.db.get(sub1Id);
      expect(sub?.pointsEarned).toBeCloseTo(5, 5);
      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("team scope: recomputes both individual and team submissions", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const [indivId, teamSubId] = await t.run(async (ctx) => {
      const i = await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-10",
        type: "individual",
        tier: "advanced",
      });
      const ts = await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-11",
        type: "team",
      });
      return [i, ts];
    });

    await t.run(async (ctx) => {
      await approve(ctx, indivId, userId);
      await approve(ctx, teamSubId, userId);
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(tournamentId, {
        scoringConfig: {
          individualPoints: { base: 7, advanced: 14 },
          teamExercisePoints: { base: 9, advanced: 18 },
          teamExerciseThreshold: 0.5,
        },
      });
    });

    const result = await t.run(async (ctx) => {
      return await recompute(ctx, { kind: "team", id: teamId }, userId);
    });

    expect(result.teamsTouched).toBe(1);
    expect(result.submissionsTouched).toBeGreaterThan(0);

    await t.run(async (ctx) => {
      const indiv = await ctx.db.get(indivId);
      expect(indiv?.pointsEarned).toBe(14);

      const ts = await ctx.db.get(teamSubId);
      // 1/1 members = team exercise, base = 9 points, sole sub → 9
      expect(ts?.pointsEarned).toBe(9);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("tournament scope: recomputes all teams in the tournament", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId: team1Id, tournamentId } = await t.run(seedWorld);

    const [team2Id, sub2Id] = await t.run(async (ctx) => {
      const user2 = await ctx.db.insert("users", {
        email: "user2@example.com",
        name: "User2",
        externalId: "ext_user2",
      });
      const t2 = await ctx.db.insert("teams", {
        name: "Team 2",
        tournamentId,
        createdBy: user2,
        joinPolicy: "open",
        points: 0,
      });
      await ctx.db.insert("teamMembers", {
        teamId: t2,
        userId: user2,
        role: "captain",
      });
      const s = await submit(ctx, {
        userId: user2,
        teamId: t2,
        date: "2024-01-20",
        type: "individual",
      });
      await approve(ctx, s, user2);
      return [t2, s];
    });

    const sub1Id = await t.run(async (ctx) => {
      const s = await submit(ctx, {
        userId,
        teamId: team1Id,
        date: "2024-01-20",
        type: "individual",
      });
      await approve(ctx, s, userId);
      return s;
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(tournamentId, {
        scoringConfig: {
          individualPoints: { base: 99, advanced: 100 },
          teamExercisePoints: { base: 3, advanced: 4 },
          teamExerciseThreshold: 0.5,
        },
      });
    });

    const result = await t.run(async (ctx) => {
      return await recompute(
        ctx,
        { kind: "tournament", id: tournamentId },
        userId,
      );
    });

    expect(result.teamsTouched).toBe(2);

    await t.run(async (ctx) => {
      const s1 = await ctx.db.get(sub1Id);
      expect(s1?.pointsEarned).toBe(99);
      const s2 = await ctx.db.get(sub2Id);
      expect(s2?.pointsEarned).toBe(99);

      await assertSubmissionInvariant(ctx, { teamId: team1Id, tournamentId });
      await assertSubmissionInvariant(ctx, { teamId: team2Id, tournamentId });
    });
  });

  test("idempotent: two consecutive recompute calls produce identical state", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const submissionId = await t.run(async (ctx) => {
      const id = await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-15",
        type: "individual",
      });
      await approve(ctx, id, userId);
      return id;
    });

    await t.run(async (ctx) => {
      await recompute(ctx, { kind: "team", id: teamId }, userId);
    });

    const stateAfterFirst = await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      const team = await ctx.db.get(teamId);
      return { points: sub?.pointsEarned, teamPoints: team?.points };
    });

    await t.run(async (ctx) => {
      await recompute(ctx, { kind: "team", id: teamId }, userId);
    });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(submissionId);
      const team = await ctx.db.get(teamId);
      expect(sub?.pointsEarned).toBe(stateAfterFirst.points);
      expect(team?.points).toBe(stateAfterFirst.teamPoints);
      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });

  test("recompute never changes submission state", async () => {
    const t = convexTest(schemaForTest);
    const { userId, teamId, tournamentId } = await t.run(seedWorld);

    const ids = await t.run(async (ctx) => {
      const pending = await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-10",
        type: "individual",
      });
      const approved = await submit(ctx, {
        userId,
        teamId,
        date: "2024-01-11",
        type: "individual",
      });
      await approve(ctx, approved, userId);
      return { pending, approved };
    });

    await t.run(async (ctx) => {
      await recompute(ctx, { kind: "team", id: teamId }, userId);
    });

    await t.run(async (ctx) => {
      const pendingSub = await ctx.db.get(ids.pending);
      expect(pendingSub?.state).toBe("pending");
      expect(pendingSub?.pointsEarned).toBe(0);

      const approvedSub = await ctx.db.get(ids.approved);
      expect(approvedSub?.state).toBe("approved");
      expect(approvedSub?.pointsEarned).toBe(1);

      await assertSubmissionInvariant(ctx, { teamId, tournamentId });
    });
  });
});
