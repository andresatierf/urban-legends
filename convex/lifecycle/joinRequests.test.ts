import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import type { Id } from "../_generated/dataModel";
import { canAcceptJoinRequest } from "../authority/core";
import schema from "../schema";
import {
  accept,
  cancel,
  expire,
  invite,
  reject,
  request,
} from "./joinRequests";

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
        initiator: "user",
        createdBy: requesterId,
        expiresAt: "2024-01-08T00:00:00.000Z",
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

    // Run 2: re-request; should be blocked
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

// ── invite then accept ───────────────────────────────────────────────────────

describe("invite then accept (Team-direction)", () => {
  test("produces a TeamMember row", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const prospectId = await makeUser(ctx, "prospect");

      const requestId = await invite(ctx, {
        teamId,
        userId: prospectId,
        createdBy: captainId,
      });

      await accept(ctx, requestId, prospectId);

      const member = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", teamId).eq("userId", prospectId),
        )
        .first();

      expect(member).toBeTruthy();
      expect(member?.role).toBe("member");
    });
  });

  test("transitions status to accepted", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const prospectId = await makeUser(ctx, "prospect");

      const requestId = await invite(ctx, {
        teamId,
        userId: prospectId,
        createdBy: captainId,
      });

      await accept(ctx, requestId, prospectId);

      const req = await ctx.db.get(requestId);
      expect(req?.status).toBe("accepted");
      expect(req?.initiator).toBe("team");
      expect(req?.respondedBy).toBe(prospectId);
    });
  });
});

// ── symmetric lockout ────────────────────────────────────────────────────────

describe("symmetric lockout", () => {
  test("reject user-direction request → re-invite to same (user, team) is blocked", async () => {
    // Uses separate t.run() calls: convex-test@0.0.1 does not reflect ctx.db.patch()
    // results in ctx.db.query().collect() within the same transaction.
    const t = convexTest(schemaForTest);
    const { captainId, teamId } = await t.run(async (ctx) => seedWorld(ctx));
    const prospectId = await t.run(async (ctx) => makeUser(ctx, "prospect"));

    const requestId = await t.run(async (ctx) =>
      request(ctx, { teamId, userId: prospectId }),
    );
    await t.run(async (ctx) => reject(ctx, requestId, captainId));

    await t.run(async (ctx) => {
      await expect(
        invite(ctx, { teamId, userId: prospectId, createdBy: captainId }),
      ).rejects.toThrow();
    });
  });

  test("reject team-direction invite → re-request by same user is blocked", async () => {
    // Uses separate t.run() calls for the same convex-test@0.0.1 reason.
    const t = convexTest(schemaForTest);
    const { captainId, teamId } = await t.run(async (ctx) => seedWorld(ctx));
    const prospectId = await t.run(async (ctx) => makeUser(ctx, "prospect"));

    const inviteId = await t.run(async (ctx) =>
      invite(ctx, { teamId, userId: prospectId, createdBy: captainId }),
    );
    await t.run(async (ctx) => reject(ctx, inviteId, prospectId));

    await t.run(async (ctx) => {
      await expect(
        request(ctx, { teamId, userId: prospectId }),
      ).rejects.toThrow();
    });
  });

  test("invite blocked when pending request already exists", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const prospectId = await makeUser(ctx, "prospect");

      await request(ctx, { teamId, userId: prospectId });

      await expect(
        invite(ctx, { teamId, userId: prospectId, createdBy: captainId }),
      ).rejects.toThrow();
    });
  });
});

// ── cascade crosses initiator boundary ───────────────────────────────────────

describe("cascade crosses initiator boundary", () => {
  test("accept user-direction cancels team-direction sibling in same tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, tournamentId, teamId } = await seedWorld(ctx);
      const prospectId = await makeUser(ctx, "prospect");

      const otherCaptainId = await makeUser(ctx, "otherCaptain");
      const otherTeamId = await ctx.db.insert("teams", {
        name: "Team Beta",
        tournamentId,
        createdBy: otherCaptainId,
        joinPolicy: "open",
        points: 0,
      });
      await ctx.db.insert("teamMembers", {
        teamId: otherTeamId,
        userId: otherCaptainId,
        role: "captain",
      });

      // User requests Team Alpha; Team Beta invites same user
      const reqAlpha = await request(ctx, { teamId, userId: prospectId });
      const inviteBeta = await invite(ctx, {
        teamId: otherTeamId,
        userId: prospectId,
        createdBy: otherCaptainId,
      });

      // Captain of Alpha accepts
      await accept(ctx, reqAlpha, captainId);

      // Team Beta's invite in same tournament should be cancelled
      const betaRow = await ctx.db.get(inviteBeta);
      expect(betaRow?.status).toBe("cancelled");
    });
  });

  test("accept team-direction cancels user-direction sibling in same tournament", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, tournamentId, teamId } = await seedWorld(ctx);
      const prospectId = await makeUser(ctx, "prospect");

      const otherCaptainId = await makeUser(ctx, "otherCaptain");
      const otherTeamId = await ctx.db.insert("teams", {
        name: "Team Beta",
        tournamentId,
        createdBy: otherCaptainId,
        joinPolicy: "open",
        points: 0,
      });
      await ctx.db.insert("teamMembers", {
        teamId: otherTeamId,
        userId: otherCaptainId,
        role: "captain",
      });

      // Team Alpha invites prospect; prospect also requests Team Beta
      const inviteAlpha = await invite(ctx, {
        teamId,
        userId: prospectId,
        createdBy: captainId,
      });
      const reqBeta = await request(ctx, {
        teamId: otherTeamId,
        userId: prospectId,
      });

      // Prospect accepts Alpha's invite
      await accept(ctx, inviteAlpha, prospectId);

      // Beta request in same tournament should be cancelled
      const betaRow = await ctx.db.get(reqBeta);
      expect(betaRow?.status).toBe("cancelled");
    });
  });
});

// ── authority: branching on initiator ────────────────────────────────────────

describe("canAcceptJoinRequest authority branching", () => {
  test("user-direction: captain can accept, prospect cannot", async () => {
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

      expect(
        await canAcceptJoinRequest.check(ctx, captainId, { requestId }),
      ).toBe(true);

      expect(
        await canAcceptJoinRequest.check(ctx, requesterId, { requestId }),
      ).toBe(false);

      expect(
        await canAcceptJoinRequest.check(ctx, memberId, { requestId }),
      ).toBe(false);
    });
  });

  test("team-direction: prospect can accept, captain cannot", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      const { captainId, teamId } = await seedWorld(ctx);
      const prospectId = await makeUser(ctx, "prospect");

      const requestId = await invite(ctx, {
        teamId,
        userId: prospectId,
        createdBy: captainId,
      });

      expect(
        await canAcceptJoinRequest.check(ctx, prospectId, { requestId }),
      ).toBe(true);

      expect(
        await canAcceptJoinRequest.check(ctx, captainId, { requestId }),
      ).toBe(false);
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
        joinPolicy: "open",
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
        joinPolicy: "open",
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
