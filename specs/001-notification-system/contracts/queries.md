# Notification Queries API Contract

**Version**: 1.0.0
**Last Updated**: 2026-01-29

This document specifies all read-only query functions for the notification system. Queries are reactive and automatically re-run when underlying data changes.

---

## `list` - Get User's Notifications

Retrieve a paginated, filtered list of notifications for the current user.

### Function Signature

```typescript
export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    filter: v.optional(v.union(
      v.literal("all"),
      v.literal("unread"),
      v.literal("read")
    )),
  },
  handler: async (ctx, args) => { /* ... */ }
});
```

### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | `Id<"users">` | Yes | - | The user whose notifications to retrieve |
| `limit` | `number` | No | `50` | Maximum number of notifications to return (1-100) |
| `offset` | `number` | No | `0` | Number of notifications to skip for pagination |
| `filter` | `"all" \| "unread" \| "read"` | No | `"all"` | Filter by read status |

### Output Format

Returns an array of notification objects ordered by `createdAt` descending (most recent first).

```typescript
type NotificationOutput = {
  _id: Id<"notifications">;
  _creationTime: number;
  userId: Id<"users">;
  type: NotificationType; // One of 23 types
  title: string;
  body?: string;
  relatedEntityId?: string;
  relatedEntityType?: "team" | "tournament" | "submission" | "role" | "user";
  isRead: boolean;
  createdAt: string; // ISO 8601 timestamp
  actionUrl?: string;
  actionMetadata?: any;
  isDeleted?: boolean;
}[];
```

### Authorization Rules

- User must be authenticated (checked via `getCurrentUserOrThrow(ctx)`)
- Users can only query their own notifications (validated: `args.userId === currentUser._id`)
- Soft-deleted notifications (`isDeleted: true`) are excluded from results

### Performance Considerations

- Uses `by_user_and_read` compound index for efficient filtering
- Limit enforced to prevent large result sets (max 100)
- Excludes deleted notifications using `by_user_and_deleted` index
- Query result is cached by Convex; identical calls with same args share cache

### Example Usage

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function NotificationList() {
  const currentUserId = useCurrentUserId(); // Your auth hook

  const notifications = useQuery(api.notifications.list, {
    userId: currentUserId,
    limit: 20,
    filter: "unread",
  });

  if (notifications === undefined) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {notifications.map(notification => (
        <NotificationItem key={notification._id} {...notification} />
      ))}
    </div>
  );
}
```

---

## `getUnreadCount` - Count Unread Notifications

Retrieve the count of unread notifications for the current user.

### Function Signature

```typescript
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => { /* ... */ }
});
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `Id<"users">` | Yes | The user whose unread count to retrieve |

### Output Format

Returns a single number representing the count of unread notifications.

```typescript
type UnreadCountOutput = number;
```

### Authorization Rules

- User must be authenticated
- Users can only query their own unread count (validated: `args.userId === currentUser._id`)
- Soft-deleted notifications are excluded from count

### Performance Considerations

- Uses `by_user_and_read` index with `isRead: false` filter
- Efficient count query (does not fetch full notification objects)
- Result is cached; automatically updates when notifications change

### Example Usage

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function NotificationBadge() {
  const currentUserId = useCurrentUserId();

  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    userId: currentUserId,
  });

  if (unreadCount === undefined || unreadCount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className="absolute -right-1 -top-1">
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}
```

---

## `recent` - Get Recent Notifications

Retrieve the N most recent notifications for quick-access dropdown panels.

### Function Signature

```typescript
export const recent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => { /* ... */ }
});
```

### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | `Id<"users">` | Yes | - | The user whose recent notifications to retrieve |
| `limit` | `number` | No | `5` | Number of recent notifications (1-10) |

### Output Format

Returns an array of notification objects ordered by `createdAt` descending.

```typescript
type RecentNotificationsOutput = NotificationOutput[]; // Same as list output
```

### Authorization Rules

- User must be authenticated
- Users can only query their own notifications
- Soft-deleted notifications are excluded

### Performance Considerations

- Uses `by_user_and_deleted` index ordered by `_creationTime` descending
- Limited to small result sets (max 10) for fast rendering
- Ideal for dropdown panels and quick previews
- Can be conditionally queried (only when dropdown is open) using `useQuery("skip")`

### Example Usage

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function NotificationDropdown({ isOpen }: { isOpen: boolean }) {
  const currentUserId = useCurrentUserId();

  // Only fetch when dropdown is open
  const recentNotifications = useQuery(
    isOpen ? api.notifications.recent : "skip",
    isOpen ? { userId: currentUserId, limit: 5 } : "skip"
  );

  if (!isOpen) return null;
  if (recentNotifications === undefined) return <LoadingSpinner />;

  return (
    <PopoverContent>
      <div className="space-y-2">
        {recentNotifications.map(notification => (
          <NotificationItem key={notification._id} {...notification} />
        ))}
      </div>
      <Button asChild variant="link" className="w-full">
        <a href="/notifications">View all notifications</a>
      </Button>
    </PopoverContent>
  );
}
```

---

## `get` - Get Single Notification

Retrieve a specific notification by ID.

### Function Signature

```typescript
export const get = query({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => { /* ... */ }
});
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notificationId` | `Id<"notifications">` | Yes | The notification ID to retrieve |

### Output Format

Returns a single notification object or `null` if not found or unauthorized.

```typescript
type NotificationGetOutput = NotificationOutput | null;
```

### Authorization Rules

- User must be authenticated
- Notification must belong to the current user (checked: `notification.userId === currentUser._id`)
- Returns `null` if notification not found or user is unauthorized
- Soft-deleted notifications return `null`

### Performance Considerations

- Direct lookup by document ID (very fast, uses primary index)
- No additional index needed
- Minimal overhead for authorization check

### Example Usage

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function NotificationDetail({ id }: { id: Id<"notifications"> }) {
  const notification = useQuery(api.notifications.get, {
    notificationId: id,
  });

  if (notification === undefined) {
    return <LoadingSpinner />;
  }

  if (notification === null) {
    return <NotFound message="Notification not found" />;
  }

  return (
    <div>
      <h2>{notification.title}</h2>
      <p>{notification.body}</p>
      {notification.actionUrl && (
        <Button asChild>
          <a href={notification.actionUrl}>Take Action</a>
        </Button>
      )}
    </div>
  );
}
```

---

## Notification Types Reference

All queries return notifications with one of the following 23 types:

### Team Events (9 types)
- `team_invitation_received`
- `team_join_request_received`
- `join_request_approved`
- `join_request_rejected`
- `member_joined_team`
- `member_left_team`
- `removed_from_team`
- `captain_role_transferred_to`
- `captain_role_transferred_from`
- `team_deleted`

### Submission Events (5 types)
- `submission_approved`
- `submission_rejected`
- `submission_group_auto_created`
- `teammate_submitted`
- `submission_flagged_for_review`

### Tournament Events (6 types)
- `tournament_starting_24h`
- `tournament_started`
- `tournament_ending_24h`
- `tournament_ended`
- `tournament_winner_announced`
- `assigned_as_tournament_manager`

### Role/Admin Events (3 types)
- `role_granted`
- `role_revoked`
- `pending_items_digest`

---

## Index Requirements

The following indexes must be defined in `convex/schema.ts`:

```typescript
notifications: defineTable({
  userId: v.id("users"),
  type: v.string(),
  title: v.string(),
  body: v.optional(v.string()),
  relatedEntityId: v.optional(v.string()),
  relatedEntityType: v.optional(v.string()),
  isRead: v.boolean(),
  createdAt: v.string(),
  actionUrl: v.optional(v.string()),
  actionMetadata: v.optional(v.any()),
  isDeleted: v.optional(v.boolean()),
})
  .index("by_user_and_read", ["userId", "isRead"])
  .index("by_user_and_deleted", ["userId", "isDeleted"])
  .index("by_createdAt", ["createdAt"])
  .index("by_user_type_entity", [
    "userId",
    "type",
    "relatedEntityType",
    "relatedEntityId"
  ])
```

---

## Error Handling

All queries follow Convex error handling patterns:

- **Authentication errors**: Throw error via `getCurrentUserOrThrow(ctx)` if user not authenticated
- **Authorization errors**: Return `null` or empty array for unauthorized access (no explicit error thrown)
- **Not found**: Return `null` (for `get`) or empty array (for `list`, `recent`)
- **Invalid parameters**: Convex validator automatically throws error before handler is called

---

## Real-Time Updates

All queries automatically re-run and update components when:
- A new notification is created for the user
- A notification's `isRead` status changes
- A notification is soft-deleted
- Any field in the notification document changes

No manual subscription management is required. Use standard `useQuery` hook from `convex/react`.
