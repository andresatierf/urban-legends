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

async function makeUser(ctx: Ctx, externalId: string, name?: string) {
  return ctx.db.insert("users", {
    email: `${externalId}@t.com`,
    name: name ?? externalId,
    externalId,
  });
}

async function makeTournament(ctx: Ctx, creatorId: Id<"users">) {
  const today = new Date().toISOString().slice(0, 10);
  const inAYear = new Date(Date.now() + 365 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return ctx.db.insert("tournaments", {
    name: "T",
    description: "T",
    startDate: today,
    endDate: inAYear,
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

async function addMember(ctx: Ctx, teamId: Id<"teams">, userId: Id<"users">) {
  await ctx.db.insert("teamMembers", { teamId, userId, role: "member" });
}

async function insertActivity(
  ctx: Ctx,
  args: {
    teamId: Id<"teams">;
    tournamentId: Id<"tournaments">;
    createdBy: Id<"users">;
    state: "approved" | "pending" | "rejected";
    reviewedAt?: number;
    pointsEarned?: number;
    tier?: "base" | "advanced";
    description?: string;
  },
) {
  return ctx.db.insert("activities", {
    teamId: args.teamId,
    tournamentId: args.tournamentId,
    createdBy: args.createdBy,
    date: "2024-06-15",
    type: "individual",
    tier: args.tier ?? "base",
    state: args.state,
    description: args.description,
    pointsEarned: args.pointsEarned ?? 1,
    participantCount: 1,
    totalTeamMembers: 1,
    participationRate: 1,
    isTeamExercise: false,
    reviewedAt: args.reviewedAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

describe("views.dashboard.getDashboardView recentActivity", () => {
  test("shows approved activities from all teams in the selected tournament, highlighting viewer's team", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const viewer = await makeUser(ctx, "viewer");
      const rival = await makeUser(ctx, "rival", "Rival Rita");
      const tournamentId = await makeTournament(ctx, viewer);
      const myTeam = await makeTeam(ctx, tournamentId, viewer, "Mine");
      const otherTeam = await makeTeam(ctx, tournamentId, rival, "Theirs");
      await addMember(ctx, myTeam, viewer);
      await addMember(ctx, otherTeam, rival);

      await insertActivity(ctx, {
        teamId: myTeam,
        tournamentId,
        createdBy: viewer,
        state: "approved",
        reviewedAt: 1_000,
        pointsEarned: 3,
      });
      await insertActivity(ctx, {
        teamId: otherTeam,
        tournamentId,
        createdBy: rival,
        state: "approved",
        reviewedAt: 2_000,
        pointsEarned: 5,
        description: "big push",
      });
    });

    const view = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.dashboard.getDashboardView, {});
    if (view.selected === null) throw new Error("expected selected tournament");
    const feed = view.selected.recentActivity;

    expect(feed).toHaveLength(2);
    expect(feed[0].team.name).toBe("Theirs");
    expect(feed[0].isViewerTeam).toBe(false);
    expect(feed[0].pointsEarned).toBe(5);
    expect(feed[0].description).toBe("big push");
    expect(feed[0].actorName).toBe("Rival Rita");
    expect(feed[1].team.name).toBe("Mine");
    expect(feed[1].isViewerTeam).toBe(true);
  });

  test("excludes non-approved activities", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const viewer = await makeUser(ctx, "viewer");
      const tournamentId = await makeTournament(ctx, viewer);
      const myTeam = await makeTeam(ctx, tournamentId, viewer, "Mine");
      await addMember(ctx, myTeam, viewer);

      await insertActivity(ctx, {
        teamId: myTeam,
        tournamentId,
        createdBy: viewer,
        state: "pending",
      });
      await insertActivity(ctx, {
        teamId: myTeam,
        tournamentId,
        createdBy: viewer,
        state: "rejected",
      });
    });

    const view = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.dashboard.getDashboardView, {});
    if (view.selected === null) throw new Error("expected selected tournament");
    expect(view.selected.recentActivity).toHaveLength(0);
  });

  test("excludes activities from other tournaments", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const viewer = await makeUser(ctx, "viewer");
      const tournamentA = await makeTournament(ctx, viewer);
      const tournamentB = await makeTournament(ctx, viewer);
      const teamA = await makeTeam(ctx, tournamentA, viewer, "A");
      const teamB = await makeTeam(ctx, tournamentB, viewer, "B");
      await addMember(ctx, teamA, viewer);
      await addMember(ctx, teamB, viewer);

      await insertActivity(ctx, {
        teamId: teamA,
        tournamentId: tournamentA,
        createdBy: viewer,
        state: "approved",
        reviewedAt: 1_000,
      });
      await insertActivity(ctx, {
        teamId: teamB,
        tournamentId: tournamentB,
        createdBy: viewer,
        state: "approved",
        reviewedAt: 2_000,
      });
    });

    const view = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.dashboard.getDashboardView, {});
    if (view.selected === null) throw new Error("expected selected tournament");
    // Should only see activity from the selected tournament (either A or B, exclusively).
    expect(view.selected.recentActivity).toHaveLength(1);
    const feedTeamId = view.selected.recentActivity[0].team._id;
    expect(feedTeamId).toBe(view.selected.myTeam.team._id);
  });

  test("orders by most recent approval first", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const viewer = await makeUser(ctx, "viewer");
      const tournamentId = await makeTournament(ctx, viewer);
      const myTeam = await makeTeam(ctx, tournamentId, viewer, "Mine");
      await addMember(ctx, myTeam, viewer);

      await insertActivity(ctx, {
        teamId: myTeam,
        tournamentId,
        createdBy: viewer,
        state: "approved",
        reviewedAt: 1_000,
        pointsEarned: 1,
      });
      await insertActivity(ctx, {
        teamId: myTeam,
        tournamentId,
        createdBy: viewer,
        state: "approved",
        reviewedAt: 3_000,
        pointsEarned: 3,
      });
      await insertActivity(ctx, {
        teamId: myTeam,
        tournamentId,
        createdBy: viewer,
        state: "approved",
        reviewedAt: 2_000,
        pointsEarned: 2,
      });
    });

    const view = await t
      .withIdentity({ subject: "viewer" })
      .query(api.views.dashboard.getDashboardView, {});
    if (view.selected === null) throw new Error("expected selected tournament");
    const points = view.selected.recentActivity.map((r) => r.pointsEarned);
    expect(points).toEqual([3, 2, 1]);
  });
});
