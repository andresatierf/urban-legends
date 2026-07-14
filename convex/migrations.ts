import { internalMutation } from "./_generated/server";

// Deletes legacy role rows from userRoles:
// - viewer: expressed nothing the system needed — it was the absence of any role
// - tournament_manager and reviewer: moved to tournamentRoles (per-Tournament axis);
//   global rows in userRoles are deleted rather than promoted because the application
//   has no production users
export const deleteLegacyRoleAssignments = internalMutation({
  args: {},
  handler: async (ctx) => {
    const legacyRoleNames = ["viewer", "tournament_manager", "reviewer"];

    const legacyRoles = await Promise.all(
      legacyRoleNames.map((name) =>
        ctx.db
          .query("roles")
          .withIndex("by_name", (q) => q.eq("name", name))
          .first(),
      ),
    );

    const legacyRoleIds = new Set(
      legacyRoles
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r) => r._id),
    );

    if (legacyRoleIds.size === 0) return { deleted: 0 };

    const allUserRoles = await ctx.db.query("userRoles").collect();
    const toDelete = allUserRoles.filter((ur) => legacyRoleIds.has(ur.roleId));

    await Promise.all(toDelete.map((ur) => ctx.db.delete(ur._id)));

    return { deleted: toDelete.length };
  },
});
