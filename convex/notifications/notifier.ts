import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import type { NotificationEvent } from "./events";
import { NOTIFICATION_TYPES } from "./types";

// Each event runs in its own scheduled mutation so failures don't propagate
// back to the originating user action.
export async function publish(
  ctx: MutationCtx,
  events: NotificationEvent[],
): Promise<void> {
  for (const event of events) {
    await ctx.scheduler.runAfter(0, internal.notifications.dispatch, {
      event,
    });
  }
}

// Unmigrated event types throw — they still flow through triggers.ts for now.
export async function handleEvent(
  ctx: MutationCtx,
  event: NotificationEvent,
): Promise<void> {
  switch (event.type) {
    case "role.granted":
      await handleRoleGranted(ctx, event);
      return;
    case "submission.created":
    case "submission.approved":
    case "submission.rejected":
    case "joinRequest.created":
    case "joinRequest.accepted":
    case "joinRequest.rejected":
    case "teamMember.removed":
    case "role.revoked":
    case "tournament.ended":
      throw new Error(
        `NotificationEvent "${event.type}" is not yet migrated to the Notifier seam`,
      );
  }
}

async function handleRoleGranted(
  ctx: MutationCtx,
  event: Extract<NotificationEvent, { type: "role.granted" }>,
): Promise<void> {
  const role = await ctx.db.get(event.roleId);
  if (!role) {
    throw new Error(
      `Role ${event.roleId} not found while dispatching role.granted`,
    );
  }

  const displayName = role.displayName || role.name;

  await ctx.scheduler.runAfter(0, internal.notifications.create, {
    userId: event.userId,
    type: NOTIFICATION_TYPES.ROLE_GRANTED,
    title: `${displayName} role granted`,
    body: `You have been granted ${displayName} privileges`,
    relatedEntityId: role.name,
    relatedEntityType: "role",
  });
}
