import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { nowUTC } from "../lib/dates";
import type { NotificationEvent } from "../notifications/events";

// Returns notification events as values rather than scheduling them directly,
// so the originating mutation controls when notifications are published.
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
