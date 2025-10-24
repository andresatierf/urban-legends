import type { UserJSON } from "@clerk/backend";
import { type Validator, v } from "convex/values";
import {
  internalMutation,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    getCurrentUserOrThrow(ctx);

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
    getCurrentUserOrThrow(ctx);

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

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (user !== null) {
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, {
          email: identity.email,
          name: identity.name,
        });
      }
      return user._id;
    }

    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      email: identity.email ?? "no email found",
      externalId: identity.subject,
    });
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    const userAttributes = {
      email: data.email_addresses[0].email_address,
      name: `${data.first_name} ${data.last_name}`,
      externalId: data.id,
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      await ctx.db.insert("users", userAttributes);
    } else {
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    }
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByExternalId(ctx, identity.subject);
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
    .unique();
}
