# Feature Specification: UTC Date Migration with User-Configurable Formatting

## Executive Summary

This specification outlines the migration of the Urban Legends application to use UTC ISO format dates consistently throughout the backend while introducing user-configurable date formatting preferences on the frontend. This change will improve data consistency, eliminate timezone-related bugs, and provide a better user experience through personalized date display formats.

**Primary Benefits:**
- Consistent date storage across all Convex tables (UTC ISO format)
- Eliminates timezone ambiguity in date comparisons and queries
- User-friendly date display through configurable formatting preferences
- Improved data integrity and query performance

**Expected Complexity:** Large (2-3 weeks)
- Backend migration: 3-5 days
- Frontend utilities and updates: 5-7 days
- Settings UI and testing: 3-4 days
- QA and edge case handling: 2-3 days

---

## 1. Current State Analysis

### Database Schema - Date Fields Identified

Based on analysis of `/convex/schema.ts`, the following date fields exist:

**tournaments table:**
- `startDate: v.string()` - Tournament start date
- `endDate: v.string()` - Tournament end date
- `completedAt: v.optional(v.string())` - Tournament completion timestamp

**teams table:**
- `lastActivityAt: v.optional(v.string())` - Last activity timestamp

**userRoles table:**
- `assignedAt: v.optional(v.string())` - Role assignment timestamp

**submissions table:**
- `date: v.string()` - Submission date (YYYY-MM-DD format)

**submissionGroups table:**
- `date: v.string()` - Group date (YYYY-MM-DD format)
- `createdAt: v.string()` - Group creation timestamp
- `updatedAt: v.string()` - Last update timestamp

**teamInvitations table:**
- `expiresAt: v.string()` - Invitation expiry date (ISO format)
- `createdAt: v.string()` - Creation timestamp
- `respondedAt: v.optional(v.string())` - Response timestamp

**joinRequests table:**
- `createdAt: v.string()` - Request creation timestamp
- `respondedAt: v.optional(v.string())` - Response timestamp

### Current Date Storage Patterns

**Backend (Convex):**
1. **ISO Timestamps:** Most timestamps use `new Date().toISOString()` (e.g., `createdAt`, `updatedAt`, `expiresAt`)
2. **Date-only strings:** Submission dates use YYYY-MM-DD format (e.g., `"2025-11-18"`)
3. **Date comparisons:** Use string comparison with ISO format (works correctly for UTC)

**Frontend (React/Next.js):**
1. **Display format:** Uses `toLocaleDateString()` without locale/format specification
2. **Date pickers:** HTML5 date inputs return YYYY-MM-DD format
3. **No centralized formatting:** Date formatting is scattered across components
4. **Inconsistent display:** Different components may show dates differently based on browser locale

### Current Issues and Inconsistencies

1. **Mixed date formats:** Timestamps (ISO) vs date-only strings (YYYY-MM-DD)
2. **Timezone ambiguity:** Date-only strings don't specify timezone, can cause off-by-one errors
3. **Inconsistent display:** Users see dates formatted based on browser locale, not preference
4. **No user control:** Users cannot choose their preferred date format
5. **Localization gaps:** `toLocaleDateString()` without parameters uses system locale, not app preference

---

## 2. Feature Requirements

### Functional Requirements

#### FR1: Backend Date Standardization
- **FR1.1:** ALL date fields in Convex schema must store dates as UTC ISO 8601 strings
- **FR1.2:** Date-only fields (submission dates) must store UTC midnight (e.g., `"2025-11-18T00:00:00.000Z"`)
- **FR1.3:** Timestamp fields must store full UTC timestamp (e.g., `"2025-11-18T14:32:15.123Z"`)
- **FR1.4:** Date comparison queries must continue to work correctly after migration
- **FR1.5:** Date range queries must handle UTC boundaries correctly

#### FR2: User Date Format Preferences
- **FR2.1:** Users can select their preferred date format from a predefined list
- **FR2.2:** Default format is "MM/dd/yyyy" (US format)
- **FR2.3:** Supported formats:
  - `"MM/dd/yyyy"` - US format (11/18/2025)
  - `"dd/MM/yyyy"` - European format (18/11/2025)
  - `"yyyy-MM-dd"` - ISO format (2025-11-18)
  - `"dd MMM yyyy"` - Medium format (18 Nov 2025)
  - `"MMM dd, yyyy"` - US long format (Nov 18, 2025)
  - `"dd MMMM yyyy"` - Long format (18 November 2025)
- **FR2.4:** Format preference is stored in user profile (new field in users table)
- **FR2.5:** Format preference persists across sessions and devices

#### FR3: Frontend Date Formatting
- **FR3.1:** All date displays must respect user's format preference
- **FR3.2:** Dates must be displayed in user's local timezone by default
- **FR3.3:** Date pickers must send UTC ISO format to backend
- **FR3.4:** Date inputs must display in user's preferred format but accept flexible input
- **FR3.5:** Relative dates (e.g., "2 days ago") can be used for recent timestamps

#### FR4: Settings UI
- **FR4.1:** Settings page has a "Date Format" section
- **FR4.2:** Dropdown selector shows all available formats with live preview
- **FR4.3:** Preview shows current date in each format before selection
- **FR4.4:** Change applies immediately without page reload
- **FR4.5:** Success feedback when preference is saved

#### FR5: Migration Safety
- **FR5.1:** Migration must be backward compatible (read old and new formats)
- **FR5.2:** Data integrity checks before and after migration
- **FR5.3:** Rollback plan must be documented and tested
- **FR5.4:** No data loss during migration
- **FR5.5:** Migration can be run multiple times safely (idempotent)

### Non-Functional Requirements

#### NFR1: Performance
- Date formatting utilities must not cause noticeable UI lag
- Date queries must maintain current performance (indexed fields)
- User preference lookup should be cached on frontend
- Migration script should process in batches to avoid timeouts

#### NFR2: Security
- Date format preference is user-specific (no shared preferences)
- Malicious date strings are validated before storage
- XSS prevention in date display (already handled by React)

#### NFR3: Accessibility
- Date format selector is keyboard navigable
- Screen readers announce selected format and preview
- Date displays include semantic HTML (time elements with datetime attribute)

#### NFR4: Browser Compatibility
- Date formatting works in all modern browsers
- Graceful fallback if Intl.DateTimeFormat is unavailable
- Date pickers work consistently across browsers

---

## 3. Technical Design

### Database Schema Changes

#### Add `dateFormat` field to users table

```typescript
// convex/schema.ts
users: defineTable({
  email: v.string(),
  name: v.string(),
  externalId: v.string(),
  dateFormat: v.optional(v.string()), // NEW: User's preferred date format
  weekStartsOn: v.optional(v.number()), // FUTURE: Move from localStorage
})
  .index("by_external_id", ["externalId"])
  .index("by_email", ["email"]),
```

**Migration strategy for users table:**
- Add `dateFormat` as optional field (default: undefined)
- Frontend uses "MM/dd/yyyy" if `dateFormat` is undefined
- Users can set preference in settings page
- No data migration needed (field is optional)

#### Normalize Date Field Comments

Update schema comments to clarify UTC ISO format:

```typescript
tournaments: defineTable({
  // ...
  startDate: v.string(), // UTC ISO format: "2025-11-18T00:00:00.000Z"
  endDate: v.string(),   // UTC ISO format: "2025-11-18T23:59:59.999Z"
  completedAt: v.optional(v.string()), // UTC ISO timestamp
  // ...
})

submissions: defineTable({
  // ...
  date: v.string(), // UTC ISO date at midnight: "2025-11-18T00:00:00.000Z"
  // ...
})
```

### Backend API Design

#### New Utility Functions (convex/lib/dates.ts)

```typescript
/**
 * Date utility functions for consistent UTC handling
 */

/**
 * Converts a date-only string (YYYY-MM-DD) or Date object to UTC ISO string at midnight.
 * @param dateInput - Date string (YYYY-MM-DD) or Date object
 * @returns UTC ISO string at midnight (e.g., "2025-11-18T00:00:00.000Z")
 */
export function toUTCDateString(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  ));
  return utcDate.toISOString();
}

/**
 * Converts a date-only string (YYYY-MM-DD) to UTC ISO string at end of day.
 * @param dateInput - Date string (YYYY-MM-DD) or Date object
 * @returns UTC ISO string at 23:59:59.999 (e.g., "2025-11-18T23:59:59.999Z")
 */
export function toUTCEndOfDayString(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23, 59, 59, 999
  ));
  return utcDate.toISOString();
}

/**
 * Gets current timestamp as UTC ISO string.
 * @returns UTC ISO timestamp (e.g., "2025-11-18T14:32:15.123Z")
 */
export function nowUTC(): string {
  return new Date().toISOString();
}

/**
 * Extracts date portion from UTC ISO string (YYYY-MM-DD).
 * @param isoString - UTC ISO string
 * @returns Date portion (YYYY-MM-DD)
 */
export function extractDateFromISO(isoString: string): string {
  return isoString.split("T")[0];
}

/**
 * Compares two UTC date strings (ignores time portion).
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareDatesOnly(a: string, b: string): number {
  const dateA = extractDateFromISO(a);
  const dateB = extractDateFromISO(b);
  return dateA.localeCompare(dateB);
}

/**
 * Checks if a UTC ISO string represents today (in user's timezone).
 * @param isoString - UTC ISO string
 * @param timezone - User's timezone (e.g., "America/New_York")
 * @returns true if date is today in user's timezone
 */
export function isToday(isoString: string, timezone?: string): boolean {
  const date = new Date(isoString);
  const now = new Date();

  // If timezone provided, use Intl.DateTimeFormat
  if (timezone) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const dateStr = formatter.format(date);
    const nowStr = formatter.format(now);
    return dateStr === nowStr;
  }

  // Otherwise use local timezone
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
```

#### Migration Functions (convex/migrations.ts)

```typescript
import { internalMutation } from "./_generated/server";
import { toUTCDateString, toUTCEndOfDayString, nowUTC } from "./lib/dates";

/**
 * Migrates all date fields to UTC ISO format.
 * This migration is idempotent - can be run multiple times safely.
 */
export const migrateDatesToUTC = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting date migration to UTC ISO format...");

    const stats = {
      tournaments: { updated: 0, skipped: 0, errors: 0 },
      submissions: { updated: 0, skipped: 0, errors: 0 },
      submissionGroups: { updated: 0, skipped: 0, errors: 0 },
      teamInvitations: { updated: 0, skipped: 0, errors: 0 },
      joinRequests: { updated: 0, skipped: 0, errors: 0 },
      teams: { updated: 0, skipped: 0, errors: 0 },
      userRoles: { updated: 0, skipped: 0, errors: 0 },
    };

    // Migrate tournaments
    const tournaments = await ctx.db.query("tournaments").collect();
    for (const tournament of tournaments) {
      try {
        // Check if already migrated (has 'T' in date string)
        const needsMigration =
          !tournament.startDate.includes("T") ||
          !tournament.endDate.includes("T");

        if (!needsMigration) {
          stats.tournaments.skipped++;
          continue;
        }

        await ctx.db.patch(tournament._id, {
          startDate: toUTCDateString(tournament.startDate),
          endDate: toUTCEndOfDayString(tournament.endDate),
          ...(tournament.completedAt && !tournament.completedAt.includes("T")
            ? { completedAt: toUTCDateString(tournament.completedAt) }
            : {}),
        });
        stats.tournaments.updated++;
      } catch (error) {
        console.error(`Error migrating tournament ${tournament._id}:`, error);
        stats.tournaments.errors++;
      }
    }

    // Migrate submissions
    const submissions = await ctx.db.query("submissions").collect();
    for (const submission of submissions) {
      try {
        if (submission.date.includes("T")) {
          stats.submissions.skipped++;
          continue;
        }

        await ctx.db.patch(submission._id, {
          date: toUTCDateString(submission.date),
        });
        stats.submissions.updated++;
      } catch (error) {
        console.error(`Error migrating submission ${submission._id}:`, error);
        stats.submissions.errors++;
      }
    }

    // Migrate submissionGroups
    const groups = await ctx.db.query("submissionGroups").collect();
    for (const group of groups) {
      try {
        const needsMigration =
          !group.date.includes("T") ||
          !group.createdAt.includes("T") ||
          !group.updatedAt.includes("T");

        if (!needsMigration) {
          stats.submissionGroups.skipped++;
          continue;
        }

        await ctx.db.patch(group._id, {
          date: toUTCDateString(group.date),
          createdAt: group.createdAt.includes("T")
            ? group.createdAt
            : toUTCDateString(group.createdAt),
          updatedAt: group.updatedAt.includes("T")
            ? group.updatedAt
            : nowUTC(),
        });
        stats.submissionGroups.updated++;
      } catch (error) {
        console.error(`Error migrating submissionGroup ${group._id}:`, error);
        stats.submissionGroups.errors++;
      }
    }

    // Migrate teamInvitations (likely already UTC, but verify)
    const invitations = await ctx.db.query("teamInvitations").collect();
    for (const invitation of invitations) {
      try {
        const needsMigration =
          !invitation.expiresAt.includes("T") ||
          !invitation.createdAt.includes("T") ||
          (invitation.respondedAt && !invitation.respondedAt.includes("T"));

        if (!needsMigration) {
          stats.teamInvitations.skipped++;
          continue;
        }

        await ctx.db.patch(invitation._id, {
          expiresAt: invitation.expiresAt.includes("T")
            ? invitation.expiresAt
            : toUTCDateString(invitation.expiresAt),
          createdAt: invitation.createdAt.includes("T")
            ? invitation.createdAt
            : toUTCDateString(invitation.createdAt),
          ...(invitation.respondedAt && !invitation.respondedAt.includes("T")
            ? { respondedAt: toUTCDateString(invitation.respondedAt) }
            : {}),
        });
        stats.teamInvitations.updated++;
      } catch (error) {
        console.error(`Error migrating invitation ${invitation._id}:`, error);
        stats.teamInvitations.errors++;
      }
    }

    // Migrate joinRequests
    const requests = await ctx.db.query("joinRequests").collect();
    for (const request of requests) {
      try {
        const needsMigration =
          !request.createdAt.includes("T") ||
          (request.respondedAt && !request.respondedAt.includes("T"));

        if (!needsMigration) {
          stats.joinRequests.skipped++;
          continue;
        }

        await ctx.db.patch(request._id, {
          createdAt: request.createdAt.includes("T")
            ? request.createdAt
            : toUTCDateString(request.createdAt),
          ...(request.respondedAt && !request.respondedAt.includes("T")
            ? { respondedAt: toUTCDateString(request.respondedAt) }
            : {}),
        });
        stats.joinRequests.updated++;
      } catch (error) {
        console.error(`Error migrating joinRequest ${request._id}:`, error);
        stats.joinRequests.errors++;
      }
    }

    // Migrate teams (lastActivityAt)
    const teams = await ctx.db.query("teams").collect();
    for (const team of teams) {
      try {
        if (!team.lastActivityAt || team.lastActivityAt.includes("T")) {
          stats.teams.skipped++;
          continue;
        }

        await ctx.db.patch(team._id, {
          lastActivityAt: toUTCDateString(team.lastActivityAt),
        });
        stats.teams.updated++;
      } catch (error) {
        console.error(`Error migrating team ${team._id}:`, error);
        stats.teams.errors++;
      }
    }

    // Migrate userRoles (assignedAt)
    const userRoles = await ctx.db.query("userRoles").collect();
    for (const userRole of userRoles) {
      try {
        if (!userRole.assignedAt || userRole.assignedAt.includes("T")) {
          stats.userRoles.skipped++;
          continue;
        }

        await ctx.db.patch(userRole._id, {
          assignedAt: toUTCDateString(userRole.assignedAt),
        });
        stats.userRoles.updated++;
      } catch (error) {
        console.error(`Error migrating userRole ${userRole._id}:`, error);
        stats.userRoles.errors++;
      }
    }

    console.log("Migration complete:", stats);
    return stats;
  },
});

/**
 * Validates that all dates are in UTC ISO format.
 * Run this after migration to verify success.
 */
export const validateDateMigration = internalMutation({
  args: {},
  handler: async (ctx) => {
    const issues: string[] = [];

    // Check tournaments
    const tournaments = await ctx.db.query("tournaments").collect();
    for (const t of tournaments) {
      if (!t.startDate.includes("T")) {
        issues.push(`Tournament ${t._id}: startDate not migrated`);
      }
      if (!t.endDate.includes("T")) {
        issues.push(`Tournament ${t._id}: endDate not migrated`);
      }
    }

    // Check submissions
    const submissions = await ctx.db.query("submissions").collect();
    for (const s of submissions) {
      if (!s.date.includes("T")) {
        issues.push(`Submission ${s._id}: date not migrated`);
      }
    }

    // Check submissionGroups
    const groups = await ctx.db.query("submissionGroups").collect();
    for (const g of groups) {
      if (!g.date.includes("T")) {
        issues.push(`SubmissionGroup ${g._id}: date not migrated`);
      }
      if (!g.createdAt.includes("T")) {
        issues.push(`SubmissionGroup ${g._id}: createdAt not migrated`);
      }
      if (!g.updatedAt.includes("T")) {
        issues.push(`SubmissionGroup ${g._id}: updatedAt not migrated`);
      }
    }

    if (issues.length === 0) {
      console.log("✓ All dates successfully migrated to UTC ISO format");
      return { success: true, issues: [] };
    } else {
      console.error("✗ Migration validation found issues:", issues);
      return { success: false, issues };
    }
  },
});
```

#### Update Existing Mutations

**Example: tournaments.upsert**

```typescript
// convex/tournaments.ts
import { toUTCDateString, toUTCEndOfDayString, nowUTC } from "./lib/dates";

export const upsert = mutation({
  args: {
    // ... existing args
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateIsAdmin(user);

    const data = {
      name: args.name,
      description: args.description || "",
      startDate: toUTCDateString(args.startDate), // Convert to UTC midnight
      endDate: toUTCEndOfDayString(args.endDate),  // Convert to UTC end of day
      teamMinSize: args.teamMinSize,
      teamMaxSize: args.teamMaxSize,
      maxSubmissionsPerDay: args.maxSubmissionsPerDay,
      scoringConfig: args.scoringConfig || defaultScoringConfig,
    };

    // ... rest of mutation
  },
});

export const determineWinner = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    // ... validation logic

    // Update tournament with winner
    await ctx.db.patch(args.tournamentId, {
      winnerId: winner._id,
      completedAt: nowUTC(), // Use utility function
    });

    // ... return logic
  },
});
```

**Example: submissions.upsert**

```typescript
// convex/submissions.ts
import { toUTCDateString, nowUTC } from "./lib/dates";

export const upsert = mutation({
  args: {
    _id: v.optional(v.id("submissions")),
    date: v.string(), // Still accepts YYYY-MM-DD from frontend
    // ... other args
  },
  handler: async (ctx, args) => {
    // ... validation logic

    const data = {
      date: toUTCDateString(args.date), // Convert to UTC midnight
      userId: user._id,
      teamId: args.teamId,
      tournamentId: team.tournamentId,
      description: args.description,
      tier: args.tier || "base",
      submissionType: args.submissionType,
    };

    // ... rest of mutation
  },
});
```

#### User Preferences API

**New queries and mutations for date format preference:**

```typescript
// convex/users.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

/**
 * Supported date format options
 */
export const DATE_FORMATS = {
  "MM/dd/yyyy": "MM/dd/yyyy",
  "dd/MM/yyyy": "dd/MM/yyyy",
  "yyyy-MM-dd": "yyyy-MM-dd",
  "dd MMM yyyy": "dd MMM yyyy",
  "MMM dd, yyyy": "MMM dd, yyyy",
  "dd MMMM yyyy": "dd MMMM yyyy",
} as const;

export type DateFormat = keyof typeof DATE_FORMATS;

/**
 * Get current user's date format preference.
 * Returns default format if not set.
 */
export const getDateFormatPreference = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return user.dateFormat || "MM/dd/yyyy";
  },
});

/**
 * Update current user's date format preference.
 */
export const updateDateFormatPreference = mutation({
  args: {
    dateFormat: v.string(), // Should be one of DATE_FORMATS keys
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate format
    if (!(args.dateFormat in DATE_FORMATS)) {
      throw new Error(`Invalid date format: ${args.dateFormat}`);
    }

    await ctx.db.patch(user._id, {
      dateFormat: args.dateFormat,
    });

    return { success: true, dateFormat: args.dateFormat };
  },
});
```

### Frontend Architecture

#### Date Utility Library (src/lib/dates.ts)

```typescript
/**
 * Frontend date formatting utilities
 */

export const DATE_FORMATS = {
  "MM/dd/yyyy": "MM/dd/yyyy",
  "dd/MM/yyyy": "dd/MM/yyyy",
  "yyyy-MM-dd": "yyyy-MM-dd",
  "dd MMM yyyy": "dd MMM yyyy",
  "MMM dd, yyyy": "MMM dd, yyyy",
  "dd MMMM yyyy": "dd MMMM yyyy",
} as const;

export type DateFormat = keyof typeof DATE_FORMATS;

/**
 * Format a UTC ISO string to user's preferred format.
 * @param isoString - UTC ISO date string
 * @param format - Desired format (defaults to "MM/dd/yyyy")
 * @param options - Additional formatting options
 * @returns Formatted date string
 */
export function formatDate(
  isoString: string | undefined | null,
  format: DateFormat = "MM/dd/yyyy",
  options?: {
    includeTime?: boolean;
    timezone?: string;
  }
): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  // Use Intl.DateTimeFormat for consistent formatting
  const formatParts = parseFormatString(format);

  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: formatParts.month,
    day: "numeric",
    ...(options?.includeTime && {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    ...(options?.timezone && { timeZone: options.timezone }),
  });

  return formatWithPattern(date, format, formatter);
}

/**
 * Parse format string to determine month style
 */
function parseFormatString(format: DateFormat): { month: "numeric" | "2-digit" | "short" | "long" } {
  if (format.includes("MMMM")) return { month: "long" };
  if (format.includes("MMM")) return { month: "short" };
  if (format.includes("MM")) return { month: "2-digit" };
  return { month: "numeric" };
}

/**
 * Format date according to pattern
 */
function formatWithPattern(
  date: Date,
  format: DateFormat,
  formatter: Intl.DateTimeFormat
): string {
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};

  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  // Map format tokens to values
  let result = format;

  // Replace year
  result = result.replace("yyyy", partMap.year || "");

  // Replace month
  if (format.includes("MMMM")) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    result = result.replace("MMMM", monthNames[date.getMonth()]);
  } else if (format.includes("MMM")) {
    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    result = result.replace("MMM", monthNamesShort[date.getMonth()]);
  } else if (format.includes("MM")) {
    result = result.replace("MM", String(date.getMonth() + 1).padStart(2, "0"));
  } else if (format.includes("M")) {
    result = result.replace("M", String(date.getMonth() + 1));
  }

  // Replace day
  result = result.replace("dd", String(date.getDate()).padStart(2, "0"));
  result = result.replace("d", String(date.getDate()));

  return result;
}

/**
 * Format a date for relative display (e.g., "2 days ago")
 * @param isoString - UTC ISO date string
 * @returns Relative time string or formatted date if too old
 */
export function formatRelativeDate(
  isoString: string | undefined | null,
  fallbackFormat: DateFormat = "MM/dd/yyyy"
): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  // Use relative format for recent dates
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;

  // Use formatted date for older dates
  return formatDate(isoString, fallbackFormat);
}

/**
 * Extract date-only portion from UTC ISO string (YYYY-MM-DD)
 * @param isoString - UTC ISO string
 * @returns Date portion in YYYY-MM-DD format
 */
export function extractDateOnly(isoString: string): string {
  return isoString.split("T")[0];
}

/**
 * Convert local date input (YYYY-MM-DD) to UTC ISO string at midnight
 * This is used when sending dates from date pickers to the backend
 * @param dateString - Local date string (YYYY-MM-DD)
 * @returns UTC ISO string at midnight
 */
export function localDateToUTC(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return utcDate.toISOString();
}

/**
 * Convert UTC ISO string to local date format (YYYY-MM-DD) for date inputs
 * @param isoString - UTC ISO string
 * @returns Local date string (YYYY-MM-DD)
 */
export function utcToLocalDateInput(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a UTC ISO string represents today in local timezone
 * @param isoString - UTC ISO string
 * @returns true if date is today
 */
export function isToday(isoString: string): boolean {
  const date = new Date(isoString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * Get preview text for a date format
 * @param format - Date format to preview
 * @returns Example date string in that format
 */
export function getFormatPreview(format: DateFormat): string {
  const exampleDate = new Date(2025, 10, 18); // November 18, 2025
  return formatWithPattern(
    exampleDate,
    format,
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: parseFormatString(format).month,
      day: "numeric",
    })
  );
}
```

#### React Hook for Date Formatting (src/hooks/useFormattedDate.ts)

```typescript
import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "../../convex/_generated/api";
import { formatDate, formatRelativeDate, type DateFormat } from "@/lib/dates";

/**
 * Hook to get user's date format preference and format dates consistently
 */
export function useFormattedDate() {
  const userFormat = useQuery(api.users.getDateFormatPreference);

  const format = useMemo(() => {
    return (
      isoString: string | undefined | null,
      options?: {
        includeTime?: boolean;
        timezone?: string;
      }
    ) => {
      const fmt = (userFormat || "MM/dd/yyyy") as DateFormat;
      return formatDate(isoString, fmt, options);
    };
  }, [userFormat]);

  const formatRelative = useMemo(() => {
    return (isoString: string | undefined | null) => {
      const fmt = (userFormat || "MM/dd/yyyy") as DateFormat;
      return formatRelativeDate(isoString, fmt);
    };
  }, [userFormat]);

  return {
    format,
    formatRelative,
    userFormat: (userFormat || "MM/dd/yyyy") as DateFormat,
  };
}
```

#### Update Date Field Component

```typescript
// src/components/form/fields/date-field.tsx
import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context";
import { localDateToUTC, utcToLocalDateInput } from "@/lib/dates";
import { Field, FieldError, FieldLabel } from "../../ui/field";
import { Input, type InputProps } from "../../ui/input";

export type DateFieldProps = InputProps & {
  label: string;
};

export function DateField({ label, ...props }: DateFieldProps) {
  const field = useFieldContext<string>();

  const [isInvalid, errors] = useStore(field.store, (state) => [
    state.meta.isTouched && !state.meta.isValid,
    state.meta.errors,
  ]);

  // Convert UTC ISO to local date format for input display
  const localValue = field.state.value
    ? utcToLocalDateInput(field.state.value)
    : "";

  // Convert local date input to UTC ISO when changed
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDate = e.target.value;
    if (localDate) {
      field.handleChange(localDateToUTC(localDate));
    } else {
      field.handleChange("");
    }
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        {...props}
        type="date"
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        value={localValue}
        onChange={handleChange}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
```

#### Update Tournament Card Component

```typescript
// src/components/tournaments/tournament-card.tsx
import { Calendar, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { getStatusBadge } from "./utils";

type Props = {
  tournament: Doc<"tournaments">;
  teamCount: number;
};

export function TournamentCard({ tournament, teamCount }: Props) {
  const { format } = useFormattedDate();

  return (
    <Card>
      <CardContent className="flex xs:flex-row flex-col items-center justify-between gap-4 xs:gap-16">
        <div className="flex-1 xs:self-auto self-start">
          <div className="flex items-center gap-2">
            <CardTitle>
              <Button
                variant="link"
                className="h-min cursor-pointer p-0 font-semibold text-base leading-none tracking-tight"
                asChild
              >
                <Link href={`/tournaments/${tournament._id}`}>
                  {tournament.name}
                </Link>
              </Button>
            </CardTitle>
            {getStatusBadge(tournament)}
          </div>
          <CardDescription className="mt-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {teamCount} team{teamCount === 1 ? "" : "s"}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(tournament.startDate)} to {format(tournament.endDate)}
            </div>
          </CardDescription>
        </div>
        <div className="flex gap-2 xs:self-auto self-end">
          <Button asChild>
            <Link href={`/tournaments/${tournament._id}`}>
              Browse Teams
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Settings Page Updates

```typescript
// src/app/(all)/settings/page.tsx
"use client";

import { useMutation, useQuery } from "convex/react";
import { useClerk } from "@clerk/nextjs";
import { Calendar, Check, Moon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { DATE_FORMATS, getFormatPreview } from "@/lib/dates";
import { tryMutate } from "@/lib/utils";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const WEEKDAY_LABELS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEK_START_STORAGE_KEY = "calendarWeekStartsOn";

export default function SettingsPage() {
  const { signOut } = useClerk();

  // Calendar week start preference (localStorage)
  const [weekStartsOn, setWeekStartsOn] = useState<number>(0);
  const weekStartSelectId = useId();

  // Date format preference (Convex)
  const dateFormat = useQuery(api.users.getDateFormatPreference);
  const updateDateFormat = useMutation(api.users.updateDateFormatPreference);
  const dateFormatSelectId = useId();

  // Load week start preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(WEEK_START_STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number.parseInt(stored, 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 6) {
        setWeekStartsOn(parsed);
      }
    }
  }, []);

  // Save week start preference to localStorage
  const handleWeekStartChange = (value: string) => {
    const newStart = Number.parseInt(value, 10);
    setWeekStartsOn(newStart);
    localStorage.setItem(WEEK_START_STORAGE_KEY, value);
  };

  // Save date format preference to Convex
  const handleDateFormatChange = async (value: string) => {
    await tryMutate({
      fn: () => updateDateFormat({ dateFormat: value }),
      successToast: "Date format preference updated!",
      defaultFailureToast: "Failed to update date format preference",
    });
  };

  return (
    <>
      <SectionHeader as="h1" title="Settings">
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <Moon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Theme</TooltipContent>
        </Tooltip>
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </SectionHeader>

      <div className="space-y-8">
        {/* Date Format Preference */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold text-gray-900 text-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
                Date Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={dateFormatSelectId}
                    className="block font-medium text-gray-700 text-sm"
                  >
                    Preferred date format
                  </label>
                  <p className="mt-1 text-gray-500 text-sm">
                    Choose how dates are displayed throughout the app
                  </p>
                </div>
                <Select
                  value={dateFormat || "MM/dd/yyyy"}
                  onValueChange={handleDateFormatChange}
                  disabled={!dateFormat} // Wait for query to load
                >
                  <SelectTrigger
                    id={dateFormatSelectId}
                    className="w-full sm:w-[220px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(DATE_FORMATS).map((format) => (
                      <SelectItem key={format} value={format}>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-mono text-sm">{format}</span>
                          <span className="text-gray-500 text-xs">
                            {getFormatPreview(format as keyof typeof DATE_FORMATS)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Live Preview */}
              <Card variant="info" className="rounded-md">
                <CardContent className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <p className="text-blue-800 text-sm">
                    Preview: Today's date will appear as{" "}
                    <strong>
                      {getFormatPreview(
                        (dateFormat || "MM/dd/yyyy") as keyof typeof DATE_FORMATS
                      )}
                    </strong>
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </section>

        {/* Calendar Week Start Preference */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold text-gray-900 text-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
                Calendar Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={weekStartSelectId}
                    className="block font-medium text-gray-700 text-sm"
                  >
                    Week starts on
                  </label>
                  <p className="mt-1 text-gray-500 text-sm">
                    Choose which day your calendar week begins
                  </p>
                </div>
                <Select
                  value={weekStartsOn.toString()}
                  onValueChange={handleWeekStartChange}
                >
                  <SelectTrigger
                    id={weekStartSelectId}
                    className="w-full sm:w-[180px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_LABELS_FULL.map((day, index) => (
                      <SelectItem key={day} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
```

### Component Update Checklist

All components displaying dates must be updated to use `useFormattedDate()` hook:

1. **Tournament Components:**
   - `/src/components/tournaments/tournament-card.tsx` ✓ (example above)
   - `/src/components/tournaments/winner-announcement.tsx`
   - `/src/components/tournaments/tournament-details-card.tsx`
   - `/src/app/(all)/tournaments/[tournamentId]/leaderboard/page.tsx`

2. **Submission Components:**
   - `/src/components/submissions/submission-details-card.tsx`
   - `/src/components/submissions/calendar-header.tsx`
   - `/src/components/submissions/calendar-date-cell.tsx`

3. **Invitation Components:**
   - `/src/components/invitations/invited-user-card.tsx`
   - `/src/components/invitations/join-request-card.tsx`
   - `/src/components/invitations/team-invitation-card.tsx`

4. **Dashboard:**
   - `/src/components/UserDashboard.tsx`

### Integration Points

1. **Convex Functions:** All mutations that create/update dates must use new utility functions
2. **Date Pickers:** Updated to convert between local YYYY-MM-DD and UTC ISO
3. **User Preferences:** Settings page saves to Convex users table
4. **Calendar Component:** Already handles week start preference, add date formatting
5. **Data Tables:** Add formatted date columns using hook

---

## 4. Implementation Plan

### Phase 1: Foundation (Days 1-3)

**Objectives:**
- Set up date utility libraries
- Update database schema
- Create migration scripts

**Tasks:**
1. Create `convex/lib/dates.ts` with utility functions
2. Update `convex/schema.ts` to add `dateFormat` to users table
3. Create migration functions in `convex/migrations.ts`
4. Create `src/lib/dates.ts` with frontend utilities
5. Create `src/hooks/useFormattedDate.ts` hook
6. Write unit tests for utility functions

**Acceptance Criteria:**
- All utility functions have test coverage
- Migration script runs successfully on test data
- Schema updated and deployed to dev environment

### Phase 2: Backend Migration (Days 4-5)

**Objectives:**
- Migrate existing data to UTC ISO format
- Update all Convex mutations to use new utilities

**Tasks:**
1. Run migration on development environment
2. Validate migration using `validateDateMigration`
3. Update all mutations in:
   - `convex/tournaments.ts`
   - `convex/submissions.ts`
   - `convex/submissionGroups.ts`
   - `convex/teamInvitations.ts`
   - `convex/joinRequests.ts`
   - `convex/admin.ts`
4. Update date comparison logic to use new utilities
5. Test all mutations with new date format

**Acceptance Criteria:**
- All existing data migrated successfully
- All mutations accept and return UTC ISO strings
- Date queries and comparisons work correctly
- No breaking changes to API contracts

### Phase 3: User Preferences (Days 6-7)

**Objectives:**
- Implement user date format preference storage
- Create settings UI for date format selection

**Tasks:**
1. Add `getDateFormatPreference` query to `convex/users.ts`
2. Add `updateDateFormatPreference` mutation to `convex/users.ts`
3. Update settings page with date format selector
4. Add live preview of date formats
5. Test preference persistence across sessions

**Acceptance Criteria:**
- Users can select and save date format preference
- Preference persists across sessions and devices
- Settings UI shows live preview
- Default format ("MM/dd/yyyy") used if not set

### Phase 4: Frontend Updates (Days 8-12)

**Objectives:**
- Update all components to use formatted dates
- Update date input components

**Tasks:**
1. Update `DateField` component to handle UTC conversion
2. Update tournament components (3 files)
3. Update submission components (3 files)
4. Update invitation components (3 files)
5. Update dashboard component
6. Update data table date columns
7. Test all date displays in different formats

**Acceptance Criteria:**
- All dates display in user's preferred format
- Date pickers correctly convert to/from UTC
- No hardcoded `toLocaleDateString()` calls remain
- Timezone handling is correct across all components

### Phase 5: Testing & Polish (Days 13-15)

**Objectives:**
- Comprehensive testing of date handling
- Edge case handling
- Performance optimization

**Tasks:**
1. Test timezone boundary cases (dates near midnight)
2. Test date range queries with UTC dates
3. Test submission calendar with UTC dates
4. Test tournament status calculation with UTC
5. Performance testing of date formatting
6. Browser compatibility testing
7. Accessibility testing of date displays
8. Documentation updates

**Acceptance Criteria:**
- All edge cases handled correctly
- No performance regressions
- Cross-browser compatibility verified
- Accessibility standards met
- Documentation complete

---

## 5. Code Examples

### Backend Query with UTC Dates

```typescript
// convex/tournaments.ts
import { nowUTC, toUTCDateString } from "./lib/dates";

export const list = query({
  args: {
    userId: v.optional(v.id("users")),
    tournamentIds: v.optional(v.array(v.id("tournaments"))),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    // ... fetch tournaments

    const nowIso = nowUTC(); // Use utility instead of new Date().toISOString()

    return tournaments.toSorted((a, b) => {
      // Date comparison still works with UTC ISO strings
      const isActive = (x: typeof a) =>
        x.startDate <= nowIso && x.endDate >= nowIso;
      const isFuture = (x: typeof a) => x.startDate > nowIso;
      const isEnded = (x: typeof a) => x.endDate < nowIso;

      // ... sorting logic
    });
  },
});
```

### Frontend Date Display with Formatting

```typescript
// src/components/tournaments/winner-announcement.tsx
import { useFormattedDate } from "@/hooks/useFormattedDate";

export function WinnerAnnouncement({ winner }: Props) {
  const { format, formatRelative } = useFormattedDate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Winner</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{winner.team.name}</p>
        <p className="text-sm text-gray-600">
          Completed on {format(winner.completedAt)}
        </p>
        <p className="text-xs text-gray-500">
          {formatRelative(winner.completedAt)}
        </p>
      </CardContent>
    </Card>
  );
}
```

### Submission Calendar with UTC Dates

```typescript
// src/components/submissions/submission-calendar.tsx
import { formatDate, extractDateOnly } from "@/lib/dates";

export function SubmissionCalendar({ teamId, tournamentId }: Props) {
  const { format } = useFormattedDate();

  // ... calendar logic

  const calendarDays = useMemo(() => {
    // ... generate days

    return days.map((date) => {
      // Convert to UTC midnight for querying
      const dateStr = date.toISOString().split("T")[0] + "T00:00:00.000Z";
      const submission = submissions?.[dateStr];

      return {
        date: dateStr,
        submission,
        display: format(dateStr), // Formatted for display
      };
    });
  }, [currentDate, submissions, format]);

  return (
    <div className="calendar-grid">
      {calendarDays.map(({ date, submission, display }) => (
        <CalendarDateCell
          key={date}
          date={date}
          submission={submission}
          displayDate={display}
        />
      ))}
    </div>
  );
}
```

### Date Range Filtering

```typescript
// convex/submissions.ts
import { toUTCDateString } from "./lib/dates";

export const list = query({
  args: {
    // ... other args
    startDate: v.optional(v.string()), // Accepts YYYY-MM-DD or ISO
    endDate: v.optional(v.string()),   // Accepts YYYY-MM-DD or ISO
  },
  handler: async (ctx, args) => {
    // ... base query

    if (args.startDate) {
      // Convert to UTC if needed
      const startUTC = args.startDate.includes("T")
        ? args.startDate
        : toUTCDateString(args.startDate);

      query = query.filter((q) => q.gte(q.field("date"), startUTC));
    }

    if (args.endDate) {
      const endUTC = args.endDate.includes("T")
        ? args.endDate
        : toUTCEndOfDayString(args.endDate);

      query = query.filter((q) => q.lte(q.field("date"), endUTC));
    }

    return await query.collect();
  },
});
```

---

## 6. Open Questions & Considerations

### Technical Decisions

**Q1: Should we support custom date formats (user-defined patterns)?**
- **Recommendation:** No, stick to predefined formats for Phase 1
- **Rationale:** Custom patterns increase complexity and validation burden
- **Future:** Can add in Phase 2 if user demand exists

**Q2: Should we detect user timezone automatically?**
- **Recommendation:** Yes, use `Intl.DateTimeFormat().resolvedOptions().timeZone`
- **Rationale:** Better UX for displaying times in local timezone
- **Implementation:** Store in localStorage or user preferences

**Q3: How to handle submissions calendar with UTC dates?**
- **Current:** Stores "2025-11-18" (ambiguous timezone)
- **Proposed:** Store "2025-11-18T00:00:00.000Z" (UTC midnight)
- **Impact:** Submission date is now fixed to UTC day boundary
- **Alternative:** Store UTC timestamp and display in user's local date
- **Recommendation:** Use UTC midnight for date-only fields (simpler)

**Q4: Should week start preference move from localStorage to Convex?**
- **Recommendation:** Yes, migrate in same PR for consistency
- **Rationale:** User preferences should be centralized and synced
- **Implementation:** Add `weekStartsOn` field to users table

### Edge Cases

**EC1: Timezone boundary submissions**
- **Scenario:** User in GMT+12 submits on "2025-11-18" at 11 PM local time
- **UTC:** Would be "2025-11-17T11:00:00.000Z" (previous day in UTC)
- **Solution:** Store submission date based on user's local date, convert to UTC midnight
- **Implementation:** Frontend sends local date (YYYY-MM-DD), backend converts to UTC midnight

**EC2: Tournament end date boundary**
- **Scenario:** Tournament ends "2025-12-31", user in GMT-8 at 11 PM
- **UTC:** Would be "2026-01-01T07:00:00.000Z" (next day in UTC)
- **Solution:** Store end date as UTC end-of-day (23:59:59.999Z)
- **Implementation:** Backend converts YYYY-MM-DD to UTC 23:59:59.999Z

**EC3: Date format preview in settings**
- **Scenario:** User changes format, how quickly does UI update?
- **Solution:** Convex reactivity updates all components automatically
- **Performance:** Should be near-instant with Convex subscriptions

**EC4: Migration rollback**
- **Scenario:** Migration fails or data corruption detected
- **Solution:** Keep migration idempotent, can re-run safely
- **Rollback:** Manual rollback requires reversing UTC to date-only strings
- **Prevention:** Extensive testing in dev/staging before production

### Performance Considerations

**PC1: Date formatting performance**
- **Concern:** Formatting hundreds of dates in data tables
- **Solution:** React.memo on date components, useMemo for formatted values
- **Benchmark:** Test with 1000+ row tables

**PC2: Convex query performance**
- **Concern:** Date range queries with UTC strings
- **Solution:** Indexes already exist, string comparison works efficiently
- **Validation:** Run performance tests on large datasets

**PC3: User preference caching**
- **Concern:** Querying date format on every render
- **Solution:** Convex caches query results, hook memoizes formatter
- **Optimization:** Single query per component tree

### Migration Risks

**MR1: Data loss during migration**
- **Mitigation:** Test migration on copy of production data
- **Backup:** Full database backup before migration
- **Validation:** Run validation script after migration
- **Rollback:** Document rollback procedure

**MR2: Breaking API changes**
- **Mitigation:** Maintain backward compatibility (accept both formats)
- **Testing:** Integration tests covering old and new formats
- **Communication:** Document changes in PR and release notes

**MR3: User timezone confusion**
- **Mitigation:** Clear messaging in UI about date/time display
- **Education:** Help text in settings explaining timezone handling
- **Support:** Document common timezone issues in FAQ

---

## 7. Success Metrics

### Functional Validation

1. **Backend Migration:**
   - ✓ 100% of date fields migrated to UTC ISO format
   - ✓ 0 data loss or corruption
   - ✓ All date queries return correct results
   - ✓ Validation script passes with no issues

2. **User Preferences:**
   - ✓ Users can select from 6 date format options
   - ✓ Preference persists across sessions
   - ✓ Default format applied for new users
   - ✓ Settings UI shows live preview

3. **Frontend Display:**
   - ✓ All date components use formatted dates
   - ✓ No hardcoded `toLocaleDateString()` calls
   - ✓ Date pickers correctly convert to/from UTC
   - ✓ Timezone handling is consistent

4. **Edge Cases:**
   - ✓ Timezone boundary dates work correctly
   - ✓ Tournament date comparisons accurate
   - ✓ Submission calendar displays correct dates
   - ✓ Date range filtering works with UTC

### Performance Benchmarks

1. **Date Formatting:**
   - Format 1000 dates in < 100ms
   - No visible UI lag when changing format

2. **Date Queries:**
   - Date range queries maintain current performance
   - No regression in tournament list loading
   - No regression in submission calendar loading

3. **User Preference:**
   - Preference query cached effectively
   - Format change reflects immediately (< 1s)

### User Experience

1. **Settings UI:**
   - Date format selector is intuitive
   - Preview updates in real-time
   - Success feedback on save

2. **Date Display:**
   - Dates are readable in user's format
   - Relative dates for recent timestamps
   - Consistent formatting across app

3. **Accessibility:**
   - Date format selector keyboard navigable
   - Screen readers announce formats
   - Semantic HTML for dates (time elements)

### Testing Coverage

1. **Unit Tests:**
   - Date utility functions (100% coverage)
   - Date formatting edge cases
   - Timezone conversion accuracy

2. **Integration Tests:**
   - Migration script on test data
   - API endpoints with UTC dates
   - User preference CRUD operations

3. **E2E Tests:**
   - Date format selection flow
   - Date display across components
   - Date picker submissions

---

## 8. Rollback Plan

### If Migration Fails

1. **Immediate Actions:**
   - Stop migration script if validation fails
   - Do NOT commit partial migration
   - Restore from database backup

2. **Investigation:**
   - Review migration logs for errors
   - Identify problematic data patterns
   - Fix migration script bugs

3. **Retry:**
   - Test fixed migration on copy of production data
   - Re-run migration after validation
   - Monitor closely during execution

### If Post-Migration Issues Discovered

1. **Data Corruption:**
   - Restore from pre-migration backup
   - Analyze root cause
   - Revise migration strategy

2. **Query Performance Degradation:**
   - Review query patterns
   - Add missing indexes if needed
   - Optimize date comparison logic

3. **UI Rendering Issues:**
   - Fix frontend formatting bugs
   - Deploy hotfix for critical issues
   - Comprehensive testing before retry

### If User Preference Issues

1. **Preference Not Saving:**
   - Check mutation permissions
   - Verify schema changes deployed
   - Fix and redeploy

2. **Format Not Applied:**
   - Check query caching
   - Verify hook implementation
   - Component updates not propagating

---

## 9. Documentation Updates

### CLAUDE.md Updates

Add section on date handling:

```markdown
## Date Handling

### Backend (Convex)

All date fields are stored as UTC ISO 8601 strings:

- **Date-only fields** (e.g., tournament dates, submission dates): UTC midnight
  - Example: `"2025-11-18T00:00:00.000Z"`
- **Timestamp fields** (e.g., createdAt, updatedAt): Full UTC timestamp
  - Example: `"2025-11-18T14:32:15.123Z"`

**Utility Functions** (`convex/lib/dates.ts`):
- `toUTCDateString(date)` - Convert to UTC midnight
- `toUTCEndOfDayString(date)` - Convert to UTC end of day
- `nowUTC()` - Current UTC timestamp
- `extractDateFromISO(iso)` - Get YYYY-MM-DD from ISO string

### Frontend (React)

All dates are displayed using user's format preference.

**Hooks:**
- `useFormattedDate()` - Format dates according to user preference

**Utilities** (`src/lib/dates.ts`):
- `formatDate(iso, format)` - Format ISO string to display format
- `formatRelativeDate(iso)` - Relative time (e.g., "2 days ago")
- `localDateToUTC(date)` - Convert YYYY-MM-DD to UTC ISO
- `utcToLocalDateInput(iso)` - Convert UTC ISO to YYYY-MM-DD for inputs

**Date Pickers:**
- Always send UTC ISO format to backend
- Display local dates in date inputs
- Use `DateField` component for consistent behavior
```

### API Documentation

Document date format expectations for all endpoints:

```typescript
/**
 * Create or update a tournament
 *
 * @param startDate - Tournament start date (YYYY-MM-DD or UTC ISO)
 * @param endDate - Tournament end date (YYYY-MM-DD or UTC ISO)
 *
 * @returns Tournament ID
 *
 * @example
 * await upsertTournament({
 *   name: "Fall Challenge",
 *   startDate: "2025-11-01", // Converted to UTC midnight
 *   endDate: "2025-11-30",   // Converted to UTC end of day
 * });
 */
```

---

## 10. Testing Strategy

### Unit Tests

**Backend (Convex utilities):**

```typescript
// convex/lib/dates.test.ts
import { describe, test, expect } from "vitest";
import {
  toUTCDateString,
  toUTCEndOfDayString,
  extractDateFromISO,
  compareDatesOnly,
} from "./dates";

describe("toUTCDateString", () => {
  test("converts YYYY-MM-DD to UTC midnight", () => {
    expect(toUTCDateString("2025-11-18")).toBe("2025-11-18T00:00:00.000Z");
  });

  test("converts Date object to UTC midnight", () => {
    const date = new Date(2025, 10, 18, 15, 30, 0); // Nov 18, 2025, 3:30 PM local
    const result = toUTCDateString(date);
    expect(result).toBe("2025-11-18T00:00:00.000Z");
  });

  test("handles leap year dates", () => {
    expect(toUTCDateString("2024-02-29")).toBe("2024-02-29T00:00:00.000Z");
  });
});

describe("toUTCEndOfDayString", () => {
  test("converts to UTC 23:59:59.999", () => {
    expect(toUTCEndOfDayString("2025-11-18")).toBe("2025-11-18T23:59:59.999Z");
  });
});

describe("extractDateFromISO", () => {
  test("extracts YYYY-MM-DD from ISO string", () => {
    expect(extractDateFromISO("2025-11-18T14:32:15.123Z")).toBe("2025-11-18");
  });
});

describe("compareDatesOnly", () => {
  test("compares dates ignoring time", () => {
    const a = "2025-11-18T00:00:00.000Z";
    const b = "2025-11-18T23:59:59.999Z";
    expect(compareDatesOnly(a, b)).toBe(0); // Same date
  });

  test("returns -1 when a < b", () => {
    expect(compareDatesOnly(
      "2025-11-17T00:00:00.000Z",
      "2025-11-18T00:00:00.000Z"
    )).toBe(-1);
  });
});
```

**Frontend (formatting utilities):**

```typescript
// src/lib/dates.test.ts
import { describe, test, expect } from "vitest";
import {
  formatDate,
  formatRelativeDate,
  localDateToUTC,
  utcToLocalDateInput,
} from "./dates";

describe("formatDate", () => {
  const isoString = "2025-11-18T14:32:15.123Z";

  test("formats as MM/dd/yyyy", () => {
    expect(formatDate(isoString, "MM/dd/yyyy")).toBe("11/18/2025");
  });

  test("formats as dd/MM/yyyy", () => {
    expect(formatDate(isoString, "dd/MM/yyyy")).toBe("18/11/2025");
  });

  test("formats as yyyy-MM-dd", () => {
    expect(formatDate(isoString, "yyyy-MM-dd")).toBe("2025-11-18");
  });

  test("formats as dd MMM yyyy", () => {
    expect(formatDate(isoString, "dd MMM yyyy")).toBe("18 Nov 2025");
  });

  test("handles null/undefined", () => {
    expect(formatDate(null, "MM/dd/yyyy")).toBe("");
    expect(formatDate(undefined, "MM/dd/yyyy")).toBe("");
  });
});

describe("formatRelativeDate", () => {
  test("shows 'just now' for recent dates", () => {
    const now = new Date().toISOString();
    expect(formatRelativeDate(now)).toBe("just now");
  });

  test("shows formatted date for old dates", () => {
    const old = "2024-01-01T00:00:00.000Z";
    expect(formatRelativeDate(old, "MM/dd/yyyy")).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe("localDateToUTC", () => {
  test("converts local date to UTC midnight", () => {
    const result = localDateToUTC("2025-11-18");
    expect(result).toBe("2025-11-18T00:00:00.000Z");
  });
});

describe("utcToLocalDateInput", () => {
  test("extracts YYYY-MM-DD for date input", () => {
    expect(utcToLocalDateInput("2025-11-18T14:32:15.123Z")).toBe("2025-11-18");
  });
});
```

### Integration Tests

**Migration validation:**

```typescript
// Test migration script on sample data
test("migration handles all date fields", async () => {
  // Create test tournament with old format
  const tournamentId = await ctx.db.insert("tournaments", {
    name: "Test",
    startDate: "2025-11-01", // Old format
    endDate: "2025-11-30",   // Old format
    // ... other fields
  });

  // Run migration
  await migrateDatesToUTC(ctx, {});

  // Verify conversion
  const tournament = await ctx.db.get(tournamentId);
  expect(tournament.startDate).toBe("2025-11-01T00:00:00.000Z");
  expect(tournament.endDate).toBe("2025-11-30T23:59:59.999Z");
});
```

**User preference flow:**

```typescript
test("user can update date format preference", async () => {
  // Get default format
  const defaultFormat = await ctx.runQuery(api.users.getDateFormatPreference);
  expect(defaultFormat).toBe("MM/dd/yyyy");

  // Update preference
  await ctx.runMutation(api.users.updateDateFormatPreference, {
    dateFormat: "dd/MM/yyyy",
  });

  // Verify update
  const newFormat = await ctx.runQuery(api.users.getDateFormatPreference);
  expect(newFormat).toBe("dd/MM/yyyy");
});
```

### E2E Tests (Playwright)

**Date format selection:**

```typescript
test("user can change date format in settings", async ({ page }) => {
  // Navigate to settings
  await page.goto("/settings");

  // Find date format selector
  const selector = page.locator('[id*="dateFormat"]');
  await selector.click();

  // Select new format
  await page.getByText("dd/MM/yyyy").click();

  // Verify success message
  await expect(page.getByText("Date format preference updated!")).toBeVisible();

  // Navigate to tournaments page
  await page.goto("/tournaments");

  // Verify dates display in new format
  const dateText = await page.locator('[data-testid="tournament-date"]').first().textContent();
  expect(dateText).toMatch(/\d{2}\/\d{2}\/\d{4}/); // dd/MM/yyyy pattern
});
```

**Date picker submission:**

```typescript
test("submission date picker sends correct UTC format", async ({ page }) => {
  await page.goto("/submissions/new");

  // Fill date picker
  await page.fill('input[type="date"]', "2025-11-18");

  // Submit form
  await page.click('button[type="submit"]');

  // Verify API call (intercept network request)
  const request = await page.waitForRequest(req =>
    req.url().includes("/submissions/upsert")
  );
  const postData = await request.postDataJSON();
  expect(postData.date).toBe("2025-11-18T00:00:00.000Z");
});
```

---

## Summary

This specification provides a comprehensive plan for migrating the Urban Legends application to use UTC ISO format dates consistently while adding user-configurable date formatting preferences. The migration is designed to be safe, backward-compatible, and user-friendly.

**Key Benefits:**
- Eliminates timezone ambiguity and date comparison bugs
- Consistent data storage across all tables
- Improved user experience through personalized formatting
- Better data integrity and query performance

**Implementation Timeline:** 2-3 weeks with proper testing and validation

**Risk Mitigation:**
- Idempotent migration (can be re-run safely)
- Comprehensive testing at all levels
- Clear rollback plan
- Extensive documentation

**Next Steps:**
1. Review and approve specification
2. Create feature branch
3. Implement Phase 1 (foundation)
4. Incremental development and testing
5. QA in staging environment
6. Production deployment with monitoring
