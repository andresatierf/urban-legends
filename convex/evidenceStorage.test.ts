import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import type { Id } from "./_generated/dataModel";
import { claimUploads, releaseUploads, sweepOrphans } from "./evidenceStorage";
import schema from "./schema";

// convex-test@0.0.1 schema validation workaround (see lifecycle/activities.test.ts)
const schemaForTest = Object.assign(Object.create(schema), {
  schemaValidation: false,
}) as typeof schema;

async function seedUser(
  ctx: Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0],
  suffix = "",
) {
  return ctx.db.insert("users", {
    email: `u${suffix}@example.com`,
    name: `User${suffix}`,
    externalId: `ext_u${suffix}`,
  });
}

describe("claimUploads", () => {
  test("deletes matching pendingUploads row for the given userId and storageId", async () => {
    const t = convexTest(schemaForTest);

    const { userId, storageId } = await t.run(async (ctx) => {
      const userId = await seedUser(ctx, "1");
      // schemaValidation is disabled; use a fake storage ID string
      const storageId = "fake_storage_claim_1" as unknown as Id<"_storage">;
      await ctx.db.insert("pendingUploads", {
        storageId,
        userId,
        createdAt: new Date().toISOString(),
      });
      return { userId, storageId };
    });

    await t.run(async (ctx) => {
      await claimUploads(ctx, userId, [storageId]);
    });

    await t.run(async (ctx) => {
      const rows = await ctx.db.query("pendingUploads").collect();
      expect(rows).toHaveLength(0);
    });
  });

  test("throws when storage ID is not in pendingUploads", async () => {
    const t = convexTest(schemaForTest);
    const userId = await t.run(async (ctx) => seedUser(ctx, "2"));

    await expect(
      t.run(async (ctx) => {
        await claimUploads(ctx, userId, [
          "nonexistent" as unknown as Id<"_storage">,
        ]);
      }),
    ).rejects.toThrow();
  });

  test("throws when storage ID belongs to a different user", async () => {
    const t = convexTest(schemaForTest);

    const { userId1, storageId } = await t.run(async (ctx) => {
      const userId1 = await seedUser(ctx, "3a");
      const userId2 = await seedUser(ctx, "3b");
      const storageId = "fake_storage_claim_3" as unknown as Id<"_storage">;
      // Row belongs to userId2
      await ctx.db.insert("pendingUploads", {
        storageId,
        userId: userId2,
        createdAt: new Date().toISOString(),
      });
      return { userId1, storageId };
    });

    // Claim as userId1; must reject because the row is owned by userId2
    await expect(
      t.run(async (ctx) => {
        await claimUploads(ctx, userId1, [storageId]);
      }),
    ).rejects.toThrow();
  });

  test("claims all rows when multiple storage IDs are owned by the same user", async () => {
    const t = convexTest(schemaForTest);

    const { userId, storageIds } = await t.run(async (ctx) => {
      const userId = await seedUser(ctx, "4multi");
      const storageIds = [
        "fake_storage_multi_1" as unknown as Id<"_storage">,
        "fake_storage_multi_2" as unknown as Id<"_storage">,
        "fake_storage_multi_3" as unknown as Id<"_storage">,
      ];
      for (const storageId of storageIds) {
        await ctx.db.insert("pendingUploads", {
          storageId,
          userId,
          createdAt: new Date().toISOString(),
        });
      }
      return { userId, storageIds };
    });

    await t.run(async (ctx) => {
      await claimUploads(ctx, userId, storageIds);
    });

    await t.run(async (ctx) => {
      const rows = await ctx.db.query("pendingUploads").collect();
      expect(rows).toHaveLength(0);
    });
  });
});

describe("releaseUploads", () => {
  // convex-test@0.0.1 does not support ctx.storage.delete with fake storage IDs:
  // the call throws and the Convex mutation rolls back the entire transaction,
  // so DB row deletion cannot be verified end-to-end here. The unit under test
  // is the DB logic; blob deletion is an integration concern covered by the
  // actual Convex runtime. We verify the no-row case and the error propagation.

  test("propagates storage error when blob deletion fails (no silent swallow)", async () => {
    const t = convexTest(schemaForTest);

    const { storageId } = await t.run(async (ctx) => {
      const userId = await seedUser(ctx, "4");
      const storageId = "fake_storage_release_1" as unknown as Id<"_storage">;
      await ctx.db.insert("pendingUploads", {
        storageId,
        userId,
        createdAt: new Date().toISOString(),
      });
      return { storageId };
    });

    // With a fake storage ID, ctx.storage.delete throws. The function must not
    // silently swallow the error; it should propagate it.
    await expect(
      t.run(async (ctx) => {
        await releaseUploads(ctx, [storageId]);
      }),
    ).rejects.toThrow();
  });

  test("is a no-op when storageIds array is empty", async () => {
    const t = convexTest(schemaForTest);

    await expect(
      t.run(async (ctx) => {
        await releaseUploads(ctx, []);
      }),
    ).resolves.not.toThrow();
  });
});

describe("sweepOrphans", () => {
  test("propagates storage error for rows older than cutoff (confirms sweep was attempted)", async () => {
    const t = convexTest(schemaForTest);
    const olderThan = new Date(Date.now() - 1000).toISOString();

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, "sweep1");
      const storageId = "fake_storage_sweep_1" as unknown as Id<"_storage">;
      const twoDaysAgo = new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000,
      ).toISOString();
      await ctx.db.insert("pendingUploads", {
        storageId,
        userId,
        createdAt: twoDaysAgo,
      });
    });

    // Row is older than the cutoff; sweep tries to delete the blob.
    // ctx.storage.delete throws for fake IDs; error must propagate.
    await expect(
      t.run(async (ctx) => {
        await sweepOrphans(ctx, olderThan);
      }),
    ).rejects.toThrow();
  });

  test("skips rows newer than the cutoff", async () => {
    const t = convexTest(schemaForTest);
    const twoDaysAgo = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, "sweep2");
      const storageId = "fake_storage_sweep_2" as unknown as Id<"_storage">;
      await ctx.db.insert("pendingUploads", {
        storageId,
        userId,
        createdAt: new Date().toISOString(),
      });
    });

    // Cutoff is 2 days ago; row was just created; must be preserved.
    await t.run(async (ctx) => {
      await sweepOrphans(ctx, twoDaysAgo);
    });

    await t.run(async (ctx) => {
      const rows = await ctx.db.query("pendingUploads").collect();
      expect(rows).toHaveLength(1);
    });
  });

  test("is a no-op when no rows match the cutoff (idempotent second run)", async () => {
    const t = convexTest(schemaForTest);
    const veryOldCutoff = "2020-01-01T00:00:00.000Z";

    await expect(
      t.run(async (ctx) => {
        await sweepOrphans(ctx, veryOldCutoff);
      }),
    ).resolves.not.toThrow();
  });
});
