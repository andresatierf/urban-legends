# Notification System: Data Model Specification

**Feature**: In-App Notification System
**Branch**: `001-notification-system`
**Created**: 2026-01-29
**Status**: Draft

---

## 1. Database Entities

### 1.1 `notifications` Table

The core table storing all user notifications.

```typescript
// convex/schema.ts
notifications: defineTable({
  userId: v.id("users"),
  type: v.string(),
  title: v.string(),
  body: v.optional(v.string()),
  relatedEntityId: v.optional(v.string()),
  relatedEntityType: v.optional(v.string()),
  isRead: v.boolean(),
  isDeleted: v.optional(v.boolean()),
  createdAt: v.string(),
  actionUrl: v.optional(v.string()),
  actionMetadata: v.optional(v.any()),
})
  .index("by_user_and_read", ["userId", "isRead"])
  .index("by_createdAt", ["createdAt"])
  .index("by_user_type_entity", [
    "userId",
    "type",
    "relatedEntityType",
    "relatedEntityId",
  ]),
```

### 1.2 `notificationPreferences` Table

User preferences for future notification customization (extensibility).

```typescript
// convex/schema.ts
notificationPreferences: defineTable({
  userId: v.id("users"),
  enabledTypes: v.optional(v.array(v.string())),
  dailyDigestEnabled: v.boolean(),
  quietHoursStart: v.optional(v.string()), // HH:mm format
  quietHoursEnd: v.optional(v.string()),   // HH:mm format
  timezone: v.optional(v.string()),         // IANA timezone
  updatedAt: v.string(),
})
  .index("by_user", ["userId"]),
```

**Note**: This table is for future extensibility. Initial implementation will not include preferences; all users receive all relevant notifications.

---

## 2. Field Specifications

### 2.1 `notifications` Fields

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `_id` | `Id<"notifications">` | Yes | Auto-generated | Unique notification identifier |
| `_creationTime` | `number` | Yes | Auto-generated | Convex internal timestamp (milliseconds since epoch) |
| `userId` | `Id<"users">` | Yes | References `users._id` | Recipient of the notification |
| `type` | `string` | Yes | Must be one of 23 valid notification types (see 2.2) | Category and event type |
| `title` | `string` | Yes | Max length: 200 characters | Primary notification message shown to user |
| `body` | `string \| undefined` | No | Max length: 1000 characters | Additional context (e.g., rejection reason, role name, digest summary) |
| `relatedEntityId` | `string \| undefined` | No | Generic string ID | ID of the related entity (team ID, tournament ID, submission ID, etc.) |
| `relatedEntityType` | `string \| undefined` | No | Must be one of: "team", "submission", "tournament", "role", "user", "submissionGroup" | Type of the related entity |
| `isRead` | `boolean` | Yes | Defaults to `false` | Whether user has marked notification as read |
| `isDeleted` | `boolean \| undefined` | No | Defaults to `false` | Soft delete flag for 90-day retention cleanup |
| `createdAt` | `string` | Yes | ISO 8601 format (e.g., "2026-01-29T10:30:00.000Z") | When notification was created |
| `actionUrl` | `string \| undefined` | No | Valid relative URL path | Where to navigate when notification is clicked |
| `actionMetadata` | `any \| undefined` | No | JSON-serializable object | Additional data for action buttons (Accept/Reject, View, etc.) |

### 2.2 Notification Type Enum

The `type` field must be one of the following 23 notification types organized in 4 categories:

#### Team Events (10 types)

```typescript
type TeamNotificationType =
  | "team_invitation_received"
  | "team_join_request_received"
  | "join_request_approved"
  | "join_request_rejected"
  | "member_joined_team"
  | "member_left_team"
  | "removed_from_team"
  | "captain_role_transferred_to"
  | "captain_role_transferred_from"
  | "team_deleted";
```

#### Submission Events (5 types)

```typescript
type SubmissionNotificationType =
  | "submission_approved"
  | "submission_rejected"
  | "submission_group_auto_created"
  | "teammate_submitted"
  | "submission_flagged_for_review";
```

#### Tournament Events (6 types)

```typescript
type TournamentNotificationType =
  | "tournament_starting_24h"
  | "tournament_started"
  | "tournament_ending_24h"
  | "tournament_ended"
  | "tournament_winner_announced"
  | "assigned_as_tournament_manager";
```

#### Role/Admin Events (3 types)

```typescript
type RoleNotificationType =
  | "role_granted"
  | "role_revoked"
  | "pending_items_digest";
```

#### Combined Type

```typescript
type NotificationType =
  | TeamNotificationType
  | SubmissionNotificationType
  | TournamentNotificationType
  | RoleNotificationType;
```

### 2.3 Related Entity Type Enum

```typescript
type RelatedEntityType =
  | "team"
  | "submission"
  | "tournament"
  | "role"
  | "user"
  | "submissionGroup";
```

### 2.4 TypeScript Interface (Runtime)

```typescript
interface Notification {
  _id: Id<"notifications">;
  _creationTime: number;
  userId: Id<"users">;
  type: NotificationType;
  title: string;
  body?: string;
  relatedEntityId?: string;
  relatedEntityType?: RelatedEntityType;
  isRead: boolean;
  isDeleted?: boolean;
  createdAt: string;
  actionUrl?: string;
  actionMetadata?: {
    buttons?: Array<{
      label: string;
      action: "accept" | "reject" | "view" | "dismiss";
      mutationName?: string;
      args?: Record<string, any>;
    }>;
    [key: string]: any;
  };
}
```

---

## 3. Relationships

### 3.1 Primary Relationships

```
notifications.userId → users._id
  - Each notification belongs to exactly one user
  - One user can have many notifications
  - Relationship: Many-to-One

notifications.relatedEntityId → (dynamic reference)
  - When relatedEntityType = "team" → teams._id
  - When relatedEntityType = "tournament" → tournaments._id
  - When relatedEntityType = "submission" → submissions._id
  - When relatedEntityType = "submissionGroup" → submissionGroups._id
  - When relatedEntityType = "role" → roles._id (via roles.name as string)
  - When relatedEntityType = "user" → users._id
  - Relationship: Polymorphic Many-to-One
```

### 3.2 Derived Relationships

```
notifications → teamInvitations
  - For type = "team_invitation_received"
  - relatedEntityId references teamInvitations._id
  - Used to link notification to invitation for Accept/Reject actions

notifications → joinRequests
  - For type = "team_join_request_received"
  - relatedEntityId references joinRequests._id
  - Used to link notification to request for Approve/Reject actions
```

### 3.3 Relationship Diagram

```
┌─────────────────────┐
│      users          │
│  _id: Id<"users">   │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────┐
│         notifications                       │
│  _id: Id<"notifications">                   │
│  userId: Id<"users">                        │
│  type: NotificationType                     │
│  relatedEntityType?: RelatedEntityType      │
│  relatedEntityId?: string                   │
└─────────────────┬───────────────────────────┘
                  │
                  │ polymorphic
       ┌──────────┴───────────────┬───────────────────┬──────────────┐
       ▼                          ▼                   ▼              ▼
┌─────────────┐         ┌──────────────────┐  ┌─────────────┐  ┌─────────────┐
│    teams    │         │   tournaments    │  │ submissions │  │    roles    │
│     _id     │         │       _id        │  │     _id     │  │     _id     │
└─────────────┘         └──────────────────┘  └─────────────┘  └─────────────┘
```

---

## 4. Indexes

### 4.1 Index Specifications

#### `by_user_and_read`

```typescript
.index("by_user_and_read", ["userId", "isRead"])
```

**Purpose**: Filter user's unread notifications
**Usage**: Notification list page, unread count queries
**Query Pattern**:
```typescript
ctx.db.query("notifications")
  .withIndex("by_user_and_read", (q) =>
    q.eq("userId", userId).eq("isRead", false)
  )
  .collect();
```

#### `by_createdAt`

```typescript
.index("by_createdAt", ["createdAt"])
```

**Purpose**: Cleanup cron job to find old notifications
**Usage**: 90-day retention cleanup
**Query Pattern**:
```typescript
ctx.db.query("notifications")
  .withIndex("by_createdAt")
  .filter((q) => q.lt(q.field("createdAt"), cutoffDate))
  .collect();
```

#### `by_user_type_entity`

```typescript
.index("by_user_type_entity", [
  "userId",
  "type",
  "relatedEntityType",
  "relatedEntityId",
])
```

**Purpose**: Deduplication - prevent duplicate notifications for same event
**Usage**: Idempotent notification creation
**Query Pattern**:
```typescript
const existing = await ctx.db.query("notifications")
  .withIndex("by_user_type_entity", (q) =>
    q.eq("userId", userId)
     .eq("type", "team_invitation_received")
     .eq("relatedEntityType", "team")
     .eq("relatedEntityId", teamId)
  )
  .first();

if (existing) return existing._id; // Already exists
```

### 4.2 Index Usage Examples

**Notification List with Pagination**:
```typescript
export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId)
      )
      .order("desc") // Most recent first
      .take(args.limit ?? 50);
  },
});
```

**Unread Count**:
```typescript
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});
```

**Recent Notifications (Dropdown)**:
```typescript
export const recent = query({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId)
      )
      .order("desc")
      .take(args.limit);
  },
});
```

---

## 5. State Transitions

### 5.1 Notification Lifecycle

```
Created (isRead = false, isDeleted = undefined/false)
   │
   │ User clicks notification or "Mark as read"
   ▼
Read (isRead = true, isDeleted = undefined/false)
   │
   │ 90 days pass, cleanup cron runs
   ▼
Soft Deleted (isRead = true/false, isDeleted = true)
   │
   │ Optional: Hard delete after additional retention period
   ▼
Hard Deleted (record removed from database)
```

### 5.2 State Transition Rules

| Current State | Transition | Next State | Trigger |
|--------------|------------|------------|---------|
| Created (isRead = false) | Mark as read | Read (isRead = true) | User action: clicks notification or "Mark as read" button |
| Created (isRead = false) | Mark all as read | Read (isRead = true) | User action: clicks "Mark all as read" button |
| Read (isRead = true) | - | Read (isRead = true) | Read state is permanent (no "mark as unread" feature) |
| Any state | Soft delete | Deleted (isDeleted = true) | System action: cleanup cron runs after 90 days |
| Deleted (isDeleted = true) | Hard delete | Removed from DB | Optional: future implementation for compliance |

### 5.3 State Transition Mutations

**Mark as Read**:
```typescript
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});
```

**Mark All as Read**:
```typescript
export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    await Promise.all(
      unread.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true })
      )
    );
  },
});
```

**Soft Delete (Cleanup)**:
```typescript
export const cleanupOldNotifications = internalMutation({
  handler: async (ctx) => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffIso = cutoffDate.toISOString();

    const oldNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_createdAt")
      .filter((q) =>
        q.and(
          q.lt(q.field("createdAt"), cutoffIso),
          q.neq(q.field("isDeleted"), true)
        )
      )
      .take(100); // Process in batches

    for (const notification of oldNotifications) {
      await ctx.db.patch(notification._id, { isDeleted: true });
    }

    return { deletedCount: oldNotifications.length };
  },
});
```

---

## 6. Validation Rules

### 6.1 Field Validation

#### `type` Validation
```typescript
const VALID_NOTIFICATION_TYPES = [
  // Team events
  "team_invitation_received",
  "team_join_request_received",
  "join_request_approved",
  "join_request_rejected",
  "member_joined_team",
  "member_left_team",
  "removed_from_team",
  "captain_role_transferred_to",
  "captain_role_transferred_from",
  "team_deleted",
  // Submission events
  "submission_approved",
  "submission_rejected",
  "submission_group_auto_created",
  "teammate_submitted",
  "submission_flagged_for_review",
  // Tournament events
  "tournament_starting_24h",
  "tournament_started",
  "tournament_ending_24h",
  "tournament_ended",
  "tournament_winner_announced",
  "assigned_as_tournament_manager",
  // Role events
  "role_granted",
  "role_revoked",
  "pending_items_digest",
] as const;

function validateNotificationType(type: string): boolean {
  return VALID_NOTIFICATION_TYPES.includes(type as any);
}
```

#### `userId` Validation
```typescript
async function validateUserId(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  return user !== null;
}
```

#### `createdAt` Validation
```typescript
function validateISODate(dateString: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (!iso8601Regex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
```

#### `relatedEntityId` Validation
```typescript
function validateRelatedEntity(
  relatedEntityType?: string,
  relatedEntityId?: string
): boolean {
  // If type is set, ID must also be set
  if (relatedEntityType && !relatedEntityId) return false;

  // If ID is set, type must also be set
  if (relatedEntityId && !relatedEntityType) return false;

  return true;
}
```

### 6.2 Business Logic Validation

#### Notification Creation Validation
```typescript
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    actionMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Validate notification type
    if (!validateNotificationType(args.type)) {
      throw new Error(`Invalid notification type: ${args.type}`);
    }

    // Validate user exists
    if (!(await validateUserId(ctx, args.userId))) {
      throw new Error(`User not found: ${args.userId}`);
    }

    // Validate related entity consistency
    if (!validateRelatedEntity(args.relatedEntityType, args.relatedEntityId)) {
      throw new Error("relatedEntityType and relatedEntityId must both be set or both be undefined");
    }

    // Validate title length
    if (args.title.length > 200) {
      throw new Error("Notification title must be 200 characters or less");
    }

    // Validate body length
    if (args.body && args.body.length > 1000) {
      throw new Error("Notification body must be 1000 characters or less");
    }

    // Check for duplicates (idempotency)
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user_type_entity", (q) =>
        q.eq("userId", args.userId)
         .eq("type", args.type)
         .eq("relatedEntityType", args.relatedEntityType ?? null)
         .eq("relatedEntityId", args.relatedEntityId ?? null)
      )
      .first();

    if (existing) {
      return existing._id; // Idempotent: return existing
    }

    // Create notification
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  },
});
```

---

## 7. Data Integrity

### 7.1 Soft Delete Pattern

**Rationale**: Soft deletes preserve audit trail and allow recovery if needed.

**Implementation**:
- Add `isDeleted: v.optional(v.boolean())` field to schema
- Cleanup cron sets `isDeleted = true` after 90 days
- Queries filter out deleted notifications by default
- Optional hard delete after additional retention period

**Benefits**:
- Preserves data for compliance audits
- Allows recovery from accidental deletion
- Gradual cleanup reduces database load

**Queries Must Filter Deleted**:
```typescript
// Good: Excludes deleted notifications
const notifications = await ctx.db
  .query("notifications")
  .withIndex("by_user_and_read", (q) =>
    q.eq("userId", userId).eq("isRead", false)
  )
  .filter((q) => q.neq(q.field("isDeleted"), true))
  .collect();

// Alternative: Add index for efficient filtering
.index("by_user_and_deleted", ["userId", "isDeleted"])

const notifications = await ctx.db
  .query("notifications")
  .withIndex("by_user_and_deleted", (q) =>
    q.eq("userId", userId).eq("isDeleted", false)
  )
  .collect();
```

### 7.2 Idempotent Creation

**Rationale**: Prevent duplicate notifications when mutations retry or events fire multiple times.

**Implementation**: Use compound index `by_user_type_entity` to check for existing notifications before creation.

**Pattern**:
```typescript
// Step 1: Check for existing notification
const existing = await ctx.db
  .query("notifications")
  .withIndex("by_user_type_entity", (q) =>
    q.eq("userId", userId)
     .eq("type", notificationType)
     .eq("relatedEntityType", entityType)
     .eq("relatedEntityId", entityId)
  )
  .first();

// Step 2: Return existing or create new
if (existing) {
  return existing._id; // Idempotent
}

return await ctx.db.insert("notifications", { /* ... */ });
```

**Benefits**:
- Safe retries on mutation failures
- Prevents duplicate notifications from rapid-fire events
- Database-level constraint (index) ensures uniqueness

### 7.3 Graceful Handling of Deleted Related Entities

**Problem**: Notifications may reference entities that are later deleted (team deleted, tournament ended, submission removed).

**Solution**: Handle missing entities gracefully in UI and queries.

**Pattern**:
```typescript
export const listWithEntities = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId)
      )
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(50);

    // Enrich with related entities
    const enriched = await Promise.all(
      notifications.map(async (notification) => {
        let relatedEntity = null;

        if (notification.relatedEntityId && notification.relatedEntityType) {
          try {
            if (notification.relatedEntityType === "team") {
              relatedEntity = await ctx.db.get(
                notification.relatedEntityId as Id<"teams">
              );
            } else if (notification.relatedEntityType === "tournament") {
              relatedEntity = await ctx.db.get(
                notification.relatedEntityId as Id<"tournaments">
              );
            }
            // ... other entity types
          } catch (error) {
            // Entity deleted or invalid ID
            relatedEntity = null;
          }
        }

        return {
          ...notification,
          relatedEntity,
          entityDeleted: notification.relatedEntityId && !relatedEntity,
        };
      })
    );

    return enriched;
  },
});
```

**UI Handling**:
```typescript
function NotificationItem({ notification }: { notification: EnrichedNotification }) {
  if (notification.entityDeleted) {
    return (
      <div className="notification notification--deleted">
        <p>{notification.title}</p>
        <span className="text-muted">This item is no longer available</span>
      </div>
    );
  }

  return (
    <a href={notification.actionUrl} className="notification">
      <p>{notification.title}</p>
      {notification.body && <p className="text-sm">{notification.body}</p>}
    </a>
  );
}
```

### 7.4 90-Day Retention Policy

**Rationale**: Balance storage costs with user needs. Most tournaments complete within 90 days.

**Implementation**:
- Cron job runs daily at 2:00 AM UTC (low-traffic period)
- Soft deletes notifications older than 90 days
- Batch processing (100 records per run) to avoid timeouts
- Logs deleted count for monitoring

**Cron Configuration**:
```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "cleanup old notifications",
  { hourUTC: 2, minuteUTC: 0 },
  internal.notifications.cleanupOldNotifications
);

export default crons;
```

**Cleanup Mutation**:
```typescript
// convex/notifications.ts
export const cleanupOldNotifications = internalMutation({
  handler: async (ctx) => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffIso = cutoffDate.toISOString();

    const batchSize = 100;
    let totalDeleted = 0;

    while (true) {
      const oldNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_createdAt")
        .filter((q) =>
          q.and(
            q.lt(q.field("createdAt"), cutoffIso),
            q.neq(q.field("isDeleted"), true)
          )
        )
        .take(batchSize);

      if (oldNotifications.length === 0) break;

      for (const notification of oldNotifications) {
        await ctx.db.patch(notification._id, { isDeleted: true });
      }

      totalDeleted += oldNotifications.length;

      if (oldNotifications.length < batchSize) break;
    }

    console.log(`Cleaned up ${totalDeleted} notifications older than ${retentionDays} days`);
    return { deletedCount: totalDeleted };
  },
});
```

---

## 8. Performance Considerations

### 8.1 Query Optimization

**Index Coverage**:
- All queries MUST use indexes (never scan full table)
- Compound indexes cover common query patterns
- Order matters: most selective fields first

**Pagination**:
```typescript
// Use take() for simple pagination
.take(50)

// Use paginate() for cursor-based pagination (large datasets)
const result = await ctx.db
  .query("notifications")
  .withIndex("by_user_and_read", (q) =>
    q.eq("userId", userId)
  )
  .order("desc")
  .paginate({ numItems: 20, cursor: args.cursor });

return {
  page: result.page,
  continueCursor: result.continueCursor,
  isDone: result.isDone,
};
```

### 8.2 Batch Operations

**Avoid N+1 Queries**:
```typescript
// Bad: N+1 queries
const notifications = await ctx.db.query("notifications").collect();
const enriched = await Promise.all(
  notifications.map(async (n) => {
    const user = await ctx.db.get(n.userId); // N queries
    return { ...n, user };
  })
);

// Good: Batch get
import { batchGetDocuments } from "./lib/helpers";

const notifications = await ctx.db.query("notifications").collect();
const userIds = [...new Set(notifications.map((n) => n.userId))];
const users = await batchGetDocuments(ctx, "users", userIds);

const userMap = new Map(users.map((u) => [u._id, u]));
const enriched = notifications.map((n) => ({
  ...n,
  user: userMap.get(n.userId),
}));
```

### 8.3 Caching Strategy

**Convex Built-in Caching**:
- `useQuery` results are cached automatically
- Identical queries share cached response
- No manual cache invalidation needed (reactive updates)

**Minimize Query Frequency**:
```typescript
// Good: Separate queries for different concerns
const unreadCount = useQuery(api.notifications.getUnreadCount, { userId });
const notifications = useQuery(api.notifications.list, { userId, limit: 20 });

// Avoid: Single large query that overfetches
const allData = useQuery(api.notifications.getEverything, { userId });
```

### 8.4 Real-Time Update Efficiency

**Selective Updates**:
- `useQuery` only rerenders when query results change
- Use focused queries to minimize unnecessary rerenders
- Convex ensures consistent state across multiple queries

**Cross-Tab Synchronization**:
- Convex client automatically syncs state across browser tabs
- No manual BroadcastChannel or localStorage events needed
- Mutations in one tab immediately update all tabs with active queries

---

## 9. Example Notification Data

### 9.1 Team Invitation Notification

```json
{
  "_id": "k17abc123...",
  "_creationTime": 1738166400000,
  "userId": "k17xyz789...",
  "type": "team_invitation_received",
  "title": "You've been invited to join Iron Warriors",
  "body": "John Doe invited you to join their team for Spring 2026 Tournament",
  "relatedEntityId": "k17inv456...",
  "relatedEntityType": "team",
  "isRead": false,
  "createdAt": "2026-01-29T12:00:00.000Z",
  "actionUrl": "/teams/invitations",
  "actionMetadata": {
    "buttons": [
      {
        "label": "Accept",
        "action": "accept",
        "mutationName": "teamInvitations.accept",
        "args": { "invitationId": "k17inv456..." }
      },
      {
        "label": "Reject",
        "action": "reject",
        "mutationName": "teamInvitations.reject",
        "args": { "invitationId": "k17inv456..." }
      }
    ]
  }
}
```

### 9.2 Submission Approved Notification

```json
{
  "_id": "k17abc124...",
  "_creationTime": 1738167000000,
  "userId": "k17xyz789...",
  "type": "submission_approved",
  "title": "Your submission has been approved",
  "body": "100 Push-ups on 2026-01-28 earned 10 points for your team",
  "relatedEntityId": "k17sub789...",
  "relatedEntityType": "submission",
  "isRead": false,
  "createdAt": "2026-01-29T12:10:00.000Z",
  "actionUrl": "/submissions/k17sub789..."
}
```

### 9.3 Tournament Starting in 24h Notification

```json
{
  "_id": "k17abc125...",
  "_creationTime": 1738253400000,
  "userId": "k17xyz789...",
  "type": "tournament_starting_24h",
  "title": "Spring 2026 Tournament starts in 24 hours",
  "body": "Get ready! The tournament begins tomorrow at 12:00 PM UTC",
  "relatedEntityId": "k17tour123...",
  "relatedEntityType": "tournament",
  "isRead": false,
  "createdAt": "2026-01-30T12:00:00.000Z",
  "actionUrl": "/tournaments/k17tour123..."
}
```

### 9.4 Daily Digest Notification

```json
{
  "_id": "k17abc126...",
  "_creationTime": 1738306800000,
  "userId": "k17xyz789...",
  "type": "pending_items_digest",
  "title": "You have 3 items requiring attention",
  "body": "1 team invitation, 2 submissions pending approval",
  "isRead": false,
  "createdAt": "2026-01-31T09:00:00.000Z",
  "actionUrl": "/dashboard"
}
```

### 9.5 Role Granted Notification

```json
{
  "_id": "k17abc127...",
  "_creationTime": 1738310400000,
  "userId": "k17xyz789...",
  "type": "role_granted",
  "title": "Admin role granted",
  "body": "You have been granted admin privileges",
  "relatedEntityId": "admin",
  "relatedEntityType": "role",
  "isRead": false,
  "createdAt": "2026-01-31T10:00:00.000Z"
}
```

---

## 10. Migration Plan

### 10.1 Schema Addition

**Step 1**: Add `notifications` table to schema
```bash
# Edit convex/schema.ts to add notifications table
# Convex will automatically create the table on next deployment
```

**Step 2**: Add `notificationPreferences` table (optional, for future)
```bash
# Add to same schema update
```

**Step 3**: Deploy schema changes
```bash
bunx convex deploy
```

### 10.2 No Data Migration Needed

This is a new feature with no existing data. No migration scripts required.

### 10.3 Rollback Plan

If notification system needs to be rolled back:
1. Remove notification creation calls from mutations
2. Hide notification UI components
3. Disable cron jobs in `convex/crons.ts`
4. (Optional) Drop `notifications` table via Convex dashboard

**Note**: Do not drop table immediately; preserve notifications for 30 days in case of rollback bugs.

---

## 11. Testing Strategy

### 11.1 Unit Tests (Vitest + convex-test)

**Notification Creation**:
```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

test("creates notification with valid data", async () => {
  const t = convexTest(schema);

  // Create user
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: "test@example.com",
      name: "Test User",
      externalId: "clerk_123",
    });
  });

  // Create notification
  const notificationId = await t.mutation(api.notifications.create, {
    userId,
    type: "team_invitation_received",
    title: "You've been invited",
  });

  // Verify notification exists
  const notification = await t.run(async (ctx) => {
    return await ctx.db.get(notificationId);
  });

  expect(notification).toBeDefined();
  expect(notification?.type).toBe("team_invitation_received");
  expect(notification?.isRead).toBe(false);
});

test("prevents duplicate notifications (idempotency)", async () => {
  const t = convexTest(schema);

  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: "test@example.com",
      name: "Test User",
      externalId: "clerk_123",
    });
  });

  const args = {
    userId,
    type: "team_invitation_received",
    title: "You've been invited",
    relatedEntityId: "team_123",
    relatedEntityType: "team",
  };

  // Create notification twice
  const id1 = await t.mutation(api.notifications.create, args);
  const id2 = await t.mutation(api.notifications.create, args);

  // Should return same ID
  expect(id1).toBe(id2);

  // Only one notification should exist
  const notifications = await t.query(api.notifications.list, { userId });
  expect(notifications).toHaveLength(1);
});
```

### 11.2 Integration Tests

Test notification creation from actual mutations:
```typescript
test("creates notification when team invitation is sent", async () => {
  const t = convexTest(schema);

  // Setup: Create tournament, team, users
  // ...

  // Trigger invitation
  await t.mutation(api.teams.inviteMember, {
    teamId,
    invitedEmail: "newuser@example.com",
  });

  // Verify notification created
  const notifications = await t.query(api.notifications.list, {
    userId: invitedUserId,
  });

  expect(notifications).toHaveLength(1);
  expect(notifications[0].type).toBe("team_invitation_received");
});
```

### 11.3 E2E Tests (Playwright)

Test full user flow:
```typescript
import { test, expect } from '@playwright/test';

test('user receives and views notification', async ({ page }) => {
  // Login as user
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Trigger notification (via admin invite)
  // ...

  // Verify badge appears
  await expect(page.locator('[data-testid="notification-badge"]'))
    .toHaveText('1');

  // Click notification bell
  await page.click('[data-testid="notification-bell"]');

  // Verify notification in dropdown
  await expect(page.locator('[data-testid="notification-item"]'))
    .toContainText("You've been invited");

  // Click notification
  await page.click('[data-testid="notification-item"]');

  // Verify navigation to correct page
  await expect(page).toHaveURL(/\/teams\/invitations/);
});
```

---

## 12. Future Enhancements

### 12.1 Notification Preferences

Allow users to customize notification types:
- Enable/disable specific notification types
- Set quiet hours (no notifications during sleep time)
- Configure daily digest frequency
- Set timezone for time-based notifications

**Schema**: Already designed in `notificationPreferences` table

### 12.2 Notification Templates

Centralize notification text generation:
```typescript
const NOTIFICATION_TEMPLATES = {
  team_invitation_received: (data: { teamName: string, inviterName: string }) => ({
    title: `You've been invited to join ${data.teamName}`,
    body: `${data.inviterName} invited you to join their team`,
  }),
  // ... other templates
};
```

### 12.3 Notification Grouping

Group related notifications:
- "3 team members submitted activities today" instead of 3 separate notifications
- "5 new submissions pending approval" instead of 5 individual notifications

**Implementation**: Add `groupId` field and display logic for grouped notifications

### 12.4 Rich Notifications

Support embedded content:
- Team logos/avatars
- Submission images
- Tournament banners
- Action buttons with icons

**Implementation**: Add `richContent` field with JSON structure for media URLs and formatting

### 12.5 Read Receipts

Track when notifications were read:
- Add `readAt` timestamp field
- Show "Read 2 hours ago" in notification list
- Analytics on notification engagement

---

**Document Status**: Complete
**Last Updated**: 2026-01-29
**Reviewed By**: Claude Sonnet 4.5
