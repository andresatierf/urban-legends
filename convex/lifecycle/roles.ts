import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { nowUTC } from "../lib/dates";
import type { NotificationEvent } from "../notifications/events";

// Grants a role to a User by inserting a userRoles row. Returns the
// notification events the transition produced, keeping the lifecycle pure:
// no scheduler, no notification imports — events are values that the public
// mutation forwards to `Notifier.publish`.
export async function grant(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    roleId: Id<"roles">;
    assignedBy: Id<"users">;
  },
): Promise<NotificationEvent[]> {
  await ctx.db.insert("userRoles", {
    userId: args.userId,
    roleId: args.roleId,
    assignedBy: args.assignedBy,
    assignedAt: nowUTC(),
  });

  return [{ type: "role.granted", userId: args.userId, roleId: args.roleId }];
}
