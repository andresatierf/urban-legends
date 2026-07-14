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
        date: "2024-06-01",
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
        date: "2024-06-01",
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
        date: "2024-06-01",
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
        date: "2024-06-01",
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
        date: "2024-06-01",
        individualAmount: 1,
        teamAmount: 2,
      });
    expect(id).toBeDefined();
  });

  test("date is stored and rejected when outside the tournament window", async () => {
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
        date: "2024-06-15",
        individualAmount: 1,
        teamAmount: 2,
      });
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.date?.slice(0, 10)).toBe("2024-06-15");

    await expect(
      t.withIdentity({ subject: "manager" }).mutation(api.challenges.create, {
        tournamentId,
        description: "d",
        date: "2023-12-31",
        individualAmount: 1,
        teamAmount: 2,
      }),
    ).rejects.toThrow(/tournament window/);

    await expect(
      t.withIdentity({ subject: "manager" }).mutation(api.challenges.create, {
        tournamentId,
        description: "d",
        date: "",
        individualAmount: 1,
        teamAmount: 2,
      }),
    ).rejects.toThrow(/required/);
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
        date: "2024-06-01",
        individualAmount: -1,
        teamAmount: 2,
      }),
    ).rejects.toThrow();

    await expect(
      t.withIdentity({ subject: "manager" }).mutation(api.challenges.create, {
        tournamentId,
        description: "d",
        date: "2024-06-01",
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
        date: "2024-06-01",
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
        date: "2024-06-01",
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
        date: "2024-06-01",
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
        date: "2024-06-01",
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

describe("challenges.approve", () => {
  type World = {
    tournamentId: Id<"tournaments">;
    manager: Id<"users">;
    teamSmall: Id<"teams">;
    teamMid: Id<"teams">;
    teamLarge: Id<"teams">;
    teamEmpty: Id<"teams">;
    small1: Id<"users">;
    mid1: Id<"users">;
    mid2: Id<"users">;
    mid3: Id<"users">;
    large1: Id<"users">;
  };

  async function seedMultiTeam(
    t: ReturnType<typeof convexTest>,
  ): Promise<World> {
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

      const teamSmall = await ctx.db.insert("teams", {
        name: "Small",
        tournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });
      const teamMid = await ctx.db.insert("teams", {
        name: "Mid",
        tournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });
      const teamLarge = await ctx.db.insert("teams", {
        name: "Large",
        tournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });
      const teamEmpty = await ctx.db.insert("teams", {
        name: "Empty",
        tournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });

      const small1 = await makeUser(ctx, "small1");
      await ctx.db.insert("teamMembers", {
        teamId: teamSmall,
        userId: small1,
        role: "member",
      });

      const mid1 = await makeUser(ctx, "mid1");
      const mid2 = await makeUser(ctx, "mid2");
      const mid3 = await makeUser(ctx, "mid3");
      for (const u of [mid1, mid2, mid3]) {
        await ctx.db.insert("teamMembers", {
          teamId: teamMid,
          userId: u,
          role: "member",
        });
      }

      const large1 = await makeUser(ctx, "large1");
      for (let i = 0; i < 5; i++) {
        const uid = i === 0 ? large1 : await makeUser(ctx, `large${i + 1}`);
        await ctx.db.insert("teamMembers", {
          teamId: teamLarge,
          userId: uid,
          role: "member",
        });
      }

      return {
        tournamentId,
        manager,
        teamSmall,
        teamMid,
        teamLarge,
        teamEmpty,
        small1,
        mid1,
        mid2,
        mid3,
        large1,
      };
    });
  }

  async function insertChallenge(
    t: ReturnType<typeof convexTest>,
    tournamentId: Id<"tournaments">,
    manager: Id<"users">,
    individualAmount: number,
    teamAmount: number,
    threshold: number,
  ): Promise<Id<"challenges">> {
    return t.run((ctx) =>
      ctx.db.insert("challenges", {
        tournamentId,
        createdBy: manager,
        description: "c",
        date: "2024-06-01",
        individualAmount,
        teamAmount,
        threshold,
        state: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  test("awards team amount when roster rate ≥ threshold; individual amount otherwise; zero-roster teams unchanged", async () => {
    const t = convexTest(schemaForTest);
    const world = await seedMultiTeam(t);
    const challengeId = await insertChallenge(
      t,
      world.tournamentId,
      world.manager,
      3, // individual
      20, // team
      1, // whole-team threshold
    );

    // Small: 1/1 → full → team amount
    // Mid: 2/3 → 0.667 → individual amount
    // Large: 1/5 → 0.2 → individual amount
    // Empty: 0/0 → unchanged
    await t.run(async (ctx) => {
      await ctx.db.insert("challengeRosterEntries", {
        challengeId,
        userId: world.small1,
        tournamentId: world.tournamentId,
        addedBy: world.manager,
        createdAt: new Date().toISOString(),
      });
      await ctx.db.insert("challengeRosterEntries", {
        challengeId,
        userId: world.mid1,
        tournamentId: world.tournamentId,
        addedBy: world.manager,
        createdAt: new Date().toISOString(),
      });
      await ctx.db.insert("challengeRosterEntries", {
        challengeId,
        userId: world.mid2,
        tournamentId: world.tournamentId,
        addedBy: world.manager,
        createdAt: new Date().toISOString(),
      });
      await ctx.db.insert("challengeRosterEntries", {
        challengeId,
        userId: world.large1,
        tournamentId: world.tournamentId,
        addedBy: world.manager,
        createdAt: new Date().toISOString(),
      });
    });

    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.approve, { challengeId });

    const [small, mid, large, empty] = await t.run(async (ctx) => [
      await ctx.db.get(world.teamSmall),
      await ctx.db.get(world.teamMid),
      await ctx.db.get(world.teamLarge),
      await ctx.db.get(world.teamEmpty),
    ]);
    expect(small?.points).toBe(20);
    expect(mid?.points).toBe(3);
    expect(large?.points).toBe(3);
    expect(empty?.points).toBe(0);

    const challenge = await t.run((ctx) => ctx.db.get(challengeId));
    expect(challenge?.state).toBe("approved");
  });

  test("custom threshold of 0.5 awards team amount at exactly that rate", async () => {
    const t = convexTest(schemaForTest);
    const world = await seedMultiTeam(t);
    const challengeId = await insertChallenge(
      t,
      world.tournamentId,
      world.manager,
      2,
      10,
      0.5,
    );

    // Mid: 2/3 ≈ 0.667 ≥ 0.5 → team amount
    // Large: 1/5 = 0.2 < 0.5 → individual amount
    await t.run(async (ctx) => {
      for (const uid of [world.mid1, world.mid2]) {
        await ctx.db.insert("challengeRosterEntries", {
          challengeId,
          userId: uid,
          tournamentId: world.tournamentId,
          addedBy: world.manager,
          createdAt: new Date().toISOString(),
        });
      }
      await ctx.db.insert("challengeRosterEntries", {
        challengeId,
        userId: world.large1,
        tournamentId: world.tournamentId,
        addedBy: world.manager,
        createdAt: new Date().toISOString(),
      });
    });

    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.approve, { challengeId });

    const [mid, large] = await t.run(async (ctx) => [
      await ctx.db.get(world.teamMid),
      await ctx.db.get(world.teamLarge),
    ]);
    expect(mid?.points).toBe(10);
    expect(large?.points).toBe(2);
  });

  test("challenge points stack on top of approved-Activity points", async () => {
    const t = convexTest(schemaForTest);
    const world = await seedMultiTeam(t);

    // Seed one approved activity worth 7 on teamSmall.
    await t.run(async (ctx) => {
      await ctx.db.insert("activities", {
        teamId: world.teamSmall,
        tournamentId: world.tournamentId,
        createdBy: world.manager,
        date: "2024-06-01",
        type: "individual",
        tier: "base",
        state: "approved",
        pointsEarned: 7,
        participantCount: 1,
        totalTeamMembers: 1,
        participationRate: 1,
        isTeamExercise: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    const challengeId = await insertChallenge(
      t,
      world.tournamentId,
      world.manager,
      3,
      20,
      1,
    );
    await t.run(async (ctx) => {
      await ctx.db.insert("challengeRosterEntries", {
        challengeId,
        userId: world.small1,
        tournamentId: world.tournamentId,
        addedBy: world.manager,
        createdAt: new Date().toISOString(),
      });
    });

    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.approve, { challengeId });

    const small = await t.run((ctx) => ctx.db.get(world.teamSmall));
    expect(small?.points).toBe(27);
  });

  test("cannot approve a non-pending Challenge; unauthorized users are rejected", async () => {
    const t = convexTest(schemaForTest);
    const world = await seedMultiTeam(t);
    const challengeId = await insertChallenge(
      t,
      world.tournamentId,
      world.manager,
      1,
      2,
      1,
    );
    await t.run(async (ctx) => {
      await makeUser(ctx, "outsider");
    });

    await expect(
      t
        .withIdentity({ subject: "outsider" })
        .mutation(api.challenges.approve, { challengeId }),
    ).rejects.toThrow();

    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.approve, { challengeId });

    await expect(
      t
        .withIdentity({ subject: "manager" })
        .mutation(api.challenges.approve, { challengeId }),
    ).rejects.toThrow();
  });
});

describe("challenges.remove", () => {
  async function setupWorld(t: ReturnType<typeof convexTest>) {
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
      const teamA = await ctx.db.insert("teams", {
        name: "A",
        tournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });
      const teamB = await ctx.db.insert("teams", {
        name: "B",
        tournamentId,
        createdBy: manager,
        joinPolicy: "open",
        points: 0,
      });
      const alice = await makeUser(ctx, "alice");
      const bob = await makeUser(ctx, "bob");
      await ctx.db.insert("teamMembers", {
        teamId: teamA,
        userId: alice,
        role: "member",
      });
      await ctx.db.insert("teamMembers", {
        teamId: teamB,
        userId: bob,
        role: "member",
      });
      return { tournamentId, manager, teamA, teamB, alice, bob };
    });
  }

  test("deleting a pending Challenge removes it with no effect on standings", async () => {
    const t = convexTest(schemaForTest);
    const world = await setupWorld(t);
    // Seed an approved activity worth 5 on teamA — establishes non-zero baseline.
    await t.run(async (ctx) => {
      await ctx.db.insert("activities", {
        teamId: world.teamA,
        tournamentId: world.tournamentId,
        createdBy: world.manager,
        date: "2024-06-01",
        type: "individual",
        tier: "base",
        state: "approved",
        pointsEarned: 5,
        participantCount: 1,
        totalTeamMembers: 1,
        participationRate: 1,
        isTeamExercise: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await ctx.db.patch(world.teamA, { points: 5 });
    });

    const pendingId = await t.run((ctx) =>
      ctx.db.insert("challenges", {
        tournamentId: world.tournamentId,
        createdBy: world.manager,
        description: "pending",
        date: "2024-06-01",
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );

    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.remove, { challengeId: pendingId });

    const [row, teamA] = await t.run(async (ctx) => [
      await ctx.db.get(pendingId),
      await ctx.db.get(world.teamA),
    ]);
    expect(row).toBeNull();
    expect(teamA?.points).toBe(5);
  });

  test("deleting an approved Challenge rolls back its awarded points", async () => {
    const t = convexTest(schemaForTest);
    const world = await setupWorld(t);
    // Seed approved Activity worth 7 on teamA (survives deletion).
    await t.run(async (ctx) => {
      await ctx.db.insert("activities", {
        teamId: world.teamA,
        tournamentId: world.tournamentId,
        createdBy: world.manager,
        date: "2024-06-01",
        type: "individual",
        tier: "base",
        state: "approved",
        pointsEarned: 7,
        participantCount: 1,
        totalTeamMembers: 1,
        participationRate: 1,
        isTeamExercise: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Challenge #1 (to be deleted): full team roster on A, awards teamAmount = 20.
    const c1 = await t.run((ctx) =>
      ctx.db.insert("challenges", {
        tournamentId: world.tournamentId,
        createdBy: world.manager,
        description: "c1",
        date: "2024-06-01",
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    await t.run(async (ctx) => {
      await ctx.db.insert("challengeRosterEntries", {
        challengeId: c1,
        userId: world.alice,
        tournamentId: world.tournamentId,
        addedBy: world.manager,
        createdAt: new Date().toISOString(),
      });
      await ctx.db.insert("challengeRosterEntries", {
        challengeId: c1,
        userId: world.bob,
        tournamentId: world.tournamentId,
        addedBy: world.manager,
        createdAt: new Date().toISOString(),
      });
    });

    // Challenge #2 (kept): full roster on A only, awards teamAmount = 4.
    const c2 = await t.run((ctx) =>
      ctx.db.insert("challenges", {
        tournamentId: world.tournamentId,
        createdBy: world.manager,
        description: "c2",
        date: "2024-06-01",
        individualAmount: 1,
        teamAmount: 4,
        threshold: 1,
        state: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    await t.run(async (ctx) => {
      await ctx.db.insert("challengeRosterEntries", {
        challengeId: c2,
        userId: world.alice,
        tournamentId: world.tournamentId,
        addedBy: world.manager,
        createdAt: new Date().toISOString(),
      });
    });

    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.approve, { challengeId: c1 });
    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.approve, { challengeId: c2 });

    // Before delete: A = 7 (activity) + 20 (c1) + 4 (c2) = 31; B = 20 (c1).
    let [teamA, teamB] = await t.run(async (ctx) => [
      await ctx.db.get(world.teamA),
      await ctx.db.get(world.teamB),
    ]);
    expect(teamA?.points).toBe(31);
    expect(teamB?.points).toBe(20);

    await t
      .withIdentity({ subject: "manager" })
      .mutation(api.challenges.remove, { challengeId: c1 });

    // After delete of c1: A = 7 + 4 = 11; B = 0.
    [teamA, teamB] = await t.run(async (ctx) => [
      await ctx.db.get(world.teamA),
      await ctx.db.get(world.teamB),
    ]);
    expect(teamA?.points).toBe(11);
    expect(teamB?.points).toBe(0);

    // Roster entries for c1 are gone.
    const remainingRoster = await t.run((ctx) =>
      ctx.db
        .query("challengeRosterEntries")
        .withIndex("by_challenge", (q) => q.eq("challengeId", c1))
        .collect(),
    );
    expect(remainingRoster).toHaveLength(0);
    const gone = await t.run((ctx) => ctx.db.get(c1));
    expect(gone).toBeNull();
  });

  test("non-manager cannot delete", async () => {
    const t = convexTest(schemaForTest);
    const world = await setupWorld(t);
    const challengeId = await t.run((ctx) =>
      ctx.db.insert("challenges", {
        tournamentId: world.tournamentId,
        createdBy: world.manager,
        description: "c",
        date: "2024-06-01",
        individualAmount: 1,
        teamAmount: 2,
        threshold: 1,
        state: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );

    await expect(
      t
        .withIdentity({ subject: "alice" })
        .mutation(api.challenges.remove, { challengeId }),
    ).rejects.toThrow();
  });
});
