# Notification Actions API Contract

**Version**: 1.0.0
**Last Updated**: 2026-01-29

This document specifies scheduled actions and internal mutations for automated notification delivery. These functions are triggered by Convex cron jobs and are not exposed to clients.

---

## `cleanupOldNotifications` - Delete Old Notifications

Scheduled job that soft-deletes notifications older than 90 days to prevent unbounded database growth.

### Function Signature

```typescript
export const cleanupOldNotifications = internalMutation({
  args: {},
  handler: async (ctx) => { /* ... */ }
});
```

### Cron Schedule

```typescript
// convex/crons.ts
crons.daily(
  "cleanup old notifications",
  { hourUTC: 2, minuteUTC: 0 }, // 2:00 AM UTC daily
  internal.notifications.cleanupOldNotifications
);
```

### Input Parameters

None. This mutation takes no arguments.

### Output Format

Returns the count of notifications that were soft-deleted.

```typescript
type CleanupOutput = { deletedCount: number };
```

### Cleanup Logic

1. Calculate cutoff date: `currentDate - 90 days`
2. Query all notifications where `createdAt < cutoffDate` and `isDeleted != true`
3. For each notification, set `isDeleted: true`
4. Process in batches of 100 to avoid timeout for large datasets
5. Log cleanup results for monitoring

### Performance Considerations

- Uses `by_createdAt` index for efficient date-based filtering
- Batch processing (100 notifications per batch) prevents timeout
- Soft delete (patch) instead of hard delete (remove) for audit trail
- Excludes already-deleted notifications from processing
- Runs during low-traffic period (2:00 AM UTC)

### Example Implementation

```typescript
export const cleanupOldNotifications = internalMutation({
  args: {},
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
            q.neq(q.field("isDeleted"), true)
          )
        )
        .take(batchSize);

      if (oldNotifications.length === 0) break;

      // Soft delete all notifications in batch
      await Promise.all(
        oldNotifications.map(notification =>
          ctx.db.patch(notification._id, { isDeleted: true })
        )
      );

      totalDeleted += oldNotifications.length;

      // Exit if we processed less than batch size (last batch)
      if (oldNotifications.length < batchSize) break;
    }

    console.log(`Cleaned up ${totalDeleted} notifications older than ${retentionDays} days`);

    return { deletedCount: totalDeleted };
  }
});
```

### Monitoring & Alerts

- Log `deletedCount` for each run
- Alert if `deletedCount > 10,000` (indicates potential bulk notification issue)
- Monitor execution time; should complete in < 30 seconds for typical datasets
- Track retention compliance for CPRA/GDPR requirements

---

## `checkTournament24hWarnings` - Send 24-Hour Tournament Warnings

Scheduled job that checks for tournaments starting in approximately 24 hours and notifies registered participants.

### Function Signature

```typescript
export const checkTournament24hWarnings = internalMutation({
  args: {},
  handler: async (ctx) => { /* ... */ }
});
```

### Cron Schedule

```typescript
// convex/crons.ts
crons.hourly(
  "tournament 24h warnings",
  { minuteUTC: 0 }, // Every hour at :00
  internal.notifications.checkTournament24hWarnings
);
```

### Input Parameters

None. This mutation queries tournaments autonomously.

### Output Format

Returns the count of notifications sent.

```typescript
type Tournament24hWarningsOutput = { notificationsSent: number };
```

### Warning Logic

1. Calculate time window: `now + 23 hours` to `now + 25 hours`
2. Query tournaments where `startDate` falls in time window
3. For each tournament:
   - Get all teams in tournament
   - Get all team members (unique users)
   - Create idempotent notification for each user
4. Return total count of notifications created

### Idempotency Handling

Uses unique `relatedEntityId` pattern to prevent duplicate warnings:
- `relatedEntityId`: `${tournamentId}_${startDate}`
- If notification already exists for this combination, skip creation
- Allows cron to run hourly without creating duplicate notifications

### Performance Considerations

- Uses tournament `by_name` index and date filtering
- Batch fetches all teams and members with `Promise.all()`
- Idempotency check uses `by_user_type_entity` index
- Runs hourly to ensure warnings sent within 5-minute SLA (Success Criteria SC-009)

### Example Implementation

```typescript
export const checkTournament24hWarnings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // +23 hours
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);   // +25 hours

    const allTournaments = await ctx.db.query("tournaments").collect();

    const tournamentsStartingSoon = allTournaments.filter(tournament => {
      const startDate = new Date(tournament.startDate);
      return startDate >= windowStart && startDate <= windowEnd;
    });

    let notificationsSent = 0;

    for (const tournament of tournamentsStartingSoon) {
      // Get all teams in tournament
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
        .collect();

      // Get all team members
      const teamMemberPromises = teams.map(team =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect()
      );
      const teamMembersNested = await Promise.all(teamMemberPromises);
      const teamMembers = teamMembersNested.flat();

      // Get unique user IDs
      const userIds = [...new Set(teamMembers.map(m => m.userId))];

      // Create notifications (idempotent)
      const notificationPromises = userIds.map(userId =>
        ctx.runMutation(internal.notifications.create, {
          userId,
          type: "tournament_starting_24h",
          title: `${tournament.name} starts in 24 hours`,
          body: "Don't forget to check your team's schedule and prepare for the tournament!",
          relatedEntityId: `${tournament._id}_${tournament.startDate}`,
          relatedEntityType: "tournament",
          actionUrl: `/tournaments/${tournament._id}`,
        })
      );

      await Promise.all(notificationPromises);
      notificationsSent += userIds.length;
    }

    console.log(`Sent ${notificationsSent} tournament 24h warning notifications`);

    return { notificationsSent };
  }
});
```

### Edge Cases

- Tournament with no teams: No notifications sent (expected)
- Tournament start date changed after warning sent: Duplicate warning may occur with new date
- User removed from team after warning sent: Harmless (user still sees notification)
- Tournament deleted before start: Users still have notification (graceful degradation)

---

## `sendDailyDigest` - Send Daily Digest Notifications

Scheduled job that aggregates pending items (pending submissions, unapproved join requests, flagged content) and sends one notification per user with pending actions.

### Function Signature

```typescript
export const sendDailyDigest = internalMutation({
  args: {},
  handler: async (ctx) => { /* ... */ }
});
```

### Cron Schedule

```typescript
// convex/crons.ts
crons.daily(
  "send daily digest",
  { hourUTC: 9, minuteUTC: 0 }, // 9:00 AM UTC daily
  internal.notifications.sendDailyDigest
);
```

### Input Parameters

None. This mutation autonomously queries pending items.

### Output Format

Returns the count of digest notifications sent.

```typescript
type DailyDigestOutput = { digestsSent: number };
```

### Digest Logic

1. Query all users with elevated roles (admin, reviewer, tournament_manager, team captains)
2. For each user, count pending items:
   - **Admins**: Pending submissions awaiting approval
   - **Reviewers**: Flagged submissions requiring review
   - **Tournament Managers**: Pending join requests, flagged submissions in managed tournaments
   - **Team Captains**: Pending join requests for their teams, pending invitations
3. If `totalPendingItems > 0`, create digest notification
4. If `totalPendingItems === 0`, skip user (FR-025)

### Notification Content

```typescript
{
  type: "pending_items_digest",
  title: `${totalPendingItems} items require your attention`,
  body: `
    - ${pendingSubmissions} submissions awaiting approval
    - ${pendingJoinRequests} team join requests
    - ${flaggedSubmissions} flagged submissions
  `.trim(),
  actionUrl: "/dashboard",
}
```

### Performance Considerations

- Uses role indexes (`by_user` on `userRoles`) to find users with elevated permissions
- Batch queries for pending items with `Promise.all()`
- Skips users with zero pending items to reduce notification noise
- Runs once per day at fixed time (9:00 AM UTC)

### Example Implementation

```typescript
export const sendDailyDigest = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all users with roles (admins, reviewers, tournament managers)
    const userRoles = await ctx.db.query("userRoles").collect();
    const rolesMap = new Map<Id<"users">, string[]>();

    for (const userRole of userRoles) {
      const role = await ctx.db.get(userRole.roleId);
      if (!role) continue;

      const existingRoles = rolesMap.get(userRole.userId) || [];
      rolesMap.set(userRole.userId, [...existingRoles, role.name]);
    }

    // Get all team captains
    const teamMembers = await ctx.db.query("teamMembers").collect();
    const captains = teamMembers
      .filter(m => m.role === "captain")
      .map(m => m.userId);

    // Combine all users with responsibilities
    const usersWithResponsibilities = [
      ...new Set([...rolesMap.keys(), ...captains])
    ];

    let digestsSent = 0;

    for (const userId of usersWithResponsibilities) {
      const roles = rolesMap.get(userId) || [];
      const isCaptain = captains.includes(userId);

      let pendingItems = {
        submissions: 0,
        joinRequests: 0,
        flaggedSubmissions: 0,
      };

      // Count pending submissions (admins only)
      if (roles.includes("admin")) {
        const pendingSubmissions = await ctx.db
          .query("submissions")
          .withIndex("by_state", (q) => q.eq("state", "pending"))
          .collect();
        pendingItems.submissions = pendingSubmissions.length;
      }

      // Count pending join requests (captains)
      if (isCaptain) {
        const captainTeams = teamMembers
          .filter(m => m.userId === userId && m.role === "captain")
          .map(m => m.teamId);

        const joinRequestPromises = captainTeams.map(teamId =>
          ctx.db
            .query("joinRequests")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect()
        );
        const joinRequestsNested = await Promise.all(joinRequestPromises);
        pendingItems.joinRequests = joinRequestsNested.flat().length;
      }

      // Count flagged submissions (reviewers)
      if (roles.includes("reviewer")) {
        // Note: Requires flagging feature implementation
        // Placeholder for now
        pendingItems.flaggedSubmissions = 0;
      }

      const totalPendingItems =
        pendingItems.submissions +
        pendingItems.joinRequests +
        pendingItems.flaggedSubmissions;

      // Only send digest if user has pending items (FR-025)
      if (totalPendingItems === 0) continue;

      const bodyParts = [];
      if (pendingItems.submissions > 0) {
        bodyParts.push(`${pendingItems.submissions} submission${pendingItems.submissions > 1 ? 's' : ''} awaiting approval`);
      }
      if (pendingItems.joinRequests > 0) {
        bodyParts.push(`${pendingItems.joinRequests} team join request${pendingItems.joinRequests > 1 ? 's' : ''}`);
      }
      if (pendingItems.flaggedSubmissions > 0) {
        bodyParts.push(`${pendingItems.flaggedSubmissions} flagged submission${pendingItems.flaggedSubmissions > 1 ? 's' : ''}`);
      }

      await ctx.runMutation(internal.notifications.create, {
        userId,
        type: "pending_items_digest",
        title: `${totalPendingItems} item${totalPendingItems > 1 ? 's' : ''} require your attention`,
        body: bodyParts.join('\n'),
        actionUrl: "/dashboard",
        relatedEntityType: "user",
        relatedEntityId: userId,
      });

      digestsSent++;
    }

    console.log(`Sent ${digestsSent} daily digest notifications`);

    return { digestsSent };
  }
});
```

### Timezone Considerations

Current implementation sends at fixed UTC time (9:00 AM UTC). For user-local time delivery:

1. Add `timezone` field to user profile (e.g., `"America/New_York"`)
2. Run cron every hour
3. Filter users where local time is 9:00 AM
4. Use `date-fns-tz` for timezone conversions

```typescript
import { utcToZonedTime } from 'date-fns-tz';

const currentUtcHour = new Date().getUTCHours();

for (const userId of usersWithResponsibilities) {
  const user = await ctx.db.get(userId);
  const userTimezone = user?.timezone || 'UTC';
  const userLocalTime = utcToZonedTime(new Date(), userTimezone);
  const userLocalHour = userLocalTime.getHours();

  // Send digest if it's 9 AM in user's timezone
  if (userLocalHour !== 9) continue;

  // ... send digest logic ...
}
```

---

## `checkTournamentStarted` - Notify Tournament Started

Scheduled job that checks for tournaments that have just started and notifies all participants.

### Function Signature

```typescript
export const checkTournamentStarted = internalMutation({
  args: {},
  handler: async (ctx) => { /* ... */ }
});
```

### Cron Schedule

```typescript
// convex/crons.ts
crons.hourly(
  "tournament started notifications",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentStarted
);
```

### Logic

Similar to `checkTournament24hWarnings` but checks for tournaments where:
- `startDate <= now`
- `startDate >= now - 1 hour`

Creates `tournament_started` notifications for all participants.

---

## `checkTournamentEnding24h` - Notify Tournament Ending Soon

Scheduled job for tournaments ending in 24 hours.

### Cron Schedule

```typescript
crons.hourly(
  "tournament ending 24h warnings",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentEnding24h
);
```

### Logic

Checks for tournaments where `endDate` is in 23-25 hour window. Creates `tournament_ending_24h` notifications.

---

## `checkTournamentEnded` - Notify Tournament Ended

Scheduled job for tournaments that have just ended.

### Cron Schedule

```typescript
crons.hourly(
  "tournament ended notifications",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentEnded
);
```

### Logic

Checks for tournaments where:
- `endDate <= now`
- `endDate >= now - 1 hour`

Creates `tournament_ended` notifications for all participants.

---

## Cron Job Configuration File

Complete `convex/crons.ts` configuration:

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

// Cleanup old notifications at 2:00 AM UTC
crons.daily(
  "cleanup old notifications",
  { hourUTC: 2, minuteUTC: 0 },
  internal.notifications.cleanupOldNotifications
);

// Tournament notifications - run hourly
crons.hourly(
  "tournament 24h start warnings",
  { minuteUTC: 0 },
  internal.notifications.checkTournament24hWarnings
);

crons.hourly(
  "tournament started notifications",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentStarted
);

crons.hourly(
  "tournament ending 24h warnings",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentEnding24h
);

crons.hourly(
  "tournament ended notifications",
  { minuteUTC: 0 },
  internal.notifications.checkTournamentEnded
);

export default crons;
```

---

## Monitoring & Observability

All scheduled jobs should log:
- Execution start time
- Number of items processed
- Execution duration
- Any errors encountered

Example logging pattern:

```typescript
const startTime = Date.now();
console.log(`[checkTournament24hWarnings] Starting execution`);

// ... job logic ...

const duration = Date.now() - startTime;
console.log(`[checkTournament24hWarnings] Completed in ${duration}ms. Sent ${notificationsSent} notifications`);
```

---

## Error Handling

Scheduled jobs should handle errors gracefully:

```typescript
export const checkTournament24hWarnings = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      // ... job logic ...
      return { notificationsSent };
    } catch (error) {
      console.error("[checkTournament24hWarnings] Error:", error);
      // Don't throw - allow cron to continue on next run
      return { notificationsSent: 0, error: String(error) };
    }
  }
});
```

---

## Testing Scheduled Jobs

Use Convex dashboard to manually trigger cron jobs for testing:

1. Navigate to Convex Dashboard → Functions → Cron Jobs
2. Click "Run Now" on any scheduled job
3. View logs and output in real-time
4. Verify notifications created in database

For automated testing with Vitest:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

test("daily digest sends notifications to users with pending items", async () => {
  const t = convexTest(schema);

  // Create test data: user with pending submission
  const userId = await t.run(async (ctx) => {
    const user = await ctx.db.insert("users", {
      email: "admin@test.com",
      name: "Admin",
      externalId: "test123",
    });

    // Assign admin role
    const adminRole = await ctx.db.insert("roles", {
      name: "admin",
      displayName: "Admin",
      hierarchy: 100,
    });

    await ctx.db.insert("userRoles", {
      userId: user,
      roleId: adminRole,
    });

    return user;
  });

  // Create pending submission
  await t.run(async (ctx) => {
    await ctx.db.insert("submissions", {
      userId,
      teamId: /* ... */,
      tournamentId: /* ... */,
      state: "pending",
      // ... other fields
    });
  });

  // Run daily digest
  const result = await t.mutation(internal.notifications.sendDailyDigest, {});

  expect(result.digestsSent).toBe(1);

  // Verify notification created
  const notifications = await t.run(async (ctx) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_and_deleted", (q) => q.eq("userId", userId))
      .collect();
  });

  expect(notifications).toHaveLength(1);
  expect(notifications[0].type).toBe("pending_items_digest");
});
```
