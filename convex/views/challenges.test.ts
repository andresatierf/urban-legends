import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

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
    email: `${externalId}@t.com`,
    name: externalId,
    externalId,
  });
}

async function makeTournament(ctx: Ctx, creatorId: Id<"users">) {
  return ctx.db.insert("tournaments", {
    name: "T",
    description: "T",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    createdBy: creatorId,
    scoringConfig,
  });
}

async function makeTeam(
  ctx: Ctx,
  tournamentId: Id<"tournaments">,
  createdBy: Id<"users">,
  name: string,
) {
  return ctx.db.insert("teams", {
    name,
    tournamentId,
    createdBy,
    joinPolicy: "open",
    points: 0,
  });
}

async function addToTeam(ctx: Ctx, teamId: Id<"teams">, userId: Id<"users">) {
  await ctx.db.insert("teamMembers", { teamId, userId, role: "member" });
}

async function giveTournamentRole(
  ctx: Ctx,
  userId: Id<"users">,
  tournamentId: Id<"tournaments">,
  role: "tournament_manager" | "reviewer",
) {
  await ctx.db.insert("tournamentRoles", { userId, tournamentId, role });
}

async function insertChallenge(
  ctx: Ctx,
  tournamentId: Id<"tournaments">,
  createdBy: Id<"users">,
  args: {
    individualAmount: number;
    teamAmount: number;
    threshold: number;
    state: "pending" | "approved";
  },
) {
  return ctx.db.insert("challenges", {
    tournamentId,
    createdBy,
    description: "c",
    individualAmount: args.individualAmount,
    teamAmount: args.teamAmount,
    threshold: args.threshold,
    state: args.state,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

async function addRosterEntry(
  ctx: Ctx,
  challengeId: Id<"challenges">,
  userId: Id<"users">,
  tournamentId: Id<"tournaments">,
  addedBy: Id<"users">,
) {
  await ctx.db.insert("challengeRosterEntries", {
    challengeId,
    userId,
    tournamentId,
    addedBy,
    createdAt: new Date().toISOString(),
  });
}

describe("views/challenges.getDetails", () => {
  test("a Player of the tournament can load the view", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      const player = await makeUser(ctx, "player");
      const team = await makeTeam(ctx, tournamentId, manager, "Red");
      await addToTeam(ctx, team, player);
      const challengeId = await insertChallenge(ctx, tournamentId, manager, {
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "pending",
      });
      return { challengeId };
    });

    const view = await t
      .withIdentity({ subject: "player" })
      .query(api.views.challenges.getDetails, { challengeId });
    expect(view.challenge._id).toBe(challengeId);
    expect(view.canManage).toBe(false);
  });

  test("a non-participant is denied", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      await makeUser(ctx, "outsider");
      const challengeId = await insertChallenge(ctx, tournamentId, manager, {
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "pending",
      });
      return { challengeId };
    });

    await expect(
      t
        .withIdentity({ subject: "outsider" })
        .query(api.views.challenges.getDetails, { challengeId }),
    ).rejects.toThrow();
  });

  test("approved Challenge: per-team awards match the shared award rule", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId, teamSmall, teamMid } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );

      const teamSmall = await makeTeam(ctx, tournamentId, manager, "Small");
      const small1 = await makeUser(ctx, "small1");
      await addToTeam(ctx, teamSmall, small1);

      const teamMid = await makeTeam(ctx, tournamentId, manager, "Mid");
      const mid1 = await makeUser(ctx, "mid1");
      const mid2 = await makeUser(ctx, "mid2");
      const mid3 = await makeUser(ctx, "mid3");
      for (const u of [mid1, mid2, mid3]) {
        await addToTeam(ctx, teamMid, u);
      }

      const challengeId = await insertChallenge(ctx, tournamentId, manager, {
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "approved",
      });
      // Small: 1/1 → team amount (20). Mid: 1/3 → individual amount (3).
      await addRosterEntry(ctx, challengeId, small1, tournamentId, manager);
      await addRosterEntry(ctx, challengeId, mid1, tournamentId, manager);
      return { challengeId, teamSmall, teamMid };
    });

    const view = await t
      .withIdentity({ subject: "manager" })
      .query(api.views.challenges.getDetails, { challengeId });
    const small = view.teamAwards.find((a) => a.teamId === teamSmall)!;
    const mid = view.teamAwards.find((a) => a.teamId === teamMid)!;
    expect(small.amount).toBe(20);
    expect(small.isTeamAward).toBe(true);
    expect(small.participantCount).toBe(1);
    expect(small.teamSize).toBe(1);
    expect(mid.amount).toBe(3);
    expect(mid.isTeamAward).toBe(false);
    expect(mid.participantCount).toBe(1);
    expect(mid.teamSize).toBe(3);
    expect(view.canManage).toBe(true);
  });

  test("pending Challenge: teamAwards report participation with zero amounts", async () => {
    const t = convexTest(schemaForTest);
    const { challengeId, teamSmall } = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const tournamentId = await makeTournament(ctx, creator);
      const manager = await makeUser(ctx, "manager");
      await giveTournamentRole(
        ctx,
        manager,
        tournamentId,
        "tournament_manager",
      );
      const teamSmall = await makeTeam(ctx, tournamentId, manager, "Small");
      const small1 = await makeUser(ctx, "small1");
      await addToTeam(ctx, teamSmall, small1);

      const challengeId = await insertChallenge(ctx, tournamentId, manager, {
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "pending",
      });
      await addRosterEntry(ctx, challengeId, small1, tournamentId, manager);
      return { challengeId, teamSmall };
    });

    const view = await t
      .withIdentity({ subject: "manager" })
      .query(api.views.challenges.getDetails, { challengeId });
    const small = view.teamAwards.find((a) => a.teamId === teamSmall)!;
    expect(small.amount).toBe(0);
    expect(small.participantCount).toBe(1);
    expect(small.teamSize).toBe(1);
  });
});
