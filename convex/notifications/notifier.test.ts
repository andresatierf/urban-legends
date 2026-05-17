import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import schema from "../schema";
import { handleEvent } from "./notifier";

// convex-test@0.0.1 accesses tableDefinition.documentType which was renamed to
// .validator in convex@1.25. Disabling schema validation is the minimal workaround.
const schemaForTest = Object.assign(Object.create(schema), {
  schemaValidation: false,
}) as typeof schema;

// Inspects the scheduled-functions table for `notifications.create` calls and
// returns their args. Asserting at the schedule boundary keeps the test
// focused on the seam (event → notification mapping) without flaky timing.
async function readScheduledCreateArgs(
  t: ReturnType<typeof convexTest>,
): Promise<Array<Record<string, unknown>>> {
  return t.run(async (ctx) => {
    const jobs = await ctx.db.system.query("_scheduled_functions").collect();
    return jobs
      .filter((j) => j.name === "notifications:create")
      .map((j) => j.args[0] as Record<string, unknown>);
  });
}

describe("Notifier dispatch", () => {
  test("role.granted maps to a single notification with correct title, body, and related entity", async () => {
    const t = convexTest(schemaForTest);

    const { userId, roleId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "u@test.com",
        name: "U",
        externalId: "ext_u",
      });
      const roleId = await ctx.db.insert("roles", {
        name: "reviewer",
        displayName: "Reviewer",
        hierarchy: 2,
      });
      return { userId, roleId };
    });

    await t.run(async (ctx) => {
      await handleEvent(ctx, { type: "role.granted", userId, roleId });
    });

    const scheduled = await readScheduledCreateArgs(t);

    expect(scheduled).toHaveLength(1);
    const [args] = scheduled;
    expect(args.userId).toBe(userId);
    expect(args.type).toBe("role_granted");
    expect(args.title).toBe("Reviewer role granted");
    expect(args.body).toBe("You have been granted Reviewer privileges");
    expect(args.relatedEntityId).toBe("reviewer");
    expect(args.relatedEntityType).toBe("role");
  });

  test("falls back to role.name when displayName is empty", async () => {
    const t = convexTest(schemaForTest);

    const { userId, roleId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "u2@test.com",
        name: "U2",
        externalId: "ext_u2",
      });
      const roleId = await ctx.db.insert("roles", {
        name: "manager",
        displayName: "",
        hierarchy: 3,
      });
      return { userId, roleId };
    });

    await t.run(async (ctx) => {
      await handleEvent(ctx, { type: "role.granted", userId, roleId });
    });

    const scheduled = await readScheduledCreateArgs(t);

    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].title).toBe("manager role granted");
    expect(scheduled[0].body).toBe("You have been granted manager privileges");
  });

  test("unmigrated event types throw a clear error", async () => {
    const t = convexTest(schemaForTest);

    const submissionId = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "s@test.com",
        name: "S",
        externalId: "ext_s",
      });
      const tournamentId = await ctx.db.insert("tournaments", {
        name: "T",
        description: "x",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdBy: userId,
        scoringConfig: {
          individualPoints: { base: 1, advanced: 2 },
          teamExercisePoints: { base: 3, advanced: 4 },
          teamExerciseThreshold: 0.5,
        },
      });
      const teamId = await ctx.db.insert("teams", {
        name: "Team",
        tournamentId,
        createdBy: userId,
        joinPolicy: "open",
        points: 0,
      });
      return ctx.db.insert("submissions", {
        userId,
        teamId,
        tournamentId,
        date: "2024-01-01",
        submissionType: "individual",
        state: "pending",
        createdBy: userId,
        tier: "base",
        pointsEarned: 0,
      });
    });

    await expect(
      t.run(async (ctx) => {
        await handleEvent(ctx, { type: "submission.created", submissionId });
      }),
    ).rejects.toThrow(/not yet migrated/);
  });
});
