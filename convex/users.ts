import type { UserJSON } from "@clerk/backend";
import { type Validator, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  type QueryCtx,
  internalMutation,
  query,
} from "./_generated/server";
import { batchGetDocuments } from "./lib/helpers";
import type { RoleName } from "./roles";

export const list = query({
  args: { userIds: v.optional(v.array(v.id("users"))) },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    let usersQuery = ctx.db.query("users");

    if (args.userIds && args.userIds.length > 0) {
      usersQuery = usersQuery.filter((q) =>
        q.or(
          ...(args.userIds as typeof args.userIds).map((u) =>
            q.eq(q.field("_id"), u),
          ),
        ),
      );
    }

    const users = await usersQuery.collect();

    return await Promise.all(
      users.map(async (user) => {
        const roles = await getRolesForUser(ctx, user._id);
        return {
          ...user,
          roles,
          roleNames: roles.map(({ name }) => name),
        };
      }),
    );
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    return await getUser(ctx, { userId: args.id });
  },
});

export const getDetails = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    const user = await getUser(ctx, { userId: args.userId });

    const [teamMemberships, allParticipations] = await Promise.all([
      ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("participations")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
    ]);

    const teamsWithTournaments = await Promise.all(
      teamMemberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        if (!team) return null;

        const tournament = await ctx.db.get(team.tournamentId);

        return {
          ...team,
          tournamentName: tournament?.name || "Unknown Tournament",
          role: membership.role,
        };
      }),
    );

    const teams = teamsWithTournaments.filter(
      (t): t is NonNullable<typeof t> => t !== null,
    );

    const activityIds = Array.from(
      new Set(allParticipations.map((p) => p.activityId)),
    );
    const activities = (
      await Promise.all(activityIds.map((id) => ctx.db.get(id)))
    ).filter((a): a is NonNullable<typeof a> => a !== null);
    const nonDeleted = activities.filter((a) => a.state !== "deleted");
    const approvedActivities = nonDeleted.filter((a) => a.state === "approved");

    const totalPointsEarned = allParticipations
      .filter((p) => !!p.fulfilledAt)
      .reduce((sum, p) => sum + (p.pointsEarned || 0), 0);

    const isAdmin = currentUser.roleNames.includes("admin");
    const canManageRoles = isAdmin;
    const isViewingSelf = currentUser._id === args.userId;

    return {
      user,
      statistics: {
        teamCount: teams.length,
        activityCount: nonDeleted.length,
        approvedActivityCount: approvedActivities.length,
        totalPointsEarned,
      },
      teams,
      canManageRoles,
      isViewingSelf,
    };
  },
});

export const current = query({
  args: {
    throw: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    typeof args.throw extends false ? UserWithRoles | null : UserWithRoles
  > => {
    if (args.throw) {
      return await getCurrentUserOrThrow(ctx, { throw: true });
    }
    return await getCurrentUserOrThrow(ctx, { throw: false });
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const userAttributes = {
      email: data.email_addresses[0].email_address,
      name: `${data.first_name} ${data.last_name}`,
      externalId: data.id,
      imageUrl: data.image_url,
    };

    const user = await userByExternalId(ctx, data.id);
    const userId =
      user === null
        ? await ctx.db.insert("users", userAttributes)
        : (await ctx.db.patch(user._id, userAttributes), user._id);

    await ensurePlayerRole(ctx, userId);
  },
});

async function ensurePlayerRole(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const playerRole = await ctx.db
    .query("roles")
    .withIndex("by_name", (q) => q.eq("name", "player"))
    .first();
  if (!playerRole) return;

  const existing = await ctx.db
    .query("userRoles")
    .withIndex("by_user_role", (q) =>
      q.eq("userId", userId).eq("roleId", playerRole._id),
    )
    .first();
  if (existing) return;

  await ctx.db.insert("userRoles", {
    userId,
    roleId: playerRole._id,
    assignedAt: new Date().toISOString(),
  });
}

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

export async function getCurrentUserOrThrow(
  ctx: QueryCtx,
  args?: { throw?: true },
): Promise<UserWithRoles>;
export async function getCurrentUserOrThrow(
  ctx: QueryCtx,
  args?: { throw: false },
): Promise<UserWithRoles | null>;
export async function getCurrentUserOrThrow(
  ctx: QueryCtx,
  args?: { throw?: boolean },
): Promise<UserWithRoles | null> {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) {
    if (args && args.throw === false) return null;
    throw new Error("Can't get current user");
  }
  const roles = await getRolesForUser(ctx, userRecord._id);
  return {
    ...userRecord,
    roles,
    roleNames: roles.map(({ name }) => name as RoleName),
  };
}

export type UserWithRoles = Doc<"users"> & {
  roles: Array<Doc<"roles">>;
  roleNames: RoleName[];
};

export async function getUser(
  ctx: QueryCtx,
  args: { userId: Id<"users">; throw?: true },
): Promise<UserWithRoles>;
export async function getUser(
  ctx: QueryCtx,
  args: { userId: Id<"users">; throw: false },
): Promise<UserWithRoles | null>;
export async function getUser(
  ctx: QueryCtx,
  args: { userId: Id<"users">; throw?: boolean },
): Promise<UserWithRoles | null> {
  const user = await ctx.db.get(args.userId);
  if (!user) {
    if (args.throw !== false) throw new Error("User not found");
    return null;
  }
  const roles = await getRolesForUser(ctx, user._id);
  return {
    ...user,
    roles,
    roleNames: roles.map(({ name }) => name as RoleName),
  };
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

export async function getRolesForUser(ctx: QueryCtx, userId: Id<"users">) {
  const userRoles = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const roleIds = userRoles.map((ur) => ur.roleId);
  return await batchGetDocuments(ctx, "roles", roleIds);
}
