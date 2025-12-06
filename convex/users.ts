import type { UserJSON } from "@clerk/backend";
import { type Validator, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  type QueryCtx,
  query,
} from "./_generated/server";
import { batchGetDocuments, groupBy, toIdMap } from "./lib/helpers";

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

/**
 * Get comprehensive user details with all related entities and permissions.
 * This query follows the pattern established by submissions.getDetails to provide
 * a single, efficient query for detail pages.
 */
export const getDetails = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Fetch user
    const user = await getUser(ctx, { userId: args.userId });

    // Fetch roles for the target user
    const [teamMemberships, allSubmissions] = await Promise.all([
      ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("submissions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
    ]);

    // Fetch teams with tournament context
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

    const approvedSubmissions = allSubmissions.filter(
      (s) => s.state === "approved",
    );

    // Calculate total points earned
    const totalPointsEarned = approvedSubmissions.reduce(
      (sum, s) => sum + (s.pointsEarned || 0),
      0,
    );

    // Determine permissions
    const isAdmin = currentUser.roleNames.includes("admin");
    const canManageRoles = isAdmin;
    const isViewingSelf = currentUser._id === args.userId;

    return {
      user,
      statistics: {
        teamCount: teams.length,
        submissionCount: allSubmissions.length,
        approvedSubmissionCount: approvedSubmissions.length,
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
    roleNames: roles.map(({ name }) => name),
  };
}

export type UserWithRoles = Doc<"users"> & {
  roles: Array<Doc<"roles">>;
  roleNames: string[];
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
    roleNames: roles.map(({ name }) => name),
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

/**
 * Enriches multiple users with roles in parallel.
 * More efficient than calling getUser in a loop.
 *
 * @param ctx - Query or Mutation context
 * @param userIds - Array of user IDs to enrich
 * @returns Array of users with roles
 */
export async function getUsersWithRoles(
  ctx: QueryCtx | MutationCtx,
  userIds: Id<"users">[],
): Promise<UserWithRoles[]> {
  if (userIds.length === 0) return [];

  // Fetch all users
  const users = await ctx.db
    .query("users")
    .filter((q) => q.or(...userIds.map((id) => q.eq(q.field("_id"), id))))
    .collect();

  // Fetch all user roles for these users in one query
  const allUserRoles = await ctx.db
    .query("userRoles")
    .filter((q) => q.or(...userIds.map((id) => q.eq(q.field("userId"), id))))
    .collect();

  // Group user roles by user ID using helper
  const userRolesByUserId = groupBy(allUserRoles, (ur) => ur.userId);

  // Get unique role IDs
  const roleIds = Array.from(new Set(allUserRoles.map((ur) => ur.roleId)));
  const roles = await ctx.db
    .query("roles")
    .filter((q) => q.or(...roleIds.map((id) => q.eq(q.field("_id"), id))))
    .collect();

  const rolesMap = toIdMap(roles);

  // Enrich users with roles
  return users.map((user) => {
    const userRoleRecords = userRolesByUserId.get(user._id) || [];
    const userRoles = userRoleRecords
      .map((ur) => rolesMap.get(ur.roleId))
      .filter((r): r is Doc<"roles"> => r !== undefined);

    return {
      ...user,
      roles: userRoles,
      roleNames: userRoles.map((r) => r.name),
    };
  });
}
