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

describe("views.activities.myFeed", () => {
  test("rostered viewer on approved Challenge with team above threshold sees team amount", async () => {
    const t = convexTest(schemaForTest);
    const ids = await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const viewer = await makeUser(ctx, "viewer");
      const tournamentId = await makeTournament(ctx, creator);
      const teamId = await makeTeam(ctx, tournamentId, creator, "Small");
      await addToTeam(ctx, teamId, viewer);
      const challengeId = await insertChallenge(ctx, tournamentId, creator, {
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "approved",
      });
      await addRosterEntry(ctx, challengeId, viewer, tournamentId, creator);
      return { challengeId, teamId };
    });

    const feed = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.activities.myFeed, {});
    expect(feed).toHaveLength(1);
    const item = feed[0];
    expect(item.kind).toBe("challenge");
    if (item.kind !== "challenge") throw new Error("expected challenge");
    expect(item.challenge._id).toBe(ids.challengeId);
    expect(item.team._id).toBe(ids.teamId);
    expect(item.award).toEqual({ amount: 20, isTeamAward: true });
  });

  test("rostered viewer on approved Challenge with team below threshold sees individual amount", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const viewer = await makeUser(ctx, "viewer");
      const other1 = await makeUser(ctx, "other1");
      const other2 = await makeUser(ctx, "other2");
      const tournamentId = await makeTournament(ctx, creator);
      const teamId = await makeTeam(ctx, tournamentId, creator, "Big");
      await addToTeam(ctx, teamId, viewer);
      await addToTeam(ctx, teamId, other1);
      await addToTeam(ctx, teamId, other2);
      const challengeId = await insertChallenge(ctx, tournamentId, creator, {
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "approved",
      });
      await addRosterEntry(ctx, challengeId, viewer, tournamentId, creator);
    });

    const feed = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.activities.myFeed, {});
    expect(feed).toHaveLength(1);
    const item = feed[0];
    if (item.kind !== "challenge") throw new Error("expected challenge");
    expect(item.award).toEqual({ amount: 3, isTeamAward: false });
  });

  test("pending Challenge shows the viewer no points", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const viewer = await makeUser(ctx, "viewer");
      const tournamentId = await makeTournament(ctx, creator);
      const teamId = await makeTeam(ctx, tournamentId, creator, "Small");
      await addToTeam(ctx, teamId, viewer);
      const challengeId = await insertChallenge(ctx, tournamentId, creator, {
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "pending",
      });
      await addRosterEntry(ctx, challengeId, viewer, tournamentId, creator);
    });

    const feed = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.activities.myFeed, {});
    expect(feed).toHaveLength(1);
    const item = feed[0];
    if (item.kind !== "challenge") throw new Error("expected challenge");
    expect(item.challenge.state).toBe("pending");
    expect(item.award).toBeNull();
  });

  test("non-rostered viewer sees nothing for that Challenge", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const viewer = await makeUser(ctx, "viewer");
      const rostered = await makeUser(ctx, "rostered");
      const tournamentId = await makeTournament(ctx, creator);
      const teamId = await makeTeam(ctx, tournamentId, creator, "Small");
      await addToTeam(ctx, teamId, viewer);
      await addToTeam(ctx, teamId, rostered);
      const challengeId = await insertChallenge(ctx, tournamentId, creator, {
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "approved",
      });
      await addRosterEntry(ctx, challengeId, rostered, tournamentId, creator);
    });

    const feed = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.activities.myFeed, {});
    expect(feed).toHaveLength(0);
  });

  test("interleaves Challenges with the viewer's Activities in a single sorted feed", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const viewer = await makeUser(ctx, "viewer");
      const tournamentId = await makeTournament(ctx, creator);
      const teamId = await makeTeam(ctx, tournamentId, creator, "Small");
      await addToTeam(ctx, teamId, viewer);

      const activityId = await ctx.db.insert("activities", {
        teamId,
        tournamentId,
        createdBy: viewer,
        date: "2024-06-15T00:00:00.000Z",
        type: "individual",
        tier: "base",
        state: "approved",
        pointsEarned: 1,
        participantCount: 1,
        totalTeamMembers: 1,
        participationRate: 1,
        isTeamExercise: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await ctx.db.insert("participations", {
        activityId,
        userId: viewer,
        teamId,
        tournamentId,
        evidenceStorageIds: [],
        fulfilledAt: new Date().toISOString(),
        pointsEarned: 1,
        createdAt: new Date().toISOString(),
      });

      // Challenge approved later than the activity date, so it sorts first.
      const later = "2024-08-01T12:00:00.000Z";
      const challengeId = await ctx.db.insert("challenges", {
        tournamentId,
        createdBy: creator,
        description: "c",
        individualAmount: 3,
        teamAmount: 20,
        threshold: 1,
        state: "approved",
        createdAt: "2024-07-01T00:00:00.000Z",
        updatedAt: later,
      });
      await addRosterEntry(ctx, challengeId, viewer, tournamentId, creator);
    });

    const feed = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.activities.myFeed, {});
    expect(feed).toHaveLength(2);
    expect(feed[0].kind).toBe("challenge");
    expect(feed[1].kind).toBe("activity");
  });

  test("user with no roster entries sees an activities-only feed", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "creator");
      const viewer = await makeUser(ctx, "viewer");
      const tournamentId = await makeTournament(ctx, creator);
      const teamId = await makeTeam(ctx, tournamentId, creator, "Small");
      await addToTeam(ctx, teamId, viewer);

      const activityId = await ctx.db.insert("activities", {
        teamId,
        tournamentId,
        createdBy: viewer,
        date: "2024-06-15T00:00:00.000Z",
        type: "individual",
        tier: "base",
        state: "approved",
        pointsEarned: 1,
        participantCount: 1,
        totalTeamMembers: 1,
        participationRate: 1,
        isTeamExercise: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await ctx.db.insert("participations", {
        activityId,
        userId: viewer,
        teamId,
        tournamentId,
        evidenceStorageIds: [],
        fulfilledAt: new Date().toISOString(),
        pointsEarned: 1,
        createdAt: new Date().toISOString(),
      });
    });

    const feed = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.activities.myFeed, {});
    expect(feed).toHaveLength(1);
    expect(feed[0].kind).toBe("activity");
  });

  test("group activity reports participants and who has provided evidence", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const creator = await makeUser(ctx, "viewer");
      const mate = await makeUser(ctx, "mate");
      const tournamentId = await makeTournament(ctx, creator);
      const teamId = await makeTeam(ctx, tournamentId, creator, "Team");
      await addToTeam(ctx, teamId, creator);
      await addToTeam(ctx, teamId, mate);

      const activityId = await ctx.db.insert("activities", {
        teamId,
        tournamentId,
        createdBy: creator,
        date: "2024-06-15T00:00:00.000Z",
        type: "group",
        tier: "base",
        state: "pending",
        pointsEarned: 3,
        participantCount: 2,
        totalTeamMembers: 2,
        participationRate: 1,
        isTeamExercise: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      // Creator provided evidence; teammate has not yet.
      await ctx.db.insert("participations", {
        activityId,
        userId: creator,
        teamId,
        tournamentId,
        evidenceStorageIds: ["kg2abcdef123" as Id<"_storage">],
        fulfilledAt: new Date().toISOString(),
        pointsEarned: 3,
        createdAt: new Date().toISOString(),
      });
      await ctx.db.insert("participations", {
        activityId,
        userId: mate,
        teamId,
        tournamentId,
        evidenceStorageIds: [],
        pointsEarned: 0,
        createdAt: new Date().toISOString(),
      });
    });

    const feed = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.activities.myFeed, {});
    expect(feed).toHaveLength(1);
    const item = feed[0];
    if (item.kind !== "activity") throw new Error("expected activity");
    expect(item.participants).toHaveLength(2);
    // Creator sorts first and is flagged as such.
    expect(item.participants[0]).toMatchObject({
      name: "viewer",
      isCreator: true,
      hasEvidence: true,
      fulfilled: true,
    });
    expect(item.participants[1]).toMatchObject({
      name: "mate",
      isCreator: false,
      hasEvidence: false,
      fulfilled: false,
    });
  });
});
