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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clerkUser(overrides: Partial<Record<string, unknown>> = {}): any {
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

async function getUserRoleIds(ctx: Ctx, externalId: string) {
  const users = await ctx.db.query("users").collect();
  const user = users.find((u) => u.externalId === externalId);
  if (!user) return [];
  const userRoles = await ctx.db.query("userRoles").collect();
  return userRoles.filter((r) => r.userId === user._id).map((r) => r.roleId);
}

describe("users.upsertFromClerk", () => {
  test("grants the player role to a newly created user", async () => {
    const t = convexTest(schemaForTest);
    await t.run(seedRoles);

    await t.mutation(internal.users.upsertFromClerk, {
      data: clerkUser(),
    });

    const roleIds = await t.run((ctx) => getUserRoleIds(ctx, "clerk_new_user"));
    const pid = await t.run(playerRoleId);

    expect(roleIds).toEqual([pid]);
  });

  test("is idempotent: repeated upserts do not add duplicate player rows", async () => {
    const t = convexTest(schemaForTest);
    await t.run(seedRoles);

    const data = clerkUser();
    await t.mutation(internal.users.upsertFromClerk, { data });
    await t.mutation(internal.users.upsertFromClerk, { data });

    const roleIds = await t.run((ctx) => getUserRoleIds(ctx, "clerk_new_user"));

    expect(roleIds).toHaveLength(1);
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

    await t.mutation(internal.users.upsertFromClerk, {
      data: clerkUser({
        id: "clerk_existing",
        email_addresses: [{ email_address: "existing@example.com" }],
        first_name: "Existing",
        last_name: "User",
      }),
    });

    const roleIds = await t.run((ctx) => getUserRoleIds(ctx, "clerk_existing"));
    const pid = await t.run(playerRoleId);

    expect(roleIds).toEqual([pid]);
  });
});
