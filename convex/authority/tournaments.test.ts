import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import {
  canCreateTournament,
  canDeleteTournament,
  canEditTournament,
  canGrantTournamentRole,
  canRevokeTournamentRole,
  canViewTournament,
  computeTournamentPermissions,
  grantTournamentRole,
  onTournamentCreated,
  revokeTournamentRole,
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

async function makeTournament(ctx: Ctx, creatorId: Id<"users">) {
  return ctx.db.insert("tournaments", {
    name: "Tournament A",
    description: "Test",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    createdBy: creatorId,
    scoringConfig,
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

describe("canViewTournament", () => {
  test("any user can view a tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const visitor = await makeUser(ctx, "visitor");
      expect(
        await canViewTournament.check(ctx, visitor, { tournamentId }),
      ).toBe(true);
    });
  });
});

describe("canCreateTournament", () => {
  test("admin can create a tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      expect(await canCreateTournament.check(ctx, admin)).toBe(true);
    });
  });

  test("dev can create a tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const dev = await makeUser(ctx, "dev");
      await giveSystemRole(ctx, dev, "dev");
      expect(await canCreateTournament.check(ctx, dev)).toBe(true);
    });
  });

  test("organizer can create a tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const organizer = await makeUser(ctx, "organizer");
      await giveSystemRole(ctx, organizer, "organizer");
      expect(await canCreateTournament.check(ctx, organizer)).toBe(true);
    });
  });

  test("plain user cannot create a tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const user = await makeUser(ctx, "user");
      expect(await canCreateTournament.check(ctx, user)).toBe(false);
    });
  });

  test("tournament_manager of another tournament cannot create (role is scoped)", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const user = await makeUser(ctx, "manager");
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      await giveTournamentRole(ctx, user, tournamentId, "tournament_manager");
      expect(await canCreateTournament.check(ctx, user)).toBe(false);
    });
  });
});

describe("canEditTournament", () => {
  test("admin can edit any tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      expect(await canEditTournament.check(ctx, admin, { tournamentId })).toBe(
        true,
      );
    });
  });

  test("dev can edit any tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const dev = await makeUser(ctx, "dev");
      await giveSystemRole(ctx, dev, "dev");
      expect(await canEditTournament.check(ctx, dev, { tournamentId })).toBe(
        true,
      );
    });
  });

  test("tournament_manager of that tournament can edit", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      expect(
        await canEditTournament.check(ctx, manager, { tournamentId }),
      ).toBe(true);
    });
  });

  test("organizer cannot edit a tournament they did not create", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const organizer = await makeUser(ctx, "organizer");
      await giveSystemRole(ctx, organizer, "organizer");
      expect(
        await canEditTournament.check(ctx, organizer, { tournamentId }),
      ).toBe(false);
    });
  });

  test("reviewer of that tournament cannot edit", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const reviewer = await makeUser(ctx, "reviewer");
      await giveTournamentRole(ctx, reviewer, tournamentId, "reviewer");
      expect(
        await canEditTournament.check(ctx, reviewer, { tournamentId }),
      ).toBe(false);
    });
  });

  test("tournament_manager of different tournament cannot edit (isolation)", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentA = await makeTournament(ctx, creator);
      const tournamentB = await ctx.db.insert("tournaments", {
        name: "Tournament B",
        description: "Other",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: creator,
        scoringConfig,
      });
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(ctx, manager, tournamentB, "tournament_manager");
      expect(
        await canEditTournament.check(ctx, manager, {
          tournamentId: tournamentA,
        }),
      ).toBe(false);
    });
  });

  test("plain user cannot edit", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const user = await makeUser(ctx, "user");
      expect(await canEditTournament.check(ctx, user, { tournamentId })).toBe(
        false,
      );
    });
  });
});

describe("canDeleteTournament", () => {
  test("admin can delete any tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      expect(
        await canDeleteTournament.check(ctx, admin, { tournamentId }),
      ).toBe(true);
    });
  });

  test("dev can delete any tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const dev = await makeUser(ctx, "dev");
      await giveSystemRole(ctx, dev, "dev");
      expect(await canDeleteTournament.check(ctx, dev, { tournamentId })).toBe(
        true,
      );
    });
  });

  test("tournament_manager cannot delete (admin-only)", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      expect(
        await canDeleteTournament.check(ctx, manager, { tournamentId }),
      ).toBe(false);
    });
  });

  test("organizer cannot delete", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const organizer = await makeUser(ctx, "organizer");
      await giveSystemRole(ctx, organizer, "organizer");
      expect(
        await canDeleteTournament.check(ctx, organizer, { tournamentId }),
      ).toBe(false);
    });
  });
});

describe("canGrantTournamentRole / canRevokeTournamentRole", () => {
  test("admin can grant tournament roles", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      expect(
        await canGrantTournamentRole.check(ctx, admin, { tournamentId }),
      ).toBe(true);
      expect(
        await canRevokeTournamentRole.check(ctx, admin, { tournamentId }),
      ).toBe(true);
    });
  });

  test("tournament_manager cannot grant roles", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      expect(
        await canGrantTournamentRole.check(ctx, manager, { tournamentId }),
      ).toBe(false);
    });
  });
});

describe("onTournamentCreated — auto-promotes creator", () => {
  test("organizer who creates becomes tournament_manager of that tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const organizer = await makeUser(ctx, "organizer");
      await giveSystemRole(ctx, organizer, "organizer");
      const tournamentId = await makeTournament(ctx, organizer);

      // Before onTournamentCreated: organizer can create but not edit
      expect(
        await canEditTournament.check(ctx, organizer, { tournamentId }),
      ).toBe(false);

      await onTournamentCreated(ctx, { tournamentId, creatorId: organizer });

      // After: organizer is now tournament_manager — can edit
      expect(
        await canEditTournament.check(ctx, organizer, { tournamentId }),
      ).toBe(true);
    });
  });

  test("admin who creates also becomes tournament_manager (idempotent grant)", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      const tournamentId = await makeTournament(ctx, admin);

      await onTournamentCreated(ctx, { tournamentId, creatorId: admin });

      // No errors, row exists
      const row = await ctx.db
        .query("tournamentRoles")
        .withIndex("by_user_tournament_role", (q) =>
          q
            .eq("userId", admin)
            .eq("tournamentId", tournamentId)
            .eq("role", "tournament_manager"),
        )
        .first();
      expect(row).not.toBeNull();
    });
  });
});

describe("grantTournamentRole / revokeTournamentRole (internal helpers)", () => {
  test("grant is idempotent — no duplicate rows", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const user = await makeUser(ctx, "user");
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);

      await grantTournamentRole(ctx, {
        userId: user,
        tournamentId,
        role: "reviewer",
      });
      await grantTournamentRole(ctx, {
        userId: user,
        tournamentId,
        role: "reviewer",
      });

      const rows = await ctx.db
        .query("tournamentRoles")
        .withIndex("by_user_and_tournament", (q) =>
          q.eq("userId", user).eq("tournamentId", tournamentId),
        )
        .collect();
      expect(rows.length).toBe(1);
    });
  });

  test("revoke removes the role", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const user = await makeUser(ctx, "user");
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);

      await grantTournamentRole(ctx, {
        userId: user,
        tournamentId,
        role: "reviewer",
      });
      await ctx.db
        .query("tournamentRoles")
        .withIndex("by_user_and_tournament", (q) =>
          q.eq("userId", user).eq("tournamentId", tournamentId),
        )
        .first()
        .then((row) => expect(row).not.toBeNull());

      await revokeTournamentRole(ctx, {
        userId: user,
        tournamentId,
        role: "reviewer",
      });
      const row = await ctx.db
        .query("tournamentRoles")
        .withIndex("by_user_and_tournament", (q) =>
          q.eq("userId", user).eq("tournamentId", tournamentId),
        )
        .first();
      expect(row).toBeNull();
    });
  });
});

describe("computeTournamentPermissions flag bag", () => {
  test("admin gets full permissions", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");

      const perms = await computeTournamentPermissions(
        ctx,
        admin,
        tournamentId,
      );
      expect(perms.canView).toBe(true);
      expect(perms.canEdit).toBe(true);
      expect(perms.canDelete).toBe(true);
      expect(perms.canGrantRole).toBe(true);
      expect(perms.canRevokeRole).toBe(true);
    });
  });

  test("tournament_manager gets edit but not delete/grant/revoke", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );

      const perms = await computeTournamentPermissions(
        ctx,
        manager,
        tournamentId,
      );
      expect(perms.canView).toBe(true);
      expect(perms.canEdit).toBe(true);
      expect(perms.canDelete).toBe(false);
      expect(perms.canGrantRole).toBe(false);
      expect(perms.canRevokeRole).toBe(false);
    });
  });

  test("plain user gets view only", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const user = await makeUser(ctx, "user");

      const perms = await computeTournamentPermissions(ctx, user, tournamentId);
      expect(perms.canView).toBe(true);
      expect(perms.canEdit).toBe(false);
      expect(perms.canDelete).toBe(false);
      expect(perms.canGrantRole).toBe(false);
      expect(perms.canRevokeRole).toBe(false);
    });
  });
});
