# Notification Mutations API Contract

**Version**: 1.0.0
**Last Updated**: 2026-01-29

This document specifies all write operations (mutations) for the notification system. Mutations modify database state and are idempotent where possible.

---

## `create` - Create Notification

Create a new notification for a user. This is an **internal mutation** (not exposed to client) called by other mutations and actions.

### Function Signature

```typescript
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(), // One of 23 notification types
    title: v.string(),
    body: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.union(
      v.literal("team"),
      v.literal("tournament"),
      v.literal("submission"),
      v.literal("role"),
      v.literal("user")
    )),
    actionUrl: v.optional(v.string()),
    actionMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => { /* ... */ }
});
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `Id<"users">` | Yes | The user who will receive the notification |
| `type` | `string` | Yes | Notification type (one of 23 types, see reference) |
| `title` | `string` | Yes | Notification title/headline (max 200 chars) |
| `body` | `string` | No | Optional detailed message (max 1000 chars) |
| `relatedEntityId` | `string` | No | ID of related entity (team, tournament, etc.) as string |
| `relatedEntityType` | `"team" \| "tournament" \| "submission" \| "role" \| "user"` | No | Type of related entity |
| `actionUrl` | `string` | No | URL to navigate when notification is clicked |
| `actionMetadata` | `any` | No | Additional metadata for action buttons (e.g., invitation ID) |

### Output Format

Returns the ID of the created notification (or existing notification if duplicate).

```typescript
type CreateOutput = Id<"notifications">;
```

### Idempotency Behavior

The `create` mutation is idempotent based on the combination of:
- `userId`
- `type`
- `relatedEntityType`
- `relatedEntityId`

If a notification with the same combination exists, the existing notification ID is returned instead of creating a duplicate.

**Exception**: Time-based notifications (e.g., `tournament_starting_24h`) use a unique `relatedEntityId` pattern (e.g., `tournamentId_YYYY-MM-DD`) to allow one notification per day.

### Authorization Rules

- This is an `internalMutation` - only callable from other Convex functions (server-side)
- No client-side authorization needed (cannot be called from frontend)
- Caller must validate that `userId` exists before calling

### Performance Considerations

- Uses `by_user_type_entity` compound index for idempotency check
- Single index lookup before insert (very fast)
- Batch creation of multiple notifications should use `Promise.all()` for parallelism

### Example Usage

```typescript
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

// Example: Team invitation creates notification
export const inviteUser = mutation({
  args: { teamId: v.id("teams"), invitedUserId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);

    // ... invitation logic ...

    // Create notification (idempotent)
    await ctx.runMutation(internal.notifications.create, {
      userId: args.invitedUserId,
      type: "team_invitation_received",
      title: `You've been invited to join ${team.name}`,
      body: `${currentUser.name} invited you to join their team`,
      relatedEntityId: args.teamId,
      relatedEntityType: "team",
      actionUrl: `/teams/${args.teamId}/invitations`,
      actionMetadata: { invitationId: invitation._id },
    });

    return invitation._id;
  }
});
```

---

## `markAsRead` - Mark Single Notification as Read

Mark a specific notification as read.

### Function Signature

```typescript
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => { /* ... */ }
});
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notificationId` | `Id<"notifications">` | Yes | The notification to mark as read |

### Output Format

Returns a boolean indicating success.

```typescript
type MarkAsReadOutput = { success: boolean };
```

### Authorization Rules

- User must be authenticated (checked via `getCurrentUserOrThrow(ctx)`)
- Notification must belong to current user (validated: `notification.userId === currentUser._id`)
- Throws error if notification not found or unauthorized

### Idempotency Behavior

- Safe to call multiple times on the same notification
- If notification is already read, operation succeeds without changes
- Returns `{ success: true }` in all cases (including already-read)

### Performance Considerations

- Direct document lookup by ID (very fast)
- Single `patch` operation
- All `useQuery` hooks watching this notification automatically update

### Example Usage

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function NotificationItem({ notification }: Props) {
  const markAsRead = useMutation(api.notifications.markAsRead);

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }

    // Navigate to action URL if present
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={notification.isRead ? "opacity-60" : "font-semibold"}
    >
      {notification.title}
    </div>
  );
}
```

---

## `markAllAsRead` - Mark All Notifications as Read

Mark all of the current user's notifications as read.

### Function Signature

```typescript
export const markAllAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => { /* ... */ }
});
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `Id<"users">` | Yes | The user whose notifications to mark as read |

### Output Format

Returns the count of notifications that were updated.

```typescript
type MarkAllAsReadOutput = { updatedCount: number };
```

### Authorization Rules

- User must be authenticated
- Users can only mark their own notifications as read (validated: `args.userId === currentUser._id`)
- Throws error if unauthorized

### Idempotency Behavior

- Safe to call multiple times
- Only counts notifications that changed from unread to read
- If all notifications are already read, returns `{ updatedCount: 0 }`

### Performance Considerations

- Uses `by_user_and_read` index to find unread notifications
- Batch updates all unread notifications with `Promise.all()`
- For large notification counts (100+), consider rate limiting to prevent timeout
- Soft-deleted notifications are excluded from update

### Example Usage

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function NotificationHeader() {
  const currentUserId = useCurrentUserId();
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    userId: currentUserId,
  });

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead({ userId: currentUserId });
    console.log(`Marked ${result.updatedCount} notifications as read`);
  };

  if (!unreadCount || unreadCount === 0) return null;

  return (
    <div className="flex items-center justify-between">
      <h3>Notifications</h3>
      <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
        Mark all as read
      </Button>
    </div>
  );
}
```

---

## `deleteNotification` - Soft Delete Notification

Soft delete a notification (marks as deleted without removing from database).

### Function Signature

```typescript
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => { /* ... */ }
});
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notificationId` | `Id<"notifications">` | Yes | The notification to delete |

### Output Format

Returns a boolean indicating success.

```typescript
type DeleteNotificationOutput = { success: boolean };
```

### Authorization Rules

- User must be authenticated
- Notification must belong to current user
- Throws error if notification not found or unauthorized

### Soft Delete Behavior

- Sets `isDeleted: true` field instead of removing document
- Soft-deleted notifications are excluded from all queries
- Allows for audit trail and potential recovery
- Hard deletion happens via scheduled cleanup (90-day retention)

### Idempotency Behavior

- Safe to call multiple times
- If notification is already deleted, returns `{ success: true }`
- Does not throw error on already-deleted notifications

### Performance Considerations

- Direct document lookup and single `patch` operation
- Soft-deleted notifications remain in database until cleanup cron runs
- Uses `by_user_and_deleted` index to filter deleted notifications in queries

### Example Usage

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function NotificationItem({ notification }: Props) {
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent notification click

    const confirmed = confirm("Delete this notification?");
    if (confirmed) {
      await deleteNotification({ notificationId: notification._id });
    }
  };

  return (
    <div className="relative group">
      <div>{notification.title}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

---

## Notification Type Constants

For type safety, define notification types as constants:

```typescript
// convex/notifications/types.ts
export const NOTIFICATION_TYPES = {
  // Team Events
  TEAM_INVITATION_RECEIVED: "team_invitation_received",
  TEAM_JOIN_REQUEST_RECEIVED: "team_join_request_received",
  JOIN_REQUEST_APPROVED: "join_request_approved",
  JOIN_REQUEST_REJECTED: "join_request_rejected",
  MEMBER_JOINED_TEAM: "member_joined_team",
  MEMBER_LEFT_TEAM: "member_left_team",
  REMOVED_FROM_TEAM: "removed_from_team",
  CAPTAIN_ROLE_TRANSFERRED_TO: "captain_role_transferred_to",
  CAPTAIN_ROLE_TRANSFERRED_FROM: "captain_role_transferred_from",
  TEAM_DELETED: "team_deleted",

  // Submission Events
  SUBMISSION_APPROVED: "submission_approved",
  SUBMISSION_REJECTED: "submission_rejected",
  SUBMISSION_GROUP_AUTO_CREATED: "submission_group_auto_created",
  TEAMMATE_SUBMITTED: "teammate_submitted",
  SUBMISSION_FLAGGED_FOR_REVIEW: "submission_flagged_for_review",

  // Tournament Events
  TOURNAMENT_STARTING_24H: "tournament_starting_24h",
  TOURNAMENT_STARTED: "tournament_started",
  TOURNAMENT_ENDING_24H: "tournament_ending_24h",
  TOURNAMENT_ENDED: "tournament_ended",
  TOURNAMENT_WINNER_ANNOUNCED: "tournament_winner_announced",
  ASSIGNED_AS_TOURNAMENT_MANAGER: "assigned_as_tournament_manager",

  // Role/Admin Events
  ROLE_GRANTED: "role_granted",
  ROLE_REVOKED: "role_revoked",
  PENDING_ITEMS_DIGEST: "pending_items_digest",
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
```

---

## Helper Functions

### `createBulkNotifications` - Create Multiple Notifications

Internal helper for creating notifications for multiple users efficiently.

```typescript
export const createBulkNotifications = internalMutation({
  args: {
    notifications: v.array(v.object({
      userId: v.id("users"),
      type: v.string(),
      title: v.string(),
      body: v.optional(v.string()),
      relatedEntityId: v.optional(v.string()),
      relatedEntityType: v.optional(v.string()),
      actionUrl: v.optional(v.string()),
      actionMetadata: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const notificationIds = await Promise.all(
      args.notifications.map(notification =>
        ctx.runMutation(internal.notifications.create, notification)
      )
    );

    return { createdCount: notificationIds.length };
  }
});
```

**Usage**: When notifying all team members, tournament participants, etc.

---

## Error Handling

All mutations follow these error handling patterns:

| Error Type | Behavior | HTTP Equivalent |
|-----------|----------|-----------------|
| **Authentication Error** | Throw error via `getCurrentUserOrThrow(ctx)` | 401 Unauthorized |
| **Authorization Error** | Throw error with message "Not authorized" | 403 Forbidden |
| **Not Found** | Throw error with message "Notification not found" | 404 Not Found |
| **Invalid Parameters** | Convex validator throws before handler runs | 400 Bad Request |
| **Idempotency** | Return existing result, do not throw error | 200 OK (idempotent) |

---

## Transaction Safety

All mutations are automatically wrapped in Convex transactions:
- Multiple database operations within a mutation are atomic
- If any operation fails, the entire mutation rolls back
- No partial state updates occur
- Concurrent mutations are serialized safely

---

## Real-Time Updates

All mutations automatically trigger real-time updates:
- `markAsRead`: Updates unread count queries and notification list queries
- `markAllAsRead`: Triggers re-render of all notification UI components
- `create`: New notification appears in all listening queries immediately
- `deleteNotification`: Notification disappears from UI across all tabs

No manual cache invalidation or subscription management required.
