import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";
import {
  canApproveJoinRequest,
  canCancelInvitation,
  canCancelJoinRequest,
  canCreateJoinRequest,
  canRejectJoinRequest,
  canRespondToInvitation,
} from "../core";

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

async function makeUser(ctx: Ctx, seed: string): Promise<Id<"users">> {
  return ctx.db.insert("users", {
    email: `${seed}@test.com`,
    name: seed,
    externalId: seed,
  });
}

async function giveSystemRole(
  ctx: Ctx,
  userId: Id<"users">,
  roleName: string,
): Promise<void> {
  const roleId = await ctx.db.insert("roles", { name: roleName });
  await ctx.db.insert("userRoles", { userId, roleId });
}

async function giveTournamentRole(
  ctx: Ctx,
  userId: Id<"users">,
  tournamentId: Id<"tournaments">,
  role: "tournament_manager" | "reviewer",
): Promise<void> {
  await ctx.db.insert("tournamentRoles", { userId, tournamentId, role });
}

async function addTeamMember(
  ctx: Ctx,
  teamId: Id<"teams">,
  userId: Id<"users">,
  role: "captain" | "member",
): Promise<void> {
  await ctx.db.insert("teamMembers", { teamId, userId, role });
}

async function seedWorld(ctx: Ctx) {
  const captainId = await makeUser(ctx, "captain");

  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Tournament A",
    description: "Test tournament",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    createdBy: captainId,
    scoringConfig,
  });

  const teamId = await ctx.db.insert("teams", {
    name: "Team Alpha",
    tournamentId,
    createdBy: captainId,
    visibility: "public",
  });

  await addTeamMember(ctx, teamId, captainId, "captain");

  return { captainId, tournamentId, teamId };
}

async function makeInvitation(
  ctx: Ctx,
  teamId: Id<"teams">,
  invitedBy: Id<"users">,
  invitedUserId: Id<"users">,
): Promise<Id<"teamInvitations">> {
  return ctx.db.insert("teamInvitations", {
    teamId,
    invitedUserId,
    invitedEmail: "invitee@test.com",
    invitedBy,
    status: "pending",
    expiresAt: "2099-01-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
  });
}

async function makeJoinRequest(
  ctx: Ctx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<Id<"joinRequests">> {
  return ctx.db.insert("joinRequests", {
    teamId,
    userId,
    status: "pending",
    createdAt: "2024-01-01T00:00:00.000Z",
  });
}

// ── canCancelInvitation ──────────────────────────────────────────────────────

describe("canCancelInvitation", () => {
  test("captain can cancel a pending invitation", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const inviteeId = await makeUser(ctx, "invitee");
      const invitationId = await makeInvitation(
        ctx,
        teamId,
        captainId,
        inviteeId,
      );

      expect(
        await canCancelInvitation.check(ctx, captainId, { invitationId }),
      ).toBe(true);
    });
  });

  test("admin can cancel any invitation", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, adminId, "admin");
      const inviteeId = await makeUser(ctx, "invitee");
      const invitationId = await makeInvitation(
        ctx,
        teamId,
        captainId,
        inviteeId,
      );

      expect(
        await canCancelInvitation.check(ctx, adminId, { invitationId }),
      ).toBe(true);
    });
  });

  test("tournament_manager can cancel invitation for their tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId, tournamentId } = await seedWorld(ctx);
      const managerId = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        managerId,
        tournamentId,
        "tournament_manager",
      );
      const inviteeId = await makeUser(ctx, "invitee");
      const invitationId = await makeInvitation(
        ctx,
        teamId,
        captainId,
        inviteeId,
      );

      expect(
        await canCancelInvitation.check(ctx, managerId, { invitationId }),
      ).toBe(true);
    });
  });

  test("regular member cannot cancel invitation", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const memberId = await makeUser(ctx, "member");
      await addTeamMember(ctx, teamId, memberId, "member");
      const inviteeId = await makeUser(ctx, "invitee");
      const invitationId = await makeInvitation(
        ctx,
        teamId,
        captainId,
        inviteeId,
      );

      expect(
        await canCancelInvitation.check(ctx, memberId, { invitationId }),
      ).toBe(false);
    });
  });

  test("invitee cannot cancel their own invitation", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const inviteeId = await makeUser(ctx, "invitee");
      const invitationId = await makeInvitation(
        ctx,
        teamId,
        captainId,
        inviteeId,
      );

      expect(
        await canCancelInvitation.check(ctx, inviteeId, { invitationId }),
      ).toBe(false);
    });
  });

  test("tournament_manager from different tournament cannot cancel", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const otherCaptainId = await makeUser(ctx, "otherCaptain");
      const otherTournamentId = await ctx.db.insert("tournaments", {
        name: "Tournament B",
        description: "Other tournament",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: otherCaptainId,
        scoringConfig,
      });
      const managerId = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        managerId,
        otherTournamentId,
        "tournament_manager",
      );
      const inviteeId = await makeUser(ctx, "invitee");
      const invitationId = await makeInvitation(
        ctx,
        teamId,
        captainId,
        inviteeId,
      );

      expect(
        await canCancelInvitation.check(ctx, managerId, { invitationId }),
      ).toBe(false);
    });
  });
});

// ── canRespondToInvitation ───────────────────────────────────────────────────

describe("canRespondToInvitation", () => {
  test("invitee can respond to their own invitation", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const inviteeId = await makeUser(ctx, "invitee");
      const invitationId = await makeInvitation(
        ctx,
        teamId,
        captainId,
        inviteeId,
      );

      expect(
        await canRespondToInvitation.check(ctx, inviteeId, { invitationId }),
      ).toBe(true);
    });
  });

  test("captain cannot respond to an invitation they sent", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const inviteeId = await makeUser(ctx, "invitee");
      const invitationId = await makeInvitation(
        ctx,
        teamId,
        captainId,
        inviteeId,
      );

      expect(
        await canRespondToInvitation.check(ctx, captainId, { invitationId }),
      ).toBe(false);
    });
  });

  test("admin cannot respond to someone else's invitation", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, adminId, "admin");
      const inviteeId = await makeUser(ctx, "invitee");
      const invitationId = await makeInvitation(
        ctx,
        teamId,
        captainId,
        inviteeId,
      );

      expect(
        await canRespondToInvitation.check(ctx, adminId, { invitationId }),
      ).toBe(false);
    });
  });
});

// ── canCreateJoinRequest ─────────────────────────────────────────────────────

describe("canCreateJoinRequest", () => {
  test("non-member can create a join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const outsiderId = await makeUser(ctx, "outsider");

      expect(
        await canCreateJoinRequest.check(ctx, outsiderId, { teamId }),
      ).toBe(true);
    });
  });

  test("existing team member cannot create a join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const memberId = await makeUser(ctx, "member");
      await addTeamMember(ctx, teamId, memberId, "member");

      expect(await canCreateJoinRequest.check(ctx, memberId, { teamId })).toBe(
        false,
      );
    });
  });

  test("captain cannot create a join request for their own team", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);

      expect(await canCreateJoinRequest.check(ctx, captainId, { teamId })).toBe(
        false,
      );
    });
  });
});

// ── canCancelJoinRequest ─────────────────────────────────────────────────────

describe("canCancelJoinRequest", () => {
  test("requester can cancel their own join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canCancelJoinRequest.check(ctx, requesterId, { requestId }),
      ).toBe(true);
    });
  });

  test("captain cannot cancel someone else's join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canCancelJoinRequest.check(ctx, captainId, { requestId }),
      ).toBe(false);
    });
  });

  test("admin cannot cancel someone else's join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, adminId, "admin");
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canCancelJoinRequest.check(ctx, adminId, { requestId }),
      ).toBe(false);
    });
  });
});

// ── canApproveJoinRequest ────────────────────────────────────────────────────

describe("canApproveJoinRequest", () => {
  test("captain can approve a join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canApproveJoinRequest.check(ctx, captainId, { requestId }),
      ).toBe(true);
    });
  });

  test("admin can approve any join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, adminId, "admin");
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canApproveJoinRequest.check(ctx, adminId, { requestId }),
      ).toBe(true);
    });
  });

  test("tournament_manager can approve for their tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId, tournamentId } = await seedWorld(ctx);
      const managerId = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        managerId,
        tournamentId,
        "tournament_manager",
      );
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canApproveJoinRequest.check(ctx, managerId, { requestId }),
      ).toBe(true);
    });
  });

  test("regular member cannot approve join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const memberId = await makeUser(ctx, "member");
      await addTeamMember(ctx, teamId, memberId, "member");
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canApproveJoinRequest.check(ctx, memberId, { requestId }),
      ).toBe(false);
    });
  });

  test("requester cannot approve their own join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canApproveJoinRequest.check(ctx, requesterId, { requestId }),
      ).toBe(false);
    });
  });

  test("tournament_manager from different tournament cannot approve", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const otherCaptainId = await makeUser(ctx, "otherCaptain");
      const otherTournamentId = await ctx.db.insert("tournaments", {
        name: "Tournament B",
        description: "Other tournament",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: otherCaptainId,
        scoringConfig,
      });
      const managerId = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        managerId,
        otherTournamentId,
        "tournament_manager",
      );
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canApproveJoinRequest.check(ctx, managerId, { requestId }),
      ).toBe(false);
    });
  });
});

// ── canRejectJoinRequest ─────────────────────────────────────────────────────

describe("canRejectJoinRequest", () => {
  test("captain can reject a join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canRejectJoinRequest.check(ctx, captainId, { requestId }),
      ).toBe(true);
    });
  });

  test("admin can reject any join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const adminId = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, adminId, "admin");
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canRejectJoinRequest.check(ctx, adminId, { requestId }),
      ).toBe(true);
    });
  });

  test("non-captain outsider cannot reject join request", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const outsiderId = await makeUser(ctx, "outsider");
      const requesterId = await makeUser(ctx, "requester");
      const requestId = await makeJoinRequest(ctx, teamId, requesterId);

      expect(
        await canRejectJoinRequest.check(ctx, outsiderId, { requestId }),
      ).toBe(false);
    });
  });
});
