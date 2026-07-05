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

async function makeTournament(ctx: Ctx, creatorId: Id<"users">, name = "T") {
  return ctx.db.insert("tournaments", {
    name,
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

describe("challenges.create", () => {
  test("tournament_manager can create a Challenge on their tournament", async () => {
    const t = convexTest(schemaForTest);
    const { tournamentId } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      return { tournamentId };
    });

    const id = await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.create, {
        tournamentId,
        description: "Do the thing",
        individualAmount: 5,
        teamAmount: 20,
      });

    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.state).toBe("pending");
    expect(row?.description).toBe("Do the thing");
    expect(row?.individualAmount).toBe(5);
    expect(row?.teamAmount).toBe(20);
    expect(row?.threshold).toBe(1);
  });

  test("threshold defaults to 1 (whole team) when omitted", async () => {
    const t = convexTest(schemaForTest);
    const { tournamentId } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      return { tournamentId };
    });

    const id = await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.create, {
        tournamentId,
        description: "d",
        individualAmount: 1,
        teamAmount: 2,
      });

    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.threshold).toBe(1);
  });

  test("plain member cannot create", async () => {
    const t = convexTest(schemaForTest);
    const { tournamentId } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      await makeUser(ctx, "player");
      return { tournamentId };
    });

    await expect(
      t.withIdentity({ subject: "player" }).mutation(api.challenges.create, {
        tournamentId,
        description: "d",
        individualAmount: 1,
        teamAmount: 2,
      }),
    ).rejects.toThrow();
  });

  test("manager of a different tournament cannot create", async () => {
    const t = convexTest(schemaForTest);
    const { tournamentA } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentA = await makeTournament(ctx, creator, "A");
      const tournamentB = await makeTournament(ctx, creator, "B");
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(ctx, manager, tournamentB, "tournament_manager");
      return { tournamentA };
    });

    await expect(
      t.withIdentity({ subject: "manager" }).mutation(api.challenges.create, {
        tournamentId: tournamentA,
        description: "d",
        individualAmount: 1,
        teamAmount: 2,
      }),
    ).rejects.toThrow();
  });

  test("admin can create a Challenge on any tournament", async () => {
    const t = convexTest(schemaForTest);
    const { tournamentId } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      return { tournamentId };
    });

    const id = await t
      .withIdentity({ subject: "admin" })
      .mutation(api.challenges.create, {
        tournamentId,
        description: "d",
        individualAmount: 1,
        teamAmount: 2,
      });
    expect(id).toBeDefined();
  });

  test("rejects negative amounts and out-of-range thresholds", async () => {
    const t = convexTest(schemaForTest);
    const { tournamentId } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      return { tournamentId };
    });

    await expect(
      t.withIdentity({ subject: "manager" }).mutation(api.challenges.create, {
        tournamentId,
        description: "d",
        individualAmount: -1,
        teamAmount: 2,
      }),
    ).rejects.toThrow();

    await expect(
      t.withIdentity({ subject: "manager" }).mutation(api.challenges.create, {
        tournamentId,
        description: "d",
        individualAmount: 1,
        teamAmount: 2,
        threshold: 1.5,
      }),
    ).rejects.toThrow();
  });
});

describe("challenges.edit", () => {
  async function createPendingChallenge(t: ReturnType<typeof convexTest>) {
    return t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      const challengeId = await ctx.db.insert("challenges", {
        tournamentId,
        createdBy: manager,
        description: "orig",
        individualAmount: 1,
        teamAmount: 2,
        threshold: 1,
        state: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { tournamentId, challengeId };
    });
  }

  test("tournament_manager edits description/amounts/threshold", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId } = await createPendingChallenge(t);

    await t.withIdentity({ subject: "manager" }).mutation(api.challenges.edit, {
      challengeId,
      description: "updated",
      individualAmount: 10,
      teamAmount: 40,
      threshold: 0.5,
    });

    const row = await t.run((ctx) => ctx.db.get(challengeId));
    expect(row?.description).toBe("updated");
    expect(row?.individualAmount).toBe(10);
    expect(row?.teamAmount).toBe(40);
    expect(row?.threshold).toBe(0.5);
  });

  test("non-manager cannot edit", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId } = await createPendingChallenge(t);
    await t.run(async (ctx) => {
      await makeUser(ctx, "outsider");
    });

    await expect(
      t
        .withIdentity({ subject: "outsider" })
        .mutation(api.challenges.edit, { challengeId, description: "x" }),
    ).rejects.toThrow();
  });

  test("edit rejects non-pending Challenges", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId } = await createPendingChallenge(t);
    await t.run(async (ctx) => {
      await ctx.db.patch(challengeId, { state: "approved" });
    });

    await expect(
      t
        .withIdentity({ subject: "manager" })
        .mutation(api.challenges.edit, { challengeId, description: "x" }),
    ).rejects.toThrow();
  });
});

describe("views/challenges.listByTournament", () => {
  test("tournament_manager sees their tournament's Challenges (newest first)", async () => {
    const t = convexTest(schemaForTest);
    const { tournamentId } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      await ctx.db.insert("challenges", {
        tournamentId,
        createdBy: manager,
        description: "first",
        individualAmount: 1,
        teamAmount: 2,
        threshold: 1,
        state: "pending",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
      await ctx.db.insert("challenges", {
        tournamentId,
        createdBy: manager,
        description: "second",
        individualAmount: 1,
        teamAmount: 2,
        threshold: 1,
        state: "pending",
        createdAt: "2024-02-01T00:00:00.000Z",
        updatedAt: "2024-02-01T00:00:00.000Z",
      });
      return { tournamentId };
    });

    const rows = await t
      .withIdentity({ subject: "manager" })
      .query(api.views.challenges.listByTournament, { tournamentId });

    expect(rows).toHaveLength(2);
    expect(rows[0].description).toBe("second");
    expect(rows[1].description).toBe("first");
  });

  test("plain member cannot list", async () => {
    const t = convexTest(schemaForTest);
    const { tournamentId } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      await makeUser(ctx, "player");
      return { tournamentId };
    });

    await expect(
      t
        .withIdentity({ subject: "player" })
        .query(api.views.challenges.listByTournament, { tournamentId }),
    ).rejects.toThrow();
  });
});
