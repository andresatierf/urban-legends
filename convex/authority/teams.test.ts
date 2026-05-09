import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import {
  canDeleteTeam,
  canEditTeam,
  canInviteToTeam,
  canLeaveTeam,
  canManageTeamMembers,
  canTransferCaptaincy,
  canViewTeam,
  computeTeamPermissions,
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
  const captainId = await ctx.db.insert("users", {
    email: "captain@test.com",
    name: "Captain",
    externalId: "captain1",
  });

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
    joinPolicy: "open",
    points: 0,
  });

  await ctx.db.insert("teamMembers", {
    teamId,
    userId: captainId,
    role: "captain",
  });

  return { captainId, tournamentId, teamId };
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

async function addTeamMember(
  ctx: Ctx,
  userId: Id<"users">,
  teamId: Id<"teams">,
  role: "member" | "captain" = "member",
) {
  await ctx.db.insert("teamMembers", { teamId, userId, role });
}

describe("canViewTeam", () => {
  test("any logged-in user can view a team", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const outsider = await makeUser(ctx, "outsider");
      const result = await canViewTeam.check(ctx, outsider, { teamId });
      expect(result).toBe(true);
    });
  });
});

describe("canEditTeam", () => {
  test("captain can edit their own team", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      expect(await canEditTeam.check(ctx, captainId, { teamId })).toBe(true);
    });
  });

  test("admin can edit any team", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      expect(await canEditTeam.check(ctx, admin, { teamId })).toBe(true);
    });
  });

  test("dev can edit any team", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const dev = await makeUser(ctx, "dev");
      await giveSystemRole(ctx, dev, "dev");
      expect(await canEditTeam.check(ctx, dev, { teamId })).toBe(true);
    });
  });

  test("tournament_manager of the team's tournament can edit", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { tournamentId, teamId } = await seedWorld(ctx);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      expect(await canEditTeam.check(ctx, manager, { teamId })).toBe(true);
    });
  });

  test("reviewer of the team's tournament cannot edit", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { tournamentId, teamId } = await seedWorld(ctx);
      const reviewer = await makeUser(ctx, "reviewer");
      await giveTournamentRole(ctx, reviewer, tournamentId, "reviewer");
      expect(await canEditTeam.check(ctx, reviewer, { teamId })).toBe(false);
    });
  });

  test("plain team member cannot edit", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");
      expect(await canEditTeam.check(ctx, member, { teamId })).toBe(false);
    });
  });

  test("outsider cannot edit", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const outsider = await makeUser(ctx, "outsider");
      expect(await canEditTeam.check(ctx, outsider, { teamId })).toBe(false);
    });
  });

  test("tournament_manager of a different tournament cannot edit (isolation)", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId, captainId } = await seedWorld(ctx);
      const otherTournamentId = await ctx.db.insert("tournaments", {
        name: "Tournament B",
        description: "Other tournament",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: captainId,
        scoringConfig,
      });
      const manager = await makeUser(ctx, "manager_b");
      await giveTournamentRole(
        ctx,
        manager,
        otherTournamentId,
        "tournament_manager",
      );
      expect(await canEditTeam.check(ctx, manager, { teamId })).toBe(false);
    });
  });
});

describe("canDeleteTeam", () => {
  test("captain can delete their team", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      expect(await canDeleteTeam.check(ctx, captainId, { teamId })).toBe(true);
    });
  });

  test("admin can delete any team", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      expect(await canDeleteTeam.check(ctx, admin, { teamId })).toBe(true);
    });
  });

  test("tournament_manager of the team's tournament can delete", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { tournamentId, teamId } = await seedWorld(ctx);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      expect(await canDeleteTeam.check(ctx, manager, { teamId })).toBe(true);
    });
  });

  test("plain member cannot delete", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");
      expect(await canDeleteTeam.check(ctx, member, { teamId })).toBe(false);
    });
  });
});

describe("canInviteToTeam", () => {
  test("captain can invite", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      expect(await canInviteToTeam.check(ctx, captainId, { teamId })).toBe(
        true,
      );
    });
  });

  test("admin can invite", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      expect(await canInviteToTeam.check(ctx, admin, { teamId })).toBe(true);
    });
  });

  test("tournament_manager can invite", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { tournamentId, teamId } = await seedWorld(ctx);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      expect(await canInviteToTeam.check(ctx, manager, { teamId })).toBe(true);
    });
  });

  test("plain member cannot invite", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");
      expect(await canInviteToTeam.check(ctx, member, { teamId })).toBe(false);
    });
  });
});

describe("canLeaveTeam", () => {
  test("non-captain member can leave", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");
      expect(await canLeaveTeam.check(ctx, member, { teamId })).toBe(true);
    });
  });

  test("captain with one member (sole member) can leave", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      expect(await canLeaveTeam.check(ctx, captainId, { teamId })).toBe(true);
    });
  });

  test("captain with multiple members cannot leave without transferring captaincy first", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");
      expect(await canLeaveTeam.check(ctx, captainId, { teamId })).toBe(false);
    });
  });

  test("outsider cannot leave a team they don't belong to", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const outsider = await makeUser(ctx, "outsider");
      expect(await canLeaveTeam.check(ctx, outsider, { teamId })).toBe(false);
    });
  });
});

describe("canTransferCaptaincy", () => {
  test("captain with multiple members can transfer captaincy", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");
      expect(await canTransferCaptaincy.check(ctx, captainId, { teamId })).toBe(
        true,
      );
    });
  });

  test("captain with only one member cannot transfer (nobody to transfer to)", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      expect(await canTransferCaptaincy.check(ctx, captainId, { teamId })).toBe(
        false,
      );
    });
  });

  test("non-captain member cannot transfer captaincy", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");
      expect(await canTransferCaptaincy.check(ctx, member, { teamId })).toBe(
        false,
      );
    });
  });

  test("admin cannot transfer captaincy (captain-only action)", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");
      expect(await canTransferCaptaincy.check(ctx, admin, { teamId })).toBe(
        false,
      );
    });
  });
});

describe("canManageTeamMembers", () => {
  test("captain can manage members", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      expect(await canManageTeamMembers.check(ctx, captainId, { teamId })).toBe(
        true,
      );
    });
  });

  test("admin can manage members", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      expect(await canManageTeamMembers.check(ctx, admin, { teamId })).toBe(
        true,
      );
    });
  });

  test("tournament_manager can manage members", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { tournamentId, teamId } = await seedWorld(ctx);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      expect(await canManageTeamMembers.check(ctx, manager, { teamId })).toBe(
        true,
      );
    });
  });

  test("plain member cannot manage members", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");
      expect(await canManageTeamMembers.check(ctx, member, { teamId })).toBe(
        false,
      );
    });
  });
});

describe("computeTeamPermissions flag bag", () => {
  test("captain gets full permission set (except canLeave blocked by member count)", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");

      const perms = await computeTeamPermissions(ctx, captainId, teamId);

      expect(perms.canView).toBe(true);
      expect(perms.canEdit).toBe(true);
      expect(perms.canDelete).toBe(true);
      expect(perms.canInvite).toBe(true);
      expect(perms.canLeave).toBe(false); // captain with 2 members must transfer first
      expect(perms.canTransferCaptaincy).toBe(true);
      expect(perms.canManageMembers).toBe(true);
    });
  });

  test("plain member gets limited permissions", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const member = await makeUser(ctx, "member");
      await addTeamMember(ctx, member, teamId, "member");

      const perms = await computeTeamPermissions(ctx, member, teamId);

      expect(perms.canView).toBe(true);
      expect(perms.canEdit).toBe(false);
      expect(perms.canDelete).toBe(false);
      expect(perms.canInvite).toBe(false);
      expect(perms.canLeave).toBe(true);
      expect(perms.canTransferCaptaincy).toBe(false);
      expect(perms.canManageMembers).toBe(false);
    });
  });

  test("admin gets all write permissions", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");

      const perms = await computeTeamPermissions(ctx, admin, teamId);

      expect(perms.canView).toBe(true);
      expect(perms.canEdit).toBe(true);
      expect(perms.canDelete).toBe(true);
      expect(perms.canInvite).toBe(true);
      expect(perms.canLeave).toBe(false); // not a member
      expect(perms.canTransferCaptaincy).toBe(false); // not captain
      expect(perms.canManageMembers).toBe(true);
    });
  });
});
