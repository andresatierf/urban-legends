# Detail Cards Data Fetching Refactor

**Priority:** MEDIUM
**Status:** Planning
**Estimated Effort:** 2-3 days

## Problem Statement

Currently, detail cards across the application use inconsistent data fetching patterns. The recently implemented submission detail card (spec 16) introduced a superior pattern that should be adopted by other detail cards:

- **Tournament Details Card**: Receives raw documents as props, relies on parent page to fetch related data
- **Team Details Card**: Makes multiple separate queries inside the component (`api.tournaments.get`, `api.teams.listMembers`), leading to multiple round trips and loading states
- **User Details Card**: Receives data with roles pre-fetched, but inconsistent with other patterns

This inconsistency leads to:

- Multiple query round trips increasing latency
- Complex loading state management in components
- Difficult-to-type component props
- Scattered permission logic
- Inconsistent user experience across detail pages

## Current State

### Submission Details Pattern (The Model)

**Backend Query** (`convex/submissions.ts:207`, `getDetails`):

- Single query fetches ALL related data (submission, team, tournament, submitter, teammates, managedByUser)
- Enriches data (adds roles to users)
- Calculates derived data (isTeamExercise, participation rate)
- Determines permissions (canEdit, canApprove, canReject, canDelete)
- Returns complete, ready-to-use data object

**Frontend Component** (`src/components/submissions/submission-details-card.tsx:16-21`):

```typescript
interface SubmissionDetailsCardProps {
  data: NonNullable<
    ReturnType<typeof useQuery<typeof api.submissions.getDetails>>
  >;
  className?: string;
}
```

**Frontend Page** (`src/app/(all)/submissions/[submissionId]/page.tsx:21-24`):

```typescript
const data = useQuery(
  api.submissions.getDetails,
  submissionId ? { submissionId } : "skip",
);
```

**Benefits:**

- Single query, single loading state
- Type safety with derived types
- No queries inside component
- Pre-calculated permissions
- All related data ready to use

### Tournament Details Card (Needs Refactor)

**Current Implementation** (`src/components/tournaments/tournament-details-card.tsx:12-16`):

```typescript
type Props = {
  tournament: Doc<"tournaments">;
  teams: Doc<"teams">[];
  enableActions?: boolean;
  className?: string;
};
```

**Current Page** (`src/app/(all)/tournaments/[tournamentId]/page.tsx:40-57`):

```typescript
const tournament = useQuery(api.tournaments.get, ...);
const teams = useQuery(api.teams.list, ...);
const userTeam = useQuery(api.teams.get, ...);
const teamMembers = useQuery(api.teams.listMembers, ...);
```

**Problems:**

- Parent page must fetch multiple queries
- Props use raw documents (hard to type with enriched data)
- `enableActions` flag is unused in component
- Uses `useUser()` hook for permission check (could be pre-calculated)
- No derived data (tournament status could be calculated in backend)
- Team count could be more accurate with member counts

### Team Details Card (Needs Refactor)

**Current Implementation** (`src/components/teams/team-details-card.tsx:22-26`):

```typescript
type Props = {
  team: Doc<"teams">;
  score?: number;
  className?: string;
};
```

**Current Component Queries** (`src/components/teams/team-details-card.tsx:35-42`):

```typescript
const tournament = useQuery(
  api.tournaments.get,
  team ? { tournamentId: team.tournamentId } : "skip",
);
const teamMembers = useQuery(
  api.teams.listMembers,
  team ? { teamIds: team._id } : "skip",
);
```

**Problems:**

- Makes queries INSIDE the component (multiple round trips)
- Two separate loading states
- Score passed as separate prop but could be in team data
- Tournament info fetched separately
- Team members fetched separately
- Permission logic scattered (uses `useUser()` hook)
- No pre-calculated permissions (canEdit, canDelete, canLeave, canInvite)
- Captain status calculated in component

### User Details Card (Partially Correct)

**Current Implementation** (`src/components/users/user-details-card.tsx:9-12`):

```typescript
type Props = {
  user: Doc<"users"> & { roleNames: string[] };
  className?: string;
};
```

**Problems:**

- Roles are pre-fetched (good) but format is inconsistent
- Uses `useUser()` hook for permission check (should be pre-calculated)
- No canManageRoles permission flag
- Could include user statistics (team count, submission count)

## Requirements

### Functional Requirements

1. **Consistent Data Fetching Pattern**
   - User story: "As a developer, I want all detail cards to use the same data fetching pattern so that the codebase is maintainable"
   - All detail cards should receive a single `data` prop from a dedicated `getDetails` query
   - All related entities should be fetched in a single backend query
   - All derived data should be calculated in the backend

2. **Pre-Calculated Permissions**
   - User story: "As a developer, I want permissions pre-calculated in the backend so that components are simpler"
   - Each detail query should return permission flags (canEdit, canDelete, etc.)
   - No `useUser()` hooks in detail card components
   - All permission logic centralized in backend

3. **Type Safety**
   - User story: "As a developer, I want strong TypeScript types for detail card props so that I catch errors at compile time"
   - Use `ReturnType<typeof useQuery<...>>` pattern for prop types
   - No manual type definitions that can drift from backend

4. **Single Query Per Page**
   - User story: "As a user, I want detail pages to load quickly with minimal latency"
   - Each detail page should make a single query for the main entity details
   - No cascading queries or multiple separate queries
   - Parallel fetching of related entities in backend

5. **Enriched Data**
   - User story: "As a user, I want to see complete information without waiting for multiple loads"
   - Related entities fetched and included in response
   - Users should include roles where relevant
   - Derived data calculated once in backend

### Non-Functional Requirements

- **Performance**: Detail pages should load 30-50% faster with single query
- **Maintainability**: New developers can understand pattern from one example
- **Consistency**: All detail cards follow same pattern
- **Type Safety**: No type assertions or `as` casts needed in components
- **Backwards Compatibility**: Existing pages continue to work during migration

## Database Schema Changes

**No schema changes required.** All necessary data exists in current tables.

## Backend Implementation

### Tournament Details Query

#### `tournaments.getDetails`

**Purpose:** Fetch comprehensive tournament details with related entities and permissions

**Parameters:**

- `tournamentId: Id<"tournaments">` - The tournament to retrieve

**Returns:**

```typescript
{
  tournament: Doc<"tournaments">;
  teams: (Doc<"teams"> & { memberCount: number; members: Doc<"users">[] })[];
  userTeam: (Doc<"teams"> & { memberCount: number }) | null;
  status: "active" | "upcoming" | "ended";
  canEdit: boolean;
  canDelete: boolean;
  canViewLeaderboard: boolean;
  statistics: {
    totalTeams: number;
    totalParticipants: number;
    averageTeamSize: number;
  };
}
```

**Permission:**

- User must be authenticated
- Any authenticated user can view tournament details
- Only admins can edit/delete

**Implementation Notes:**

- Fetch all teams in tournament
- For each team, fetch member count and member details
- Find user's team in this tournament (if exists)
- Calculate tournament status based on dates
- Determine permissions based on user role
- Calculate statistics

**Edge Cases:**

- Tournament not found: Throw error
- No teams in tournament: Return empty array
- User not in any team: userTeam is null
- Tournament dates invalid: Handle gracefully

### Team Details Query

#### `teams.getDetails`

**Purpose:** Fetch comprehensive team details with related entities and permissions

**Parameters:**

- `teamId: Id<"teams">` - The team to retrieve

**Returns:**

```typescript
{
  team: Doc<"teams">;
  tournament: Doc<"tournaments"> | null;
  members: (Doc<"users"> & {
    roleNames: string[];
    role: "captain" | "member";
    membershipId: Id<"teamMembers">;
  })[];
  captain: (Doc<"users"> & { roleNames: string[] }) | null;
  userMembership: {
    role: "captain" | "member";
    userId: Id<"users">;
  } | null;
  statistics: {
    points: number;
    memberCount: number;
    submissionCount: number;
    approvalRate: number;
  };
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canLeave: boolean;
  canTransferCaptaincy: boolean;
  canManageMembers: boolean;
}
```

**Permission:**

- User must be authenticated
- Any authenticated user can view team details (teams are public within tournaments)
- Only captain can edit, delete, invite, transfer captaincy
- Only non-captain members can leave
- Admins have override permissions

**Implementation Notes:**

- Fetch team document
- Fetch tournament info
- Fetch all team members with their roles (captain/member)
- Fetch each user's system roles (admin, etc.)
- Find current user's membership status
- Calculate statistics (points from team doc, submission count from submissions, approval rate)
- Determine permissions based on user's membership role

**Edge Cases:**

- Team not found: Throw error
- Tournament deleted: Return null
- No captain: Handle gracefully (shouldn't happen but be defensive)
- User not a member: userMembership is null, limited permissions
- Captain trying to leave without transfer: canLeave is false

### User Details Query

#### `users.getDetails`

**Purpose:** Fetch comprehensive user details with related entities and permissions

**Parameters:**

- `userId: Id<"users">` - The user to retrieve

**Returns:**

```typescript
{
  user: Doc<"users"> & {
    roles: Doc<"roles">[];
    roleNames: string[];
  };
  statistics: {
    teamCount: number;
    submissionCount: number;
    approvedSubmissionCount: number;
    totalPointsEarned: number;
  };
  teams: (Doc<"teams"> & {
    tournamentName: string;
    role: "captain" | "member";
  })[];
  canManageRoles: boolean;
  isViewingSelf: boolean;
}
```

**Permission:**

- User must be authenticated
- Any authenticated user can view user details (users are public within the system)
- Only admins can manage roles

**Implementation Notes:**

- Fetch user document
- Fetch all user's roles
- Fetch statistics (team memberships, submission counts, points)
- Fetch all teams user is part of with tournament context
- Determine if viewing own profile
- Check if current user can manage roles (admin only)

**Edge Cases:**

- User not found: Throw error
- User has no teams: Return empty array
- User has no submissions: Counts are 0
- User has no roles: Only base "user" role

## Frontend Implementation

### Modified Components

#### `TournamentDetailsCard`

**Location:** `src/components/tournaments/tournament-details-card.tsx`

**New Props:**

```typescript
interface TournamentDetailsCardProps {
  data: NonNullable<
    ReturnType<typeof useQuery<typeof api.tournaments.getDetails>>
  >;
  className?: string;
}
```

**Changes:**

- Remove `useUser()` hook import and usage
- Remove `tournament`, `teams`, `enableActions` props
- Use `data` prop for all information
- Remove `isAdmin` check, use `data.canEdit` and `data.canDelete`
- Display status badge using `data.status`
- Show statistics from `data.statistics`
- Add user's team indicator if `data.userTeam` exists

**Benefits:**

- No queries inside component
- No permission logic in component
- All data readily available
- Type-safe props

#### `TeamDetailsCard`

**Location:** `src/components/teams/team-details-card.tsx`

**New Props:**

```typescript
interface TeamDetailsCardProps {
  data: NonNullable<ReturnType<typeof useQuery<typeof api.teams.getDetails>>>;
  className?: string;
}
```

**Changes:**

- Remove `useQuery` calls for tournament and members
- Remove `useUser()` hook usage
- Remove `team`, `score` props
- Use `data` prop for all information
- Use `data.tournament.name` instead of querying
- Use `data.statistics.points` instead of score prop
- Use `data.canEdit`, `data.canDelete`, `data.canInvite`, `data.canLeave`, etc. for permissions
- Use `data.userMembership.role === "captain"` instead of calculating

**Benefits:**

- Single loading state (in parent page)
- Simpler component logic
- No scattered queries
- All permissions pre-calculated

#### `UserDetailsCard`

**Location:** `src/components/users/user-details-card.tsx`

**New Props:**

```typescript
interface UserDetailsCardProps {
  data: NonNullable<ReturnType<typeof useQuery<typeof api.users.getDetails>>>;
  className?: string;
}
```

**Changes:**

- Remove `useUser()` hook usage
- Update `user` prop to `data`
- Use `data.canManageRoles` instead of `isAdmin`
- Add statistics display (team count, submission count)
- Show teams list

**Benefits:**

- Consistent with other detail cards
- Pre-calculated permissions
- Richer information display

### Modified Pages

#### `/tournaments/[tournamentId]/page.tsx`

**Changes:**

```typescript
// Before: Multiple queries
const tournament = useQuery(api.tournaments.get, ...);
const teams = useQuery(api.teams.list, ...);
const userTeam = useQuery(api.teams.get, ...);
const teamMembers = useQuery(api.teams.listMembers, ...);

// After: Single query
const data = useQuery(
  api.tournaments.getDetails,
  tournamentId ? { tournamentId } : "skip",
);

// Update component usage
<TournamentDetailsCard data={data} />

// Use data.teams for team list
// Use data.userTeam to check if user has team
```

**Benefits:**

- Single query reduces latency by 50-75%
- Single loading state
- No need to manually calculate team member counts
- All data consistent and fetched together

#### `/teams/[teamId]/page.tsx`

**Changes:**

```typescript
// Before: Component makes its own queries
const team = useQuery(api.teams.get, ...);
const members = useQuery(api.teams.listTeamMembers, ...);

// After: Single query
const data = useQuery(
  api.teams.getDetails,
  teamId ? { teamId } : "skip",
);

// Update component usage
<TeamDetailsCard data={data} />

// Use data.members for member list
// Use data.captain for captain display
// data.userMembership.role for role checks
```

**Benefits:**

- No queries in child components
- Single loading state
- Pre-calculated permissions
- Member data with roles included

#### `/users/[userId]/page.tsx`

**Changes:**

```typescript
// Before: Uses api.users.getById
const user = useQuery(api.users.getById, { id: resolvedParams.userId });

// After: Use new getDetails query
const data = useQuery(
  api.users.getDetails,
  resolvedParams.userId ? { userId: resolvedParams.userId } : "skip",
);

// Update component usage
<UserDetailsCard data={data} />
```

**Benefits:**

- Consistent pattern with other pages
- Richer user information
- Statistics display
- Team list

## Migration Plan

### Phase 1: Backend Implementation (Estimated: 1 day)

1. **Implement `tournaments.getDetails`** (3-4 hours)
   - Create query in `convex/tournaments.ts`
   - Fetch tournament, teams, members in parallel
   - Calculate status and statistics
   - Determine permissions
   - Test in Convex dashboard

2. **Implement `teams.getDetails`** (3-4 hours)
   - Create query in `convex/teams.ts`
   - Fetch team, tournament, members in parallel
   - Enrich members with roles and membership info
   - Calculate statistics
   - Determine permissions
   - Test in Convex dashboard

3. **Implement `users.getDetails`** (2-3 hours)
   - Create query in `convex/users.ts`
   - Fetch user with roles
   - Calculate statistics (team count, submission counts)
   - Fetch user's teams with tournament context
   - Determine permissions
   - Test in Convex dashboard

**Acceptance Criteria:**

- All queries return complete data structures
- Permission checks work correctly
- Statistics calculated accurately
- Edge cases handled (null entities, missing data)
- Type safety maintained

### Phase 2: Component Refactor (Estimated: 0.5 days)

1. **Refactor `TournamentDetailsCard`** (1-2 hours)
   - Update props interface
   - Remove `useUser()` hook
   - Update all references to use `data` prop
   - Update permission checks
   - Test with new query

2. **Refactor `TeamDetailsCard`** (1-2 hours)
   - Update props interface
   - Remove internal queries
   - Remove `useUser()` hook
   - Update all references to use `data` prop
   - Update permission checks
   - Test with new query

3. **Refactor `UserDetailsCard`** (1 hour)
   - Update props interface
   - Remove `useUser()` hook
   - Update permission checks
   - Add statistics display
   - Test with new query

**Acceptance Criteria:**

- Components render correctly with new data structure
- No queries made inside components
- Type errors resolved
- All permission checks use pre-calculated flags
- Loading states handled in parent pages

### Phase 3: Page Integration (Estimated: 0.5 days)

1. **Update `/tournaments/[tournamentId]/page.tsx`** (1 hour)
   - Replace multiple queries with single `getDetails` query
   - Update `TournamentDetailsCard` usage
   - Update teams list rendering
   - Update user team check
   - Test complete flow

2. **Update `/teams/[teamId]/page.tsx`** (1 hour)
   - Replace query with `getDetails` query
   - Update `TeamDetailsCard` usage
   - Update member list rendering
   - Update captain identification
   - Test complete flow

3. **Update `/users/[userId]/page.tsx`** (30 min)
   - Replace query with `getDetails` query
   - Update `UserDetailsCard` usage
   - Test complete flow

**Acceptance Criteria:**

- All pages load correctly
- Single loading state per page
- All features work as before
- Performance improved
- Type safety maintained

### Phase 4: Testing & Polish (Estimated: 0.5 days)

1. **Integration Testing** (2 hours)
   - Test all detail pages with various user roles
   - Verify permissions work correctly
   - Test edge cases (deleted entities, missing data)
   - Check performance improvements

2. **Code Quality** (1 hour)
   - Run Biome linting and formatting
   - Fix any type errors
   - Remove unused imports
   - Update CLAUDE.md if needed

3. **Documentation** (1 hour)
   - Add JSDoc comments to new queries
   - Document the pattern for future developers
   - Update any relevant docs

**Acceptance Criteria:**

- All tests pass
- Biome checks pass
- No console errors or warnings
- Performance metrics improved
- Code reviewed and approved

**Total Estimated Effort:** 2-3 days

## Testing Checklist

### Backend Tests

- [ ] `tournaments.getDetails` returns all required fields
- [ ] `tournaments.getDetails` calculates status correctly (active/upcoming/ended)
- [ ] `tournaments.getDetails` calculates statistics accurately
- [ ] `tournaments.getDetails` permissions work for admin and non-admin
- [ ] `teams.getDetails` returns all required fields
- [ ] `teams.getDetails` fetches all members with correct roles
- [ ] `teams.getDetails` calculates statistics accurately
- [ ] `teams.getDetails` permissions work for captain, member, non-member, admin
- [ ] `users.getDetails` returns all required fields
- [ ] `users.getDetails` calculates statistics accurately
- [ ] `users.getDetails` permissions work for admin and non-admin
- [ ] All queries handle null/missing related entities gracefully

### Component Tests

- [ ] `TournamentDetailsCard` renders with new data prop
- [ ] `TournamentDetailsCard` displays status badge correctly
- [ ] `TournamentDetailsCard` shows/hides actions based on permissions
- [ ] `TeamDetailsCard` renders with new data prop
- [ ] `TeamDetailsCard` displays all team information
- [ ] `TeamDetailsCard` shows/hides actions based on permissions
- [ ] `UserDetailsCard` renders with new data prop
- [ ] `UserDetailsCard` displays statistics
- [ ] All detail cards handle loading state (return null gracefully)

### Page Tests

- [ ] Tournament detail page makes single query
- [ ] Tournament detail page displays all information correctly
- [ ] Tournament detail page shows user's team if exists
- [ ] Team detail page makes single query
- [ ] Team detail page displays all information correctly
- [ ] Team detail page shows correct permissions for current user
- [ ] User detail page makes single query
- [ ] User detail page displays all information correctly
- [ ] All pages handle loading states correctly
- [ ] All pages handle error states correctly

### Performance Tests

- [ ] Tournament detail page loads 30-50% faster
- [ ] Team detail page loads 30-50% faster
- [ ] Reduced number of database queries per page
- [ ] No unnecessary re-renders
- [ ] Efficient data fetching with parallel queries

## Performance Optimization

### Query Optimization

- **Parallel Fetching**: Use `Promise.all` to fetch related entities in parallel
- **Indexed Queries**: Leverage existing indexes for team/member lookups
- **Minimal Data**: Only fetch fields that will be displayed
- **Efficient Calculations**: Calculate statistics once in backend instead of client

### Expected Improvements

| Page               | Before               | After              | Improvement                |
| ------------------ | -------------------- | ------------------ | -------------------------- |
| Tournament Details | 4 queries (serial)   | 1 query            | ~75% faster                |
| Team Details       | 1 query + 2 internal | 1 query            | ~66% faster                |
| User Details       | 1 query              | 1 query (enriched) | Similar speed, richer data |

## Success Metrics

**Performance:**

- Detail pages load 30-50% faster on average
- Reduced query count from 7 total across 3 pages to 3 total
- Single loading state per page improves perceived performance

**Code Quality:**

- Reduced component complexity (no queries in components)
- Improved type safety (no manual type definitions)
- Consistent pattern across all detail cards
- Reduced lines of code in components by ~30%

**Maintainability:**

- Single pattern to learn and follow
- Easier to add new detail cards in future
- Centralized permission logic
- Clear separation of concerns (data fetching vs presentation)

## Edge Cases

1. **Tournament Not Found**
   - Backend throws error
   - Frontend shows error state or redirects

2. **Team Not Found**
   - Backend throws error
   - Frontend shows error state or redirects

3. **User Not Found**
   - Backend throws error
   - Frontend shows error state or redirects

4. **Tournament Deleted But Teams Exist**
   - Return null for tournament
   - Display gracefully in UI

5. **Team Members Deleted From System**
   - Filter out null users
   - Show member count based on actual users

6. **User Not Member of Any Teams**
   - Return empty teams array
   - Show appropriate empty state

7. **User Has No Submissions**
   - Statistics show 0 counts
   - No errors thrown

8. **Tournament Dates Invalid**
   - Fallback to "upcoming" status
   - Log warning for admin review

9. **Concurrent Updates**
   - Convex handles consistency
   - Real-time updates ensure latest data shown

10. **Permission Edge Cases**
    - Last admin cannot have roles removed (existing check)
    - Captain cannot leave without transfer (new check in getDetails)
    - Admins have override permissions on all actions

## Future Enhancements

- Add caching layer for frequently accessed detail queries
- Implement optimistic updates for mutations from detail pages
- Add skeleton loading states for better UX
- Create detail card "templates" for new entities
- Add data prefetching on list page hover
- Implement detail page analytics tracking
- Add breadcrumb navigation with prefetched data
- Create shared detail card component with slot-based customization

## Dependencies

### Backend Dependencies

- Existing helper functions: `getCurrentUserOrThrow`, `getRolesForUser`, `validateIsAdmin`
- Existing queries: None (all new queries)
- Database tables: `tournaments`, `teams`, `teamMembers`, `users`, `userRoles`, `roles`, `submissions`

### Frontend Dependencies

- UI components: `DetailsCard`, `Badge`, `Button`, etc. (existing)
- Convex React: `useQuery`, `useMutation` (existing)
- Existing mutations: All work without changes

### Breaking Changes

- **None**: All changes are additive or internal refactors
- Existing queries remain available for backward compatibility
- Migration can be done incrementally per page

## Notes

- This refactor improves consistency across the codebase
- Performance improvements benefit all users
- Type safety improvements catch bugs earlier
- Pattern makes adding new detail pages easier
- Consider documenting this pattern in CLAUDE.md as the standard approach
- The submission details implementation (spec 16) proves this pattern works well
- Future detail cards should follow this pattern from the start
- This is a foundation for further optimizations (caching, prefetching, etc.)
