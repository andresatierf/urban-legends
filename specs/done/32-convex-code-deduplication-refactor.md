# Specification 32: Convex Code Deduplication Refactor

## Executive Summary

The Urban Legends Convex backend contains significant code duplication across multiple files, particularly in role validation and data enrichment patterns. This specification outlines a comprehensive refactoring plan to eliminate duplication, improve maintainability, and establish reusable helper functions while maintaining type safety and real-time performance.

**File Organization Approach**: Helper functions will be placed at the bottom of their respective domain files (teams.ts, users.ts, submissions.ts, tournaments.ts) with generic cross-domain utilities in `convex/lib/helpers.ts`.

**Estimated Complexity**: Medium
**Expected Timeline**: 4-5 days
**Primary Benefits**: Reduced code duplication by ~45%, improved maintainability, hierarchy-aware role validation, consistent data fetching patterns

---

## Current State: Analysis of Code Duplication

### 1. Team Enrichment Pattern (Most Pervasive)

**Pattern**: Fetching teams with member counts and member details

**Occurrences** (at least 8 instances):

1. **tournaments.ts:122-140** - `getDetails` query

```typescript
const teamsWithMembers = await Promise.all(
  teams.map(async (team) => {
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();
    const memberUsers = await Promise.all(
      members.map((member) => ctx.db.get(member.userId)),
    );
    return {
      ...team,
      memberCount: members.length,
      members: memberUsers.filter((u) => u !== null),
    };
  }),
);
```

2. **tournaments.ts:386-403** - `getLeaderboard` query (simplified version)

```typescript
const teamsWithCounts = await Promise.all(
  teams.map(async (team) => {
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();
    return {
      teamId: team._id,
      teamName: team.name,
      points: team.points ?? 0,
      memberCount: members.length,
      // ...
    };
  }),
);
```

3. **tournaments.ts:453-462** - `getWinner` query

```typescript
const members = await ctx.db
  .query("teamMembers")
  .withIndex("by_team", (q) => q.eq("teamId", tournament.winnerId))
  .collect();
const users = await Promise.all(
  members.map((member) => ctx.db.get(member.userId)),
);
return {
  team,
  members: users.filter((u) => u !== null),
  // ...
};
```

4. **teams.ts:199-214** - `getDetails` query

```typescript
const membersWithRoles = await Promise.all(
  teamMembers.map(async (member) => {
    const memberUser = await getUser(ctx, {
      userId: member.userId,
      throw: false,
    });
    if (!memberUser) return null;
    return {
      ...memberUser,
      memberRole: member.role,
    };
  }),
);
```

5. **teams.ts:355-370** - `listTeamMembers` query

```typescript
const teamMembers = await ctx.db
  .query("teamMembers")
  .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
  .collect();
const users = await ctx.db
  .query("users")
  .filter((q) =>
    q.or(...teamMembers.map((member) => q.eq(q.field("_id"), member.userId))),
  )
  .collect();
return users
  .filter((u) => !args.excludeSelf || u._id !== user._id)
  .map((u) => ({
    ...u,
    role: teamMembers.find((m) => m.userId === u._id)?.role,
  }));
```

6. **captain.ts:125-134** - `getDashboardData` query (bulk team member fetching)
7. **dashboard.ts:26-45** - `getUserDashboardData` query
8. **admin.ts:342-344** - `getSystemHealth` query (checking orphaned team members)

### 2. User Enrichment with Roles Pattern

**Pattern**: Fetching users with their role information

**Occurrences** (at least 6 instances):

1. **users.ts:26-34** - `list` query

```typescript
return await Promise.all(
  users.map(async (user) => {
    const roles = await getRolesForUser(ctx, user._id);
    return {
      ...user,
      roles,
      roleNames: roles.map(({ name }) => name),
    };
  }),
);
```

2. **users.ts:174-197** - `getCurrentUserOrThrow` function
3. **users.ts:204-227** - `getUser` function
4. **users.ts:244-257** - `getRolesForUser` function (used by others)
5. **submissions.ts:530-534** - `getDetails` query (calls getUser)
6. **teams.ts:199-211** - `getDetails` query (calls getUser)

### 3. Submission Group Enrichment Pattern

**Pattern**: Fetching submissions with user data

**Occurrences** (at least 4 instances):

1. **submissionGroups.ts:364-378** - `getWithSubmissions` query

```typescript
const submissionsWithUsers = await Promise.all(
  submissions.map(async (submission) => {
    const user = await ctx.db.get(submission.userId);
    return {
      ...submission,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            email: user.email,
          }
        : null,
    };
  }),
);
```

2. **submissions.ts:554-564** - `getDetails` query (teammates in group)

```typescript
const teammatePromises = groupSubmissions.map(({ userId }) =>
  getUser(ctx, { userId, throw: false }),
);
const fetchedTeammates = await Promise.all(teammatePromises);
teammates = fetchedTeammates.filter(
  (t): t is NonNullable<typeof t> => t !== null,
);
```

3. **reviewer.ts:185-193** - `getPendingSubmissions` query (group submitters)
4. **admin.ts:274-279** - `getDashboardData` query (enriched activity)

### 4. Orphaned Records Detection Pattern

**Pattern**: Finding orphaned records across related tables

**Occurrences** (2 instances, identical code):

1. **admin.ts:401-437** - `getOrphanedRecordsData` helper
2. **admin.ts:329-344** - `getSystemHealth` query (inline version)

Both implement the exact same logic for detecting orphaned teams, submissions, and team members.

### 5. Tournament Context Enrichment Pattern

**Pattern**: Fetching team + tournament data together

**Occurrences** (at least 5 instances):

1. **dashboard.ts:25-45** - `getUserDashboardData`
2. **captain.ts:102-123** - `getDashboardData` (teams with tournament context)
3. **users.ts:76-87** - `getDetails` query
4. **teamInvitations.ts:86-100** - `listUserInvitations`
5. **reviewer.ts:94-145** - `getPendingSubmissions` (bulk enrichment)

### 6. Pending Count Queries Pattern

**Pattern**: Counting pending items by state

**Occurrences** (3 nearly identical implementations):

1. **submissionGroups.ts:391-411** - `getPendingCount`
2. **reviewer.ts:10-38** - `getPendingCount`
3. **admin.ts:206-227** - `getAllPendingCount`

All three fetch pending submissions and groups with slight variations in access control.

### 7. Map Construction Pattern

**Pattern**: Converting arrays to Maps for efficient lookups

**Occurrences** (at least 6 instances):

1. **captain.ts:108-123** - Teams, tournaments, team members maps
2. **reviewer.ts:133-145** - Teams, tournaments, users maps
3. **captain.ts:280-298** - Tournament teams by tournament ID map

### 8. Role Validation Pattern

**Pattern**: Checking if a user has required role permissions

**Occurrences** (at least 20+ instances across multiple files):

The codebase has extensive role validation duplication with inconsistent patterns:

1. **Single role check** - Example from users.ts:260, dashboard.ts:89:

```typescript
if (!user.roleNames.includes("admin")) {
  throw new Error("Admin access required");
}
```

2. **Multiple role check (AND pattern)** - Example from reviewer.ts:15-20, 54-60, 236-237:

```typescript
if (!user.roleNames.includes("reviewer") && !user.roleNames.includes("admin")) {
  throw new Error("Reviewer or admin access required");
}
```

3. **Multiple role check (OR pattern, inconsistent syntax)** - Example from tournaments.ts:231-232, 508-509:

```typescript
if (
  !user.roleNames.includes("admin") &&
  !user.roleNames.includes("tournament_manager")
) {
  throw new Error("Admin or tournament manager access required");
}
```

4. **Array.some() pattern** - Example from tournamentManager.ts:20, 54, 152, 219:

```typescript
if (!["admin", "tournament_manager"].some((r) => user.roleNames.includes(r))) {
  throw new Error("Unauthorized");
}
```

5. **Triple role check** - Example from submissionGroups.ts:398-400:

```typescript
if (
  user.roleNames.includes("admin") ||
  user.roleNames.includes("reviewer") ||
  user.roleNames.includes("tournament_manager")
) {
  // authorized
}
```

6. **Local boolean variables** - Example from tournaments.ts:165-166, teams.ts:231, 276-277:

```typescript
const isAdmin = user.roleNames.includes("admin");
const isTournamentManager = user.roleNames.includes("tournament_manager");
if (!isAdmin && !isTournamentManager) {
  throw new Error("Unauthorized");
}
```

**Files with role validation duplication**:

- **users.ts** - 2 instances
- **reviewer.ts** - 3 instances (lines 17-18, 56-57, 236-237)
- **tournaments.ts** - 5 instances (lines 165-166, 231-232, 278, 508-509)
- **tournamentManager.ts** - 4 instances (lines 20, 54, 152, 219)
- **teams.ts** - 5 instances (lines 231, 276-277, 452, 738-739)
- **submissions.ts** - 6 instances (lines 504-506, 625-626, 678-679, 749-750, 1120-1121)
- **submissionGroups.ts** - 2 instances (lines 346, 398-400)
- **dashboard.ts** - 1 instance (line 89)

**Existing validation function** (partial solution):

- `validateIsAdmin` exists in users.ts:259-263 but only handles admin role

**Key insight**: The `convex/data.ts` file already defines a role hierarchy system (lines 174-217):

```typescript
export const rolesToCreate = [
  { name: "dev", hierarchy: 0 }, // Highest privilege
  { name: "admin", hierarchy: 1 },
  { name: "tournament_manager", hierarchy: 2 },
  { name: "reviewer", hierarchy: 3 },
  { name: "player", hierarchy: 4 },
  { name: "viewer", hierarchy: 5 }, // Lowest privilege
];
```

This hierarchy system is currently **not utilized** for validation - all checks use explicit role name matching, missing the opportunity for hierarchy-based authorization.

**Problems with current approach**:

1. **Inconsistent syntax**: 4 different patterns for checking the same concept
2. **No hierarchy awareness**: Can't check "admin or higher" easily
3. **Verbose and error-prone**: Easy to forget a role in multi-role checks
4. **Hard to maintain**: Adding new roles requires updating 20+ locations
5. **Type safety issues**: Role names are string literals, prone to typos
6. **Duplicated error messages**: Same authorization errors written differently everywhere

---

## Impact Analysis

### Code Duplication Metrics

- **Team enrichment logic**: ~150 lines duplicated across 8 locations
- **User with roles logic**: ~80 lines duplicated across 6 locations
- **Submission user enrichment**: ~40 lines duplicated across 4 locations
- **Orphaned records detection**: ~35 lines duplicated across 2 locations
- **Map construction patterns**: ~60 lines duplicated across 6 locations
- **Role validation logic**: ~100 lines duplicated across 28+ locations in 8 files

**Total estimated duplication**: ~465 lines of repetitive code

### Maintenance Challenges

1. **Inconsistent implementations**: Some team enrichment patterns fetch full user details, others just names
2. **Bug propagation**: A bug in team member fetching would need fixes in 8+ locations
3. **Performance optimization difficulty**: Improving query patterns requires changes across multiple files
4. **Type inconsistency**: Similar operations return slightly different shapes
5. **Testing complexity**: Same logic needs testing in multiple contexts

---

## Proposed Architecture

### Design Principles

1. **Single Responsibility**: Each helper does one thing well
2. **Type Safety**: Maintain full TypeScript type inference
3. **Performance**: No additional Convex function calls - all helpers are internal functions
4. **Composability**: Helpers can be combined for complex enrichment
5. **Domain Organization**: Helpers live in their relevant domain files

### File Organization Strategy

**Approach**: Keep helpers at the bottom of their domain files, clearly marked with comment sections:

```
/convex/
  teams.ts          # Team queries/mutations + team enrichment helpers at bottom
  users.ts          # User queries/mutations + user enrichment helpers at bottom
  submissions.ts    # Submission queries/mutations + submission helpers at bottom
  tournaments.ts    # Tournament queries/mutations + tournament helpers at bottom
  /lib/
    helpers.ts      # Generic data manipulation utilities (cross-domain)
```

**Benefits of this approach**:

- No circular dependencies
- Domain cohesion maintained
- Helpers close to their usage context
- Easy to find related functionality
- Follows existing pattern in users.ts (getUser, getRolesForUser already exist)

**Convention**: Helpers should be placed at the bottom of each file in a clearly marked section:

```typescript
// ============================================================================
// Helper Functions
// ============================================================================
```

---

## Proposed Helper Functions

### 1. Team Enrichment Helpers

**Location**: Bottom of `convex/teams.ts`

```typescript
// ============================================================================
// Helper Functions
// ============================================================================

import { groupBy, toIdMap } from "./lib/helpers";

/**
 * Enriches a single team with member count and optional member details.
 *
 * @param ctx - Query or Mutation context
 * @param teamId - Team ID to enrich
 * @param options - Configuration for what data to include
 * @returns Enriched team with member data
 */
export async function enrichTeamWithMembers(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  options?: {
    includeMemberDetails?: boolean;
    includeMemberRoles?: boolean;
    excludeUserId?: Id<"users">;
  },
): Promise<{
  team: Doc<"teams">;
  memberCount: number;
  members?: Array<Doc<"users"> & { memberRole?: "captain" | "member" }>;
}> {
  const team = await ctx.db.get(teamId);
  if (!team) throw new Error("Team not found");

  const teamMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();

  let filteredMembers = teamMembers;
  if (options?.excludeUserId) {
    filteredMembers = teamMembers.filter(
      (m) => m.userId !== options.excludeUserId,
    );
  }

  let memberDetails:
    | Array<Doc<"users"> & { memberRole?: "captain" | "member" }>
    | undefined;

  if (options?.includeMemberDetails) {
    const userIds = filteredMembers.map((m) => m.userId);
    const users = await ctx.db
      .query("users")
      .filter((q) => q.or(...userIds.map((id) => q.eq(q.field("_id"), id))))
      .collect();

    if (options?.includeMemberRoles) {
      const membershipByUserId = new Map(teamMembers.map((m) => [m.userId, m]));
      memberDetails = users.map((user) => {
        const membership = membershipByUserId.get(user._id);
        return {
          ...user,
          memberRole: membership?.role,
        };
      });
    } else {
      memberDetails = users;
    }
  }

  return {
    team,
    memberCount: filteredMembers.length,
    members: memberDetails,
  };
}

/**
 * Enriches multiple teams in parallel with member data.
 * More efficient than calling enrichTeamWithMembers in a loop.
 *
 * @param ctx - Query or Mutation context
 * @param teamIds - Array of team IDs to enrich
 * @param options - Configuration for what data to include
 * @returns Array of enriched teams with member data
 */
export async function enrichTeamsWithMembers(
  ctx: QueryCtx | MutationCtx,
  teamIds: Id<"teams">[],
  options?: {
    includeMemberDetails?: boolean;
    includeMemberRoles?: boolean;
  },
): Promise<
  Array<{
    team: Doc<"teams">;
    memberCount: number;
    members?: Array<Doc<"users"> & { memberRole?: "captain" | "member" }>;
  }>
> {
  // Fetch all teams
  const teams = await ctx.db
    .query("teams")
    .filter((q) => q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))))
    .collect();

  // Fetch all team members for these teams in one query
  const allTeamMembers = await ctx.db
    .query("teamMembers")
    .filter((q) => q.or(...teamIds.map((id) => q.eq(q.field("teamId"), id))))
    .collect();

  // Group team members by team ID using helper
  const membersByTeamId = groupBy(allTeamMembers, (member) => member.teamId);

  // If we need user details, fetch all users at once
  let usersMap: Map<Id<"users">, Doc<"users">> | undefined;
  if (options?.includeMemberDetails) {
    const allUserIds = allTeamMembers.map((m) => m.userId);
    const users = await ctx.db
      .query("users")
      .filter((q) => q.or(...allUserIds.map((id) => q.eq(q.field("_id"), id))))
      .collect();
    usersMap = toIdMap(users);
  }

  // Enrich each team
  return teams.map((team) => {
    const members = membersByTeamId.get(team._id) || [];
    let memberDetails:
      | Array<Doc<"users"> & { memberRole?: "captain" | "member" }>
      | undefined;

    if (options?.includeMemberDetails && usersMap) {
      memberDetails = members
        .map((member) => {
          const user = usersMap!.get(member.userId);
          if (!user) return null;
          return options?.includeMemberRoles
            ? { ...user, memberRole: member.role }
            : user;
        })
        .filter((u): u is NonNullable<typeof u> => u !== null);
    }

    return {
      team,
      memberCount: members.length,
      members: memberDetails,
    };
  });
}

/**
 * Gets team members with full user details.
 * Optimized for fetching members of a single team.
 *
 * @param ctx - Query or Mutation context
 * @param teamId - Team ID
 * @param options - Configuration options
 * @returns Array of users with optional role information
 */
export async function getTeamMembersWithUsers(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  options?: {
    includeRoles?: boolean;
    excludeUserId?: Id<"users">;
  },
): Promise<Array<Doc<"users"> & { memberRole?: "captain" | "member" }>> {
  const teamMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();

  const userIds = teamMembers
    .filter(
      (m) => !options?.excludeUserId || m.userId !== options.excludeUserId,
    )
    .map((m) => m.userId);

  if (userIds.length === 0) return [];

  const users = await ctx.db
    .query("users")
    .filter((q) => q.or(...userIds.map((id) => q.eq(q.field("_id"), id))))
    .collect();

  if (!options?.includeRoles) {
    return users;
  }

  return users.map((user) => {
    const membership = teamMembers.find((m) => m.userId === user._id);
    return {
      ...user,
      memberRole: membership?.role,
    };
  });
}
```

### 2. Role Validation Helpers

**Location**: Bottom of `convex/users.ts` (below existing `validateIsAdmin` function)

These helpers consolidate 28+ instances of role validation logic across 8 files into a single, hierarchy-aware system.

```typescript
// ============================================================================
// Role Validation Helper Functions
// ============================================================================

import { rolesToCreate } from "./data";

/**
 * Role hierarchy map for efficient lookups.
 * Lower hierarchy number = higher privilege.
 */
const ROLE_HIERARCHY = new Map(
  rolesToCreate.map((role) => [role.name, role.hierarchy]),
);

/**
 * Type for role names in the system.
 */
export type RoleName =
  | "dev"
  | "admin"
  | "tournament_manager"
  | "reviewer"
  | "player"
  | "viewer";

/**
 * Validates that a user has at least the specified minimum role privilege.
 * Uses role hierarchy to check if user's role is equal to or higher than required.
 *
 * @param user - User with roles to validate
 * @param minimumRole - Minimum required role (e.g., "tournament_manager")
 * @param options - Configuration options
 * @throws Error if user doesn't have required role
 *
 * @example
 * // User must be admin or dev (higher than admin)
 * validateMinimumRole(user, "admin");
 *
 * @example
 * // User must be tournament_manager, reviewer, admin, or dev
 * validateMinimumRole(user, "tournament_manager", {
 *   customMessage: "Tournament management access required"
 * });
 *
 * @example
 * // Check without throwing
 * if (!hasMinimumRole(user, "reviewer")) {
 *   return null; // early return instead of throw
 * }
 */
export function validateMinimumRole(
  user: UserWithRoles,
  minimumRole: RoleName,
  options?: {
    customMessage?: string;
  },
): void {
  if (!hasMinimumRole(user, minimumRole)) {
    const message =
      options?.customMessage ??
      `${minimumRole.replace("_", " ")} access or higher required`;
    throw new Error(message);
  }
}

/**
 * Checks if a user has at least the specified minimum role privilege.
 * Returns boolean instead of throwing.
 *
 * @param user - User with roles to check
 * @param minimumRole - Minimum required role
 * @returns true if user has required role or higher
 *
 * @example
 * const canManageTournaments = hasMinimumRole(user, "tournament_manager");
 * if (canManageTournaments) {
 *   // Show tournament management UI
 * }
 */
export function hasMinimumRole(
  user: UserWithRoles,
  minimumRole: RoleName,
): boolean {
  const requiredHierarchy = ROLE_HIERARCHY.get(minimumRole);
  if (requiredHierarchy === undefined) {
    throw new Error(`Unknown role: ${minimumRole}`);
  }

  // Check if user has any role with equal or higher privilege (lower hierarchy number)
  return user.roleNames.some((roleName) => {
    const userRoleHierarchy = ROLE_HIERARCHY.get(roleName);
    return (
      userRoleHierarchy !== undefined && userRoleHierarchy <= requiredHierarchy
    );
  });
}

/**
 * Validates that a user has at least one of the specified roles.
 * Useful for cases where multiple specific roles are allowed (not hierarchy-based).
 *
 * @param user - User with roles to validate
 * @param allowedRoles - Array of allowed role names
 * @param options - Configuration options
 * @throws Error if user doesn't have any of the allowed roles
 *
 * @example
 * // User must be either reviewer OR admin (not hierarchy-based)
 * validateHasAnyRole(user, ["reviewer", "admin"]);
 */
export function validateHasAnyRole(
  user: UserWithRoles,
  allowedRoles: RoleName[],
  options?: {
    customMessage?: string;
  },
): void {
  if (!hasAnyRole(user, allowedRoles)) {
    const message =
      options?.customMessage ??
      `One of the following roles required: ${allowedRoles.join(", ")}`;
    throw new Error(message);
  }
}

/**
 * Checks if a user has at least one of the specified roles.
 * Returns boolean instead of throwing.
 *
 * @param user - User with roles to check
 * @param allowedRoles - Array of allowed role names
 * @returns true if user has any of the allowed roles
 */
export function hasAnyRole(
  user: UserWithRoles,
  allowedRoles: RoleName[],
): boolean {
  return allowedRoles.some((role) => user.roleNames.includes(role));
}

/**
 * Legacy function - kept for backward compatibility.
 * New code should use validateMinimumRole(user, "admin") instead.
 *
 * @deprecated Use validateMinimumRole(user, "admin") instead
 */
export function validateIsAdmin(user: UserWithRoles, message?: string) {
  validateMinimumRole(user, "admin", { customMessage: message });
}
```

**Migration Examples**:

**Before** (reviewer.ts:15-20):

```typescript
if (!user.roleNames.includes("reviewer") && !user.roleNames.includes("admin")) {
  return 0;
}
```

**After**:

```typescript
if (!hasMinimumRole(user, "reviewer")) {
  return 0;
}
```

**Before** (tournaments.ts:231-234):

```typescript
if (
  !user.roleNames.includes("admin") &&
  !user.roleNames.includes("tournament_manager")
) {
  throw new Error("Admin or tournament manager access required");
}
```

**After**:

```typescript
validateMinimumRole(user, "tournament_manager");
```

**Before** (tournamentManager.ts:20):

```typescript
if (!["admin", "tournament_manager"].some((r) => user.roleNames.includes(r))) {
  throw new Error("Unauthorized");
}
```

**After**:

```typescript
validateMinimumRole(user, "tournament_manager", {
  customMessage: "Unauthorized",
});
```

**Benefits**:

1. **Single source of truth**: Role hierarchy logic in one place
2. **Type safety**: `RoleName` type prevents typos
3. **Clearer intent**: `validateMinimumRole(user, "reviewer")` is self-documenting
4. **Easier to maintain**: Changing role hierarchy only requires updating `data.ts`
5. **Consistent error messages**: Standardized authorization errors
6. **Flexibility**: Both throwing (`validateMinimumRole`) and non-throwing (`hasMinimumRole`) versions

### 3. User Enrichment Helpers

**Location**: Bottom of `convex/users.ts` (below role validation helpers)

The `getUser` and `getRolesForUser` functions already exist. We should:

1. Keep them as-is (they're well-designed)
2. Add bulk enrichment helper at the bottom:

```typescript
// ============================================================================
// Helper Functions
// ============================================================================

// (existing getUser and getRolesForUser functions already here)

import { groupBy, toIdMap } from "./lib/helpers";

/**
 * Enriches multiple users with roles in parallel.
 * More efficient than calling getUser in a loop.
 *
 * @param ctx - Query or Mutation context
 * @param userIds - Array of user IDs to enrich
 * @returns Array of users with roles
 */
export async function getUsersWithRoles(
  ctx: QueryCtx,
  userIds: Id<"users">[],
): Promise<UserWithRoles[]> {
  if (userIds.length === 0) return [];

  // Fetch all users
  const users = await ctx.db
    .query("users")
    .filter((q) => q.or(...userIds.map((id) => q.eq(q.field("_id"), id))))
    .collect();

  // Fetch all user roles for these users in one query
  const allUserRoles = await ctx.db
    .query("userRoles")
    .filter((q) => q.or(...userIds.map((id) => q.eq(q.field("userId"), id))))
    .collect();

  // Group user roles by user ID using helper
  const userRolesByUserId = groupBy(allUserRoles, (ur) => ur.userId);

  // Get unique role IDs
  const roleIds = Array.from(new Set(allUserRoles.map((ur) => ur.roleId)));
  const roles = await ctx.db
    .query("roles")
    .filter((q) => q.or(...roleIds.map((id) => q.eq(q.field("_id"), id))))
    .collect();

  const rolesMap = toIdMap(roles);

  // Enrich users with roles
  return users.map((user) => {
    const userRoleRecords = userRolesByUserId.get(user._id) || [];
    const userRoles = userRoleRecords
      .map((ur) => rolesMap.get(ur.roleId))
      .filter((r): r is Doc<"roles"> => r !== undefined);

    return {
      ...user,
      roles: userRoles,
      roleNames: userRoles.map((r) => r.name),
    };
  });
}
```

### 3. Generic Data Manipulation Helpers

**Location**: New file `convex/lib/helpers.ts`

```typescript
import type { Id, Doc } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Converts an array of documents to a Map keyed by _id for efficient lookups.
 *
 * @param items - Array of Convex documents with _id field
 * @returns Map keyed by document ID
 */
export function toIdMap<T extends { _id: Id<any> }>(
  items: T[],
): Map<T["_id"], T> {
  return new Map(items.map((item) => [item._id, item]));
}

/**
 * Groups items by a key function.
 *
 * @param items - Array of items to group
 * @param keyFn - Function to extract the grouping key
 * @returns Map of grouped items
 */
export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  return items.reduce<Map<K, T[]>>((acc, item) => {
    const key = keyFn(item);
    const group = acc.get(key) ?? [];
    group.push(item);
    acc.set(key, group);
    return acc;
  }, new Map());
}

/**
 * Batch fetches documents by IDs with efficient querying.
 * Automatically deduplicates IDs.
 *
 * @param ctx - Query or Mutation context
 * @param tableName - Name of the table to query
 * @param ids - Array of document IDs to fetch
 * @returns Map of documents keyed by ID
 */
export async function batchGetByIds<T extends keyof DataModel>(
  ctx: QueryCtx | MutationCtx,
  tableName: T,
  ids: Id<T>[],
): Promise<Map<Id<T>, Doc<T>>> {
  if (ids.length === 0) return new Map();

  // Deduplicate IDs
  const uniqueIds = Array.from(new Set(ids));

  // For small batches, use individual gets (more efficient)
  if (uniqueIds.length <= 5) {
    const docs = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
    return new Map(
      docs
        .map((doc, i) => [uniqueIds[i], doc])
        .filter(([, doc]) => doc !== null) as Array<[Id<T>, Doc<T>]>,
    );
  }

  // For larger batches, use filter query
  const docs = await ctx.db
    .query(tableName)
    .filter((q) => q.or(...uniqueIds.map((id) => q.eq(q.field("_id"), id))))
    .collect();

  return toIdMap(docs);
}

/**
 * Enriches items with related documents by foreign key.
 *
 * @param ctx - Query or Mutation context
 * @param items - Items to enrich
 * @param foreignKeyFn - Function to extract foreign key from item
 * @param relatedTable - Table name of related documents
 * @returns Items enriched with related documents
 */
export async function enrichWithRelated<
  TItem,
  TTable extends keyof DataModel,
  TKey extends keyof TItem,
>(
  ctx: QueryCtx | MutationCtx,
  items: TItem[],
  foreignKeyFn: (item: TItem) => Id<TTable>,
  relatedTable: TTable,
): Promise<Array<TItem & { related: Doc<TTable> | null }>> {
  const foreignKeys = items.map(foreignKeyFn);
  const relatedMap = await batchGetByIds(ctx, relatedTable, foreignKeys);

  return items.map((item) => ({
    ...item,
    related: relatedMap.get(foreignKeyFn(item)) || null,
  }));
}
```

**Usage of Generic Helpers**: These utilities are imported and used by all domain-specific enrichment functions:

- **`toIdMap`** - Used in:
  - `enrichTeamsWithMembers` (teams.ts) - for creating users map
  - `getUsersWithRoles` (users.ts) - for creating roles map
  - `enrichTeamsWithTournaments` (tournaments.ts) - for creating tournament map
  - `enrichSubmissionsWithUsers` (submissions.ts) - for creating users map
- **`groupBy`** - Used in:
  - `enrichTeamsWithMembers` (teams.ts) - for grouping team members by teamId
  - `getUsersWithRoles` (users.ts) - for grouping user roles by userId
- **`batchGetByIds`** - Can be used as an optimization for fetching related documents (not shown in examples but available for future use)
- **`enrichWithRelated`** - Generic helper for foreign key enrichment pattern (not shown in examples but available for future use)

### 4. Submission Enrichment Helpers

**Location**: Bottom of `convex/submissions.ts`

```typescript
// ============================================================================
// Helper Functions
// ============================================================================

import { toIdMap } from "./lib/helpers";

/**
 * Enriches teams with their tournament context.
 * Useful for dashboard and list views.
 *
 * @param ctx - Query or Mutation context
 * @param teams - Array of teams to enrich
 * @returns Teams with tournament information
 */
export async function enrichTeamsWithTournaments(
  ctx: QueryCtx | MutationCtx,
  teams: Doc<"teams">[],
): Promise<
  Array<{
    team: Doc<"teams">;
    tournament: Doc<"tournaments"> | null;
  }>
> {
  const tournamentIds = Array.from(new Set(teams.map((t) => t.tournamentId)));

  const tournaments = await ctx.db
    .query("tournaments")
    .filter((q) => q.or(...tournamentIds.map((id) => q.eq(q.field("_id"), id))))
    .collect();

  const tournamentMap = toIdMap(tournaments);

  return teams.map((team) => ({
    team,
    tournament: tournamentMap.get(team.tournamentId) || null,
  }));
}
```

### 5. Tournament Context Helper

**Location**: Bottom of `convex/tournaments.ts`

```typescript
// ============================================================================
// Helper Functions
// ============================================================================

import { toIdMap } from "./lib/helpers";

/**
 * Enriches submissions with user data.
 *
 * @param ctx - Query or Mutation context
 * @param submissions - Array of submissions to enrich
 * @param options - Configuration options
 * @returns Submissions with user data
 */
export async function enrichSubmissionsWithUsers(
  ctx: QueryCtx | MutationCtx,
  submissions: Doc<"submissions">[],
  options?: {
    includeFullUser?: boolean; // Include email, etc.
  },
): Promise<
  Array<
    Doc<"submissions"> & {
      user: Pick<Doc<"users">, "_id" | "name" | "email"> | null;
    }
  >
> {
  const userIds = Array.from(new Set(submissions.map((s) => s.userId)));
  const users = await ctx.db
    .query("users")
    .filter((q) => q.or(...userIds.map((id) => q.eq(q.field("_id"), id))))
    .collect();

  const userMap = toIdMap(users);

  return submissions.map((submission) => {
    const user = userMap.get(submission.userId);
    return {
      ...submission,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            email: user.email,
          }
        : null,
    };
  });
}
```

### 6. Data Integrity Helpers

**Location**: `convex/lib/helpers.ts` (add to existing file after generic utilities)

```typescript
import type { Id, Doc } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Result of orphaned records detection.
 */
export type OrphanedRecordsResult = {
  orphanedTeams: Doc<"teams">[];
  orphanedSubmissions: Doc<"submissions">[];
  orphanedTeamMembers: Doc<"teamMembers">[];
};

/**
 * Detects orphaned records across the database.
 * Consolidated from admin.ts duplicate implementations.
 *
 * @param ctx - Query or Mutation context
 * @returns Object containing arrays of orphaned records
 */
export async function detectOrphanedRecords(
  ctx: QueryCtx | MutationCtx,
): Promise<OrphanedRecordsResult> {
  // Get all entities for validation
  const [tournaments, teams, submissions, users, teamMembers] =
    await Promise.all([
      ctx.db.query("tournaments").collect(),
      ctx.db.query("teams").collect(),
      ctx.db.query("submissions").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("teamMembers").collect(),
    ]);

  // Build ID sets for fast lookup
  const tournamentIds = new Set(tournaments.map((t) => t._id));
  const teamIds = new Set(teams.map((t) => t._id));
  const userIds = new Set(users.map((u) => u._id));

  // Find orphaned teams (teams with non-existent tournaments)
  const orphanedTeams = teams.filter((t) => !tournamentIds.has(t.tournamentId));

  // Find orphaned submissions (submissions with non-existent teams or tournaments)
  const orphanedSubmissions = submissions.filter(
    (s) => !teamIds.has(s.teamId) || !tournamentIds.has(s.tournamentId),
  );

  // Find orphaned team members (members with non-existent teams or users)
  const orphanedTeamMembers = teamMembers.filter(
    (tm) => !teamIds.has(tm.teamId) || !userIds.has(tm.userId),
  );

  return {
    orphanedTeams,
    orphanedSubmissions,
    orphanedTeamMembers,
  };
}
```

---

## Migration Strategy

### Phase 1: Create Helper Functions (No Breaking Changes)

**Goal**: Introduce new helper functions without changing existing code

**Steps**:

1. Create `convex/lib/helpers.ts` with generic data manipulation utilities (toIdMap, groupBy, batchGetByIds, enrichWithRelated)
2. Add role validation helpers to bottom of `users.ts` (validateMinimumRole, hasMinimumRole, validateHasAnyRole, hasAnyRole, update validateIsAdmin)
3. Add helper functions section at bottom of `teams.ts` with team enrichment helpers
4. Add helper functions section at bottom of `users.ts` with bulk user enrichment (getUsersWithRoles)
5. Add helper functions section at bottom of `submissions.ts` with submission enrichment helpers
6. Add helper functions section at bottom of `tournaments.ts` with tournament enrichment helpers
7. Add integrity helpers to `convex/lib/helpers.ts` (detectOrphanedRecords)

**File Structure Changes**:

```
convex/
  teams.ts                    # Add helpers at bottom
  users.ts                    # Add helpers at bottom
  submissions.ts              # Add helpers at bottom
  tournaments.ts              # Add helpers at bottom
  lib/
    helpers.ts                # NEW: Generic utilities + integrity helpers
```

**Testing**:

- Unit test each helper function in isolation
- Verify type inference works correctly
- Test with various input sizes (0, 1, 10, 100 items)

**Deliverable**: New helper functions exist alongside old code, fully tested

### Phase 2: Refactor Role Validation (Highest Impact)

**Goal**: Replace the most pervasive pattern (role validation) first - affects 28+ locations

**Priority Order** (by frequency and impact):

1. `reviewer.ts` - Replace 3 instances with `validateMinimumRole(user, "reviewer")`
2. `tournamentManager.ts` - Replace 4 instances with `validateMinimumRole(user, "tournament_manager")`
3. `tournaments.ts` - Replace 5 instances with `validateMinimumRole` or `hasMinimumRole`
4. `teams.ts` - Replace 5 instances with `validateMinimumRole(user, "tournament_manager")`
5. `submissions.ts` - Replace 6 instances with role validation helpers
6. `submissionGroups.ts` - Replace 2 instances
7. `dashboard.ts` - Replace 1 instance with `validateMinimumRole(user, "admin")`
8. `users.ts` - Update existing `validateIsAdmin` to use new implementation

**Example Refactoring**:

**Before** (reviewer.ts:15-20):

```typescript
if (!user.roleNames.includes("reviewer") && !user.roleNames.includes("admin")) {
  return 0;
}
```

**After**:

```typescript
if (!hasMinimumRole(user, "reviewer")) {
  return 0;
}
```

**Before** (tournaments.ts:165-166, then 168):

```typescript
const isAdmin = user.roleNames.includes("admin");
const isTournamentManager = user.roleNames.includes("tournament_manager");
if (!isAdmin && !isTournamentManager) {
  throw new Error("Unauthorized");
}
```

**After**:

```typescript
validateMinimumRole(user, "tournament_manager", {
  customMessage: "Unauthorized",
});
```

**Testing for Each Refactor**:

1. Run existing integration tests
2. Test authorization flows - verify unauthorized users are blocked
3. Test with different role levels (dev, admin, tournament_manager, etc.)
4. Verify error messages are appropriate
5. Check that hierarchy works correctly (admin can access tournament_manager features)

### Phase 3: Refactor Team Enrichment

**Goal**: Replace the second most duplicated pattern (team enrichment)

**Priority Order** (by impact):

1. `tournaments.ts` - `getDetails`, `getLeaderboard`, `getWinner`
2. `teams.ts` - `getDetails`, `listTeamMembers`
3. `captain.ts` - `getDashboardData`, `getTeamsComparison`
4. `dashboard.ts` - `getUserDashboardData`

**Example Refactoring**:

**Before** (tournaments.ts:122-140):

```typescript
const teamsWithMembers = await Promise.all(
  teams.map(async (team) => {
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();
    const memberUsers = await Promise.all(
      members.map((member) => ctx.db.get(member.userId)),
    );
    return {
      ...team,
      memberCount: members.length,
      members: memberUsers.filter((u) => u !== null),
    };
  }),
);
```

**After**:

```typescript
const teamsWithMembers = await enrichTeamsWithMembers(
  ctx,
  teams.map((t) => t._id),
  {
    includeMemberDetails: true,
    includeMemberRoles: false,
  },
);
```

**Testing for Each Refactor**:

1. Run existing integration tests
2. Manually test affected pages in the UI
3. Compare query results before/after (use console.log temporarily)
4. Check Convex dashboard for query performance

### Phase 4: Refactor User Enrichment

**Goal**: Consolidate user with roles fetching

**Files to Update**:

1. `users.ts` - Add `getUsersWithRoles` helper
2. Replace individual `getUser` calls in loops with bulk fetching
3. Update all dashboard queries using user enrichment

**Testing**: Same as Phase 2

### Phase 5: Refactor Submission Enrichment

**Goal**: Consolidate submission + user data fetching

**Files to Update**:

1. `submissions.ts` - Add `enrichSubmissionsWithUsers`
2. `submissionGroups.ts` - Use new helper in `getWithSubmissions`
3. `reviewer.ts` - Use new helper in `getPendingSubmissions`
4. `admin.ts` - Use new helper in `getDashboardData`

### Phase 6: Refactor Integrity Checks

**Goal**: Eliminate duplicate orphaned records detection

**Files to Update**:

1. `admin.ts` - Replace inline logic with `detectOrphanedRecords`
2. Remove `getOrphanedRecordsData` function (duplicate)

### Phase 7: Refactor Map Construction Patterns

**Goal**: Use `toIdMap` and `groupBy` utilities consistently

**Files to Update**:

1. All files creating ID maps manually
2. Replace with `toIdMap(items)` or `groupBy(items, keyFn)`

---

## Implementation Checklist

### Pre-Implementation

- [ ] Review specification with team
- [ ] Identify any additional duplication patterns
- [ ] Set up branch: `feature/convex-deduplication`

### Phase 1: Helper Functions

- [ ] Create `convex/lib/helpers.ts` with generic utilities (toIdMap, groupBy, batchGetByIds, enrichWithRelated)
- [ ] Add integrity helpers (detectOrphanedRecords) to `convex/lib/helpers.ts`
- [ ] Add role validation helpers to bottom of `users.ts` (validateMinimumRole, hasMinimumRole, validateHasAnyRole, hasAnyRole)
- [ ] Update existing `validateIsAdmin` to use new implementation
- [ ] Add team enrichment helpers to bottom of `teams.ts`
- [ ] Add getUsersWithRoles helper to bottom of `users.ts`
- [ ] Add submission enrichment helpers to bottom of `submissions.ts`
- [ ] Add tournament enrichment helpers to bottom of `tournaments.ts`
- [ ] Write unit tests for all helpers
- [ ] Verify types and TypeScript compilation

### Phase 2: Role Validation

- [ ] Refactor `reviewer.ts` - Replace 3 role check instances
- [ ] Test reviewer dashboard and pending submissions
- [ ] Refactor `tournamentManager.ts` - Replace 4 role check instances
- [ ] Test tournament manager dashboard
- [ ] Refactor `tournaments.ts` - Replace 5 role check instances
- [ ] Test tournament CRUD operations
- [ ] Refactor `teams.ts` - Replace 5 role check instances
- [ ] Test team management
- [ ] Refactor `submissions.ts` - Replace 6 role check instances
- [ ] Test submission operations
- [ ] Refactor `submissionGroups.ts` - Replace 2 role check instances
- [ ] Refactor `dashboard.ts` - Replace 1 role check instance
- [ ] Test all authorization flows with different role levels
- [ ] Verify error messages are appropriate

### Phase 3: Team Enrichment

- [ ] Refactor `tournaments.ts` - `getDetails`
- [ ] Test tournament details page
- [ ] Refactor `tournaments.ts` - `getLeaderboard`
- [ ] Test leaderboard display
- [ ] Refactor `tournaments.ts` - `getWinner`
- [ ] Refactor `teams.ts` - `getDetails`
- [ ] Test team details page
- [ ] Refactor `teams.ts` - `listTeamMembers`
- [ ] Refactor `captain.ts` - `getDashboardData`
- [ ] Test captain dashboard
- [ ] Refactor `captain.ts` - `getTeamsComparison`
- [ ] Refactor `dashboard.ts` - `getUserDashboardData`
- [ ] Test user dashboard

### Phase 4: User Enrichment

- [ ] Add `getUsersWithRoles` to `users.ts`
- [ ] Identify all loops calling `getUser`
- [ ] Refactor to use bulk helper
- [ ] Test user lists and dashboards

### Phase 5: Submission Enrichment

- [ ] Add `enrichSubmissionsWithUsers` to `submissions.ts`
- [ ] Refactor `submissionGroups.ts` - `getWithSubmissions`
- [ ] Refactor `reviewer.ts` - `getPendingSubmissions`
- [ ] Refactor `admin.ts` - `getDashboardData`
- [ ] Test submission views

### Phase 6: Integrity Checks

- [ ] Refactor `admin.ts` - `getSystemHealth`
- [ ] Refactor `admin.ts` - `runIntegrityCheck`
- [ ] Remove duplicate `getOrphanedRecordsData`
- [ ] Test admin health dashboard

### Phase 7: Map Construction

- [ ] Find all manual Map construction
- [ ] Replace with `toIdMap` or `groupBy`
- [ ] Test affected queries

### Post-Implementation

- [ ] Full regression testing
- [ ] Performance benchmarking
- [ ] Update CLAUDE.md with helper patterns
- [ ] Code review
- [ ] Merge to main

---

## Testing Considerations

### Unit Testing Strategy

For each helper function:

1. **Empty input test**: `enrichTeamsWithMembers(ctx, [])`
2. **Single item test**: Verify correct enrichment
3. **Multiple items test**: Verify bulk efficiency
4. **Missing relations test**: Handle orphaned references gracefully
5. **Options test**: Verify all configuration options work

### Integration Testing

For each refactored query:

1. **Comparison test**: Compare output before/after refactoring
2. **UI test**: Manually verify affected pages work
3. **Performance test**: Check query times in Convex dashboard
4. **Edge case test**: Test with empty data, single item, large datasets

### Regression Testing Checklist

- [ ] Tournament list page loads
- [ ] Tournament details page shows all data
- [ ] Tournament leaderboard displays correctly
- [ ] Team details page shows members
- [ ] User dashboard shows teams and tournaments
- [ ] Captain dashboard shows all teams
- [ ] Admin dashboard shows statistics
- [ ] Reviewer queue shows pending submissions
- [ ] Submission details show submitter and teammates
- [ ] Team invitations show correct users
- [ ] Join requests display properly

---

## Performance Considerations

### Expected Improvements

1. **Reduced N+1 Queries**: Bulk fetching eliminates sequential database queries
2. **Query Consolidation**: Single filter query replaces multiple individual gets
3. **Memory Efficiency**: Map construction happens once, not per iteration

### Benchmarking Plan

For key queries before/after refactoring:

| Query                            | Before (ms) | After (ms) | Change |
| -------------------------------- | ----------- | ---------- | ------ |
| `tournaments.getDetails`         | TBD         | TBD        | TBD    |
| `teams.getDetails`               | TBD         | TBD        | TBD    |
| `captain.getDashboardData`       | TBD         | TBD        | TBD    |
| `reviewer.getPendingSubmissions` | TBD         | TBD        | TBD    |

**How to Measure**:

1. Use Convex dashboard query logs
2. Note execution time before refactoring
3. Compare after refactoring
4. Test with realistic dataset sizes

### Performance Safety Nets

1. **Batch size limits**: For `enrichTeamsWithMembers`, consider chunking for >100 items
2. **Query limits**: Use `.take()` for large result sets
3. **Caching**: Consider caching frequently accessed enriched data

---

## Benefits Summary

### Code Quality Benefits

1. **45% Reduction in Duplication**: ~465 lines of duplicate code eliminated
2. **Single Source of Truth**: Role validation and data enrichment logic centralized
3. **Easier Bug Fixes**: Fix once, fix everywhere
4. **Consistent Behavior**: All authorization and data enrichment works the same way
5. **Better Type Safety**: Centralized helpers have well-defined types with `RoleName` type preventing typos
6. **Hierarchy-Aware Authorization**: Role validation now uses the existing hierarchy system
7. **Composable Generic Utilities**: `toIdMap` and `groupBy` are used across all enrichment functions, eliminating repetitive Map construction patterns

### Developer Experience Benefits

1. **Faster Feature Development**: Reuse helpers for new features
2. **Lower Cognitive Load**: Less code to understand
3. **Clearer Intent**: `enrichTeamsWithMembers()` is self-documenting
4. **Easier Onboarding**: New developers learn patterns once
5. **Reusable Utilities**: Generic helpers like `toIdMap` and `groupBy` can be used for any future data enrichment needs

### Maintenance Benefits

1. **Performance Optimization**: Improve all usage by optimizing helper
2. **Testing**: Test helper once, benefit everywhere
3. **Refactoring**: Change structure once, not 8 times
4. **Documentation**: Document pattern once

---

## Risk Assessment

### Low Risks

- **Type safety**: TypeScript catches any breaking changes
- **Gradual migration**: Can refactor one query at a time
- **Existing helpers**: `getUser` pattern already proves this works

### Medium Risks

- **Performance regression**: Possible if helpers are less efficient
  - **Mitigation**: Benchmark each refactored query
  - **Rollback**: Keep old code in git history
- **Behavioral changes**: Helper might not exactly match old logic
  - **Mitigation**: Compare outputs before/after
  - **Testing**: Comprehensive integration tests

### Mitigations

1. **Feature flag**: Could add flag to toggle between old/new logic temporarily
2. **Parallel implementation**: Keep both versions during migration
3. **Monitoring**: Watch Convex logs for errors after deployment
4. **Gradual rollout**: Deploy to staging first, then production

---

## Success Metrics

### Quantitative Metrics

- [ ] Lines of code reduced by ~465 lines
- [ ] Code duplication score improved (use tool like jscpd)
- [ ] Role validation consolidated from 28+ instances to 4 helper functions
- [ ] Query performance maintained or improved
- [ ] Test coverage for helpers at 90%+
- [ ] All authorization flows working with hierarchy-aware validation

### Qualitative Metrics

- [ ] Team agrees code is more maintainable
- [ ] New features using helpers are faster to implement
- [ ] No regressions in production
- [ ] Documentation is clearer

---

## Open Questions

1. **Should we create a separate /helpers directory or keep helpers in domain files?**
   - **Recommendation**: Keep in domain files to avoid circular dependencies

2. **Should helpers throw errors or return null for missing data?**
   - **Recommendation**: Follow existing pattern - throw for unexpected missing data (like user not found), return null for optional relations

3. **How to handle different enrichment needs (some need full user, some just name)?**
   - **Recommendation**: Use options parameters like `includeFullUser` to control detail level

4. **Should we batch ALL database queries or just the most impactful ones?**
   - **Recommendation**: Start with high-impact patterns, expand based on performance monitoring

5. **What's the maximum batch size before we should chunk queries?**
   - **Recommendation**: Test with 100+ items; if performance degrades, add chunking

---

## Future Enhancements

After initial refactoring, consider:

1. **Query result caching**: Cache enriched data for frequently accessed entities
2. **Computed fields**: Store member counts directly on teams table
3. **Subscription optimization**: Consolidate real-time subscriptions
4. **Aggregation functions**: Replace manual counting with Convex aggregations (when available)
5. **GraphQL-style resolver pattern**: Further formalize data fetching patterns

---

## Conclusion

This refactoring eliminates ~465 lines of duplicate code, establishes reusable patterns, and improves maintainability without breaking existing functionality. The phased migration approach allows for safe, incremental changes with comprehensive testing at each step.

**Key Improvements**:

1. **Role Validation**: 28+ instances consolidated into hierarchy-aware helpers
2. **Data Enrichment**: Team, user, and submission enrichment patterns standardized
3. **Generic Utilities**: Reusable `toIdMap`, `groupBy`, and integrity helpers
4. **Type Safety**: New `RoleName` type prevents authorization bugs

**Estimated Timeline**:

- Phase 1 (Helpers): 1 day
- Phase 2 (Role validation): 1 day
- Phase 3 (Team enrichment): 1 day
- Phase 4-7 (Remaining): 1 day
- Testing & Documentation: 0.5 days

**Total**: 4.5 days of focused development

**Next Steps**: Review specification, approve approach, begin Phase 1 implementation.
