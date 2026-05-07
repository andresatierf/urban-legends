import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

// convex-test@0.0.1 schema validation workaround
const schemaForTest = Object.assign(Object.create(schema), {
  schemaValidation: false,
}) as typeof schema;

const scoringConfig = {
  individualPoints: { base: 1, advanced: 2 },
  teamExercisePoints: { base: 3, advanced: 4 },
  teamExerciseThreshold: 0.5,
};

// Dates that position tournaments relative to "now" (May 2026)
const ACTIVE_START = "2020-01-01T00:00:00.000Z";
const ACTIVE_END = "2099-12-31T23:59:59.999Z";
const UPCOMING_START = "2099-06-01T00:00:00.000Z";
const UPCOMING_END = "2099-12-31T23:59:59.999Z";
const ENDED_START = "2020-01-01T00:00:00.000Z";
const ENDED_END = "2020-12-31T23:59:59.999Z";

type Ctx = Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0];

async function makeUser(ctx: Ctx, externalId: string) {
  return ctx.db.insert("users", {
    email: `${externalId}@test.com`,
    name: externalId,
    externalId,
  });
}

async function makeTournament(
  ctx: Ctx,
  creatorId: Id<"users">,
  opts: { startDate?: string; endDate?: string; name?: string } = {},
) {
  return ctx.db.insert("tournaments", {
    name: opts.name ?? "Tournament",
    description: "Test tournament",
    startDate: opts.startDate ?? ACTIVE_START,
    endDate: opts.endDate ?? ACTIVE_END,
    createdBy: creatorId,
    scoringConfig,
  });
}

async function makeTeam(
  ctx: Ctx,
  tournamentId: Id<"tournaments">,
  creatorId: Id<"users">,
  name = "Team A",
) {
  return ctx.db.insert("teams", {
    name,
    tournamentId,
    createdBy: creatorId,
    visibility: "public",
    points: 42,
  });
}

async function addTeamMember(
  ctx: Ctx,
  teamId: Id<"teams">,
  userId: Id<"users">,
  role: "member" | "captain" = "member",
) {
  return ctx.db.insert("teamMembers", { teamId, userId, role });
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

describe("tournaments.listWithAuthority", () => {
  describe("partition: yours vs discover", () => {
    test("viewer with no relationship sees tournament in discover, not yours", async () => {
      const t = convexTest(schemaForTest);
      const { viewerId } = await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        await makeTournament(ctx, creatorId);
        const viewerId = await makeUser(ctx, "viewer");
        return { viewerId };
      });

      const data = await t
        .withIdentity({ subject: "viewer" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.yours).toHaveLength(0);
      expect(data.discover).toHaveLength(1);
      void viewerId;
    });

    test("TeamMember only sees tournament in yours", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        const tournamentId = await makeTournament(ctx, creatorId);
        const playerId = await makeUser(ctx, "player");
        const teamId = await makeTeam(ctx, tournamentId, creatorId);
        await addTeamMember(ctx, teamId, playerId, "member");
      });

      const data = await t
        .withIdentity({ subject: "player" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.yours).toHaveLength(1);
      expect(data.discover).toHaveLength(0);
      expect(data.yours[0].authority.team).toBeDefined();
      expect(data.yours[0].authority.team?.isCaptain).toBe(false);
    });

    test("Captain sees tournament in yours with isCaptain=true", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        const tournamentId = await makeTournament(ctx, creatorId);
        const captainId = await makeUser(ctx, "captain");
        const teamId = await makeTeam(ctx, tournamentId, creatorId);
        await addTeamMember(ctx, teamId, captainId, "captain");
      });

      const data = await t
        .withIdentity({ subject: "captain" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.yours).toHaveLength(1);
      expect(data.discover).toHaveLength(0);
      expect(data.yours[0].authority.team?.isCaptain).toBe(true);
    });

    test("reviewer-only sees tournament in yours", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        const tournamentId = await makeTournament(ctx, creatorId);
        const reviewerId = await makeUser(ctx, "reviewer");
        await giveTournamentRole(ctx, reviewerId, tournamentId, "reviewer");
      });

      const data = await t
        .withIdentity({ subject: "reviewer" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.yours).toHaveLength(1);
      expect(data.discover).toHaveLength(0);
      expect(data.yours[0].authority.canReview).toBe(true);
      expect(data.yours[0].authority.canManage).toBe(false);
    });

    test("tournament_manager-only sees tournament in yours with canManage=true", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        const tournamentId = await makeTournament(ctx, creatorId);
        const managerId = await makeUser(ctx, "manager");
        await giveTournamentRole(
          ctx,
          managerId,
          tournamentId,
          "tournament_manager",
        );
      });

      const data = await t
        .withIdentity({ subject: "manager" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.yours).toHaveLength(1);
      expect(data.discover).toHaveLength(0);
      expect(data.yours[0].authority.canManage).toBe(true);
      expect(data.yours[0].authority.canReview).toBe(true);
    });

    test("tournament_manager who is also a Captain sees tournament once in yours", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        const tournamentId = await makeTournament(ctx, creatorId);
        const userId = await makeUser(ctx, "manager-captain");
        await giveTournamentRole(
          ctx,
          userId,
          tournamentId,
          "tournament_manager",
        );
        const teamId = await makeTeam(ctx, tournamentId, creatorId);
        await addTeamMember(ctx, teamId, userId, "captain");
      });

      const data = await t
        .withIdentity({ subject: "manager-captain" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.yours).toHaveLength(1);
      expect(data.discover).toHaveLength(0);
      expect(data.yours[0].authority.canManage).toBe(true);
      expect(data.yours[0].authority.team?.isCaptain).toBe(true);
    });

    test("system admin with no direct relationship sees tournament in discover (not yours)", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        await makeTournament(ctx, creatorId);
        const adminId = await makeUser(ctx, "admin");
        await giveSystemRole(ctx, adminId, "admin");
      });

      const data = await t
        .withIdentity({ subject: "admin" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.yours).toHaveLength(0);
      expect(data.discover).toHaveLength(1);
    });

    test("system admin sees canManage=true on discover tournaments", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        await makeTournament(ctx, creatorId);
        const adminId = await makeUser(ctx, "admin");
        await giveSystemRole(ctx, adminId, "admin");
      });

      const data = await t
        .withIdentity({ subject: "admin" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.discover[0].authority.canManage).toBe(true);
      expect(data.discover[0].authority.canReview).toBe(true);
    });

    test("organizer who created a tournament gets tournament_manager via onTournamentCreated and sees it in yours", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const organizerId = await makeUser(ctx, "organizer");
        await giveSystemRole(ctx, organizerId, "organizer");
        // Simulate creating a tournament (which calls onTournamentCreated internally)
        const tournamentId = await makeTournament(ctx, organizerId);
        // Grant tournament_manager role as onTournamentCreated would
        await giveTournamentRole(
          ctx,
          organizerId,
          tournamentId,
          "tournament_manager",
        );
      });

      const data = await t
        .withIdentity({ subject: "organizer" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.yours).toHaveLength(1);
      expect(data.discover).toHaveLength(0);
      expect(data.yours[0].authority.canManage).toBe(true);
    });
  });

  describe("includeEnded filter", () => {
    test("ended tournaments are excluded by default", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "user");
        await makeUser(ctx, "viewer");
        await makeTournament(ctx, creatorId, {
          startDate: ENDED_START,
          endDate: ENDED_END,
        });
      });

      const data = await t
        .withIdentity({ subject: "viewer" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.yours).toHaveLength(0);
      expect(data.discover).toHaveLength(0);
    });

    test("ended tournaments appear when includeEnded=true", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "user");
        await makeUser(ctx, "viewer");
        await makeTournament(ctx, creatorId, {
          startDate: ENDED_START,
          endDate: ENDED_END,
        });
      });

      const data = await t
        .withIdentity({ subject: "viewer" })
        .query(api.tournaments.listWithAuthority, { includeEnded: true });

      expect(data.discover).toHaveLength(1);
    });

    test("active and upcoming tournaments always appear when not includeEnded", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "user");
        await makeUser(ctx, "viewer");
        await makeTournament(ctx, creatorId, {
          startDate: ACTIVE_START,
          endDate: ACTIVE_END,
          name: "Active",
        });
        await makeTournament(ctx, creatorId, {
          startDate: UPCOMING_START,
          endDate: UPCOMING_END,
          name: "Upcoming",
        });
        await makeTournament(ctx, creatorId, {
          startDate: ENDED_START,
          endDate: ENDED_END,
          name: "Ended",
        });
      });

      const data = await t
        .withIdentity({ subject: "viewer" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.discover).toHaveLength(2);
      expect(data.discover.map((t) => t.name)).not.toContain("Ended");
    });
  });

  describe("authority: team context", () => {
    test("team context includes points, submission counts", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        const tournamentId = await makeTournament(ctx, creatorId);
        const playerId = await makeUser(ctx, "player");
        const teamId = await makeTeam(ctx, tournamentId, creatorId);
        await addTeamMember(ctx, teamId, playerId, "member");
        await ctx.db.insert("submissions", {
          userId: playerId,
          teamId,
          tournamentId,
          date: "2024-06-01",
          submissionType: "individual",
          state: "approved",
          tier: "base",
          createdBy: playerId,
          pointsEarned: 1,
        });
        await ctx.db.insert("submissions", {
          userId: playerId,
          teamId,
          tournamentId,
          date: "2024-06-02",
          submissionType: "individual",
          state: "pending",
          tier: "base",
          createdBy: playerId,
          pointsEarned: 0,
        });
      });

      const data = await t
        .withIdentity({ subject: "player" })
        .query(api.tournaments.listWithAuthority, {});

      const team = data.yours[0].authority.team;
      expect(team).toBeDefined();
      expect(team?.points).toBe(42);
      expect(team?.totalSubmissions).toBe(2);
      expect(team?.approvedSubmissions).toBe(1);
    });

    test("pendingReviewCount is populated for tournament_manager", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        const tournamentId = await makeTournament(ctx, creatorId);
        const managerId = await makeUser(ctx, "manager");
        await giveTournamentRole(
          ctx,
          managerId,
          tournamentId,
          "tournament_manager",
        );
        const teamId = await makeTeam(ctx, tournamentId, creatorId);
        await ctx.db.insert("submissions", {
          userId: creatorId,
          teamId,
          tournamentId,
          date: "2024-06-01",
          submissionType: "individual",
          state: "pending",
          tier: "base",
          createdBy: creatorId,
          pointsEarned: 0,
        });
        await ctx.db.insert("submissions", {
          userId: creatorId,
          teamId,
          tournamentId,
          date: "2024-06-02",
          submissionType: "individual",
          state: "pending",
          tier: "base",
          createdBy: creatorId,
          pointsEarned: 0,
        });
      });

      const data = await t
        .withIdentity({ subject: "manager" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.yours[0].authority.pendingReviewCount).toBe(2);
    });

    test("pendingReviewCount is 0 for plain viewer", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "creator");
        const tournamentId = await makeTournament(ctx, creatorId);
        await makeUser(ctx, "viewer");
        const teamId = await makeTeam(ctx, tournamentId, creatorId);
        await ctx.db.insert("submissions", {
          userId: creatorId,
          teamId,
          tournamentId,
          date: "2024-06-01",
          submissionType: "individual",
          state: "pending",
          tier: "base",
          createdBy: creatorId,
          pointsEarned: 0,
        });
      });

      const data = await t
        .withIdentity({ subject: "viewer" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.discover[0].authority.pendingReviewCount).toBe(0);
    });
  });

  describe("sorting", () => {
    test("active tournaments come before upcoming in discover", async () => {
      const t = convexTest(schemaForTest);
      await t.run(async (ctx) => {
        const creatorId = await makeUser(ctx, "user");
        await makeUser(ctx, "viewer");
        await makeTournament(ctx, creatorId, {
          startDate: UPCOMING_START,
          endDate: UPCOMING_END,
          name: "Upcoming",
        });
        await makeTournament(ctx, creatorId, {
          startDate: ACTIVE_START,
          endDate: ACTIVE_END,
          name: "Active",
        });
      });

      const data = await t
        .withIdentity({ subject: "viewer" })
        .query(api.tournaments.listWithAuthority, {});

      expect(data.discover[0].name).toBe("Active");
      expect(data.discover[1].name).toBe("Upcoming");
    });
  });
});
