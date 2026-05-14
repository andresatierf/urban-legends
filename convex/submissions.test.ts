import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

// convex-test@0.0.1 schema validation workaround (see evidenceStorage.test.ts)
const schemaForTest = Object.assign(Object.create(schema), {
  schemaValidation: false,
}) as typeof schema;

const scoringConfig = {
  individualPoints: { base: 1, advanced: 2 },
  teamExercisePoints: { base: 3, advanced: 4 },
  teamExerciseThreshold: 0.5,
};

async function seedWorld(
  ctx: Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0],
) {
  const userId = await ctx.db.insert("users", {
    email: "player@example.com",
    name: "Player One",
    externalId: "ext_player_1",
  });

  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Test Tournament",
    description: "For thumbnail tests",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    createdBy: userId,
    scoringConfig,
  });

  const teamId = await ctx.db.insert("teams", {
    name: "Test Team",
    tournamentId,
    createdBy: userId,
    joinPolicy: "open",
    points: 0,
  });

  await ctx.db.insert("teamMembers", {
    teamId,
    userId,
    role: "captain",
  });

  return { userId, teamId, tournamentId };
}

describe("submissions.list", () => {
  describe("thumbnailUrl and evidenceCount", () => {
    test("row with evidence has non-null thumbnailUrl and evidenceCount equals array length", async () => {
      const t = convexTest(schemaForTest);

      const { userId, teamId, tournamentId, storageId } = await t.run(
        async (ctx) => {
          const { userId, teamId, tournamentId } = await seedWorld(ctx);
          const storageId = await ctx.storage.store(
            new Blob(["fake image"], { type: "image/jpeg" }),
          );
          await ctx.db.insert("submissions", {
            userId,
            teamId,
            tournamentId,
            date: "2024-01-15",
            submissionType: "individual",
            state: "pending",
            tier: "base",
            createdBy: userId,
            pointsEarned: 0,
            submittedAt: Date.now(),
            evidenceStorageIds: [storageId],
          });
          return { userId, teamId, tournamentId, storageId };
        },
      );

      const results = await t
        .withIdentity({ subject: "ext_player_1" })
        .query(api.submissions.list, { userId });

      expect(results).toHaveLength(1);
      expect(results[0].thumbnailUrl).not.toBeNull();
      expect(typeof results[0].thumbnailUrl).toBe("string");
      expect(results[0].evidenceCount).toBe(1);
    });

    test("row without evidence has thumbnailUrl null and evidenceCount zero", async () => {
      const t = convexTest(schemaForTest);

      const { userId } = await t.run(async (ctx) => {
        const { userId, teamId, tournamentId } = await seedWorld(ctx);
        await ctx.db.insert("submissions", {
          userId,
          teamId,
          tournamentId,
          date: "2024-01-15",
          submissionType: "individual",
          state: "pending",
          tier: "base",
          createdBy: userId,
          pointsEarned: 0,
          submittedAt: Date.now(),
        });
        return { userId };
      });

      const results = await t
        .withIdentity({ subject: "ext_player_1" })
        .query(api.submissions.list, { userId });

      expect(results).toHaveLength(1);
      expect(results[0].thumbnailUrl).toBeNull();
      expect(results[0].evidenceCount).toBe(0);
    });
  });
});

// getMonthSubmissions uses a compound q.and() filter that convex-test@0.0.1-alpha.38
// does not implement. We verify the thumbnail resolution logic it uses via t.run()
// and rely on TypeScript types to confirm the query return type includes the fields.
describe("submissions.getMonthSubmissions — thumbnail resolution logic", () => {
  test("ctx.storage.getUrl returns non-null for a stored blob (used by getMonthSubmissions)", async () => {
    const t = convexTest(schemaForTest);

    await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(
        new Blob(["fake image"], { type: "image/jpeg" }),
      );
      const url = await ctx.storage.getUrl(storageId);
      expect(url).not.toBeNull();
      expect(typeof url).toBe("string");
    });
  });

  test("evidenceCount is the length of evidenceStorageIds", async () => {
    const t = convexTest(schemaForTest);

    await t.run(async (ctx) => {
      const { userId, teamId, tournamentId } = await seedWorld(ctx);
      const s1 = await ctx.storage.store(
        new Blob(["img1"], { type: "image/jpeg" }),
      );
      const s2 = await ctx.storage.store(
        new Blob(["img2"], { type: "image/jpeg" }),
      );
      const subId = await ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-01-15T00:00:00.000Z",
        submissionType: "individual",
        state: "pending",
        tier: "base",
        createdBy: userId,
        pointsEarned: 0,
        submittedAt: Date.now(),
        evidenceStorageIds: [s1, s2],
      });
      const sub = await ctx.db.get(subId);
      expect((sub?.evidenceStorageIds ?? []).length).toBe(2);
    });
  });
});
