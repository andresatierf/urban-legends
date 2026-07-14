import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { rolesToCreate } from "../common/roleData";
import { internal } from "./_generated/api";
import schema from "./schema";

const schemaForTest = Object.assign(Object.create(schema), {
  schemaValidation: false,
}) as typeof schema;

type Ctx = Parameters<Parameters<ReturnType<typeof convexTest>["run"]>[0]>[0];

async function seedRoles(ctx: Ctx) {
  for (const role of rolesToCreate) {
    await ctx.db.insert("roles", role);
  }
}

function clerkUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "clerk_new_user",
    first_name: "New",
    last_name: "User",
    email_addresses: [{ email_address: "new@example.com" }],
    image_url: "",
    ...overrides,
  };
}

async function playerRoleId(ctx: Ctx) {
  const roles = await ctx.db.query("roles").collect();
  return roles.find((r) => r.name === "player")?._id ?? null;
}

describe("users.upsertFromClerk", () => {
  test("grants the player role to a newly created user", async () => {
    const t = convexTest(schemaForTest);
    await t.run(seedRoles);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await t.mutation(internal.users.upsertFromClerk, {
      data: clerkUser() as any,
    });

    const { userRoles, playerId } = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_external_id", (q) =>
          q.eq("externalId", "clerk_new_user"),
        )
        .unique();
      const rows = user
        ? await ctx.db
            .query("userRoles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect()
        : [];
      return { userRoles: rows, playerId: await playerRoleId(ctx) };
    });

    expect(userRoles.map((r) => r.roleId)).toEqual([playerId]);
  });

  test("is idempotent: repeated upserts do not add duplicate player rows", async () => {
    const t = convexTest(schemaForTest);
    await t.run(seedRoles);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = clerkUser() as any;
    await t.mutation(internal.users.upsertFromClerk, { data });
    await t.mutation(internal.users.upsertFromClerk, { data });

    const rows = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_external_id", (q) =>
          q.eq("externalId", "clerk_new_user"),
        )
        .unique();
      return user
        ? await ctx.db
            .query("userRoles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect()
        : [];
    });

    expect(rows).toHaveLength(1);
  });

  test("backfills the player role on update for a pre-existing user without it", async () => {
    const t = convexTest(schemaForTest);
    await t.run(async (ctx) => {
      await seedRoles(ctx);
      await ctx.db.insert("users", {
        email: "existing@example.com",
        name: "Existing User",
        externalId: "clerk_existing",
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await t.mutation(internal.users.upsertFromClerk, {
      data: clerkUser({
        id: "clerk_existing",
        email_addresses: [{ email_address: "existing@example.com" }],
        first_name: "Existing",
        last_name: "User",
      }) as any,
    });

    const rows = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_external_id", (q) =>
          q.eq("externalId", "clerk_existing"),
        )
        .unique();
      return user
        ? await ctx.db
            .query("userRoles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect()
        : [];
    });

    const pid = await t.run(playerRoleId);
    expect(rows.map((r) => r.roleId)).toEqual([pid]);
  });
});
