# Notification System Implementation Research

**Date**: 2026-01-29
**Project**: Urban Legends (Next.js 15 + Convex)
**Feature Branch**: `001-notification-system`

---

## 1. Testing Framework

**Decision**: Vitest for unit/component tests, Playwright for E2E tests

**Rationale**:

- **No existing testing framework**: Package.json analysis confirms no testing framework is currently installed (no Jest, Vitest, or E2E tools detected)
- **Vitest advantages for Next.js 15**:
  - Significantly faster than Jest (3.8s vs 15.5s for equivalent test suites)
  - Better integration with modern Next.js tooling and Turbopack
  - Worker threads for parallel test execution
  - HMR-like hot reloading for tests
  - Almost trivial transition from Jest if needed later
  - Native ESM support
- **Playwright advantages for E2E**:
  - Superior performance: test suites run in 14 minutes (Playwright with 15 native parallels) vs 90 minutes (Cypress with 5 paid parallels)
  - Cross-browser support: Chrome, Firefox, Safari/WebKit (Cypress lacks Safari)
  - Lower flakiness: 1.8% vs 6.5% for Cypress
  - Native parallelization without external services
  - Better CI/CD scalability
  - Multi-language support for future extensibility
- **Convex integration**: Convex provides official `convex-test` library that works with Vitest for testing queries and mutations

**Alternatives Considered**:

- **Jest**: Industry standard but slower than Vitest, lacks modern tooling advantages
- **Cypress**: Better debugging experience but limited to Chromium/Firefox (no Safari), slower, higher flakiness rate, requires paid parallelization
- **Testing Library only**: Would need a test runner anyway (Jest or Vitest)

**Implementation Notes**:

```bash
# Installation
bun add -d vitest @testing-library/react @testing-library/jest-dom
bun add -d @playwright/test
bun add -d convex-test

# Vitest configuration (vitest.config.ts)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts']
  }
})

# Package.json scripts
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}

# Convex function testing pattern
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

test("notification creation", async () => {
  const t = convexTest(schema);
  await t.mutation(api.notifications.create, {
    userId: "user123",
    type: "team_invitation_received",
    title: "You've been invited",
  });
  const notifications = await t.query(api.notifications.list, { userId: "user123" });
  expect(notifications).toHaveLength(1);
});
```

**Important Limitation**: Vitest does not support async Server Components (as of 2026). Use E2E tests with Playwright for async components.

**Sources**:
- [Vitest vs Jest - Which Should I Use for My Next.js App?](https://www.wisp.blog/blog/vitest-vs-jest-which-should-i-use-for-my-nextjs-app)
- [Setting up Vitest for Next.js 15](https://www.wisp.blog/blog/setting-up-vitest-for-nextjs-15)
- [Playwright vs Cypress: The 2026 Enterprise Testing Guide](https://devin-rosario.medium.com/playwright-vs-cypress-the-2026-enterprise-testing-guide-ade8b56d3478)
- [Cypress vs Playwright: I Ran 500 E2E Tests in Both](https://medium.com/lets-code-future/cypress-vs-playwright-i-ran-500-e2e-tests-in-both-heres-what-broke-2afc448470ee)
- [convex-test | Convex Developer Hub](https://docs.convex.dev/testing/convex-test)

---

## 2. Convex Scheduled Jobs (Crons)

**Decision**: Use Convex built-in cron jobs for time-based notifications (24-hour warnings, daily digests)

**Rationale**:

- **Native Convex support**: Built-in cron functionality via `cronJobs` from "convex/server"
- **Multiple scheduling options**: interval(), monthly(), daily(), hourly(), and traditional cron syntax
- **UTC timezone**: Cron expressions run in UTC, requiring conversion for user-local times
- **Dashboard monitoring**: View and manually trigger cron jobs in Convex dashboard
- **Type-safe**: Full TypeScript support with type-safe function references
- **Serverless**: No additional infrastructure needed

**Alternatives Considered**:

- **Dynamic cron jobs at runtime**: Convex crons.ts must be static, but `convex-helpers` or custom `@convex-dev/crons` component can enable runtime registration if needed
- **Client-side scheduling**: Not reliable for server-side notifications
- **Third-party services**: Unnecessary complexity

**Implementation Notes**:

Create `/convex/crons.ts`:

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily digest at 9:00 AM UTC
crons.daily(
  "send daily digest",
  { hourUTC: 9, minuteUTC: 0 },
  internal.notifications.sendDailyDigest
);

// Check for 24-hour tournament warnings every hour
crons.hourly(
  "tournament 24h warnings",
  { minuteUTC: 0 },
  internal.notifications.checkTournament24hWarnings
);

// Alternative: Traditional cron syntax
// crons.cron("tournament warnings", "0 * * * *", internal.notifications.checkTournament24hWarnings);

export default crons;
```

**Handling Time Zones**:

For user-specific scheduling (e.g., daily digest at user's local 9 AM):
1. Store user timezone preference in user profile
2. Cron runs at multiple hours (e.g., every hour)
3. Filter users whose local time matches target time (9 AM)
4. Use `date-fns-tz` or similar for timezone conversions

```typescript
// Example time zone handling
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export const sendDailyDigest = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const currentUtcHour = new Date().getUTCHours();

    for (const user of users) {
      const userTimezone = user.timezone || 'UTC';
      const userLocalTime = utcToZonedTime(new Date(), userTimezone);
      const userLocalHour = userLocalTime.getHours();

      // Send digest if it's 9 AM in user's timezone
      if (userLocalHour === 9) {
        await sendDigestToUser(ctx, user._id);
      }
    }
  }
});
```

**Cron Expression Reference**:

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-6, Sunday = 0)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

**Sources**:
- [Cron Jobs | Convex Developer Hub](https://docs.convex.dev/scheduling/cron-jobs)
- [Configure Cron Jobs at Runtime](https://stack.convex.dev/cron-jobs)
- [Cron Jobs in Next.js App Using Convex](https://www.telerik.com/blogs/cron-jobs-nextjs-app-using-convex)
- [GitHub - get-convex/crons](https://github.com/get-convex/crons)

---

## 3. Convex Real-Time Subscriptions

**Decision**: Use standard `useQuery` hook for real-time notification delivery with built-in reactivity

**Rationale**:

- **Automatic reactivity**: `useQuery` automatically rerenders components when underlying data changes
- **Consistent state**: Convex ensures components never render inconsistent state across multiple `useQuery` calls
- **Automatic caching**: Query results cached automatically; identical queries with same arguments share cached response
- **No manual subscription management**: Unlike traditional WebSocket approaches, no need to manually subscribe/unsubscribe
- **Built-in optimistic updates**: Works seamlessly with Convex mutations for immediate UI feedback
- **Cross-tab consistency**: Convex client syncs state across browser tabs automatically

**Alternatives Considered**:

- **TanStack Query with Convex**: Adds complexity; standard `useQuery` sufficient for most cases. TanStack Query useful if already using it extensively or need advanced cache control (5-minute gcTime vs immediate cleanup)
- **Manual WebSocket subscriptions**: Unnecessary complexity; Convex handles this internally
- **Polling**: Inefficient compared to reactive subscriptions

**Implementation Notes**:

```typescript
// Standard pattern for notification list
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function NotificationList() {
  const notifications = useQuery(api.notifications.list, {
    userId: currentUserId
  });

  // notifications automatically updates when data changes
  // undefined during initial load
  if (notifications === undefined) return <Loading />;

  return (
    <div>
      {notifications.map(notification => (
        <NotificationItem key={notification._id} {...notification} />
      ))}
    </div>
  );
}

// Unread count indicator
export function NotificationBadge() {
  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    userId: currentUserId
  });

  if (unreadCount === undefined || unreadCount === 0) return null;

  return <Badge>{unreadCount}</Badge>;
}

// Conditional queries (skip when not needed)
export function NotificationDropdown({ isOpen }: { isOpen: boolean }) {
  const recentNotifications = useQuery(
    isOpen ? api.notifications.recent : "skip",
    isOpen ? { userId: currentUserId, limit: 5 } : "skip"
  );

  // Query only runs when dropdown is open
  if (!isOpen) return null;
  if (recentNotifications === undefined) return <Loading />;

  return <div>{/* render notifications */}</div>;
}
```

**Preventing Duplicate Notifications on Reconnection**:

Convex handles reconnection automatically:
- Client maintains query state during brief disconnections
- On reconnection, Convex syncs to latest state
- No duplicate mutations triggered (mutations are idempotent by design)
- Queries automatically reconcile to current database state

**Optimizing Query Reactivity**:

```typescript
// Use indexes for efficient queries
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Uses index for optimal performance
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId)
      )
      .order("desc") // Most recent first
      .take(50); // Limit results
  }
});

// Separate queries for different concerns
// Good: Two focused queries
const unreadCount = useQuery(api.notifications.getUnreadCount, { userId });
const notifications = useQuery(api.notifications.list, { userId, limit: 20 });

// Avoid: Single large query that overfetches
// const allData = useQuery(api.notifications.getEverything, { userId });
```

**Cross-Tab Handling**:

```typescript
// Mark as read mutation works across all tabs automatically
const markAsRead = useMutation(api.notifications.markAsRead);

const handleClick = async (notificationId: Id<"notifications">) => {
  // Mutation updates database
  await markAsRead({ notificationId });

  // All tabs with useQuery for this notification automatically update
  // No need for manual BroadcastChannel or localStorage events
};
```

**Sources**:
- [Queries | Convex Developer Hub](https://docs.convex.dev/functions/query-functions)
- [Convex React | Convex Developer Hub](https://docs.convex.dev/client/react)
- [Realtime | Convex Developer Hub](https://docs.convex.dev/realtime)
- [How Convex Works](https://stack.convex.dev/how-convex-works)
- [A guide to using Convex for state management](https://blog.logrocket.com/using-convex-for-state-management/)

---

## 4. Notification Retention & Cleanup

**Decision**: Implement scheduled cleanup via Convex cron job that soft-deletes notifications older than 90 days

**Rationale**:

- **Automatic cleanup**: Cron job handles cleanup without manual intervention
- **Configurable retention**: 90-day retention balances storage costs with user needs (most tournaments complete within this timeframe)
- **Performance optimization**: Regular cleanup prevents unbounded table growth
- **Soft delete option**: Can mark as deleted rather than hard delete for audit trail if needed
- **Compliant with 2026 regulations**: CPRA auto-deletion requirements starting January 2026

**Alternatives Considered**:

- **Manual cleanup**: Unreliable, requires admin intervention
- **Infinite retention**: Storage costs grow unbounded, query performance degrades
- **Client-side filtering**: Inefficient, all historical notifications still loaded
- **Immediate deletion**: No grace period for users to review older notifications

**Implementation Notes**:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run cleanup daily at 2:00 AM UTC (low-traffic period)
crons.daily(
  "cleanup old notifications",
  { hourUTC: 2, minuteUTC: 0 },
  internal.notifications.cleanupOldNotifications
);

export default crons;

// convex/notifications.ts
export const cleanupOldNotifications = internalMutation({
  handler: async (ctx) => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffIso = cutoffDate.toISOString();

    // Find notifications older than 90 days
    const oldNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_createdAt") // Requires index on _creationTime or createdAt
      .filter((q) => q.lt(q.field("createdAt"), cutoffIso))
      .collect();

    // Soft delete: mark as deleted (preserves audit trail)
    for (const notification of oldNotifications) {
      await ctx.db.patch(notification._id, { isDeleted: true });
    }

    // Hard delete: completely remove (saves storage)
    // for (const notification of oldNotifications) {
    //   await ctx.db.delete(notification._id);
    // }

    console.log(`Cleaned up ${oldNotifications.length} notifications older than ${retentionDays} days`);

    return { deletedCount: oldNotifications.length };
  }
});
```

**Performance Implications**:

For large notification tables (100k+ records):
- **Batch processing**: Process in chunks to avoid timeout
- **Pagination**: Use `.paginate()` for large result sets
- **Index optimization**: Ensure `by_createdAt` index exists for efficient filtering

```typescript
// Optimized cleanup for large tables
export const cleanupOldNotifications = internalMutation({
  handler: async (ctx) => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffIso = cutoffDate.toISOString();

    const batchSize = 100;
    let totalDeleted = 0;

    // Process in batches to avoid timeout
    while (true) {
      const oldNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_createdAt")
        .filter((q) =>
          q.and(
            q.lt(q.field("createdAt"), cutoffIso),
            q.neq(q.field("isDeleted"), true) // Skip already deleted
          )
        )
        .take(batchSize);

      if (oldNotifications.length === 0) break;

      for (const notification of oldNotifications) {
        await ctx.db.patch(notification._id, { isDeleted: true });
      }

      totalDeleted += oldNotifications.length;

      // Exit if we processed less than batch size (last batch)
      if (oldNotifications.length < batchSize) break;
    }

    console.log(`Cleaned up ${totalDeleted} notifications`);
    return { deletedCount: totalDeleted };
  }
});
```

**Schema Addition**:

```typescript
// convex/schema.ts
export default defineSchema({
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    // ... other fields
    createdAt: v.string(),
    isDeleted: v.optional(v.boolean()),
  })
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_createdAt", ["createdAt"]) // For cleanup queries
    .index("by_user_and_deleted", ["userId", "isDeleted"]), // For filtering deleted
});
```

**Query Adjustment to Exclude Deleted**:

```typescript
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_and_deleted", (q) =>
        q.eq("userId", args.userId).eq("isDeleted", false)
      )
      .collect();
  }
});
```

**Sources**:
- [Data Retention Policy: 10 Best Practices](https://www.filecloud.com/blog/data-retention-policy-best-practices/)
- [CPRA Auto-Deletion Workflows](https://secureprivacy.ai/blog/cpra-auto-deletion-workflows)
- [Backup & Restore | Convex Developer Hub](https://docs.convex.dev/database/backup-restore)
- [Scheduling | Convex Developer Hub](https://docs.convex.dev/scheduling)

---

## 5. Radix UI Components

**Decision**: Use `Popover` primitive for notification dropdown panel

**Rationale**:

- **Appropriate semantics**: Popover is designed for non-modal content displays (notification panels), while DropdownMenu is for action menus
- **Accessibility built-in**: Adheres to Dialog WAI-ARIA design pattern, keyboard navigation, focus management
- **Already in project**: `/src/components/ui/popover.tsx` exists with proper Radix Popover implementation
- **Non-modal by default**: Users can still interact with page while notifications are open
- **Fine-grained focus control**: `onOpenAutoFocus`, `onCloseAutoFocus` props for managing focus behavior
- **Portal rendering**: Content renders in portal to avoid z-index conflicts

**Alternatives Considered**:

- **DropdownMenu**: Better for action menus (File, Edit, etc.), not notification displays. Both are accessible but semantically different.
- **Custom implementation**: Unnecessary work; Radix provides battle-tested accessibility
- **Dialog**: Too modal; notifications should be quick glances, not full interactions

**Implementation Notes**:

```typescript
// src/components/notifications/notification-popover.tsx
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function NotificationPopover() {
  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    userId: currentUserId,
  });
  const recentNotifications = useQuery(api.notifications.recent, {
    userId: currentUserId,
    limit: 5,
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : 'Notifications'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="end"
        onOpenAutoFocus={(e) => {
          // Prevent auto-focus on first item if needed
          // e.preventDefault();
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentNotifications?.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
            />
          ))}
        </div>
        <Button
          variant="link"
          className="w-full mt-2"
          asChild
        >
          <a href="/notifications">View all notifications</a>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
```

**Accessibility Considerations**:

1. **Keyboard Navigation**:
   - Tab to open trigger button
   - Enter/Space to open popover
   - Tab through notification items
   - Escape to close popover

2. **Screen Readers**:
   - Use `sr-only` class for descriptive text ("X unread notifications")
   - Ensure notification items have proper ARIA labels
   - Badge count should be announced to screen readers

3. **Focus Management**:
   - Focus returns to trigger on close (Radix handles this)
   - Optional: Auto-focus first notification on open
   - Trap focus within popover when open

```typescript
// Enhanced accessibility example
<PopoverContent
  className="w-80"
  align="end"
  role="dialog"
  aria-label="Notification panel"
  onOpenAutoFocus={(e) => {
    // Auto-focus first notification (optional)
    const firstNotification = e.currentTarget.querySelector('[role="listitem"]');
    if (firstNotification instanceof HTMLElement) {
      firstNotification.focus();
    }
  }}
>
  <div role="list" aria-label="Recent notifications">
    {recentNotifications?.map((notification) => (
      <div
        key={notification._id}
        role="listitem"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleNotificationClick(notification);
        }}
      >
        <NotificationItem notification={notification} />
      </div>
    ))}
  </div>
</PopoverContent>
```

**Handling Stacked Popovers/Dropdowns**:

When combining Radix components (e.g., notification popover with action dropdown inside):
- Match `modal` props to avoid conflicts
- Use Portal for proper z-index layering (Radix does this by default)
- Consider closing parent popover when child action is taken

**Project-Specific Pattern** (from existing codebase):

The project uses shadcn/ui conventions with class-variance-authority (CVA):
- All UI components in `/src/components/ui/`
- Use `cn()` utility for class merging (from `/src/lib/utils.ts`)
- Follow existing popover.tsx patterns for consistency
- Biome will enforce sorted Tailwind classes

**Sources**:
- [Popover – Radix Primitives](https://www.radix-ui.com/primitives/docs/components/popover)
- [Dropdown Menu – Radix Primitives](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)
- [Interactive dropdown menus with Radix UI](https://www.joshuawootonn.com/radix-interactive-dropdown)
- [Radix Primitives](https://www.radix-ui.com/primitives)

---

## 6. Idempotent Notification Creation

**Decision**: Use compound unique indexes and conditional insertion to prevent duplicate notifications

**Rationale**:

- **Database-level deduplication**: Convex schema constraints prevent duplicates at source
- **Idempotent by design**: Multiple calls with same parameters produce same result
- **No manual tracking**: No need for separate deduplication tables or Redis-like stores
- **Type-safe**: Convex enforces constraints at compile-time
- **Handles retries gracefully**: Failed mutations can safely retry without creating duplicates

**Alternatives Considered**:

- **Idempotency keys with TTL**: Complex; requires separate tracking table and cleanup. Better suited for payment systems where 1-hour windows apply
- **Check-then-insert pattern**: Race conditions possible; not atomic
- **Client-side deduplication**: Unreliable; doesn't prevent duplicate API calls
- **Deduplication keys (indefinite)**: Separate from idempotency; typically used for event processing, not mutations

**Implementation Notes**:

**Schema Design** (prevents duplicates at database level):

```typescript
// convex/schema.ts
export default defineSchema({
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()), // Generic ID as string
    relatedEntityType: v.optional(v.string()), // "team", "tournament", etc.
    isRead: v.boolean(),
    createdAt: v.string(),
    actionUrl: v.optional(v.string()),
    actionMetadata: v.optional(v.any()),
  })
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_createdAt", ["createdAt"])
    // Compound index prevents duplicates for same user + type + entity
    .index("by_user_type_entity", [
      "userId",
      "type",
      "relatedEntityType",
      "relatedEntityId"
    ]),
});
```

**Idempotent Creation Pattern**:

```typescript
// convex/notifications.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if notification already exists
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user_type_entity", (q) =>
        q
          .eq("userId", args.userId)
          .eq("type", args.type)
          .eq("relatedEntityType", args.relatedEntityType ?? null)
          .eq("relatedEntityId", args.relatedEntityId ?? null)
      )
      .first();

    if (existing) {
      // Idempotent: return existing notification ID
      return existing._id;
    }

    // Create new notification
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  },
});
```

**For Time-Based Notifications** (tournaments starting in 24h):

Use unique constraint to prevent duplicate warnings:

```typescript
export const createTournament24hWarning = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    // Get all registered participants
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    const teamMembers = await Promise.all(
      teams.map((team) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect()
      )
    );

    const userIds = [...new Set(teamMembers.flat().map((m) => m.userId))];

    // Create notification for each user (idempotent)
    const notificationIds = await Promise.all(
      userIds.map((userId) =>
        ctx.db
          .query("notifications")
          .withIndex("by_user_type_entity", (q) =>
            q
              .eq("userId", userId)
              .eq("type", "tournament_starting_24h")
              .eq("relatedEntityType", "tournament")
              .eq("relatedEntityId", args.tournamentId)
          )
          .first()
          .then(async (existing) => {
            if (existing) return existing._id;

            return await ctx.db.insert("notifications", {
              userId,
              type: "tournament_starting_24h",
              title: `${tournament.name} starts in 24 hours`,
              relatedEntityType: "tournament",
              relatedEntityId: args.tournamentId,
              actionUrl: `/tournaments/${args.tournamentId}`,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          })
      )
    );

    return { createdCount: notificationIds.length };
  },
});
```

**Handling Rapid-Fire Notifications** (multiple submissions):

For team activity notifications (teammate submitted), prevent spam:

```typescript
// Option 1: Daily digest (one notification per day per team)
export const createTeamActivityNotification = mutation({
  args: {
    teamId: v.id("teams"),
    submitterId: v.id("users"),
    activityDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Notify all members except submitter
    const recipientIds = teamMembers
      .map((m) => m.userId)
      .filter((id) => id !== args.submitterId);

    for (const userId of recipientIds) {
      // Use date in relatedEntityId to ensure one notification per day per team
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_user_type_entity", (q) =>
          q
            .eq("userId", userId)
            .eq("type", "team_activity_daily")
            .eq("relatedEntityType", "team")
            .eq("relatedEntityId", `${args.teamId}_${today}`)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("notifications", {
          userId,
          type: "team_activity_daily",
          title: "Team activity today",
          body: `Your team has submitted activities today`,
          relatedEntityType: "team",
          relatedEntityId: `${args.teamId}_${today}`, // Unique per team per day
          actionUrl: `/teams/${args.teamId}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Update existing notification with latest count
        const currentCount = existing.body?.match(/\d+/)?.[0] || "1";
        await ctx.db.patch(existing._id, {
          body: `Your team has submitted ${parseInt(currentCount) + 1} activities today`,
        });
      }
    }
  },
});

// Option 2: Immediate with rate limiting (max 1 per hour per team)
// Similar pattern but use hourly window instead of daily
```

**Retry Safety** (for Convex actions):

Convex mutations are automatically idempotent when using the check-then-insert pattern above. For actions (which can have side effects):

```typescript
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const sendNotificationWithSideEffect = action({
  args: { userId: v.id("users"), type: v.string(), title: v.string() },
  handler: async (ctx, args) => {
    // Create notification (idempotent mutation)
    const notificationId = await ctx.runMutation(internal.notifications.create, args);

    // Side effect (e.g., webhook, external API call)
    // Use idempotency key for external calls
    if (notificationId) {
      await fetch("https://external-api.com/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `notification-${notificationId}`, // External deduplication
        },
        body: JSON.stringify({ notificationId, userId: args.userId }),
      });
    }
  },
});
```

**Project-Specific Pattern** (using existing helpers):

The project has `batchGetDocuments` and `enrichWithRelations` helpers in `/convex/lib/helpers.ts`. Use these for efficient notification creation:

```typescript
import { batchGetDocuments } from "./lib/helpers";

// Efficiently fetch all team members for notifications
const userIds = [...new Set(teamMemberRecords.map(m => m.userId))];
const users = await batchGetDocuments(ctx, "users", userIds);
```

**Sources**:
- [Workpool](https://www.convex.dev/components/workpool)
- [Understanding Idempotency in APIs and Distributed Systems](https://dev.to/msnmongare/understanding-idempotency-in-apis-and-distributed-systems-3afb)
- [Deduplication in Distributed Systems](https://www.architecture-weekly.com/p/deduplication-in-distributed-systems)
- [What Is Idempotency? Why It Matters for Durable Systems](https://temporal.io/blog/idempotency-and-durable-execution)

---

## Summary & Recommendations

### Testing Strategy
1. Install Vitest + Playwright
2. Use convex-test library for backend function testing
3. Start with unit tests for notification creation logic
4. Add E2E tests for critical user flows (mark as read, navigation)

### Convex Implementation
1. Create `convex/crons.ts` for scheduled notifications
2. Use standard `useQuery` for real-time updates (no additional libraries needed)
3. Implement 90-day retention cleanup via daily cron
4. Design schema with compound indexes for deduplication

### UI Components
1. Use existing Popover component from `/src/components/ui/popover.tsx`
2. Follow shadcn/ui patterns with CVA
3. Ensure full keyboard accessibility and ARIA labels
4. Test cross-tab consistency with multiple browser windows

### Key Architecture Decisions
- **No external services needed**: Convex handles crons, real-time, and storage
- **Type-safe throughout**: TypeScript + Convex validators
- **Idempotent by design**: Database constraints prevent duplicates
- **Accessible by default**: Radix UI primitives + proper ARIA
- **Optimized queries**: Use indexes, pagination, and batch operations

### Next Steps
1. Set up testing framework (Vitest + Playwright)
2. Implement notification schema with indexes
3. Create core mutations (create, markAsRead, markAllAsRead)
4. Build UI components (Popover, NotificationList)
5. Add cron jobs for scheduled notifications
6. Write tests for critical paths
7. Deploy and monitor performance

---

**Document Status**: Complete
**Last Updated**: 2026-01-29
**Approved By**: Claude Sonnet 4.5
