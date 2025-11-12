# Code Cleanup

## Unused Components Report

Generated: 2025-11-12

This document lists all components and exports in the `src/components` directory that are not being used anywhere in the codebase.

### Summary Statistics

- **Total unused components/exports:** 13
- **Total size:** ~25 KB
- **Categories:**
  - Unused UI components: 7
  - Unused form/input components: 3
  - Unused data table components: 2
  - Unused variant exports: 2

---

### Unused Components

#### 1. UserCard Component

**File:** `src/components/UserCard.tsx`
**Export:** `UserCard`
**Size:** 1,042 bytes
**Purpose:** Component for displaying a user card with their teams
**Status:** ❌ Not imported anywhere

```typescript
// Displays user information and their teams
export function UserCard({ userId }: { userId: Id<"users"> });
```

---

#### 2. UserStatsCard Component

**File:** `src/components/UserStatsCard.tsx`
**Export:** `UserStatsCard`
**Size:** 1,298 bytes
**Purpose:** Component for displaying user statistics (name, teams, total score)
**Status:** ❌ Not imported anywhere

```typescript
// Shows user stats including total score
export function UserStatsCard({ userId }: { userId: Id<"users"> });
```

---

#### 3. SignInForm Component

**File:** `src/components/auth/sign-in-form.tsx`
**Export:** `SignInForm`
**Size:** 2,874 bytes
**Purpose:** Authentication form component for sign-in/sign-up
**Status:** ❌ Not imported anywhere
**Note:** May have been replaced by Clerk authentication

```typescript
// Form for user authentication
export function SignInForm();
```

---

#### 4. ButtonDemo Component

**File:** `src/components/button-demo.tsx`
**Export:** `ButtonDemo`
**Size:** 2,610 bytes
**Purpose:** Demo/showcase component displaying all button variants, sizes, colors, and shapes
**Status:** ❌ Not imported anywhere
**Note:** Development/documentation component

```typescript
// Demonstrates all button variants
export function ButtonDemo();
```

---

#### 5. ConfirmButton Component

**File:** `src/components/ui/confirm-button.tsx`
**Export:** `ConfirmButton`
**Size:** 1,404 bytes
**Purpose:** Button component with confirmation state (requires double-click)
**Status:** ❌ Not imported anywhere

```typescript
// Button that requires confirmation before action
export function ConfirmButton(...)
```

---

#### 6. DatePicker Component

**File:** `src/components/ui/date-picker.tsx`
**Export:** `DatePicker`
**Size:** 1,278 bytes
**Purpose:** Date picker component using calendar and popover
**Status:** ❌ Not imported anywhere

```typescript
// Date selection component
export function DatePicker({ date, setDate }: DatePickerProps);
```

---

#### 7. TeamsDataTable Component

**File:** `src/components/teams/teams-data-table.tsx`
**Export:** `TeamsDataTable`
**Size:** 3,284 bytes
**Purpose:** Data table component for displaying teams with actions (edit, delete)
**Status:** ❌ Not imported anywhere
**Note:** Uses `DataTableSection` internally which IS used elsewhere

```typescript
// Data table for teams with CRUD operations
export function TeamsDataTable(...)
```

---

#### 8. TournamentsDataTable Component

**File:** `src/components/tournaments/tournaments-data-table.tsx`
**Export:** `TournamentsDataTable`
**Size:** 3,518 bytes
**Purpose:** Data table component for displaying tournaments with actions
**Status:** ❌ Not imported anywhere
**Note:** Uses `DataTableSection` internally which IS used elsewhere

```typescript
// Data table for tournaments with CRUD operations
export function TournamentsDataTable(...)
```

---

#### 9. DataTableColumnHeader Component

**File:** `src/components/ui/data-table/column-header.tsx`
**Export:** `DataTableColumnHeader`
**Size:** 1,909 bytes
**Purpose:** Column header component with sorting/visibility controls for data tables
**Status:** ❌ Not imported anywhere

```typescript
// Column header with sorting controls
export function DataTableColumnHeader<TData, TValue>(...)
```

---

#### 10. DataTableViewOptions Component

**File:** `src/components/ui/data-table/view-options.tsx`
**Export:** `DataTableViewOptions`
**Size:** 1,458 bytes
**Purpose:** View options component to toggle column visibility in data tables
**Status:** ❌ Not imported anywhere

```typescript
// Toggle column visibility in data tables
export function DataTableViewOptions<TData>(...)
```

---

#### 11. badgeVariants Export

**File:** `src/components/ui/badge.tsx`
**Export:** `badgeVariants`
**Size:** N/A (partial)
**Purpose:** Badge variant styling definitions
**Status:** ❌ Not imported (but `Badge` component is used)

```typescript
// CVA variants for badges
export const badgeVariants = cva(...)
```

---

#### 12. Button Type Constants

**File:** `src/components/ui/button.types.ts`
**Exports:** `BUTTON_COLORS`, `BUTTON_SHAPES`, `BUTTON_SIZES`, `BUTTON_VARIANTS`
**Size:** 970 bytes
**Purpose:** Button constant definitions
**Status:** ⚠️ Only imported in `button-demo.tsx` (unused) and `ui/button.tsx`

```typescript
export const BUTTON_VARIANTS = ["default", "primary", ...] as const;
export const BUTTON_SIZES = ["default", "xs", "sm", ...] as const;
// etc.
```

---

#### 13. inputVariants Export

**File:** `src/components/ui/input.tsx`
**Export:** `inputVariants`
**Size:** N/A (partial)
**Purpose:** Input variant styling definitions
**Status:** ❌ Not imported (but `Input` component is used)

```typescript
// CVA variants for inputs
export const inputVariants = cva(...)
```

---

### Recommendations

#### Safe to Remove

These components appear to be unused and can likely be safely removed:

1. **`button-demo.tsx`** - Development/documentation component
2. **`UserCard.tsx`** - Legacy dashboard component
3. **`UserStatsCard.tsx`** - Legacy dashboard component
4. **`sign-in-form.tsx`** - Replaced by Clerk authentication

#### Consider Removing

These components might have been replaced or are no longer needed:

5. **`ConfirmButton.tsx`** - Unused UI utility
6. **`DatePicker.tsx`** - Unused date selection component
7. **`TeamsDataTable.tsx`** - May have been replaced by direct use of `DataTableSection`
8. **`TournamentsDataTable.tsx`** - May have been replaced by direct use of `DataTableSection`
9. **`column-header.tsx`** - Unused data table component
10. **`view-options.tsx`** - Unused data table component

#### Review Before Removing

These exports might be needed for external documentation or future use:

11. **`badgeVariants`** - Could be made private if not needed externally
12. **`button.types.ts`** - Constants only used internally
13. **`inputVariants`** - Could be made private if not needed externally

---

### Next Steps

1. **Audit** - Review each component to confirm it's truly unused
2. **Test** - Run the application to ensure removing components doesn't break anything
3. **Remove** - Delete unused components in phases:
   - Phase 1: Remove obvious development/demo components
   - Phase 2: Remove legacy components
   - Phase 3: Clean up unused exports
4. **Commit** - Make separate commits for each phase for easy rollback if needed

---

---

## Unused Convex Functions Report

This section lists all Convex backend functions that are not being used anywhere in the codebase, as well as functions that could potentially be consolidated.

### Summary Statistics

- **Total unused Convex functions:** 13
- **Functions that could be consolidated:** 4 pairs
- **Empty/stub implementations:** 1
- **Admin-only utilities (may be used manually):** 2

---

### Unused Convex Functions

#### 1. admin.makeFirstUserAdmin

**File:** `convex/admin.ts:6-40`
**Type:** mutation
**Purpose:** Makes the first user in the system an admin (bootstrap function)
**Status:** ❌ Not imported anywhere in frontend
**Note:** May be intended for manual execution via Convex dashboard

```typescript
export const makeFirstUserAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    /* ... */
  },
});
```

---

#### 2. admin.addUserRole

**File:** `convex/admin.ts:42-48`
**Type:** mutation
**Purpose:** Add a role to a user
**Status:** ❌ Not imported anywhere AND has empty implementation
**Note:** Stub implementation with no logic

```typescript
export const addUserRole = mutation({
  args: { userId: v.id("users"), roleId: v.id("roles") },
  handler: async () => {}, // EMPTY!
});
```

**Recommendation:** Either implement or remove this function

---

#### 3. admin.setUserRole

**File:** `convex/admin.ts:50-89`
**Type:** mutation
**Purpose:** Set user role (replaces existing roles with new one)
**Status:** ❌ Not imported anywhere in frontend
**Note:** Fully implemented but unused. Mentioned in CLAUDE.md as "partially implemented/commented out"

```typescript
export const setUserRole = mutation({
  args: { userId: v.id("users"), role: v.union(...) },
  handler: async (ctx, args) => { /* ... */ }
});
```

---

#### 4. roles.getByUserId

**File:** `convex/roles.ts:4-23`
**Type:** query
**Purpose:** Get roles for a specific user
**Status:** ❌ Not imported anywhere in frontend
**Note:** There's an internal `getRolesForUser` helper in `users.ts` that does the same thing

```typescript
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    /* ... */
  },
});
```

**Consolidation Opportunity:** This duplicates logic from `users.ts:116-127` (internal helper). Consider exposing the helper or removing this query.

---

#### 5. submissions.getById

**File:** `convex/submissions.ts:189-196`
**Type:** query
**Purpose:** Get submission by ID (no ownership check)
**Status:** ❌ Not imported anywhere in frontend
**Note:** Similar to `submissions.get` but without ownership validation

```typescript
export const getById = query({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

**Consolidation Opportunity:** `submissions.get` (line 87-100) does similar thing but WITH ownership check. Consider consolidating.

---

#### 6. submissions.getUserSubmissions

**File:** `convex/submissions.ts:243-264`
**Type:** query
**Purpose:** Get user's submissions for a team within a date range
**Status:** ❌ Not imported anywhere in frontend
**Note:** Very specific query that overlaps with `submissions.list`

```typescript
export const getUserSubmissions = query({
  args: { teamId: v.id("teams"), startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    /* ... */
  },
});
```

**Consolidation Opportunity:** `submissions.list` (line 5-84) can do the same thing with flexible filters.

---

#### 7. submissions.getTeamSubmissions

**File:** `convex/submissions.ts:266-304`
**Type:** query
**Purpose:** Get team submissions for a specific date with user details
**Status:** ❌ Not imported anywhere in frontend
**Note:** Very specific query, likely for calendar view (see spec 04)

```typescript
export const getTeamSubmissions = query({
  args: { teamId: v.id("teams"), date: v.string() },
  handler: async (ctx, args) => {
    /* ... */
  },
});
```

---

#### 8. tournaments.remove

**File:** `convex/tournaments.ts:156-161`
**Type:** mutation
**Purpose:** Delete a tournament
**Status:** ⚠️ Imported in UI but throws "Not implemented"
**Note:** Used in `tournament-details-card.tsx:24` and `tournaments-data-table.tsx:33` but will always fail

```typescript
export const remove = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (_ctx, _args) => {
    throw new Error("Not implemented");
  },
});
```

**Recommendation:** Either implement or remove this and update UI components

---

#### 9. tournaments.determineWinner

**File:** `convex/tournaments.ts:350-413`
**Type:** mutation
**Purpose:** Admin function to determine tournament winner
**Status:** ❌ Not imported anywhere in frontend
**Note:** Admin utility, may be intended for manual execution

```typescript
export const determineWinner = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    /* ... */
  },
});
```

---

#### 10. teams.create

**File:** `convex/teams.ts:230-265`
**Type:** mutation
**Purpose:** Admin creates a team (legacy)
**Status:** ❌ Not imported anywhere in frontend
**Note:** Has TODO comment "add members if provided" (line 261)

```typescript
export const create = mutation({
  args: { name: v.string(), tournamentId: v.id("tournaments"), members: v.array(...) },
  handler: async (ctx, args) => { /* ... TODO: add members ... */ }
});
```

**Consolidation Opportunity:** Replaced by `teams.upsertUserTeam` (line 370-447) which users actually use. Consider removing this.

---

#### 11. teams.addMember

**File:** `convex/teams.ts:267-300`
**Type:** mutation
**Purpose:** Admin adds a member to a team by email
**Status:** ❌ Not imported anywhere in frontend
**Note:** Admin utility, may have been replaced by invitation system

```typescript
export const addMember = mutation({
  args: { teamId: v.id("teams"), userEmail: v.string(), role: v.union(...) },
  handler: async (ctx, args) => { /* ... */ }
});
```

**Consolidation Opportunity:** Team invitation system (`teamInvitations.inviteMember`) provides similar functionality with better UX.

---

#### 12. teams.recalculatePoints

**File:** `convex/teams.ts:619-705`
**Type:** mutation
**Purpose:** Admin utility to recalculate team points from submissions
**Status:** ❌ Not imported anywhere in frontend
**Note:** Admin utility for fixing data inconsistencies

```typescript
export const recalculatePoints = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    /* ... */
  },
});
```

---

#### 13. teams.getTeams (internal helper)

**File:** `convex/teams.ts:335-368`
**Type:** internal function (not exported mutation/query)
**Purpose:** Internal helper to get teams by user/tournament
**Status:** ⚠️ Only used once internally in `tournaments.ts:29`
**Note:** Could potentially be consolidated with `teams.list` query

---

### Potential Consolidation Opportunities

#### Pair 1: Duplicate Submission Getters

- **`submissions.get`** (line 87-100): Gets submission WITH ownership check
- **`submissions.getById`** (line 189-196): Gets submission WITHOUT ownership check
- **Recommendation:** Keep `get` for user-facing, add admin flag to bypass ownership check, remove `getById`

#### Pair 2: Overlapping Submission List Queries

- **`submissions.list`** (line 5-84): Flexible query with many filters
- **`submissions.listUserSubmissions`** (line 159-187): Get current user's submissions with optional state filter
- **`submissions.getUserSubmissions`** (line 243-264): Get user's submissions for team/date range
- **Recommendation:** `list` can handle all these cases. Consider removing the more specific ones.

#### Pair 3: Duplicate Team Creation

- **`teams.create`** (line 230-265): Admin creates team (unused, incomplete)
- **`teams.upsertUserTeam`** (line 370-447): User/admin creates or updates team (actively used)
- **Recommendation:** Remove `teams.create` as it's superseded

#### Pair 4: Duplicate Member Addition

- **`teams.addMember`** (line 267-300): Admin directly adds member by email
- **`teamInvitations.inviteMember`** (line 107-170): Captain invites member by email (better UX)
- **Recommendation:** Keep invitation system, remove direct add (unless needed for admin bulk operations)

---

### Functions Used Only in Specs (Planned Features)

These functions exist but may only be referenced in spec documents, not implemented in UI yet:

1. **`submissions.getTeamSubmissions`** - Referenced in spec 04 (submission calendar)
2. **`tournaments.determineWinner`** - Referenced in spec 02 (leaderboard)
3. **`teams.recalculatePoints`** - Referenced in spec 02 (admin utilities)

---

### Recommendations by Priority

#### High Priority (Safe to Remove)

1. **`admin.addUserRole`** - Empty stub implementation
2. **`teams.create`** - Incomplete, superseded by `upsertUserTeam`
3. **`submissions.getById`** - Redundant with `submissions.get`
4. **`submissions.getUserSubmissions`** - Redundant with `submissions.list`

#### Medium Priority (Consider Removing)

5. **`roles.getByUserId`** - Duplicates internal helper in `users.ts`
6. **`teams.addMember`** - Superseded by invitation system
7. **`submissions.getTeamSubmissions`** - Very specific, likely unused (check calendar spec status)

#### Low Priority (Keep or Implement)

8. **`admin.makeFirstUserAdmin`** - Keep as bootstrap utility
9. **`admin.setUserRole`** - Either implement UI or remove
10. **`tournaments.remove`** - Either implement or remove (currently breaks UI)
11. **`tournaments.determineWinner`** - Keep as admin utility (or add UI)
12. **`teams.recalculatePoints`** - Keep as admin utility for data fixes

---

### Notes

- This report was generated by searching for imports across the entire codebase
- Some components might be imported dynamically or through barrel exports
- Always test thoroughly after removing components
- Keep this file updated as components are removed or added
