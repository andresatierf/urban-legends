import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { canManageChallenge } from "./core";

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

describe("canManageChallenge", () => {
  test("tournament_manager of that tournament is granted", async () => {
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
        await canManageChallenge.check(ctx, manager, { tournamentId }),
      ).toBe(true);
    });
  });

  test("plain member is denied", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const player = await makeUser(ctx, "player");
      expect(
        await canManageChallenge.check(ctx, player, { tournamentId }),
      ).toBe(false);
    });
  });

  test("tournament_manager of a different tournament is denied (isolation)", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentA = await makeTournament(ctx, creator, "A");
      const tournamentB = await makeTournament(ctx, creator, "B");
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(ctx, manager, tournamentB, "tournament_manager");
      expect(
        await canManageChallenge.check(ctx, manager, {
          tournamentId: tournamentA,
        }),
      ).toBe(false);
    });
  });

  test("reviewer of that tournament is denied (managers only)", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const reviewer = await makeUser(ctx, "reviewer");
      await giveTournamentRole(ctx, reviewer, tournamentId, "reviewer");
      expect(
        await canManageChallenge.check(ctx, reviewer, { tournamentId }),
      ).toBe(false);
    });
  });

  test("admin is granted on any tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const admin = await makeUser(ctx, "admin");
      await giveSystemRole(ctx, admin, "admin");
      expect(await canManageChallenge.check(ctx, admin, { tournamentId })).toBe(
        true,
      );
    });
  });

  test("dev is granted on any tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const dev = await makeUser(ctx, "dev");
      await giveSystemRole(ctx, dev, "dev");
      expect(await canManageChallenge.check(ctx, dev, { tournamentId })).toBe(
        true,
      );
    });
  });
});
