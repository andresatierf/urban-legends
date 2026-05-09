# Notifications System

**Priority:** MEDIUM
**Status:** Not Implemented
**Estimated Effort:** 3-4 days

## Executive Summary

The Urban Legends platform currently lacks a notification system, requiring users to manually check for important updates like submission approvals, team invitations, join requests, and tournament events. This specification defines a comprehensive real-time notification system leveraging Convex's built-in real-time capabilities to deliver instant in-app notifications with optional email delivery.

**Primary User Benefit:** Users receive instant, actionable notifications for all important events, improving engagement and reducing missed opportunities (invitations, approvals, tournament deadlines).

**Business Value:** Increased user engagement, faster response times to team actions, reduced administrative overhead, and improved tournament participation rates.

**Expected Timeline:** 3-4 days (Medium complexity)

## Feature Requirements

### Functional Requirements

#### 1. In-App Notification System

- **Real-Time Delivery:** Notifications appear instantly using Convex subscriptions
- **Notification Bell:** Header component with unread count badge
- **Notification Panel:** Dropdown displaying recent notifications (last 50)
- **Notification Types:** Support for 20+ event types across teams, submissions, tournaments, and roles
- **Click Actions:** Each notification navigates to the relevant page/resource
- **Mark as Read:** Single notification or bulk "mark all as read" functionality
- **Auto-Read:** Notifications marked as read after clicking
- **Persistence:** Notifications stored in database with 90-day retention
- **Grouping:** Similar notifications grouped (e.g., "3 submissions approved")
- **Time Display:** Relative timestamps ("2 minutes ago", "yesterday")

#### 2. Notification Event Coverage

**Team Events (9 types):**

- Team invitation received
- Team join request received (for captains)
- Join request approved/rejected
- Member joined team
- Member left team
- Removed from team
- Captain role transferred (to you / from you)
- Team deleted (for members)

**Submission Events (5 types):**

- Submission approved
- Submission rejected (with reason visible)
- Submission group auto-created (team exercise threshold met)
- Teammate submitted (daily progress notification)
- Submission flagged for review (for reviewers)

**Tournament Events (6 types):**

- Tournament starting in 24 hours
- Tournament started
- Tournament ending in 24 hours
- Tournament ended
- Tournament winner announced
- Assigned as tournament manager

**Role/Admin Events (3 types):**

- Role granted (admin, reviewer, tournament_manager, viewer)
- Role revoked
- Pending items require attention (aggregated daily digest)

**Total:** 23 notification event types

#### 3. Notification Preferences

- **Per-Event Preferences:** Enable/disable each notification type individually
- **Channel Preferences:** In-app (always on), email (optional)
- **Frequency Settings:** Immediate, daily digest, or disabled
- **Default Settings:** All in-app notifications enabled by default
- **Preference Storage:** Stored per-user in database
- **Quick Settings:** Access from notification panel and user settings page

#### 4. Email Notifications (Optional/Future)

- **SMTP Integration:** Configurable email service (Resend, SendGrid, etc.)
- **Email Templates:** HTML templates for each notification type
- **Digest Mode:** Daily summary email option
- **Unsubscribe:** One-click unsubscribe mechanism
- **Preference Sync:** Email preferences sync with in-app settings
- **Rate Limiting:** Max 10 emails per day per user (digest recommended)

### Non-Functional Requirements

- **Performance:** Notification creation <50ms, query <100ms
- **Real-Time:** Notification delivery <500ms via Convex subscriptions
- **Scalability:** Support 10,000+ notifications per day
- **Storage:** 90-day retention policy with automatic cleanup
- **Accessibility:** Screen reader compatible, keyboard navigation
- **Mobile:** Responsive notification panel for mobile devices
- **Loading States:** Skeleton loaders during data fetching
- **Error Handling:** Graceful degradation if notifications fail

## Database Schema Changes

### New Tables

#### `notifications`

```typescript
notifications: defineTable({
  userId: v.id("users"), // Recipient
  type: v.union(
    // Team events
    v.literal("team_invitation_received"),
    v.literal("team_join_request_received"),
    v.literal("team_join_request_approved"),
    v.literal("team_join_request_rejected"),
    v.literal("team_member_joined"),
    v.literal("team_member_left"),
    v.literal("team_member_removed"),
    v.literal("team_captain_transferred_to"),
    v.literal("team_captain_transferred_from"),
    v.literal("team_deleted"),
    // Submission events
    v.literal("submission_approved"),
    v.literal("submission_rejected"),
    v.literal("submission_group_created"),
    v.literal("teammate_submitted"),
    v.literal("submission_flagged"),
    // Tournament events
    v.literal("tournament_starting_soon"),
    v.literal("tournament_started"),
    v.literal("tournament_ending_soon"),
    v.literal("tournament_ended"),
    v.literal("tournament_winner_announced"),
    v.literal("tournament_manager_assigned"),
    // Role events
    v.literal("role_granted"),
    v.literal("role_revoked"),
    v.literal("pending_actions_digest"),
  ),
  title: v.string(), // Short summary (e.g., "Submission Approved")
  message: v.string(), // Full message (e.g., "Your submission for Team Alpha on 2024-11-18 was approved")
  read: v.boolean(), // Read status
  readAt: v.optional(v.string()), // When marked as read
  actionUrl: v.optional(v.string()), // Navigation target (e.g., "/teams/abc123")
  metadata: v.optional(v.object({
    // Context-specific data for rendering
    teamId: v.optional(v.id("teams")),
    teamName: v.optional(v.string()),
    tournamentId: v.optional(v.id("tournaments")),
    tournamentName: v.optional(v.string()),
    submissionId: v.optional(v.id("submissions")),
    submissionDate: v.optional(v.string()),
    userId: v.optional(v.id("users")), // Actor (who triggered the event)
    userName: v.optional(v.string()),
    roleName: v.optional(v.string()),
    reason: v.optional(v.string()), // Rejection reason, etc.
    count: v.optional(v.number()), // For grouped notifications
  })),
  createdAt: v.string(), // ISO timestamp
  expiresAt: v.optional(v.string()), // Auto-delete after this date (90 days)
})
  .index("by_user", ["userId"])
  .index("by_user_and_read", ["userId", "read"])
  .index("by_user_and_created", ["userId", "createdAt"])
  .index("by_expires", ["expiresAt"]), // For cleanup job
```

#### `notificationPreferences`

```typescript
notificationPreferences: defineTable({
  userId: v.id("users"),
  notificationType: v.string(), // Same as notification.type
  inAppEnabled: v.boolean(), // Default: true
  emailEnabled: v.boolean(), // Default: false
  frequency: v.union(
    v.literal("immediate"),
    v.literal("daily_digest"),
    v.literal("disabled"),
  ), // Default: immediate for in-app
  updatedAt: v.string(),
})
  .index("by_user", ["userId"])
  .index("by_user_and_type", ["userId", "notificationType"]),
```

## Backend Implementation

### New Convex Functions

#### `notifications.ts` - Core Notification Functions

##### `notifications.create` (Internal Mutation)

```typescript
/**
 * Internal mutation to create a notification.
 * Should be called from other mutations when events occur.
 * NOT exposed to frontend directly.
 */
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(), // One of the notification types
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        teamId: v.optional(v.id("teams")),
        teamName: v.optional(v.string()),
        tournamentId: v.optional(v.id("tournaments")),
        tournamentName: v.optional(v.string()),
        submissionId: v.optional(v.id("submissions")),
        submissionDate: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        userName: v.optional(v.string()),
        roleName: v.optional(v.string()),
        reason: v.optional(v.string()),
        count: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Check user preferences
    const preference = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("notificationType", args.type),
      )
      .first();

    // Default to enabled if no preference exists
    const inAppEnabled = preference?.inAppEnabled !== false;
    const frequency = preference?.frequency || "immediate";

    if (!inAppEnabled || frequency === "disabled") {
      return null; // Don't create notification if disabled
    }

    // Calculate expiration (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      read: false,
      actionUrl: args.actionUrl,
      metadata: args.metadata,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    // TODO: If emailEnabled and frequency === "immediate", schedule email
    // This would require email service integration (future enhancement)

    return notificationId;
  },
});
```

##### `notifications.list` (Query)

```typescript
/**
 * Get notifications for the current user
 */
export const list = query({
  args: {
    limit: v.optional(v.number()), // Default: 50
    unreadOnly: v.optional(v.boolean()), // Default: false
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const limit = args.limit || 50;

    let query = ctx.db
      .query("notifications")
      .withIndex("by_user_and_created", (q) => q.eq("userId", user._id))
      .order("desc");

    if (args.unreadOnly) {
      query = ctx.db
        .query("notifications")
        .withIndex("by_user_and_read", (q) =>
          q.eq("userId", user._id).eq("read", false),
        )
        .order("desc");
    }

    const notifications = await query.take(limit);
    return notifications;
  },
});
```

##### `notifications.getUnreadCount` (Query)

```typescript
/**
 * Get count of unread notifications for badge display
 */
export const getUnreadCount = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .collect();

    return unread.length;
  },
});
```

##### `notifications.markAsRead` (Mutation)

```typescript
/**
 * Mark one or all notifications as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.optional(v.id("notifications")), // If omitted, mark all as read
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (args.notificationId) {
      // Mark single notification as read
      const notification = await ctx.db.get(args.notificationId);
      if (!notification) {
        throw new Error("Notification not found");
      }

      if (notification.userId !== user._id) {
        throw new Error("Not authorized to update this notification");
      }

      await ctx.db.patch(args.notificationId, {
        read: true,
        readAt: new Date().toISOString(),
      });
    } else {
      // Mark all as read
      const unread = await ctx.db
        .query("notifications")
        .withIndex("by_user_and_read", (q) =>
          q.eq("userId", user._id).eq("read", false),
        )
        .collect();

      const now = new Date().toISOString();
      await Promise.all(
        unread.map((n) => ctx.db.patch(n._id, { read: true, readAt: now })),
      );
    }

    return { success: true };
  },
});
```

##### `notifications.deleteOld` (Internal Mutation - Scheduled)

```typescript
/**
 * Delete expired notifications (run via scheduled function)
 */
export const deleteOld = internalMutation({
  handler: async (ctx) => {
    const now = new Date().toISOString();

    const expired = await ctx.db
      .query("notifications")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .collect();

    await Promise.all(expired.map((n) => ctx.db.delete(n._id)));

    return { deleted: expired.length };
  },
});
```

#### `notificationPreferences.ts` - User Preferences

##### `notificationPreferences.get` (Query)

```typescript
/**
 * Get notification preferences for current user
 */
export const get = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Return map of type -> settings
    const prefMap: Record<string, any> = {};
    for (const pref of preferences) {
      prefMap[pref.notificationType] = {
        inAppEnabled: pref.inAppEnabled,
        emailEnabled: pref.emailEnabled,
        frequency: pref.frequency,
      };
    }

    return prefMap;
  },
});
```

##### `notificationPreferences.update` (Mutation)

```typescript
/**
 * Update notification preferences for a specific type
 */
export const update = mutation({
  args: {
    notificationType: v.string(),
    inAppEnabled: v.optional(v.boolean()),
    emailEnabled: v.optional(v.boolean()),
    frequency: v.optional(
      v.union(
        v.literal("immediate"),
        v.literal("daily_digest"),
        v.literal("disabled"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Find existing preference
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", user._id).eq("notificationType", args.notificationType),
      )
      .first();

    const now = new Date().toISOString();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        inAppEnabled: args.inAppEnabled ?? existing.inAppEnabled,
        emailEnabled: args.emailEnabled ?? existing.emailEnabled,
        frequency: args.frequency ?? existing.frequency,
        updatedAt: now,
      });
    } else {
      // Create new preference
      await ctx.db.insert("notificationPreferences", {
        userId: user._id,
        notificationType: args.notificationType,
        inAppEnabled: args.inAppEnabled ?? true,
        emailEnabled: args.emailEnabled ?? false,
        frequency: args.frequency ?? "immediate",
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
```

#### Helper Functions for Creating Notifications

Create a `notificationHelpers.ts` file with reusable helper functions:

```typescript
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Helper to create team invitation notification
 */
export async function notifyTeamInvitation(
  ctx: any,
  args: {
    invitedUserId: Id<"users">;
    teamId: Id<"teams">;
    teamName: string;
    invitedByName: string;
    tournamentName: string;
  },
) {
  await ctx.runMutation(api.notifications.create, {
    userId: args.invitedUserId,
    type: "team_invitation_received",
    title: "Team Invitation",
    message: `${args.invitedByName} invited you to join "${args.teamName}" in ${args.tournamentName}`,
    actionUrl: `/teams/${args.teamId}`,
    metadata: {
      teamId: args.teamId,
      teamName: args.teamName,
      userName: args.invitedByName,
    },
  });
}

/**
 * Helper to create submission approval notification
 */
export async function notifySubmissionApproved(
  ctx: any,
  args: {
    userId: Id<"users">;
    submissionId: Id<"submissions">;
    submissionDate: string;
    teamName: string;
    pointsEarned: number;
    reviewerName: string;
  },
) {
  await ctx.runMutation(api.notifications.create, {
    userId: args.userId,
    type: "submission_approved",
    title: "Submission Approved",
    message: `Your submission for ${args.teamName} on ${args.submissionDate} was approved! (+${args.pointsEarned} points)`,
    actionUrl: `/submissions/${args.submissionId}`,
    metadata: {
      submissionId: args.submissionId,
      submissionDate: args.submissionDate,
      teamName: args.teamName,
      userName: args.reviewerName,
      count: args.pointsEarned,
    },
  });
}

// ... similar helpers for all notification types
```

### Integration Points - Modified Mutations

Update existing mutations to trigger notifications:

#### `teamInvitations.ts`

```typescript
// In inviteMember mutation, after creating invitation:
await ctx.runMutation(internal.notificationHelpers.notifyTeamInvitation, {
  invitedUserId: invitedUser._id,
  teamId: args.teamId,
  teamName: team.name,
  invitedByName: user.name,
  tournamentName: tournament.name,
});
```

#### `submissions.ts`

```typescript
// In approve mutation, after updating submission:
await ctx.runMutation(internal.notificationHelpers.notifySubmissionApproved, {
  userId: submission.userId,
  submissionId: args.submissionId,
  submissionDate: submission.date,
  teamName: team.name,
  pointsEarned,
  reviewerName: user.name,
});
```

#### `joinRequests.ts`

```typescript
// In requestToJoin mutation, after creating request:
// Notify team captain(s)
const captains = await ctx.db
  .query("teamMembers")
  .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
  .filter((q) => q.eq(q.field("role"), "captain"))
  .collect();

for (const captain of captains) {
  await ctx.runMutation(internal.notificationHelpers.notifyJoinRequest, {
    captainId: captain.userId,
    userId: user._id,
    userName: user.name,
    teamId: args.teamId,
    teamName: team.name,
  });
}
```

### Scheduled Function for Cleanup

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 3am to delete expired notifications
crons.daily(
  "delete-expired-notifications",
  { hourUTC: 3, minuteUTC: 0 },
  internal.notifications.deleteOld,
);

export default crons;
```

## Frontend Implementation

### New Components

#### `NotificationBell` Component

**Location:** `src/components/notifications/notification-bell.tsx`

```typescript
"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationPanel } from "./notification-panel";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = useQuery(api.notifications.getUnreadCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[400px] p-0"
        sideOffset={8}
      >
        <NotificationPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
```

#### `NotificationPanel` Component

**Location:** `src/components/notifications/notification-panel.tsx`

```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCheck, Settings } from "lucide-react";
import { NotificationItem } from "./notification-item";
import Link from "next/link";
import { Empty } from "@/components/ui/empty";

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const notifications = useQuery(api.notifications.list, { limit: 50 });
  const markAllAsRead = useMutation(api.notifications.markAsRead);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({});
  };

  const unreadNotifications = notifications?.filter((n) => !n.read) || [];

  return (
    <div className="flex h-[500px] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 px-2"
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <Link href="/settings/notifications" onClick={onClose}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <ScrollArea className="flex-1">
        {!notifications ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <Empty
              icon={Bell}
              title="No notifications"
              description="You're all caught up!"
            />
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications && notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full"
              size="sm"
              asChild
            >
              <Link href="/notifications" onClick={onClose}>
                View all notifications
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

#### `NotificationItem` Component

**Location:** `src/components/notifications/notification-item.tsx`

```typescript
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getNotificationIcon } from "@/lib/notification-utils";
import { Button } from "@/components/ui/button";

interface NotificationItemProps {
  notification: {
    _id: Id<"notifications">;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    actionUrl?: string;
  };
  onClose: () => void;
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const router = useRouter();
  const markAsRead = useMutation(api.notifications.markAsRead);

  const Icon = getNotificationIcon(notification.type);

  const handleClick = async () => {
    // Mark as read
    if (!notification.read) {
      await markAsRead({ notificationId: notification._id });
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose();
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <Button
      variant="ghost"
      className={cn(
        "h-auto w-full justify-start rounded-none p-4 text-left",
        !notification.read && "bg-muted/50"
      )}
      onClick={handleClick}
    >
      <div className="flex w-full gap-3">
        {/* Icon */}
        <div
          className={cn(
            "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            !notification.read ? "bg-primary/10" : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              !notification.read ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm font-medium",
                !notification.read && "font-semibold"
              )}
            >
              {notification.title}
            </p>
            {!notification.read && (
              <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
    </Button>
  );
}
```

#### Utility Function for Icons

**Location:** `src/lib/notification-utils.ts`

```typescript
import {
  Bell,
  CheckCircle,
  XCircle,
  Users,
  Trophy,
  UserPlus,
  UserMinus,
  Flag,
  Shield,
  Calendar,
  type LucideIcon,
} from "lucide-react";

export function getNotificationIcon(type: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    // Team events
    team_invitation_received: UserPlus,
    team_join_request_received: UserPlus,
    team_join_request_approved: CheckCircle,
    team_join_request_rejected: XCircle,
    team_member_joined: Users,
    team_member_left: UserMinus,
    team_member_removed: XCircle,
    team_captain_transferred_to: Shield,
    team_captain_transferred_from: Shield,
    team_deleted: XCircle,
    // Submission events
    submission_approved: CheckCircle,
    submission_rejected: XCircle,
    submission_group_created: Users,
    teammate_submitted: CheckCircle,
    submission_flagged: Flag,
    // Tournament events
    tournament_starting_soon: Calendar,
    tournament_started: Trophy,
    tournament_ending_soon: Calendar,
    tournament_ended: Trophy,
    tournament_winner_announced: Trophy,
    tournament_manager_assigned: Shield,
    // Role events
    role_granted: Shield,
    role_revoked: Shield,
    pending_actions_digest: Bell,
  };

  return iconMap[type] || Bell;
}
```

### New Pages

#### `/notifications/page.tsx` - Full Notification History

**Location:** `src/app/(all)/notifications/page.tsx`

```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationItem } from "@/components/notifications/notification-item";
import { CheckCheck, Filter } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty } from "@/components/ui/empty";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const notifications = useQuery(api.notifications.list, {
    limit: 100,
    unreadOnly: filter === "unread",
  });
  const markAllAsRead = useMutation(api.notifications.markAsRead);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({});
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notification List */}
      <Card>
        <CardContent className="p-0">
          {!notifications ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Empty
                icon={Bell}
                title={filter === "unread" ? "No unread notifications" : "No notifications"}
                description={
                  filter === "unread"
                    ? "You've read all your notifications"
                    : "You don't have any notifications yet"
                }
              />
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClose={() => {}}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### `/settings/notifications/page.tsx` - Notification Preferences

**Location:** `src/app/(all)/settings/notifications/page.tsx`

```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NOTIFICATION_CATEGORIES = {
  "Team Events": [
    { type: "team_invitation_received", label: "Team invitations" },
    { type: "team_join_request_received", label: "Join requests (as captain)" },
    { type: "team_join_request_approved", label: "Join request approved" },
    { type: "team_join_request_rejected", label: "Join request rejected" },
    { type: "team_member_joined", label: "Member joined team" },
    { type: "team_member_left", label: "Member left team" },
    { type: "team_member_removed", label: "Removed from team" },
    { type: "team_captain_transferred_to", label: "Captain role transferred to you" },
  ],
  "Submission Events": [
    { type: "submission_approved", label: "Submission approved" },
    { type: "submission_rejected", label: "Submission rejected" },
    { type: "teammate_submitted", label: "Teammate submitted" },
  ],
  "Tournament Events": [
    { type: "tournament_starting_soon", label: "Tournament starting soon (24h)" },
    { type: "tournament_started", label: "Tournament started" },
    { type: "tournament_ending_soon", label: "Tournament ending soon (24h)" },
    { type: "tournament_ended", label: "Tournament ended" },
    { type: "tournament_winner_announced", label: "Winner announced" },
  ],
  "Role Events": [
    { type: "role_granted", label: "Role granted" },
    { type: "role_revoked", label: "Role revoked" },
  ],
};

export default function NotificationSettingsPage() {
  const preferences = useQuery(api.notificationPreferences.get);
  const updatePreference = useMutation(api.notificationPreferences.update);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (
    notificationType: string,
    field: "inAppEnabled" | "emailEnabled",
    value: boolean
  ) => {
    setLoading(true);
    try {
      await updatePreference({
        notificationType,
        [field]: value,
      });
      toast.success("Preference updated");
    } catch (error) {
      toast.error("Failed to update preference");
    } finally {
      setLoading(false);
    }
  };

  const handleFrequencyChange = async (
    notificationType: string,
    frequency: "immediate" | "daily_digest" | "disabled"
  ) => {
    setLoading(true);
    try {
      await updatePreference({
        notificationType,
        frequency,
      });
      toast.success("Frequency updated");
    } catch (error) {
      toast.error("Failed to update frequency");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how you receive notifications
        </p>
      </div>

      {Object.entries(NOTIFICATION_CATEGORIES).map(([category, types]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
            <CardDescription>
              Configure notifications for {category.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {types.map(({ type, label }) => {
              const pref = preferences?.[type] || {
                inAppEnabled: true,
                emailEnabled: false,
                frequency: "immediate",
              };

              return (
                <div
                  key={type}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <Label htmlFor={type} className="flex-1 cursor-pointer">
                    {label}
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={type}
                        checked={pref.inAppEnabled}
                        onCheckedChange={(checked) =>
                          handleToggle(type, "inAppEnabled", checked)
                        }
                        disabled={loading}
                      />
                      <span className="text-sm text-muted-foreground">In-app</span>
                    </div>
                    {/* Email toggle - for future implementation */}
                    {/* <div className="flex items-center gap-2">
                      <Switch
                        checked={pref.emailEnabled}
                        onCheckedChange={(checked) =>
                          handleToggle(type, "emailEnabled", checked)
                        }
                        disabled={loading}
                      />
                      <span className="text-sm text-muted-foreground">Email</span>
                    </div> */}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Modified Components

#### Header/Navigation Bar

Update the main header/navigation to include the NotificationBell component:

**Location:** `src/components/ui/sidebar.tsx` (or header component)

```typescript
import { NotificationBell } from "@/components/notifications/notification-bell";

// In the header section, add:
<NotificationBell />
```

## Integration Points

### Trigger Notifications from Existing Mutations

Update the following files to call notification helpers:

1. **`convex/teamInvitations.ts`**
   - `inviteMember`: Notify invited user
   - `respondToInvitation`: Notify captain if accepted

2. **`convex/joinRequests.ts`**
   - `requestToJoin`: Notify team captain(s)
   - `respondToJoinRequest`: Notify requester (approved/rejected)

3. **`convex/submissions.ts`**
   - `approve`: Notify submitter
   - `reject`: Notify submitter with reason
   - Group creation: Notify team members

4. **`convex/teams.ts`**
   - `removeMember`: Notify removed user
   - `transferCaptaincy`: Notify new and old captain
   - `deleteTeam`: Notify all members

5. **`convex/tournaments.ts`**
   - Tournament state changes: Notify participants
   - Winner announcement: Notify winning team

6. **`convex/roles.ts`** (or admin.ts)
   - `assignRole`: Notify user of role grant
   - `removeRole`: Notify user of role revocation

### Notification Batching/Grouping (Future Enhancement)

For high-volume events like "teammate submitted", consider grouping:

- **Daily digest:** "3 teammates submitted today"
- **Real-time with debounce:** Group submissions within 5-minute window
- **Smart grouping:** "5 submissions approved" instead of 5 separate notifications

## UI/UX Considerations

### Notification Panel Design

```
┌─────────────────────────────────────┐
│ Notifications        [✓] [Settings] │
├─────────────────────────────────────┤
│ 🔵 Team Invitation           2m ago │
│   Andre invited you to join         │
│   "Team Alpha" in Fall 2024         │
├─────────────────────────────────────┤
│ ✅ Submission Approved      15m ago │
│   Your submission for Team Alpha    │
│   on 2024-11-18 was approved!       │
│   (+3 points)                       │
├─────────────────────────────────────┤
│    Join Request            1h ago   │
│    John wants to join Team Alpha    │
│                                     │
├─────────────────────────────────────┤
│              View all               │
└─────────────────────────────────────┘
```

### Color Scheme

- **Unread:** Blue accent dot, slightly bolder background
- **Read:** Gray/muted appearance
- **Icons:** Context-specific (checkmark for approval, X for rejection, etc.)
- **Badge:** Red background for unread count

### Accessibility

- **Screen Reader:** Announce notification count in bell button
- **Keyboard Navigation:** Arrow keys to navigate list, Enter to open
- **Focus Management:** Auto-focus first notification when panel opens
- **ARIA Labels:** Proper labeling for all interactive elements

### Real-Time Behavior

- **Live Updates:** Notification count updates instantly via Convex subscription
- **Toast Notification:** Optional toast for high-priority notifications (e.g., team deleted)
- **Sound/Vibration:** Future enhancement with user preference

### Empty States

- **No Notifications:** Friendly message with icon
- **All Read:** "You're all caught up!" message
- **Loading:** Skeleton loaders for smooth experience

## Testing Checklist

### Unit Tests

- [ ] Notification creation respects user preferences
- [ ] Mark as read updates read status and timestamp
- [ ] Mark all as read updates multiple notifications
- [ ] Unread count calculates correctly
- [ ] Expired notifications are deleted by cron job
- [ ] Preferences update correctly
- [ ] Default preferences are applied for new users

### Integration Tests

- [ ] Team invitation creates notification
- [ ] Join request creates notification for captain
- [ ] Submission approval creates notification
- [ ] Submission rejection includes reason in notification
- [ ] Role grant/revoke creates notification
- [ ] Tournament events create notifications
- [ ] Clicking notification marks as read and navigates

### UI Tests

- [ ] Notification bell displays unread count
- [ ] Notification panel opens on click
- [ ] Notifications display with correct icons
- [ ] Mark all as read clears unread status
- [ ] Settings page updates preferences
- [ ] Real-time updates work (new notification appears)
- [ ] Mobile responsive layout works
- [ ] Keyboard navigation works

## Edge Cases

1. **User has notifications disabled globally**
   - Don't create notifications
   - Show message in settings explaining no notifications will be received

2. **Notification refers to deleted entity**
   - Handle gracefully (e.g., team deleted, show "Team no longer exists")
   - Still allow reading the notification

3. **Simultaneous mark as read from multiple devices**
   - Convex handles this automatically with optimistic updates

4. **Notification spam (e.g., 100 teammates submit)**
   - Implement grouping logic for high-volume events
   - Daily digest option for less urgent notifications

5. **User clicks notification while entity is being deleted**
   - Show error page with friendly message
   - Option to go back to notifications

6. **Expired notifications during viewing**
   - Automatically remove from list via Convex reactivity

## Performance Optimization

- **Query Optimization:** Index on `by_user_and_read` for fast unread queries
- **Limit Results:** Default to 50 notifications, load more on scroll
- **Lazy Loading:** Virtual scrolling for large notification lists
- **Debounce Batching:** Group rapid-fire notifications (e.g., bulk approvals)
- **Cache Queries:** Convex auto-caches, no additional work needed
- **Scheduled Cleanup:** Daily cron removes notifications older than 90 days

## Migration & Deployment

### Migration Steps

1. **Schema Update**
   - Add `notifications` and `notificationPreferences` tables
   - Deploy schema to Convex

2. **Backend Implementation**
   - Implement notification queries and mutations
   - Create helper functions for notification creation
   - Add cron job for cleanup

3. **Integration**
   - Update existing mutations to call notification helpers
   - Test each trigger point

4. **Frontend Implementation**
   - Build NotificationBell, NotificationPanel, NotificationItem components
   - Create notifications page and settings page
   - Integrate bell into header/sidebar

5. **Testing**
   - Test all notification triggers
   - Verify real-time updates
   - Test preferences

6. **Deployment**
   - Deploy backend changes
   - Deploy frontend changes
   - Monitor for errors

7. **User Communication**
   - Announce new notification system
   - Provide settings guide
   - Collect feedback

## Success Metrics

- **Adoption:** 80%+ of users have notifications enabled
- **Engagement:** 60%+ of notifications are clicked within 24 hours
- **Response Time:** 50% reduction in time to respond to team invitations
- **User Satisfaction:** 4+ star rating for notification experience
- **Performance:** <100ms notification query time, <500ms delivery time
- **Retention:** 90-day notification retention with automatic cleanup

## Future Enhancements

### Phase 2: Email Notifications (1-2 days)

- Email service integration (Resend, SendGrid)
- HTML email templates
- Daily digest emails
- Unsubscribe mechanism

### Phase 3: Push Notifications (2-3 days)

- Browser push notifications (Web Push API)
- Service worker implementation
- Push notification preferences

### Phase 4: Advanced Features (3-4 days)

- Notification grouping/threading
- Priority levels (critical, normal, low)
- Custom notification sounds
- Do Not Disturb mode
- Notification analytics dashboard

### Phase 5: AI/Smart Features (5-7 days)

- Smart notification frequency (learn user patterns)
- Suggested actions in notifications
- Predictive notifications (e.g., "Tournament ending soon, your team needs 2 more submissions")

## Dependencies

- **Convex:** Real-time subscriptions for live notifications
- **shadcn/ui components:** Bell, Badge, Popover, ScrollArea, Switch
- **Lucide React:** Icons for notification types
- **date-fns:** Relative timestamp formatting
- **sonner:** Toast notifications (already in project)
- **React hooks:** useQuery, useMutation from Convex
- **Email Service (optional):** Resend, SendGrid, or similar

## Open Questions

1. **Should notifications be deleted after being read?**
   - **Recommendation:** No - keep for 90 days for audit trail and user reference

2. **What's the maximum unread count to display in badge?**
   - **Recommendation:** Show "99+" for counts over 99

3. **Should we implement browser push notifications in MVP?**
   - **Recommendation:** No - start with in-app, add push in Phase 3

4. **How to handle notification grouping/batching?**
   - **Recommendation:** Start simple (individual notifications), add grouping in Phase 4

5. **Should email notifications be included in MVP?**
   - **Recommendation:** Optional - start with in-app only, add email in Phase 2 if needed

6. **What about notification sounds?**
   - **Recommendation:** Future enhancement - requires user preference and browser support

7. **Should we track notification click/read analytics?**
   - **Recommendation:** Track read status only for MVP, add detailed analytics in Phase 5

8. **How to notify users when they're offline?**
   - **Recommendation:** Notifications stored in DB, appear when they return (Convex handles this)

9. **Should notifications appear for actions the user themselves triggered?**
   - **Recommendation:** No - don't notify users of their own actions (e.g., don't notify captain when they approve a join request)

10. **What about notification snooze/reminder functionality?**
    - **Recommendation:** Future enhancement - complex UX, defer to Phase 4
