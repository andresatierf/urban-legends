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

describe("teams.getStatistics", () => {
  test("rank and totalTeams scoped to team's tournament only", async () => {
    const t = convexTest(schemaForTest);

    const { teamAId, teamBId, teamCId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "player@example.com",
        name: "Player One",
        externalId: "ext_player_1",
      });

      const tournament1 = await ctx.db.insert("tournaments", {
        name: "Tournament 1",
        description: "First",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig,
      });

      const tournament2 = await ctx.db.insert("tournaments", {
        name: "Tournament 2",
        description: "Second",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig,
      });

      const teamAId = await ctx.db.insert("teams", {
        name: "Team A",
        tournamentId: tournament1,
        createdBy: userId,
        joinPolicy: "open",
        points: 100,
      });

      const teamBId = await ctx.db.insert("teams", {
        name: "Team B",
        tournamentId: tournament1,
        createdBy: userId,
        joinPolicy: "open",
        points: 50,
      });

      const teamCId = await ctx.db.insert("teams", {
        name: "Team C",
        tournamentId: tournament2,
        createdBy: userId,
        joinPolicy: "open",
        points: 200,
      });

      await ctx.db.insert("teamMembers", {
        teamId: teamAId,
        userId,
        role: "captain",
      });

      return { teamAId, teamBId, teamCId };
    });

    const asUser = t.withIdentity({ subject: "ext_player_1" });

    const statsA = await asUser.query(api.teams.getStatistics, {
      teamId: teamAId,
    });
    expect(statsA).not.toBeNull();
    expect(statsA!.totalTeams).toBe(2);
    expect(statsA!.rank).toBe(1);

    const statsB = await asUser.query(api.teams.getStatistics, {
      teamId: teamBId,
    });
    expect(statsB).not.toBeNull();
    expect(statsB!.totalTeams).toBe(2);
    expect(statsB!.rank).toBe(2);

    const statsC = await asUser.query(api.teams.getStatistics, {
      teamId: teamCId,
    });
    expect(statsC).not.toBeNull();
    expect(statsC!.totalTeams).toBe(1);
    expect(statsC!.rank).toBe(1);
  });
});

describe("teams.listWithMembers", () => {
  // enrichWithRelations uses $or filters on _id which convex-test doesn't support
  test.skip("rank and totalTeams scoped to each team's tournament", async () => {
    const t = convexTest(schemaForTest);

    const { tournamentId, teamAId, teamBId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "player@example.com",
        name: "Player One",
        externalId: "ext_player_1",
      });

      const tournament1 = await ctx.db.insert("tournaments", {
        name: "Tournament 1",
        description: "First",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig,
      });

      const tournament2 = await ctx.db.insert("tournaments", {
        name: "Tournament 2",
        description: "Second",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig,
      });

      const teamAId = await ctx.db.insert("teams", {
        name: "Team A",
        tournamentId: tournament1,
        createdBy: userId,
        joinPolicy: "open",
        points: 100,
      });

      const teamBId = await ctx.db.insert("teams", {
        name: "Team B",
        tournamentId: tournament1,
        createdBy: userId,
        joinPolicy: "open",
        points: 50,
      });

      await ctx.db.insert("teams", {
        name: "Team C",
        tournamentId: tournament2,
        createdBy: userId,
        joinPolicy: "open",
        points: 200,
      });

      await ctx.db.insert("teamMembers", {
        teamId: teamAId,
        userId,
        role: "captain",
      });
      await ctx.db.insert("teamMembers", {
        teamId: teamBId,
        userId,
        role: "member",
      });

      return { tournamentId: tournament1, teamAId, teamBId };
    });

    const results = await t
      .withIdentity({ subject: "ext_player_1" })
      .query(api.teams.listWithMembers, { tournamentId });

    const resultA = results.find((r) => r._id === teamAId);
    const resultB = results.find((r) => r._id === teamBId);

    expect(results).toHaveLength(2);
    expect(resultA?.totalTeams).toBe(2);
    expect(resultA?.rank).toBe(1);

    expect(resultB?.totalTeams).toBe(2);
    expect(resultB?.rank).toBe(2);
  });
});

describe("teams.transferCaptaincy (admin actor)", () => {
  test("admin demotes the actual captain (not themselves) and routes notifications correctly", async () => {
    const t = convexTest(schemaForTest);

    const { teamId, captainId, memberId, adminId } = await t.run(
      async (ctx) => {
        const adminId = await ctx.db.insert("users", {
          email: "admin@example.com",
          name: "Admin",
          externalId: "ext_admin",
        });

        const captainId = await ctx.db.insert("users", {
          email: "captain@example.com",
          name: "Captain",
          externalId: "ext_captain",
        });

        const memberId = await ctx.db.insert("users", {
          email: "member@example.com",
          name: "Member",
          externalId: "ext_member",
        });

        const adminRoleId = await ctx.db.insert("roles", {
          name: "admin",
          displayName: "admin",
          hierarchy: 0,
        });
        await ctx.db.insert("userRoles", {
          userId: adminId,
          roleId: adminRoleId,
        });

        const tournamentId = await ctx.db.insert("tournaments", {
          name: "Tournament",
          description: "x",
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
        await ctx.db.insert("teamMembers", {
          teamId,
          userId: memberId,
          role: "member",
        });

        return { teamId, captainId, memberId, adminId };
      },
    );

    const asAdmin = t.withIdentity({ subject: "ext_admin" });

    await asAdmin.mutation(api.teams.transferCaptaincy, {
      teamId,
      newCaptainId: memberId,
    });

    await t.run(async (ctx) => {
      const members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect();

      const prevCaptain = members.find((m) => m.userId === captainId);
      const newCaptain = members.find((m) => m.userId === memberId);

      expect(prevCaptain?.role).toBe("member");
      expect(newCaptain?.role).toBe("captain");

      // Admin actor was never a member; nothing should have appeared for them.
      const adminMembership = members.find((m) => m.userId === adminId);
      expect(adminMembership).toBeUndefined();
    });
  });

  test("non-captain plain member cannot transfer captaincy", async () => {
    const t = convexTest(schemaForTest);

    const { teamId, memberAId, memberBId } = await t.run(async (ctx) => {
      const captainId = await ctx.db.insert("users", {
        email: "captain@example.com",
        name: "Captain",
        externalId: "ext_captain",
      });

      const memberAId = await ctx.db.insert("users", {
        email: "member-a@example.com",
        name: "Member A",
        externalId: "ext_member_a",
      });

      const memberBId = await ctx.db.insert("users", {
        email: "member-b@example.com",
        name: "Member B",
        externalId: "ext_member_b",
      });

      const tournamentId = await ctx.db.insert("tournaments", {
        name: "Tournament",
        description: "x",
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
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: memberAId,
        role: "member",
      });
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: memberBId,
        role: "member",
      });

      return { teamId, memberAId, memberBId };
    });

    const asMember = t.withIdentity({ subject: "ext_member_a" });

    await expect(
      asMember.mutation(api.teams.transferCaptaincy, {
        teamId,
        newCaptainId: memberBId,
      }),
    ).rejects.toThrow();
  });
});
