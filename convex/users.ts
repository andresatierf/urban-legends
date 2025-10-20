import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const [users, roles, userRoles] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("roles").collect(),
      ctx.db.query("userRoles").collect(),
    ]);

    return users.map((user) => ({
      ...user,
      roles: userRoles
        .filter((role) => role.userId === user._id)
        .map((role) => roles.find((r) => r._id === role.roleId)?.name),
    }));
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    const [roles, userRoles] = await Promise.all([
      ctx.db.query("roles").collect(),
      ctx.db
        .query("userRoles")
        .withIndex("by_user", (q) => q.eq("userId", id))
        .collect(),
    ]);

    return {
      ...user,
      roles: userRoles.map(
        (role) => roles.find((r) => r._id === role.roleId)?.name,
      ),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.users.internalCreate, args);
  },
});

export const internalCreate = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { name, email, password }) => {
    await createAccount(ctx, {
      provider: "password",
      account: {
        id: email,
        secret: password,
      },
      profile: {
        name,
        email,
      },
    });
  },
});
