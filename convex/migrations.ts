import { internalMutation } from "./_generated/server";
import { nowUTC } from "./lib/dates";

// Deletes legacy role rows from userRoles:
// - player and viewer: expressed nothing the system needed; player is now derived
//   from teamMembers, viewer was the absence of any role
// - tournament_manager and reviewer: moved to tournamentRoles (per-Tournament axis);
//   global rows in userRoles are deleted rather than promoted because the application
//   has no production users
export const deleteLegacyRoleAssignments = internalMutation({
  args: {},
  handler: async (ctx) => {
    const legacyRoleNames = [
      "player",
      "viewer",
      "tournament_manager",
      "reviewer",
    ];

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

// Backfills teamInvitations into joinRequests and patches existing joinRequests rows.
// Run once before dropping the teamInvitations table from schema.
// Delete this mutation after running, consistent with the prior cleanup pattern.
export const unifyJoinRequestsAndInvitations = internalMutation({
  args: {},
  handler: async (ctx) => {
    // biome-ignore lint/suspicious/noExplicitAny: migration queries table dropped from schema
    const invitations = await ctx.db.query("teamInvitations" as any).collect();
    let backfilled = 0;
    for (const inv of invitations) {
      const expiresAt =
        inv.expiresAt ??
        (() => {
          const d = new Date(inv.createdAt);
          d.setDate(d.getDate() + 7);
          return d.toISOString();
        })();

      const status =
        inv.status === "accepted"
          ? "accepted"
          : inv.status === "rejected"
            ? "rejected"
            : inv.status === "cancelled"
              ? "cancelled"
              : inv.status === "expired"
                ? "expired"
                : "pending";

      await ctx.db.insert("joinRequests", {
        teamId: inv.teamId,
        userId: inv.invitedUserId,
        status,
        createdAt: inv.createdAt,
        respondedAt: inv.respondedAt,
        initiator: "team",
        createdBy: inv.invitedBy,
        expiresAt,
      });
      backfilled++;
    }

    const requests = await ctx.db.query("joinRequests").collect();
    let patched = 0;
    const now = nowUTC();
    for (const req of requests) {
      if (req.initiator !== undefined) continue;

      const expiresAt =
        req.expiresAt ??
        (() => {
          const d = new Date(req.createdAt);
          d.setDate(d.getDate() + 7);
          return d.toISOString();
        })();

      const status = req.status === "approved" ? "accepted" : req.status;

      await ctx.db.patch(req._id, {
        initiator: "user",
        createdBy: req.userId,
        expiresAt,
        status,
        respondedAt:
          req.respondedAt ?? (status !== "pending" ? now : undefined),
      });
      patched++;
    }

    return { backfilled, patched };
  },
});
