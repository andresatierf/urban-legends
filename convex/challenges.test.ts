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

describe("challenges roster", () => {
  async function setupPendingWithTeams(t: ReturnType<typeof convexTest>) {
    return t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const otherTournamentId = await makeTournament(ctx, creator, "Other");
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      const alice = await makeUser(ctx, "alice");
      const bob = await makeUser(ctx, "bob");
      const outsider = await makeUser(ctx, "outsider");
      const teamRed = await ctx.db.insert("teams", {
        name: "Red",
        tournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });
      const teamBlue = await ctx.db.insert("teams", {
        name: "Blue",
        tournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });
      const teamOther = await ctx.db.insert("teams", {
        name: "Other",
        tournamentId: otherTournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });
      await ctx.db.insert("teamMembers", {
        teamId: teamRed,
        userId: alice,
        role: "member",
      });
      await ctx.db.insert("teamMembers", {
        teamId: teamBlue,
        userId: bob,
        role: "member",
      });
      await ctx.db.insert("teamMembers", {
        teamId: teamOther,
        userId: outsider,
        role: "member",
      });
      const challengeId = await ctx.db.insert("challenges", {
        tournamentId,
        createdBy: manager,
        description: "c",
        individualAmount: 1,
        teamAmount: 2,
        threshold: 1,
        state: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return {
        tournamentId,
        challengeId,
        manager,
        alice,
        bob,
        outsider,
      };
    });
  }

  test("manager can add users from different teams (roster spans teams)", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId, alice, bob, tournamentId } =
      await setupPendingWithTeams(t);

    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.addToRoster, { challengeId, userId: alice });
    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.addToRoster, { challengeId, userId: bob });

    const rows = await t
      .withIdentity({ subject: "manager" })
      .query(api.views.challenges.listByTournament, { tournamentId });
    const challenge = rows.find((r) => r._id === challengeId)!;
    const teamNames = new Set(challenge.roster.map((r) => r.teamName));
    expect(challenge.roster).toHaveLength(2);
    expect(teamNames).toEqual(new Set(["Red", "Blue"]));
  });

  test("manager can remove a user from the roster", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId, alice, tournamentId } = await setupPendingWithTeams(t);

    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.addToRoster, { challengeId, userId: alice });
    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.removeFromRoster, {
        challengeId,
        userId: alice,
      });

    const rows = await t
      .withIdentity({ subject: "manager" })
      .query(api.views.challenges.listByTournament, { tournamentId });
    const challenge = rows.find((r) => r._id === challengeId)!;
    expect(challenge.roster).toHaveLength(0);
  });

  test("add is idempotent (no duplicate roster entries)", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId, alice, tournamentId } = await setupPendingWithTeams(t);

    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.addToRoster, { challengeId, userId: alice });
    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.addToRoster, { challengeId, userId: alice });

    const rows = await t
      .withIdentity({ subject: "manager" })
      .query(api.views.challenges.listByTournament, { tournamentId });
    const challenge = rows.find((r) => r._id === challengeId)!;
    expect(challenge.roster).toHaveLength(1);
  });

  test("cannot add a user who is not a Player of this Tournament", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId, outsider } = await setupPendingWithTeams(t);

    await expect(
      t
        .withIdentity({ subject: "manager" })
        .mutation(api.challenges.addToRoster, {
          challengeId,
          userId: outsider,
        }),
    ).rejects.toThrow();
  });

  test("non-manager cannot add or remove", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId, alice } = await setupPendingWithTeams(t);

    await expect(
      t
        .withIdentity({ subject: "alice" })
        .mutation(api.challenges.addToRoster, {
          challengeId,
          userId: alice,
        }),
    ).rejects.toThrow();

    await expect(
      t
        .withIdentity({ subject: "alice" })
        .mutation(api.challenges.removeFromRoster, {
          challengeId,
          userId: alice,
        }),
    ).rejects.toThrow();
  });

  test("cannot add or remove on a non-pending Challenge", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId, alice } = await setupPendingWithTeams(t);
    await t.run(async (ctx) => {
      await ctx.db.patch(challengeId, { state: "approved" });
    });

    await expect(
      t
        .withIdentity({ subject: "manager" })
        .mutation(api.challenges.addToRoster, { challengeId, userId: alice }),
    ).rejects.toThrow();

    await expect(
      t
        .withIdentity({ subject: "manager" })
        .mutation(api.challenges.removeFromRoster, {
          challengeId,
          userId: alice,
        }),
    ).rejects.toThrow();
  });

  test("admin can add and remove on any tournament", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId, alice, tournamentId } = await setupPendingWithTeams(t);
    await t.run(async (ctx) => {
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
    });

    await t
      .withIdentity({ subject: "admin" })
      .mutation(api.challenges.addToRoster, { challengeId, userId: alice });
    const rows = await t
      .withIdentity({ subject: "admin" })
      .query(api.views.challenges.listByTournament, { tournamentId });
    expect(rows.find((r) => r._id === challengeId)!.roster).toHaveLength(1);
  });
});

describe("views/challenges.tournamentPlayers", () => {
  test("returns all Players across all Teams in the tournament, sorted by name", async () => {
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
      const alice = await makeUser(ctx, "alice");
      const bob = await makeUser(ctx, "bob");
      const teamRed = await ctx.db.insert("teams", {
        name: "Red",
        tournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });
      const teamBlue = await ctx.db.insert("teams", {
        name: "Blue",
        tournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });
      await ctx.db.insert("teamMembers", {
        teamId: teamRed,
        userId: alice,
        role: "member",
      });
      await ctx.db.insert("teamMembers", {
        teamId: teamBlue,
        userId: bob,
        role: "member",
      });
      return { tournamentId };
    });

    const players = await t
      .withIdentity({ subject: "manager" })
      .query(api.views.challenges.tournamentPlayers, { tournamentId });
    expect(players.map((p) => p.name)).toEqual(["alice", "bob"]);
  });

  test("plain member is denied", async () => {
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
        .query(api.views.challenges.tournamentPlayers, { tournamentId }),
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
