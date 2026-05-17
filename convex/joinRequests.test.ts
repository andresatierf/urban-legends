import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const schemaForTest = Object.assign(Object.create(schema), {
  schemaValidation: false,
}) as typeof schema;

const scoringConfig = {
  individualPoints: { base: 1, advanced: 2 },
  teamExercisePoints: { base: 3, advanced: 4 },
  teamExerciseThreshold: 0.5,
};

async function seed(
  ctx: Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0],
) {
  const captainId = await ctx.db.insert("users", {
    email: "captain@example.com",
    name: "Captain",
    externalId: "ext_captain",
  });
  const playerId = await ctx.db.insert("users", {
    email: "player@example.com",
    name: "Player",
    externalId: "ext_player",
  });
  const invitedId = await ctx.db.insert("users", {
    email: "invited@example.com",
    name: "Invited",
    externalId: "ext_invited",
  });

  const tournamentId = await ctx.db.insert("tournaments", {
    name: "T1",
    description: "x",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    createdBy: captainId,
    scoringConfig,
  });

  const teamId = await ctx.db.insert("teams", {
    name: "Team A",
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

  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const userRequestId = await ctx.db.insert("joinRequests", {
    teamId,
    userId: playerId,
    status: "pending",
    createdAt: now,
    initiator: "user",
    createdBy: playerId,
    expiresAt,
  });

  const teamInviteId = await ctx.db.insert("joinRequests", {
    teamId,
    userId: invitedId,
    status: "pending",
    createdAt: now,
    initiator: "team",
    createdBy: captainId,
    expiresAt,
  });

  const acceptedRequestId = await ctx.db.insert("joinRequests", {
    teamId,
    userId: playerId,
    status: "accepted",
    createdAt: now,
    initiator: "user",
    createdBy: playerId,
    expiresAt,
  });

  return {
    captainId,
    playerId,
    invitedId,
    tournamentId,
    teamId,
    userRequestId,
    teamInviteId,
    acceptedRequestId,
  };
}

describe("joinRequests.list", () => {
  test("throws when neither teamId nor userId provided", async () => {
    const t = convexTest(schemaForTest);
    await t.run(seed);
    const asUser = t.withIdentity({ subject: "ext_captain" });
    await expect(asUser.query(api.joinRequests.list, {})).rejects.toThrow(
      /exactly one of teamId or userId/i,
    );
  });

  test("throws when both teamId and userId provided", async () => {
    const t = convexTest(schemaForTest);
    const { teamId, playerId } = await t.run(seed);
    const asUser = t.withIdentity({ subject: "ext_captain" });
    await expect(
      asUser.query(api.joinRequests.list, { teamId, userId: playerId }),
    ).rejects.toThrow(/exactly one of teamId or userId/i);
  });

  test("by teamId returns all rows for that team with full enrichment", async () => {
    const t = convexTest(schemaForTest);
    const { teamId, tournamentId, captainId, playerId, invitedId } =
      await t.run(seed);
    const asUser = t.withIdentity({ subject: "ext_captain" });

    const rows = await asUser.query(api.joinRequests.list, { teamId });
    expect(rows.length).toBe(3);

    for (const row of rows) {
      expect(row.team?._id).toBe(teamId);
      expect(row.tournament?._id).toBe(tournamentId);
      expect(row.user).not.toBeNull();
    }

    const userRow = rows.find(
      (r) => r.initiator === "user" && r.status === "pending",
    );
    expect(userRow?.user?._id).toBe(playerId);
    // For user-initiated rows, invitedByUser is null per spec.
    expect(userRow?.invitedByUser).toBeNull();

    const teamRow = rows.find((r) => r.initiator === "team");
    expect(teamRow?.user?._id).toBe(invitedId);
    expect(teamRow?.invitedByUser?._id).toBe(captainId);
  });

  test("filters by initiator", async () => {
    const t = convexTest(schemaForTest);
    const { teamId } = await t.run(seed);
    const asUser = t.withIdentity({ subject: "ext_captain" });

    const userRows = await asUser.query(api.joinRequests.list, {
      teamId,
      initiator: "user",
    });
    expect(userRows.every((r) => r.initiator === "user")).toBe(true);
    expect(userRows.length).toBe(2);

    const teamRows = await asUser.query(api.joinRequests.list, {
      teamId,
      initiator: "team",
    });
    expect(teamRows.every((r) => r.initiator === "team")).toBe(true);
    expect(teamRows.length).toBe(1);
  });

  test("filters by status", async () => {
    const t = convexTest(schemaForTest);
    const { teamId } = await t.run(seed);
    const asUser = t.withIdentity({ subject: "ext_captain" });

    const pending = await asUser.query(api.joinRequests.list, {
      teamId,
      status: "pending",
    });
    expect(pending.length).toBe(2);
    expect(pending.every((r) => r.status === "pending")).toBe(true);

    const accepted = await asUser.query(api.joinRequests.list, {
      teamId,
      status: "accepted",
    });
    expect(accepted.length).toBe(1);
    expect(accepted[0].status).toBe("accepted");
  });

  test("combines initiator and status filters", async () => {
    const t = convexTest(schemaForTest);
    const { teamId } = await t.run(seed);
    const asUser = t.withIdentity({ subject: "ext_captain" });

    const rows = await asUser.query(api.joinRequests.list, {
      teamId,
      initiator: "user",
      status: "pending",
    });
    expect(rows.length).toBe(1);
    expect(rows[0].initiator).toBe("user");
    expect(rows[0].status).toBe("pending");
  });

  test("by userId returns all rows for that user with enrichment", async () => {
    const t = convexTest(schemaForTest);
    const { playerId, teamId, tournamentId } = await t.run(seed);
    const asUser = t.withIdentity({ subject: "ext_player" });

    const rows = await asUser.query(api.joinRequests.list, {
      userId: playerId,
    });
    expect(rows.length).toBe(2);
    for (const row of rows) {
      expect(row.user?._id).toBe(playerId);
      expect(row.team?._id).toBe(teamId);
      expect(row.tournament?._id).toBe(tournamentId);
    }
  });

  test("invitedByUser is populated with createdBy user on team-initiated rows", async () => {
    const t = convexTest(schemaForTest);
    const { invitedId } = await t.run(seed);
    const asUser = t.withIdentity({ subject: "ext_invited" });

    const rows = await asUser.query(api.joinRequests.list, {
      userId: invitedId,
      initiator: "team",
    });
    expect(rows.length).toBe(1);
    expect(rows[0].invitedByUser).not.toBeNull();
    expect(rows[0].invitedByUser?.email).toBe("captain@example.com");
  });
});
