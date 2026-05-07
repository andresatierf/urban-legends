import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import {
  canApproveSubmission,
  canDeleteSubmission,
  canEditSubmission,
  canRejectSubmission,
  canViewSubmission,
  computeSubmissionPermissions,
} from "./core";

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

type Ctx = Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0];

async function seedWorld(ctx: Ctx) {
  const ownerId = await ctx.db.insert("users", {
    email: "owner@test.com",
    name: "Owner",
    externalId: "owner1",
  });

  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Tournament A",
    description: "Test tournament",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    createdBy: ownerId,
    scoringConfig,
  });

  const teamId = await ctx.db.insert("teams", {
    name: "Team Alpha",
    tournamentId,
    createdBy: ownerId,
    joinPolicy: "open",
    points: 0,
  });

  await ctx.db.insert("teamMembers", {
    teamId,
    userId: ownerId,
    role: "captain",
  });

  const submissionId = await ctx.db.insert("submissions", {
    userId: ownerId,
    teamId,
    tournamentId,
    date: "2024-01-15",
    submissionType: "individual",
    state: "pending",
    tier: "base",
    pointsEarned: 0,
    createdBy: ownerId,
  });

  return { ownerId, tournamentId, teamId, submissionId };
}

async function makeUser(
  ctx: Ctx,
  externalId: string,
  email = `${externalId}@test.com`,
) {
  return ctx.db.insert("users", {
    email,
    name: externalId,
    externalId,
  });
}

async function giveSystemRole(ctx: Ctx, userId: Id<"users">, roleName: string) {
  const roleId = await ctx.db.insert("roles", {
    name: roleName,
    displayName: roleName,
    hierarchy: 0,
  });
  await ctx.db.insert("userRoles", { userId, roleId });
}

async function giveTournamentRole(
  ctx: Ctx,
  userId: Id<"users">,
  tournamentId: Id<"tournaments">,
  role: "tournament_manager" | "reviewer",
) {
  await ctx.db.insert("tournamentRoles", { userId, tournamentId, role });
}

// ── canApproveSubmission ────────────────────────────────────────────────────

describe("canApproveSubmission", () => {
  test("admin can approve any submission (system override)", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin1");
      await giveSystemRole(ctx, adminId, "admin");
      return canApproveSubmission.check(ctx, adminId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("dev can approve any submission (system override)", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId } = await seedWorld(ctx);
      const devId = await makeUser(ctx, "dev1");
      await giveSystemRole(ctx, devId, "dev");
      return canApproveSubmission.check(ctx, devId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("tournament_manager of the submission's tournament can approve", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, tournamentId } = await seedWorld(ctx);
      const managerId = await makeUser(ctx, "manager1");
      await giveTournamentRole(
        ctx,
        managerId,
        tournamentId,
        "tournament_manager",
      );
      return canApproveSubmission.check(ctx, managerId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("reviewer of the submission's tournament can approve", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, tournamentId } = await seedWorld(ctx);
      const reviewerId = await makeUser(ctx, "reviewer1");
      await giveTournamentRole(ctx, reviewerId, tournamentId, "reviewer");
      return canApproveSubmission.check(ctx, reviewerId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("reviewer of a DIFFERENT tournament cannot approve (isolation)", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, ownerId } = await seedWorld(ctx);
      const otherTournamentId = await ctx.db.insert("tournaments", {
        name: "Tournament B",
        description: "Other",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: ownerId,
        scoringConfig,
      });
      const reviewerId = await makeUser(ctx, "reviewer_b");
      await giveTournamentRole(ctx, reviewerId, otherTournamentId, "reviewer");
      return canApproveSubmission.check(ctx, reviewerId, { submissionId });
    });
    expect(result).toBe(false);
  });

  test("organizer cannot approve (no tournament role granted)", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId } = await seedWorld(ctx);
      const organizerId = await makeUser(ctx, "org1");
      await giveSystemRole(ctx, organizerId, "organizer");
      return canApproveSubmission.check(ctx, organizerId, { submissionId });
    });
    expect(result).toBe(false);
  });

  test("plain team member cannot approve", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, teamId } = await seedWorld(ctx);
      const memberId = await makeUser(ctx, "member1");
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: memberId,
        role: "member",
      });
      return canApproveSubmission.check(ctx, memberId, { submissionId });
    });
    expect(result).toBe(false);
  });
});

// ── canRejectSubmission ─────────────────────────────────────────────────────

describe("canRejectSubmission", () => {
  test("admin can reject any submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin2");
      await giveSystemRole(ctx, adminId, "admin");
      return canRejectSubmission.check(ctx, adminId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("tournament_manager of the submission's tournament can reject", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, tournamentId } = await seedWorld(ctx);
      const managerId = await makeUser(ctx, "manager2");
      await giveTournamentRole(
        ctx,
        managerId,
        tournamentId,
        "tournament_manager",
      );
      return canRejectSubmission.check(ctx, managerId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("reviewer of a different tournament cannot reject", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, ownerId } = await seedWorld(ctx);
      const otherTId = await ctx.db.insert("tournaments", {
        name: "B",
        description: "B",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: ownerId,
        scoringConfig,
      });
      const reviewerId = await makeUser(ctx, "reviewer_b2");
      await giveTournamentRole(ctx, reviewerId, otherTId, "reviewer");
      return canRejectSubmission.check(ctx, reviewerId, { submissionId });
    });
    expect(result).toBe(false);
  });
});

// ── canEditSubmission ───────────────────────────────────────────────────────

describe("canEditSubmission", () => {
  test("owner can edit their pending submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, ownerId } = await seedWorld(ctx);
      return canEditSubmission.check(ctx, ownerId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("owner cannot edit an approved submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, ownerId } = await seedWorld(ctx);
      await ctx.db.patch(submissionId, { state: "approved" });
      return canEditSubmission.check(ctx, ownerId, { submissionId });
    });
    expect(result).toBe(false);
  });

  test("non-owner team member cannot edit", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, teamId } = await seedWorld(ctx);
      const memberId = await makeUser(ctx, "member2");
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: memberId,
        role: "member",
      });
      return canEditSubmission.check(ctx, memberId, { submissionId });
    });
    expect(result).toBe(false);
  });

  test("admin cannot edit (edit is owner-only)", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin3");
      await giveSystemRole(ctx, adminId, "admin");
      return canEditSubmission.check(ctx, adminId, { submissionId });
    });
    expect(result).toBe(false);
  });
});

// ── canDeleteSubmission ─────────────────────────────────────────────────────

describe("canDeleteSubmission", () => {
  test("owner can delete their pending submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, ownerId } = await seedWorld(ctx);
      return canDeleteSubmission.check(ctx, ownerId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("admin can delete any submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin4");
      await giveSystemRole(ctx, adminId, "admin");
      return canDeleteSubmission.check(ctx, adminId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("tournament_manager of the submission's tournament can delete", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, tournamentId } = await seedWorld(ctx);
      const managerId = await makeUser(ctx, "manager3");
      await giveTournamentRole(
        ctx,
        managerId,
        tournamentId,
        "tournament_manager",
      );
      return canDeleteSubmission.check(ctx, managerId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("reviewer cannot delete (delete requires manager or higher)", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, tournamentId } = await seedWorld(ctx);
      const reviewerId = await makeUser(ctx, "reviewer3");
      await giveTournamentRole(ctx, reviewerId, tournamentId, "reviewer");
      return canDeleteSubmission.check(ctx, reviewerId, { submissionId });
    });
    expect(result).toBe(false);
  });

  test("owner cannot delete an already-deleted submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, ownerId } = await seedWorld(ctx);
      await ctx.db.patch(submissionId, { state: "deleted" });
      return canDeleteSubmission.check(ctx, ownerId, { submissionId });
    });
    expect(result).toBe(false);
  });

  test("owner cannot delete a rejected submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, ownerId } = await seedWorld(ctx);
      await ctx.db.patch(submissionId, { state: "rejected" });
      return canDeleteSubmission.check(ctx, ownerId, { submissionId });
    });
    expect(result).toBe(false);
  });
});

// ── canViewSubmission ───────────────────────────────────────────────────────

describe("canViewSubmission", () => {
  test("owner can view their submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, ownerId } = await seedWorld(ctx);
      return canViewSubmission.check(ctx, ownerId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("team member can view team submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, teamId } = await seedWorld(ctx);
      const memberId = await makeUser(ctx, "member3");
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: memberId,
        role: "member",
      });
      return canViewSubmission.check(ctx, memberId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("admin can view any submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin5");
      await giveSystemRole(ctx, adminId, "admin");
      return canViewSubmission.check(ctx, adminId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("reviewer of the tournament can view", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, tournamentId } = await seedWorld(ctx);
      const reviewerId = await makeUser(ctx, "reviewer4");
      await giveTournamentRole(ctx, reviewerId, tournamentId, "reviewer");
      return canViewSubmission.check(ctx, reviewerId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("unrelated user cannot view", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId } = await seedWorld(ctx);
      const strangerId = await makeUser(ctx, "stranger1");
      return canViewSubmission.check(ctx, strangerId, { submissionId });
    });
    expect(result).toBe(false);
  });
});

// ── tournament_manager → reviewer inheritance ───────────────────────────────

describe("loader composition: tournament_manager inherits reviewer", () => {
  test("tournament_manager can approve (inherits reviewer privileges)", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, tournamentId } = await seedWorld(ctx);
      const managerId = await makeUser(ctx, "manager4");
      await giveTournamentRole(
        ctx,
        managerId,
        tournamentId,
        "tournament_manager",
      );
      return canApproveSubmission.check(ctx, managerId, { submissionId });
    });
    expect(result).toBe(true);
  });

  test("reviewer of tournament A cannot approve submission in tournament B", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, ownerId } = await seedWorld(ctx);
      const tournamentB = await ctx.db.insert("tournaments", {
        name: "B2",
        description: "B",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: ownerId,
        scoringConfig,
      });
      const reviewerId = await makeUser(ctx, "reviewer5");
      await giveTournamentRole(ctx, reviewerId, tournamentB, "reviewer");
      return canApproveSubmission.check(ctx, reviewerId, { submissionId });
    });
    expect(result).toBe(false);
  });
});

// ── computeSubmissionPermissions (flag bag) ─────────────────────────────────

describe("computeSubmissionPermissions", () => {
  test("returns full flag bag for owner of pending submission", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId, ownerId } = await seedWorld(ctx);
      return computeSubmissionPermissions(ctx, ownerId, submissionId);
    });
    expect(result.canView).toBe(true);
    expect(result.canEdit).toBe(true);
    expect(result.canDelete).toBe(true);
    expect(result.canApprove).toBe(false);
    expect(result.canReject).toBe(false);
  });

  test("admin sees full approval + delete flags", async () => {
    const t = convexTest(schemaForTest);
    const result = await t.run(async (ctx) => {
      const { submissionId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin6");
      await giveSystemRole(ctx, adminId, "admin");
      return computeSubmissionPermissions(ctx, adminId, submissionId);
    });
    expect(result.canView).toBe(true);
    expect(result.canApprove).toBe(true);
    expect(result.canReject).toBe(true);
    expect(result.canDelete).toBe(true);
    expect(result.canEdit).toBe(false);
  });
});
