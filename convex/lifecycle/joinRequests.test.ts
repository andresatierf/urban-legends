import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import type { Id } from "../_generated/dataModel";
import { canApproveJoinRequest } from "../authority/core";
import schema from "../schema";
import { accept, cancel, expire, reject, request } from "./joinRequests";

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
    points: 0,
  });

  await ctx.db.insert("teamMembers", {
    teamId,
    userId: captainId,
    role: "captain",
  });

  return { captainId, tournamentId, teamId };
}

// ── request → accept ─────────────────────────────────────────────────────────

describe("request then accept", () => {
  test("produces a TeamMember row", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");

      const requestId = await request(ctx, { teamId, userId: requesterId });

      await accept(ctx, requestId, captainId);

      const member = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", teamId).eq("userId", requesterId),
        )
        .first();

      expect(member).toBeTruthy();
      expect(member?.role).toBe("member");
    });
  });

  test("transitions join request status to accepted", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");

      const requestId = await request(ctx, { teamId, userId: requesterId });
      await accept(ctx, requestId, captainId);

      const req = await ctx.db.get(requestId);
      expect(req?.status).toBe("accepted");
      expect(req?.respondedBy).toBe(captainId);
    });
  });
});

// ── reject lockout ────────────────────────────────────────────────────────────

describe("reject then re-request", () => {
  test("is blocked by lockout when rejected row was inserted directly", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");

      // Insert a rejected row directly (simulating a prior rejection that already committed).
      // This verifies the lockout read-path independently of patch visibility.
      await ctx.db.insert("joinRequests", {
        teamId,
        userId: requesterId,
        status: "rejected",
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      await expect(
        request(ctx, { teamId, userId: requesterId }),
      ).rejects.toThrow("rejected");
    });
  });

  test("is blocked by lockout in a separate run after rejection", async () => {
    const t = convexTest(schemaForTest);
    const { captainId, teamId } = await t.run(async (ctx) => {
      return await seedWorld(ctx);
    });
    const requesterId = await t.run(async (ctx) => makeUser(ctx, "requester"));

    // Run 1: request and reject
    const requestId = await t.run(async (ctx) => {
      return await request(ctx, { teamId, userId: requesterId });
    });
    await t.run(async (ctx) => {
      await reject(ctx, requestId, captainId);
    });

    // Run 2: re-request — should be blocked
    await t.run(async (ctx) => {
      await expect(
        request(ctx, { teamId, userId: requesterId }),
      ).rejects.toThrow("rejected");
    });
  });
});

// ── cancel permission ─────────────────────────────────────────────────────────

describe("cancel", () => {
  test("permitted only by createdBy", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");
      const otherId = await makeUser(ctx, "other");

      const requestId = await request(ctx, { teamId, userId: requesterId });

      await expect(cancel(ctx, requestId, otherId)).rejects.toThrow();
      await expect(cancel(ctx, requestId, captainId)).rejects.toThrow();

      await expect(
        cancel(ctx, requestId, requesterId),
      ).resolves.toBeUndefined();

      const req = await ctx.db.get(requestId);
      expect(req?.status).toBe("cancelled");
    });
  });
});

// ── expiry ────────────────────────────────────────────────────────────────────

describe("expire", () => {
  test("transitions past-expiresAt pending row to expired", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");

      const requestId = await request(ctx, { teamId, userId: requesterId });

      // Backdate expiresAt to the past
      await ctx.db.patch(requestId, {
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });

      const result = await expire(ctx, requestId);
      expect(result).toBe("expired");

      const req = await ctx.db.get(requestId);
      expect(req?.status).toBe("expired");
    });
  });

  test("returns noop for non-expired pending row", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");

      const requestId = await request(ctx, { teamId, userId: requesterId });

      const result = await expire(ctx, requestId);
      expect(result).toBe("noop");
    });
  });

  test("returns noop for already-resolved row", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");

      const requestId = await request(ctx, { teamId, userId: requesterId });
      await reject(ctx, requestId, captainId);

      const result = await expire(ctx, requestId);
      expect(result).toBe("noop");
    });
  });
});

// ── authority: only captain can accept ───────────────────────────────────────

describe("only captain can accept", () => {
  test("member cannot accept via authority rule", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");
      const memberId = await makeUser(ctx, "member");
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: memberId,
        role: "member",
      });

      const requestId = await request(ctx, { teamId, userId: requesterId });

      const memberCanApprove = await canApproveJoinRequest.check(
        ctx,
        memberId,
        {
          requestId,
        },
      );
      expect(memberCanApprove).toBe(false);

      const captainCanApprove = await canApproveJoinRequest.check(
        ctx,
        captainId,
        {
          requestId,
        },
      );
      expect(captainCanApprove).toBe(true);

      await accept(ctx, requestId, captainId);

      const member = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", teamId).eq("userId", requesterId),
        )
        .first();
      expect(member).toBeTruthy();
    });
  });
});

// ── cascade on accept ─────────────────────────────────────────────────────────

describe("accept cascades siblings", () => {
  test("cancels other pending requests in same tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, tournamentId, teamId } = await seedWorld(ctx);
      const requesterId = await makeUser(ctx, "requester");

      // Second team in same tournament
      const otherCaptainId = await makeUser(ctx, "otherCaptain");
      const otherTeamId = await ctx.db.insert("teams", {
        name: "Team Beta",
        tournamentId,
        createdBy: otherCaptainId,
        visibility: "public",
        points: 0,
      });
      await ctx.db.insert("teamMembers", {
        teamId: otherTeamId,
        userId: otherCaptainId,
        role: "captain",
      });

      // Third team in a different tournament (should NOT be cancelled)
      const otherTournamentId = await ctx.db.insert("tournaments", {
        name: "Tournament B",
        description: "Other",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: captainId,
        scoringConfig,
      });
      const isolatedTeamId = await ctx.db.insert("teams", {
        name: "Team Gamma",
        tournamentId: otherTournamentId,
        createdBy: captainId,
        visibility: "public",
        points: 0,
      });
      await ctx.db.insert("teamMembers", {
        teamId: isolatedTeamId,
        userId: captainId,
        role: "captain",
      });

      // Requester sends requests to all three teams
      const reqAlpha = await request(ctx, { teamId, userId: requesterId });
      const reqBeta = await request(ctx, {
        teamId: otherTeamId,
        userId: requesterId,
      });
      const reqGamma = await request(ctx, {
        teamId: isolatedTeamId,
        userId: requesterId,
      });

      // Accept the first request
      await accept(ctx, reqAlpha, captainId);

      // Beta request in same tournament is cancelled
      const beta = await ctx.db.get(reqBeta);
      expect(beta?.status).toBe("cancelled");

      // Gamma request in different tournament is untouched
      const gamma = await ctx.db.get(reqGamma);
      expect(gamma?.status).toBe("pending");
    });
  });
});
