# Notification System: Quickstart Implementation Guide

**Feature**: In-App Notification System
**Branch**: `001-notification-system`
**Created**: 2026-01-29
**Status**: Ready for Implementation

---

## 1. Overview

This guide provides step-by-step instructions for implementing the in-app notification system for Urban Legends. Follow the steps in order to ensure proper dependency management and testing.

### What You're Building

A real-time notification system that keeps users informed about tournament activities, team events, submission statuses, and role changes. Users receive notifications through a dropdown bell icon in the header and can view all notifications on a dedicated page.

### Tech Stack

- **Backend**: Convex (serverless functions, real-time subscriptions)
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI Components**: Radix UI (Popover), shadcn/ui patterns, Tailwind CSS
- **Forms**: TanStack Form (@tanstack/react-form)
- **Real-Time**: Convex `useQuery` hooks (automatic reactivity)
- **Testing**: Vitest (unit/integration), Playwright (E2E)

### Key Deliverables

- ✅ 23 notification types across 4 categories (Team, Submission, Tournament, Role)
- ✅ Real-time notification dropdown in header
- ✅ Full notifications page with filtering and pagination
- ✅ Badge showing unread count
- ✅ Mark as read / Mark all as read functionality
- ✅ 6 scheduled cron jobs (cleanup, tournament warnings, daily digest)
- ✅ 90-day retention policy with automatic cleanup
- ✅ Idempotent notification creation (no duplicates)

---

## 2. Prerequisites

### Required Tools

- **bun**: Package manager and runtime (already in project)
- **Node.js**: v18+ (required by Next.js 15)
- **git**: Version control
- **Convex account**: For backend deployment (existing)

### Environment Setup

Ensure both development servers are running:

```bash
# Terminal 1: Next.js development server
bun run dev

# Terminal 2: Convex backend
bunx convex dev
```

Both commands must run simultaneously for the application to work.

### Existing Knowledge

- TypeScript basics
- React hooks (useState, useEffect)
- Convex fundamentals (queries, mutations)
- Next.js App Router patterns
- Tailwind CSS utility classes

---

## 3. Implementation Order

Follow these steps sequentially. Each step builds on the previous one.

---

### Step 1: Database Schema

Update the Convex schema to add notification tables.

**File**: `/convex/schema.ts`

**Action**: Add the following tables to your schema:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ... existing tables ...

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // One of 23 notification types
    title: v.string(),
    body: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    isRead: v.boolean(),
    isDeleted: v.optional(v.boolean()),
    createdAt: v.string(), // ISO 8601 timestamp
    actionUrl: v.optional(v.string()),
    actionMetadata: v.optional(v.any()),
  })
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_user_and_deleted", ["userId", "isDeleted"])
    .index("by_createdAt", ["createdAt"])
    .index("by_user_type_entity", [
      "userId",
      "type",
      "relatedEntityType",
      "relatedEntityId",
    ]),

  notificationPreferences: defineTable({
    userId: v.id("users"),
    enabledTypes: v.optional(v.array(v.string())),
    dailyDigestEnabled: v.boolean(),
    quietHoursStart: v.optional(v.string()), // HH:mm format
    quietHoursEnd: v.optional(v.string()),
    timezone: v.optional(v.string()), // IANA timezone
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),
});
```

**Deploy Schema Changes**:

```bash
# Schema changes are automatically applied when convex dev is running
# Watch the terminal for confirmation: "Schema updated successfully"
```

**Verification**:

1. Open Convex Dashboard (https://dashboard.convex.dev)
2. Navigate to Data → Tables
3. Confirm `notifications` and `notificationPreferences` tables exist
4. Verify all 4 indexes are present on `notifications` table

---

### Step 2: Notification Types & Utilities

Create type definitions and helper functions for notification creation.

**File**: `/convex/notifications/types.ts` (create new file)

```typescript
// Notification type constants for type safety
export const NOTIFICATION_TYPES = {
  // Team Events (10 types)
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

  // Submission Events (5 types)
  SUBMISSION_APPROVED: "submission_approved",
  SUBMISSION_REJECTED: "submission_rejected",
  SUBMISSION_GROUP_AUTO_CREATED: "submission_group_auto_created",
  TEAMMATE_SUBMITTED: "teammate_submitted",
  SUBMISSION_FLAGGED_FOR_REVIEW: "submission_flagged_for_review",

  // Tournament Events (6 types)
  TOURNAMENT_STARTING_24H: "tournament_starting_24h",
  TOURNAMENT_STARTED: "tournament_started",
  TOURNAMENT_ENDING_24H: "tournament_ending_24h",
  TOURNAMENT_ENDED: "tournament_ended",
  TOURNAMENT_WINNER_ANNOUNCED: "tournament_winner_announced",
  ASSIGNED_AS_TOURNAMENT_MANAGER: "assigned_as_tournament_manager",

  // Role/Admin Events (3 types)
  ROLE_GRANTED: "role_granted",
  ROLE_REVOKED: "role_revoked",
  PENDING_ITEMS_DIGEST: "pending_items_digest",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export type RelatedEntityType =
  | "team"
  | "submission"
  | "tournament"
  | "role"
  | "user"
  | "submissionGroup";
```

**File**: `/convex/notifications/triggers.ts` (create new file)

```typescript
import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { NOTIFICATION_TYPES } from "./types";

/**
 * Helper function to create team invitation notification
 */
export async function notifyTeamInvitation(
  ctx: MutationCtx,
  params: {
    invitedUserId: Id<"users">;
    teamId: Id<"teams">;
    teamName: string;
    inviterName: string;
  },
) {
  await ctx.runMutation(internal.notifications.create, {
    userId: params.invitedUserId,
    type: NOTIFICATION_TYPES.TEAM_INVITATION_RECEIVED,
    title: `You've been invited to join ${params.teamName}`,
    body: `${params.inviterName} invited you to join their team`,
    relatedEntityId: params.teamId,
    relatedEntityType: "team",
    actionUrl: `/teams/${params.teamId}/invitations`,
  });
}

/**
 * Helper function to create submission approval notification
 */
export async function notifySubmissionApproved(
  ctx: MutationCtx,
  params: {
    recipientIds: Id<"users">[];
    submissionId: Id<"submissions">;
    teamName: string;
    description?: string;
  },
) {
  await Promise.all(
    params.recipientIds.map((userId) =>
      ctx.runMutation(internal.notifications.create, {
        userId,
        type: NOTIFICATION_TYPES.SUBMISSION_APPROVED,
        title: "Submission approved",
        body: `${params.description || "Your submission"} for ${params.teamName} has been approved`,
        relatedEntityId: params.submissionId,
        relatedEntityType: "submission",
        actionUrl: `/submissions/${params.submissionId}`,
      }),
    ),
  );
}

// Add more helper functions as needed for each notification type
```

---

### Step 3: Core Convex Functions

Create the main notification queries and mutations.

**File**: `/convex/notifications.ts` (create new file)

```typescript
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

/**
 * Query: List user's notifications with filtering and pagination
 */
export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    filter: v.optional(
      v.union(v.literal("all"), v.literal("unread"), v.literal("read")),
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Authorization: users can only view their own notifications
    if (currentUser._id !== args.userId) {
      throw new Error("Not authorized");
    }

    const limit = Math.min(args.limit ?? 50, 100);
    const offset = args.offset ?? 0;

    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_user_and_deleted", (q) =>
        q.eq("userId", args.userId).eq("isDeleted", false),
      );

    // Apply read/unread filter if specified
    const allNotifications = await notificationsQuery.collect();

    let filtered = allNotifications;
    if (args.filter === "unread") {
      filtered = allNotifications.filter((n) => !n.isRead);
    } else if (args.filter === "read") {
      filtered = allNotifications.filter((n) => n.isRead);
    }

    // Sort by createdAt descending (most recent first)
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Apply pagination
    return filtered.slice(offset, offset + limit);
  },
});

/**
 * Query: Get unread notification count
 */
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    if (currentUser._id !== args.userId) {
      throw new Error("Not authorized");
    }

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false),
      )
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    return unread.length;
  },
});

/**
 * Query: Get recent notifications (for dropdown)
 */
export const recent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    if (currentUser._id !== args.userId) {
      throw new Error("Not authorized");
    }

    const limit = Math.min(args.limit ?? 5, 10);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_deleted", (q) =>
        q.eq("userId", args.userId).eq("isDeleted", false),
      )
      .collect();

    // Sort by createdAt descending
    notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return notifications.slice(0, limit);
  },
});

/**
 * Query: Get single notification by ID
 */
export const get = query({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) return null;
    if (notification.userId !== currentUser._id) return null;
    if (notification.isDeleted) return null;

    return notification;
  },
});

/**
 * Internal Mutation: Create notification (idempotent)
 */
export const create = internalMutation({
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
    // Validate title length
    if (args.title.length > 200) {
      throw new Error("Notification title must be 200 characters or less");
    }

    // Validate body length
    if (args.body && args.body.length > 1000) {
      throw new Error("Notification body must be 1000 characters or less");
    }

    // Check for existing notification (idempotency)
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user_type_entity", (q) =>
        q
          .eq("userId", args.userId)
          .eq("type", args.type)
          .eq("relatedEntityType", args.relatedEntityType ?? null)
          .eq("relatedEntityId", args.relatedEntityId ?? null),
      )
      .first();

    if (existing) {
      return existing._id; // Idempotent: return existing
    }

    // Create new notification
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      relatedEntityId: args.relatedEntityId,
      relatedEntityType: args.relatedEntityType,
      actionUrl: args.actionUrl,
      actionMetadata: args.actionMetadata,
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Mutation: Mark notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== currentUser._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.notificationId, { isRead: true });

    return { success: true };
  },
});

/**
 * Mutation: Mark all notifications as read
 */
export const markAllAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    if (currentUser._id !== args.userId) {
      throw new Error("Not authorized");
    }

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false),
      )
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    await Promise.all(
      unread.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true }),
      ),
    );

    return { updatedCount: unread.length };
  },
});

/**
 * Mutation: Soft delete notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== currentUser._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.notificationId, { isDeleted: true });

    return { success: true };
  },
});

/**
 * Internal Mutation: Cleanup old notifications (90-day retention)
 */
export const cleanupOldNotifications = internalMutation({
  args: {},
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
            q.neq(q.field("isDeleted"), true),
          ),
        )
        .take(batchSize);

      if (oldNotifications.length === 0) break;

      await Promise.all(
        oldNotifications.map((notification) =>
          ctx.db.patch(notification._id, { isDeleted: true }),
        ),
      );

      totalDeleted += oldNotifications.length;

      if (oldNotifications.length < batchSize) break;
    }

    console.log(
      `Cleaned up ${totalDeleted} notifications older than ${retentionDays} days`,
    );

    return { deletedCount: totalDeleted };
  },
});
```

**Verification**:

```bash
# In Convex dashboard, navigate to Functions
# You should see all new query and mutation functions listed
```

---

### Step 4: Scheduled Jobs (Cron)

Create cron jobs for automated notifications and cleanup.

**File**: `/convex/crons.ts` (create new file)

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily digest at 9:00 AM UTC
crons.daily(
  "send daily digest",
  { hourUTC: 9, minuteUTC: 0 },
  internal.notifications.sendDailyDigest,
);

// Cleanup old notifications at 2:00 AM UTC (low-traffic period)
crons.daily(
  "cleanup old notifications",
  { hourUTC: 2, minuteUTC: 0 },
  internal.notifications.cleanupOldNotifications,
);

// Tournament notifications - run hourly
crons.hourly(
  "tournament 24h start warnings",
  { minuteUTC: 0 },
  internal.notifications.checkTournament24hWarnings,
);

crons.hourly(
  "tournament started notifications",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentStarted,
);

crons.hourly(
  "tournament ending 24h warnings",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentEnding24h,
);

crons.hourly(
  "tournament ended notifications",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentEnded,
);

export default crons;
```

**Add cron job implementations to `/convex/notifications.ts`**:

```typescript
/**
 * Internal Mutation: Check for tournaments starting in 24 hours
 */
export const checkTournament24hWarnings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const allTournaments = await ctx.db.query("tournaments").collect();

    const tournamentsStartingSoon = allTournaments.filter((tournament) => {
      const startDate = new Date(tournament.startDate);
      return startDate >= windowStart && startDate <= windowEnd;
    });

    let notificationsSent = 0;

    for (const tournament of tournamentsStartingSoon) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
        .collect();

      const teamMemberPromises = teams.map((team) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect(),
      );
      const teamMembersNested = await Promise.all(teamMemberPromises);
      const teamMembers = teamMembersNested.flat();

      const userIds = [...new Set(teamMembers.map((m) => m.userId))];

      const notificationPromises = userIds.map((userId) =>
        ctx.runMutation(internal.notifications.create, {
          userId,
          type: "tournament_starting_24h",
          title: `${tournament.name} starts in 24 hours`,
          body: "Don't forget to check your team's schedule!",
          relatedEntityId: `${tournament._id}_${tournament.startDate}`,
          relatedEntityType: "tournament",
          actionUrl: `/tournaments/${tournament._id}`,
        }),
      );

      await Promise.all(notificationPromises);
      notificationsSent += userIds.length;
    }

    console.log(
      `Sent ${notificationsSent} tournament 24h warning notifications`,
    );

    return { notificationsSent };
  },
});

// Add similar implementations for:
// - checkTournamentStarted
// - checkTournamentEnding24h
// - checkTournamentEnded
// - sendDailyDigest

// See /specs/001-notification-system/contracts/actions.md for full implementations
```

**Verification**:

1. Navigate to Convex Dashboard → Functions → Cron Jobs
2. You should see 6 cron jobs listed
3. Click "Run Now" on `cleanup old notifications` to test
4. Check logs for confirmation

---

### Step 5: Event Triggers

Update existing mutations to create notifications when events occur.

**File**: `/convex/teams.ts`

Add notification triggers to team-related mutations:

```typescript
import { internal } from "./_generated/api";
import { NOTIFICATION_TYPES } from "./notifications/types";

// Example: Team invitation
export const inviteUser = mutation({
  args: {
    teamId: v.id("teams"),
    invitedUserId: v.id("users"),
    invitedEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // ... existing invitation logic ...

    const invitation = await ctx.db.insert("teamInvitations", {
      teamId: args.teamId,
      invitedUserId: args.invitedUserId,
      invitedEmail: args.invitedEmail,
      invitedBy: currentUser._id,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    // CREATE NOTIFICATION
    try {
      await ctx.runMutation(internal.notifications.create, {
        userId: args.invitedUserId,
        type: NOTIFICATION_TYPES.TEAM_INVITATION_RECEIVED,
        title: `You've been invited to join ${team.name}`,
        body: `${currentUser.name} invited you to join their team`,
        relatedEntityId: args.teamId,
        relatedEntityType: "team",
        actionUrl: `/teams/${args.teamId}/invitations`,
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
      // Don't throw - allow invitation to succeed
    }

    return invitation;
  },
});
```

**Repeat for all triggers listed in `/specs/001-notification-system/contracts/triggers.md`**:

- 10 team event triggers (`teams.ts`)
- 3 submission event triggers (`submissions.ts`)
- 2 role event triggers (`admin.ts`)

> **Note**: See the triggers contract document for complete implementation details for each event type.

---

### Step 6: React Hooks

Create custom hooks for consuming notification data in React components.

**File**: `/src/hooks/use-notifications.ts` (create new file)

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useNotifications(userId: Id<"users">, limit = 50) {
  const notifications = useQuery(api.notifications.list, {
    userId,
    limit,
    filter: "all",
  });

  return notifications;
}
```

**File**: `/src/hooks/use-unread-count.ts` (create new file)

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useUnreadCount(userId: Id<"users">) {
  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    userId,
  });

  return unreadCount ?? 0;
}
```

---

### Step 7: UI Components

Create React components for displaying notifications.

**File**: `/src/components/notifications/notification-item.tsx` (create new file)

```typescript
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: {
    _id: Id<"notifications">;
    title: string;
    body?: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
  };
  onClick?: () => void;
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const markAsRead = useMutation(api.notifications.markAsRead);

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent",
        !notification.isRead && "bg-accent/50 font-semibold",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm">{notification.title}</p>
        {!notification.isRead && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
        )}
      </div>
      {notification.body && (
        <p className="text-xs text-muted-foreground">{notification.body}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(notification.createdAt), {
          addSuffix: true,
        })}
      </p>
    </button>
  );
}
```

**File**: `/src/components/notifications/notification-list.tsx` (create new file)

```typescript
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "./notification-item";
import type { Id } from "@/convex/_generated/dataModel";

interface NotificationListProps {
  userId: Id<"users">;
  limit?: number;
}

export function NotificationList({ userId, limit }: NotificationListProps) {
  const notifications = useNotifications(userId, limit);

  if (notifications === undefined) {
    return <div className="p-4 text-sm">Loading notifications...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No notifications yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <NotificationItem key={notification._id} notification={notification} />
      ))}
    </div>
  );
}
```

**File**: `/src/components/notifications/notification-dropdown.tsx` (create new file)

```typescript
"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NotificationItem } from "./notification-item";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

interface NotificationDropdownProps {
  userId: Id<"users">;
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useUnreadCount(userId);
  const recentNotifications = useQuery(
    isOpen ? api.notifications.recent : "skip",
    isOpen ? { userId, limit: 5 } : "skip",
  );
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({ userId });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {recentNotifications === undefined && (
            <div className="p-4 text-sm">Loading...</div>
          )}
          {recentNotifications && recentNotifications.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          )}
          {recentNotifications?.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onClick={() => setIsOpen(false)}
            />
          ))}
        </div>
        <Button variant="link" className="mt-2 w-full" asChild>
          <a href="/notifications">View all notifications</a>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
```

**File**: `/src/components/notifications/notification-indicator.tsx` (create new file)

```typescript
"use client";

import { useUnreadCount } from "@/hooks/use-unread-count";
import type { Id } from "@/convex/_generated/dataModel";

interface NotificationIndicatorProps {
  userId: Id<"users">;
}

export function NotificationIndicator({
  userId,
}: NotificationIndicatorProps) {
  const unreadCount = useUnreadCount(userId);

  if (unreadCount === 0) return null;

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
```

---

### Step 8: Pages

Create the full notifications page.

**File**: `/src/app/(all)/notifications/page.tsx` (create new file)

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  // Note: You'll need to convert clerkUserId to Convex userId
  // This assumes you have a helper function to do this conversion
  // const convexUserId = await getConvexUserId(clerkUserId);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated on tournament activities and team events
        </p>
      </div>

      <NotificationList userId={convexUserId as any} limit={100} />
    </div>
  );
}
```

---

### Step 9: Layout Integration

Add the notification dropdown to the application header.

**File**: `/src/app/(all)/layout.tsx`

Update your existing layout to include the notification dropdown:

```typescript
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
// ... other imports

export default async function AllLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId: clerkUserId } = await auth();

  // Convert to Convex userId
  // const convexUserId = await getConvexUserId(clerkUserId);

  return (
    <div>
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between py-4">
          <nav>{/* Your existing navigation */}</nav>

          <div className="flex items-center gap-4">
            {/* Add notification dropdown */}
            <NotificationDropdown userId={convexUserId as any} />

            {/* Your existing user menu, etc. */}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
```

---

### Step 10: Testing Setup

Install testing frameworks and write initial tests.

**Install Dependencies**:

```bash
bun add -d vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
bun add -d @playwright/test
bun add -d convex-test
```

**File**: `/vitest.config.ts` (create new file)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**File**: `/vitest.setup.ts` (create new file)

```typescript
import "@testing-library/jest-dom";
```

**File**: `/convex/notifications.test.ts` (create new file)

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

test("creates notification with valid data", async () => {
  const t = convexTest(schema);

  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: "test@example.com",
      name: "Test User",
      externalId: "clerk_123",
    });
  });

  const notificationId = await t.mutation(internal.notifications.create, {
    userId,
    type: "team_invitation_received",
    title: "You've been invited",
  });

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

  const id1 = await t.mutation(internal.notifications.create, args);
  const id2 = await t.mutation(internal.notifications.create, args);

  expect(id1).toBe(id2);

  const notifications = await t.query(api.notifications.list, { userId });
  expect(notifications).toHaveLength(1);
});
```

**Add test scripts to `package.json`**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**Run Tests**:

```bash
bun test
```

---

### Step 11: Code Quality

Run linting and formatting to ensure code quality.

```bash
# Run Biome linter
bun run lint

# Auto-fix linting issues
bun run lint:fix

# Check code formatting
bun run format

# Auto-format code
bun run format:fix
```

**Important**: This project uses **Biome** (not ESLint/Prettier). Biome will:

- Enforce sorted Tailwind classes
- Auto-organize imports
- Ensure consistent code style

---

## 4. Key Code Patterns

### Schema Definition

```typescript
notifications: defineTable({
  userId: v.id("users"),
  type: v.string(),
  title: v.string(),
  // ... other fields
})
  .index("by_user_and_read", ["userId", "isRead"])
  .index("by_user_type_entity", [
    "userId",
    "type",
    "relatedEntityType",
    "relatedEntityId",
  ]);
```

### Query with useQuery Hook

```typescript
const notifications = useQuery(api.notifications.list, {
  userId: currentUserId,
  limit: 20,
  filter: "unread",
});

if (notifications === undefined) {
  return <Loading />;
}
```

### Mutation with useMutation Hook

```typescript
const markAsRead = useMutation(api.notifications.markAsRead);

const handleClick = async () => {
  await markAsRead({ notificationId: notification._id });
};
```

### Notification Trigger in Existing Mutation

```typescript
export const inviteUser = mutation({
  args: { teamId: v.id("teams"), invitedUserId: v.id("users") },
  handler: async (ctx, args) => {
    // ... existing logic ...

    // Create notification (wrap in try-catch to prevent blocking)
    try {
      await ctx.runMutation(internal.notifications.create, {
        userId: args.invitedUserId,
        type: "team_invitation_received",
        title: `You've been invited to join ${team.name}`,
        relatedEntityId: args.teamId,
        relatedEntityType: "team",
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
    }

    return invitation;
  },
});
```

### Cron Job Definition

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "cleanup old notifications",
  { hourUTC: 2, minuteUTC: 0 },
  internal.notifications.cleanupOldNotifications,
);

export default crons;
```

### React Component Using Notifications

```typescript
export function NotificationBadge({ userId }: { userId: Id<"users"> }) {
  const unreadCount = useQuery(api.notifications.getUnreadCount, { userId });

  if (unreadCount === undefined || unreadCount === 0) {
    return null;
  }

  return <Badge>{unreadCount > 99 ? "99+" : unreadCount}</Badge>;
}
```

---

## 5. Testing Strategy

### Unit Tests

Test notification creation, idempotency, and read status:

```bash
bun test convex/notifications.test.ts
```

**Coverage**:

- ✅ Notification creation with valid data
- ✅ Idempotency (duplicate prevention)
- ✅ Mark as read functionality
- ✅ Mark all as read
- ✅ Unread count query

### Integration Tests

Test trigger flows (e.g., team invitation → notification created):

```typescript
test("team invitation creates notification", async () => {
  const t = convexTest(schema);

  // Setup: create users, tournament, team
  // ...

  // Trigger invitation
  await t.mutation(api.teams.inviteUser, {
    teamId,
    invitedUserId,
    invitedEmail: "user@test.com",
  });

  // Verify notification created
  const notifications = await t.query(api.notifications.list, {
    userId: invitedUserId,
  });

  expect(notifications).toHaveLength(1);
  expect(notifications[0].type).toBe("team_invitation_received");
});
```

### E2E Tests

Test dropdown interaction, mark all as read, navigation:

```bash
bun test:e2e
```

**File**: `/e2e/notifications.spec.ts` (create new file)

```typescript
import { test, expect } from "@playwright/test";

test("user receives and views notification", async ({ page }) => {
  // Login as user
  await page.goto("/sign-in");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL("/dashboard");

  // Verify badge appears (assuming notification exists)
  const badge = page.locator('[data-testid="notification-badge"]');
  await expect(badge).toBeVisible();

  // Click notification bell
  await page.click('[data-testid="notification-bell"]');

  // Verify notification in dropdown
  await expect(
    page.locator('[data-testid="notification-item"]').first(),
  ).toBeVisible();

  // Click notification
  await page.locator('[data-testid="notification-item"]').first().click();

  // Verify navigation to correct page
  await expect(page).toHaveURL(/\/(teams|tournaments|submissions)/);
});
```

---

## 6. Common Pitfalls

### ❌ Forgetting to Run Both Dev Servers

**Problem**: Next.js app runs but Convex queries fail.

**Solution**: Always run both:

```bash
# Terminal 1
bun run dev

# Terminal 2
bunx convex dev
```

### ❌ Not Using Indexes in Queries

**Problem**: Slow query performance, Convex dashboard warnings.

**Solution**: Always use `.withIndex()`:

```typescript
// Good
ctx.db
  .query("notifications")
  .withIndex("by_user_and_read", (q) =>
    q.eq("userId", userId).eq("isRead", false),
  );

// Bad
ctx.db.query("notifications").filter((q) => q.eq(q.field("userId"), userId));
```

### ❌ Creating Duplicate Notifications

**Problem**: Users receive multiple notifications for the same event.

**Solution**: Use idempotent pattern with compound index:

```typescript
const existing = await ctx.db
  .query("notifications")
  .withIndex("by_user_type_entity", (q) =>
    q.eq("userId", userId).eq("type", type).eq("relatedEntityId", entityId),
  )
  .first();

if (existing) return existing._id;
```

### ❌ Not Filtering Out Deleted Notifications

**Problem**: Soft-deleted notifications still appear in queries.

**Solution**: Always filter:

```typescript
.filter((q) => q.neq(q.field("isDeleted"), true))
```

### ❌ Forgetting Authorization in Queries

**Problem**: Users can access other users' notifications.

**Solution**: Always check ownership:

```typescript
const currentUser = await getCurrentUserOrThrow(ctx);
if (currentUser._id !== args.userId) {
  throw new Error("Not authorized");
}
```

---

## 7. Performance Checklist

- ✅ All queries use indexes (`by_user_and_read`, `by_user_type_entity`, etc.)
- ✅ Pagination implemented for large lists (`limit`, `offset` parameters)
- ✅ Batch operations use `Promise.all()` for parallelism
- ✅ Soft delete instead of hard delete (preserves audit trail)
- ✅ Conditional queries skip when not needed (`useQuery("skip")` for closed dropdown)
- ✅ Cleanup cron runs during low-traffic period (2:00 AM UTC)
- ✅ Idempotent notification creation prevents duplicates

---

## 8. Deployment Checklist

### Before Deployment

- ✅ Schema deployed to Convex production environment
- ✅ All indexes created successfully
- ✅ Cron jobs visible in Convex dashboard
- ✅ All tests passing (`bun test`)
- ✅ Biome linting/formatting passing (`bun run lint`, `bun run format`)
- ✅ Environment variables configured (if any new ones added)

### Deployment Steps

```bash
# 1. Deploy Convex backend
bunx convex deploy --prod

# 2. Build Next.js application
bun run build

# 3. Deploy Next.js (platform-specific)
# Example for Vercel:
vercel deploy --prod
```

### Post-Deployment Verification

- ✅ Cron jobs running on schedule (check Convex dashboard logs)
- ✅ Real-time updates working across tabs
- ✅ Notification badge updates without refresh
- ✅ All 23 notification types tested in production
- ✅ Query performance acceptable (< 1 second for 100 notifications)

---

## 9. Monitoring & Observability

### Convex Dashboard

**Navigate to**: https://dashboard.convex.dev

**Monitor**:

- **Cron Jobs**: Execution logs, success/failure rates
- **Functions**: Query performance, mutation latency
- **Database**: Table sizes, index usage
- **Logs**: Error messages, console.log output

### Key Metrics to Track

| Metric                                      | Target         | Alert Threshold          |
| ------------------------------------------- | -------------- | ------------------------ |
| Notification delivery latency               | < 3 seconds    | > 5 seconds              |
| Query response time (list 50 notifications) | < 1 second     | > 2 seconds              |
| Cron job execution time (cleanup)           | < 30 seconds   | > 60 seconds             |
| Notification table size                     | Grows linearly | Sudden spike (> 10k/day) |
| Failed notification creation rate           | < 0.1%         | > 1%                     |

### Cleanup Effectiveness

Monitor notification count growth:

```typescript
// Query total notification count
const totalNotifications = await ctx.db.query("notifications").collect();
const activeNotifications = totalNotifications.filter((n) => !n.isDeleted);

console.log({
  total: totalNotifications.length,
  active: activeNotifications.length,
  deleted: totalNotifications.length - activeNotifications.length,
});
```

Expected: Active notifications should stabilize after 90 days (steady state).

---

## 10. Next Steps / Future Enhancements

### Phase 2 Enhancements

1. **Notification Preferences**
   - Enable/disable specific notification types
   - Set quiet hours (no notifications during sleep time)
   - Configure daily digest frequency
   - User-local timezone for time-based notifications

2. **Notification Templates**
   - Centralize notification text generation
   - Support for multiple languages (i18n)
   - Dynamic template variables

3. **Notification Grouping**
   - Combine similar notifications (e.g., "3 team members submitted activities today")
   - Reduce notification noise for active teams

4. **Rich Notifications**
   - Team logos/avatars
   - Submission images
   - Action buttons with icons
   - Embedded tournament banners

5. **Push Notifications**
   - Integrate external push service (Firebase, OneSignal)
   - Browser push notifications (Web Push API)
   - Mobile app notifications (if mobile app is built)

6. **Analytics**
   - Track notification engagement (click-through rates)
   - Measure time to read notifications
   - Identify most valuable notification types
   - A/B test notification copy

---

## Additional Resources

### Documentation

- **Feature Spec**: `/specs/001-notification-system/spec.md`
- **Data Model**: `/specs/001-notification-system/data-model.md`
- **Contracts**: `/specs/001-notification-system/contracts/` (queries, mutations, actions, triggers)
- **Research**: `/specs/001-notification-system/research.md`

### External References

- [Convex Documentation](https://docs.convex.dev)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)

---

## Support & Questions

If you encounter issues during implementation:

1. Check Convex Dashboard logs for error messages
2. Verify both `bun run dev` and `bunx convex dev` are running
3. Review `/specs/001-notification-system/` for detailed specifications
4. Run `bun run lint:fix` to auto-fix common code issues
5. Check that all indexes are created in Convex dashboard

---

**Document Status**: Complete
**Last Updated**: 2026-01-29
**Ready for Implementation**: Yes
