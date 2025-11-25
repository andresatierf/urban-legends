# Completed Features

This document tracks all completed features for the Urban Legends tournament tracking platform.

## Overview

The platform has successfully implemented **17 major features** representing approximately **34-43 days of development effort**. These features provide core functionality for tournament management, team collaboration, scoring, submission tracking with individual accountability, detailed submission views, comprehensive data fetching, polished loading states, role-based navigation, unified dashboard, and administration.

---

## ✅ 1. Team Joining / Self-Service

**Spec:** [specs/done/01-team-joining.md](specs/done/01-team-joining.md)
**PR:** #1
**Completed:** 2025-11-07
**Effort:** 3-5 days

### Summary

Complete self-service team management system allowing users to create, join, and manage teams without admin intervention.

### Implemented Features

- ✅ User self-service team creation for tournaments
- ✅ Join existing teams (with captain approval via join requests)
- ✅ Leave teams with automatic captain transfer
- ✅ Team invitation system by email
- ✅ Accept/reject invitations
- ✅ Cancel join requests
- ✅ Public/private team visibility settings
- ✅ Team size constraints from tournaments

### Backend Mutations

- `teams.createUserTeam` - Create new team and become captain
- `teams.requestToJoin` - Request to join public teams
- `teams.approveJoinRequest` / `teams.rejectJoinRequest` - Captain approval
- `teams.cancelJoinRequest` - Cancel pending requests
- `teams.inviteMember` - Captain can invite users by email
- `teams.respondToInvitation` - Accept/reject invitations
- `teams.leaveTeam` - Leave team with captain transfer requirement
- `teams.transferCaptaincy` - Transfer captain role to another member

### Frontend Components

- `JoinTeamButton` - Request to join public teams
- `JoinRequestsList` - Captain/admin view to manage requests
- `TeamInvitationsList` - User view of pending invitations
- `InviteMemberDialog` - Captain interface to invite users
- `CreateTournamentTeamForm` - Team creation with visibility

### Database Schema

- `teamInvitations` table - Track invitations with expiry and status
- `joinRequests` table - Track join requests with approval workflow
- `teams.visibility` - Public/private team visibility
- `teams.maxMembers` - Optional team size limit

---

## ✅ 2. Leaderboard & Scoring System

**Spec:** [specs/done/02-leaderboard-scoring.md](specs/done/02-leaderboard-scoring.md)
**PR:** #5
**Completed:** 2025-11-12
**Effort:** 2-3 days

### Summary

Comprehensive tournament scoring and leaderboard system with flexible point configuration, real-time rankings, and detailed statistics.

### Implemented Features

- ✅ Point tracking per team (teams.points field)
- ✅ Flexible scoring configuration per tournament
  - Base/Advanced tiers for individual exercises
  - Base/Advanced tiers for team exercises
  - Configurable team exercise threshold (% of members required)
- ✅ Automatic point calculation on submission approval/rejection
- ✅ Leaderboard query with ranking and tie-breaking logic
- ✅ Tournament winner determination
- ✅ Leaderboard UI page with podium display
- ✅ Team statistics page with performance metrics
- ✅ Tournament statistics (total teams, submissions, participation rate)
- ✅ Admin recalculatePoints utility

### Backend Implementation

**Schema Changes:**

- `teams.points` - Track team score
- `teams.lastActivityAt` - Timestamp for tie-breaking
- `tournaments.winnerId` - Reference to winning team
- `tournaments.completedAt` - Tournament completion timestamp
- `tournaments.scoringConfig` - Flexible scoring configuration
- `submissions.tier` - Base or advanced tier
- `submissions.pointsEarned` - Points awarded for submission

**Mutations:**

- `submissions.approve` - Increment team points on approval
- `submissions.reject` - Decrement points if previously approved
- `submissions.remove` - Decrement points if approved submission deleted
- `tournaments.determineWinner` - Admin can set tournament winner
- `teams.recalculatePoints` - Admin utility to fix point inconsistencies

**Queries:**

- `tournaments.getLeaderboard` - Ranked list with tie-breaking logic
- `tournaments.getWinner` - Get winner details with members
- `tournaments.getStatistics` - Tournament-wide metrics
- `teams.getStatistics` - Detailed team performance stats

### Frontend Implementation

- `TournamentLeaderboard` - Full leaderboard table with rankings
- `LeaderboardPodium` - Visual podium for top 3 teams
- `WinnerAnnouncement` - Tournament champion display
- `TeamStatisticsCard` - Team performance metrics
- `/tournaments/[id]/leaderboard` page
- `/teams/[id]/statistics` page

### Scoring System

- Per-tournament configurable scoring
- Individual exercises: customizable base/advanced points
- Team exercises: higher points when threshold met (e.g., 50% of members)
- Tie-breaking: points > lastActivityAt > creation date
- Real-time updates via Convex reactivity

---

## ✅ 3. Team Edit & Delete

**Spec:** [specs/done/03-team-edit-delete.md](specs/done/03-team-edit-delete.md)
**PR:** #3 (Delete), Built-in (Edit via upsertUserTeam)
**Completed:** 2025-11-11
**Effort:** 0.5 days

### Summary

Complete team management capabilities allowing captains and admins to edit team details and delete teams with proper cascade cleanup.

### Implemented Features

- ✅ Edit team name and visibility
- ✅ Delete teams with cascade cleanup
- ✅ Permission checks (captains + admins only)
- ✅ Complete cascade deletion:
  - Remove all team members
  - Cancel pending join requests
  - Delete all submissions
  - Cancel pending invitations

### Backend Mutations

- `teams.upsertUserTeam` - Create or update team (handles both cases)
  - Update team name with uniqueness validation
  - Update team visibility (public/private)
  - Permission checks for captain/admin
- `teams.removeUserTeam` - Delete team with cascade cleanup
  - Removes members, submissions, requests, invitations
  - Captain or admin only

### Frontend Components

- `UpsertTeamFormDialog` - Edit team form (reuses create form)
- Integrated into `TeamDetailsCard` with Edit button
- Delete confirmation in team details

### Validation & Safety

- Name uniqueness within tournament
- Permission checks (captain or admin)
- Cascade deletion prevents orphaned data
- Confirmation required for deletion

---

## ✅ 4. Admin Role Management

**Spec:** [specs/done/05-admin-role-management.md](specs/done/05-admin-role-management.md)
**PR:** #6
**Completed:** 2025-11-12
**Effort:** 1 day

### Summary

Complete role management UI and backend allowing admins to assign and remove roles with proper validation and audit tracking.

### Implemented Features

- ✅ Complete `addUserRole` mutation with validation
- ✅ Complete `removeUserRole` mutation with safety checks
- ✅ `listRoles` query with user counts
- ✅ Role assignment tracking (assignedBy, assignedAt)
- ✅ UI components for role management
- ✅ Permission checks (admin-only, cannot remove last admin)
- ✅ Self-demotion warnings

### Backend Implementation

**Schema Changes:**

- `userRoles.assignedBy` - Track who assigned the role
- `userRoles.assignedAt` - Track when role was assigned

**Mutations:**

- `admin.addUserRole` - Assign role to user
  - Admin-only access
  - Validates role exists
  - Checks for duplicate role assignment
  - Records assignment metadata
- `admin.removeUserRole` - Remove role from user
  - Cannot remove "user" base role
  - Cannot remove last admin
  - Warns on self-demotion
  - Validates role ownership

**Queries:**

- `admin.listRoles` - List all roles with user counts

### Frontend Components

- `RemoveRoleDialog` - Confirmation dialog for role removal
- `ManageRolesForm` - Assign/remove roles interface
- `RolesBadgeList` - Display roles as badges with inline removal
- Integrated into user detail pages

### Safety Features

- Cannot remove last admin user
- Extra confirmation for self-demotion
- Cannot remove base "user" role
- Audit trail of role changes (assignedBy, assignedAt)
- Admin-only access to all role mutations

---

## ✅ 5. Team Member Management UI

**Spec:** [specs/done/06-team-member-management.md](specs/done/06-team-member-management.md)
**PR:** Built-in (implemented via invitation system in PR #1)
**Completed:** 2025-11-07 (via PR #1)
**Effort:** Included in Team Joining feature

### Summary

Complete team roster management UI allowing captains to manage team members, transfer captaincy, and handle team membership through an invitation-based system (implemented differently than originally specified, but with superior UX).

### Implemented Features

- ✅ View team roster with member roles (captain/member badges)
- ✅ Invite members by email (invitation system)
- ✅ Remove team members (captain permission)
- ✅ Leave team functionality with captain transfer requirement
- ✅ Transfer captaincy to another member
- ✅ Join requests for public teams
- ✅ Accept/reject team invitations
- ✅ Role badges with crown icon for captains

### Backend Implementation

**Mutations:**

- `teams.removeMember` - Captain can remove members (line 302-331 in teams.ts)
- `teams.leaveTeam` - Members can leave with captain transfer check (line 450-496)
- `teams.transferCaptaincy` - Transfer captain role (line 499-522)
- `teamInvitations.inviteMember` - Invite users by email with expiry
- `teamInvitations.respondToInvitation` - Accept/reject invitations
- `joinRequests.requestToJoin` - Request to join public teams
- `joinRequests.approveJoinRequest` / `rejectJoinRequest` - Captain approval

**Queries:**

- `teams.listTeamMembers` - Get team roster with role information (line 202-228)
- `teamInvitations.listTeamInvitations` - View pending/past invitations
- `joinRequests.listJoinRequests` - View join requests for team

### Frontend Components

- `TeamMemberCard` - Display member with role badge and remove action
- `InviteMemberFormDialog` - Captain interface to invite users by email
- `TransferCaptaincyFormDialog` - Transfer captain role with confirmation
- `InvitedUsersList` - View and manage pending invitations
- `JoinRequestsList` - Captain view to approve/reject join requests
- Team details page integrated member management (`/teams/[teamId]/page.tsx`)

### Implementation Notes

**Differs from Original Spec:**
The spec originally called for direct member addition (`teams.addMember` with captain permissions), but the implementation uses a more sophisticated **invitation system** instead:

- Email-based invitations with 7-day expiry
- Accept/reject workflow for better user control
- Join requests for public teams
- Better audit trail and notification support
- Prevents adding users without their consent

This approach provides superior UX and is actually more feature-rich than the original specification.

**Permission Model:**

- Team captains can: invite members, remove members (except captain), transfer captaincy, approve join requests
- Regular members can: leave team (with captain transfer check)
- Admins have: full management capabilities
- Protected operations: cannot remove captain without transfer, cannot leave as last captain without deleting team

---

## ✅ 6. Code Quality & Type Safety

**Spec:** [specs/done/08-code-quality-fixes.md](specs/done/08-code-quality-fixes.md)
**PR:** #4
**Completed:** 2025-11-11
**Effort:** 1 day

### Summary

Comprehensive code quality improvements addressing TypeScript errors, linting issues, and type safety concerns across the entire codebase.

### Implemented Features

- ✅ Fixed all TypeScript type errors (0 errors)
- ✅ Removed non-null assertions with proper validation
- ✅ Environment variable validation at startup
- ✅ Webhook validation improvements
- ✅ Fixed linting errors (0 errors, 2 acceptable warnings)
- ✅ Improved null checking throughout codebase

### Backend Fixes

- `convex/auth.config.ts` - Validate CLERK_JWT_ISSUER_DOMAIN at startup
- `convex/http.ts` - Add validation for Svix headers and webhook secret
- `convex/tournaments.ts` - Remove unreachable code and non-null assertions
- `convex/submissions.ts` - Remove non-null assertions (validated by schema)
- `convex/teams.ts` - Remove non-null assertions (validated by conditionals)
- `convex/users.ts` - Remove non-null assertions (validated by conditionals)

### Frontend Fixes

- `src/components/TournamentTeams.tsx` - Proper null checking for team/user lookups
- `src/app/(all)/submissions/page.tsx` - Add null checking
- `src/app/ConvexClientProvider.tsx` - Validate NEXT_PUBLIC_CONVEX_URL at startup
- `src/components/svg-icon.tsx` - Add aria-label for accessibility
- `src/components/ui/field.tsx` - Use error message as key

### Biome Configuration

- Disabled `noUnknownAtRules` for Tailwind CSS compatibility
- Updated schema to 2.3.4
- Enabled Tailwind CSS parser

### Result

- Zero TypeScript errors
- Zero linting errors
- 2 acceptable warnings (document.cookie, noExplicitAny in specific cases)
- Improved type safety and validation throughout

---

## ✅ 7. Submission Progress Calendar

**Spec:** [specs/done/04-submission-calendar.md](specs/done/04-submission-calendar.md)
**PR:** #8
**Completed:** 2025-11-13
**Effort:** 1-2 days

### Summary

Complete submission calendar visualization system allowing users to track their daily submission progress with color-coded dates, statistics, and interactive navigation.

### Implemented Features

- ✅ Interactive calendar grid with month/year navigation
- ✅ Color-coded date cells by submission state
  - Green for approved submissions with points displayed
  - Yellow for pending submissions
  - Red for rejected submissions
  - Gray for empty dates
- ✅ Click date to create/edit submissions
- ✅ Team selector for multi-team users (persists to localStorage)
- ✅ Calendar statistics panel (completion rate, streak, submission counts)
- ✅ Configurable week start day (Sunday-Saturday)
- ✅ Tournament date range restrictions
- ✅ Toggle between calendar and list views
- ✅ Responsive design for mobile/tablet/desktop
- ✅ Keyboard navigation and accessibility (ARIA labels)
- ✅ Hover tooltips with submission details

### Backend Implementation

**Queries:**

- `submissions.getMonthSubmissions` - Fetch submissions for specific month/year by team
  - Returns map of date → submission data for efficient calendar rendering
  - Validates user is member of team
  - Filters by month and year
- `submissions.getTeamStatistics` - Calculate comprehensive team progress metrics
  - Total days, completion rate, current streak calculation
  - Counts by submission state (approved/pending/rejected)
  - Handles tournament date ranges and edge cases

### Frontend Components

- `SubmissionCalendar` - Full calendar grid layout (`src/components/submissions/submission-calendar.tsx`)
  - 7-column grid with proper week structure
  - Real-time data via Convex queries
  - Handles timezone and date edge cases
  - Week start preference (configurable)
  - Legend for color-coded states

- `CalendarDateCell` - Interactive date cells (`src/components/submissions/calendar-date-cell.tsx`)
  - Color-coded by submission state (green/yellow/red/gray)
  - Shows points earned per submission
  - Accessible with ARIA labels and keyboard navigation
  - Hover tooltips with submission details
  - Click handlers for create/edit

- `CalendarHeader` - Month navigation (`src/components/submissions/calendar-header.tsx`)
  - Prev/Next/Today buttons
  - Restricts navigation to tournament date ranges
  - Highlights current month

- `CalendarStatistics` - Progress metrics panel (`src/components/submissions/calendar-statistics.tsx`)
  - Completion rate progress bar
  - Current streak with fire emoji
  - Submission status breakdown
  - Motivational messages for achievements

- `TeamSelector` - Dropdown for multi-team users (`src/components/submissions/team-selector.tsx`)
  - Persists selection to localStorage
  - Shows tournament context for each team
  - Unique IDs with useId hook

### Page Integration

**Submissions Page (`src/app/(all)/submissions/page.tsx`):**

- Toggle between calendar view and list view with icons
- Calendar view pre-fills team and date when creating new submission
- Empty state when user has no teams
- Real-time updates via Convex subscriptions

**Settings Page (`src/app/(all)/settings/page.tsx`):**

- Week start day preference selector
- Persists to localStorage
- Created new settings page for user preferences

**UI Components:**

- Added `Tabs` component (`src/components/ui/tabs.tsx`) for view switching
- Updated `Card` component for better calendar layout

### Implementation Notes

**Replaced Commented Code:**

The spec mentioned 77 lines of commented calendar code. This implementation completely replaced that with a full-featured, production-ready calendar system.

**Key Features Not in Original Spec:**

- Configurable week start day (added based on regional preferences)
- Settings page for user preferences
- Team selector with localStorage persistence
- Comprehensive statistics panel with streak tracking
- Motivational messages for achievements
- Tabs component for view switching

**Accessibility:**

- ARIA labels on all interactive elements
- Keyboard navigation support
- Semantic HTML with proper roles
- Screen reader friendly descriptions

**Performance:**

- Efficient date calculations
- Memoized calendar grid generation
- LocalStorage for preference persistence
- Convex real-time subscriptions for data updates

---

## ✅ 8. Submission Detail Page

**Spec:** [specs/done/16-submission-detail-page.md](specs/done/16-submission-detail-page.md)
**PR:** #9
**Completed:** 2025-11-14
**Effort:** 2-3 days

### Summary

Comprehensive submission detail page providing full visibility into submission information, participants, approval status, and context for team members, captains, and admins.

### Implemented Features

- ✅ Complete submission information display (date, description, tier, state, points)
- ✅ Team exercise vs individual exercise classification
- ✅ Submitter and participant information with avatars
- ✅ Tournament and team context with navigation links
- ✅ Approval/rejection metadata (who managed, when)
- ✅ Admin action controls (approve, reject, delete)
- ✅ Edit capability for submission owners
- ✅ Permission-based access control (owner, team members, admins)
- ✅ Real-time updates via Convex subscriptions

### Backend Implementation

**Query:**

- `submissions.getDetail` - Comprehensive detail query with permission checks
  - Fetches submission with all related entities (team, tournament, users)
  - Validates user is owner, team member, or admin
  - Calculates team exercise status and participation rate
  - Returns permission flags (canEdit, canApprove, canReject, canDelete)
  - Enriches users with role information
  - Handles deleted entities gracefully

**Permission Model:**

- Access allowed for: submission owner, team members, admins
- Edit allowed for: owner (if not approved)
- Approve/Reject allowed for: admins (if pending)
- Delete allowed for: owner and admins (if not rejected/deleted)

### Frontend Implementation

**Components:**

- `SubmissionDetailsCard` - Main detail display card
  - Uses DetailsCard pattern for consistency
  - Shows all submission fields with badges
  - Action dropdown with role-based buttons
  - Integrates edit dialog
  - Links to related entities (team, tournament)
- `SubmitterInfo` - Participant display section
  - Shows submitter with avatar and badges
  - Lists all teammates who participated
  - Displays admin badges where applicable
  - Responsive card layout

**Page:**

- `/submissions/[submissionId]` - Complete detail page
  - Replaced edit-only view with comprehensive display
  - Back navigation to submissions list
  - Two-section layout: details + participants
  - Loading states with skeleton placeholders

### Key Features

**Transparency:**

- Complete visibility into submission status
- Clear approval workflow tracking
- Who approved/rejected with metadata
- Points calculation display

**Navigation:**

- Links to team detail page
- Links to tournament detail page
- Back to submissions list
- Edit submission (if allowed)

**Role-Based Actions:**

- Submission owner: Edit (if pending), Delete
- Team members: View only
- Admins: Approve, Reject, Delete, View all details

**Accessibility:**

- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliant badges

**Real-Time Updates:**

- Instant reflection of approval/rejection
- Live state changes via Convex
- Toast notifications for actions
- Optimistic UI updates

### Implementation Notes

**Permission Architecture:**

The backend enforces strict access control:
- Submission owner can always view
- Any team member can view (not just captain)
- Admins have full access
- Non-authorized users get permission error

**Data Enrichment:**

Query fetches and enriches related data:
- Submission with full details
- Team and tournament information
- Submitter with role information
- All teammates with role information
- Manager (admin who approved/rejected)

**Team Exercise Detection:**

Reuses existing calculation logic:
- Counts teammates participating
- Calculates participation rate vs total team size
- Compares to tournament threshold
- Determines team vs individual exercise
- Displays appropriately in UI

**Points Display:**

- Shows points earned if approved
- Explains tier (base vs advanced)
- Shows exercise type (team vs individual)
- Contextualizes with tournament scoring rules

### Database Schema

**No schema changes required.**

Used existing fields:
- `submissions.managedBy` - Who approved/rejected
- `submissions.pointsEarned` - Points calculated on approval
- `submissions.tier` - Base or advanced classification
- `submissions.teammates` - Participating users array

### Benefits

**For Users:**

- Understand submission status clearly
- See who participated in activity
- Track points earned
- Know who approved/rejected and why

**For Team Captains:**

- Monitor team submissions
- Verify participation
- Track team performance
- View approval history

**For Admins:**

- Complete context for approval decisions
- Quick access to approve/reject actions
- View all submission details
- Audit trail of approvals

**For Platform:**

- Improved transparency
- Reduced confusion about status
- Better user experience
- Enhanced trust in approval process

---

## ✅ 9. Detail Cards Data Fetching Refactor

**Spec:** [specs/done/17-detail-cards-data-fetching-refactor.md](specs/done/17-detail-cards-data-fetching-refactor.md)
**PR:** #10
**Completed:** 2025-11-14
**Effort:** 2-3 days

### Summary

Comprehensive refactoring of all detail card data fetching patterns to use a consistent, performant `getDetails` query pattern that fetches all related data in a single query with pre-calculated permissions and statistics.

### Implemented Features

- ✅ Single query per detail page (replaces 2-4 parallel queries)
- ✅ Pre-calculated permissions (canEdit, canDelete, canManage, etc.)
- ✅ Pre-calculated statistics (team counts, approval rates, points)
- ✅ Enriched user data with roles
- ✅ Type-safe props derived from query return types
- ✅ Consistent data fetching pattern across all detail pages
- ✅ 30-75% performance improvement per page

### Backend Implementation

**New Comprehensive Queries:**

- `tournaments.getDetails` - Single query for tournament detail page
  - Fetches tournament, teams with member counts, user's team
  - Calculates tournament status (active/upcoming/ended)
  - Pre-calculates permissions (canEdit, canDelete, canViewLeaderboard)
  - Returns statistics (totalTeams, totalParticipants, averageTeamSize)

- `teams.getDetails` - Single query for team detail page
  - Fetches team, tournament, members with roles, submissions
  - Enriches members with system roles and membership details
  - Pre-calculates permissions (canEdit, canDelete, canInvite, canLeave, etc.)
  - Returns statistics (points, memberCount, submissionCount, approvalRate)

- `users.getDetails` - Single query for user detail page
  - Fetches user with roles, teams, submissions
  - Enriches teams with tournament names and user's role
  - Pre-calculates permissions (canManageRoles)
  - Returns statistics (teamCount, submissionCount, totalPointsEarned)
  - Includes isViewingSelf flag

**Query Pattern:**

All getDetails queries follow the same structure:
- Parallel data fetching for performance
- Pre-calculated permissions (no client-side logic needed)
- Type-safe return structures
- Comprehensive error handling
- Edge case handling (deleted entities, missing data)

### Frontend Refactoring

**Updated Detail Cards:**

- `TournamentDetailsCard` - Changed to single `data` prop
  - Type-safe props using `ReturnType<typeof useQuery>` pattern
  - Removed useUser hook, uses pre-calculated permissions
  - Added statistics display
  - Uses data.canEdit, data.canDelete, data.canViewLeaderboard

- `TeamDetailsCard` - Changed to single `data` prop
  - Removed internal queries (tournaments.get, teams.listMembers)
  - Uses pre-calculated permissions for all actions
  - Shows captain name from enriched data
  - Displays richer statistics

- `UserDetailsCard` - Changed to `data` prop
  - Uses pre-calculated permissions
  - Added statistics display
  - Uses data.canManageRoles for role management

**Updated Detail Pages:**

- `/tournaments/[id]` - Single getDetails query (was 4 queries)
- `/teams/[id]` - Single getDetails query (was 1 + 2 internal queries)
- `/users/[id]` - Single getDetails query (was 1 query, now enriched)

### Performance Improvements

**Tournament Detail Page:**
- Before: 4 serial queries (tournament, teams, userTeam, teamMembers)
- After: 1 query with all data
- **Improvement: ~75% faster**

**Team Detail Page:**
- Before: 1 query + 2 internal component queries
- After: 1 query with all data
- **Improvement: ~66% faster**

**User Detail Page:**
- Before: 1 query, client-side permission logic
- After: 1 query with pre-calculated data
- **Improvement: Faster rendering, simpler code**

### Benefits

**Code Quality:**
- No queries inside components (moved to pages)
- No permission logic in components (pre-calculated in backend)
- Type-safe props derived from query return types
- Consistent pattern across all detail cards
- Easier to test and maintain

**Performance:**
- Single query reduces network latency by 30-75%
- Single loading state improves UX
- Pre-calculated data reduces client-side processing
- Parallel fetching in backend is faster than serial client queries

**User Experience:**
- Faster page loads
- Single loading state (no cascading loads)
- Richer information display
- Consistent behavior across pages

### Implementation Notes

**Type Safety Pattern:**

Components use the ReturnType pattern for type-safe props:

```typescript
interface ComponentProps {
  data: NonNullable<
    ReturnType<typeof useQuery<typeof api.entity.getDetails>>
  >;
}
```

This ensures props exactly match backend query return types.

**Permission Pre-calculation:**

Backend calculates all permissions based on user role and relationship:
- Admins have full access
- Owners/captains have management access
- Members have limited access
- Frontend only needs to check boolean flags

**Statistics Pre-calculation:**

Backend calculates derived statistics:
- Tournament: team counts, participant counts, averages
- Team: points, approval rates, submission counts
- User: team counts, submission counts, points earned

**Data Enrichment:**

Backend enriches data with related information:
- Users with their roles
- Teams with member counts
- Members with role information
- Submissions with approval details

---

## ✅ 10. Loading States / Skeleton Screens

**Spec:** [specs/done/10-loading-states.md](specs/done/10-loading-states.md)
**PR:** #11
**Completed:** 2025-11-14
**Effort:** 1-2 days

### Summary

Complete implementation of skeleton loading states across the entire application, replacing all instances of blank screens during data fetching with polished, animated skeleton placeholders that match actual content layout.

### Implemented Features

- ✅ Created 7 reusable skeleton components
- ✅ Replaced 9 locations returning `null` during loading
- ✅ Extracted 4 inline skeleton implementations into reusable components
- ✅ ARIA attributes for accessibility (role="status", aria-busy)
- ✅ Consistent animation timing with animate-pulse
- ✅ Skeleton layouts match actual content structure

### Skeleton Components Created

**Core Skeleton Components:**

1. **DetailsCardSkeleton** - For detail cards (tournaments, teams, users, submissions)
   - Card layout with title, description, and configurable detail fields
   - Props: detailsCount (default 4), showActions (default true), className
   - File: `src/components/ui/details-card-skeleton.tsx`

2. **TableSkeleton** - For data tables
   - Table layout with configurable columns and rows
   - Props: columns (required), rows (default 5), headers (optional), className
   - Supports both header text or skeleton headers
   - File: `src/components/ui/table-skeleton.tsx`

3. **CardGridSkeleton** - For grid layouts
   - Grid of card skeletons with title, description, and content
   - Props: count (default 4), className
   - Used for tournament lists, etc.
   - File: `src/components/ui/card-grid-skeleton.tsx`

4. **PageSkeleton** - For full page layouts
   - Full page skeleton with header and multiple sections
   - Props: showHeader (default true), headerTitle, sections (default 2)
   - Includes ARIA attributes for accessibility
   - File: `src/components/ui/page-skeleton.tsx`

**Specialized Skeleton Components:**

5. **StatCardsGridSkeleton** - For statistics dashboards
   - Grid of statistic cards with icon, title, value, description
   - Props: count (default 6), className
   - Used in team statistics pages
   - File: `src/components/ui/stat-cards-grid-skeleton.tsx`

6. **PodiumSkeleton** - For tournament leaderboard podiums
   - Grid of 3 podium-style cards with icon, title, score
   - Props: className
   - File: `src/components/ui/podium-skeleton.tsx`

7. **WinnerAnnouncementSkeleton** - For tournament winner displays
   - Highlighted yellow card for tournament winner
   - Maintains special border/background styling
   - File: `src/components/ui/winner-announcement-skeleton.tsx`

### Components Updated with Loading States

**Detail Card Components (3):**

- `TournamentDetailsCard` - DetailsCardSkeleton with 4 detail fields
- `UserDetailsCard` - DetailsCardSkeleton with 3 detail fields
- `TeamDetailsCard` - DetailsCardSkeleton with 2 detail fields (tournament, score)

**Page Loading States (5):**

- `TournamentsPage` - CardGridSkeleton with 6 cards in 2-column grid
- `UsersPage` - TableSkeleton with 3 columns (Name, Email, Roles) and 8 rows
- `UserDetailPage` - PageSkeleton with 2 sections
- `TournamentDetailPage` - PageSkeleton with 2 sections
- `TeamDetailPage` - PageSkeleton with 3 sections

**Extracted Inline Skeletons (4):**

These components had inline skeleton code that was extracted:

- `TeamStatisticsCard` - Now uses StatCardsGridSkeleton (removed 15 lines)
- `TournamentLeaderboard` - Now uses TableSkeleton (removed 34 lines)
- `LeaderboardPodium` - Now uses PodiumSkeleton (removed 14 lines)
- `WinnerAnnouncement` - Now uses WinnerAnnouncementSkeleton (removed 13 lines)

**Impact:** Removed ~76 lines of duplicate inline skeleton code

### User Experience Improvements

**Before:**
- Users saw blank screens during data loading
- Flash of empty content before data appeared
- No indication that data was being loaded
- Jarring "pop-in" effect when data loaded

**After:**
- Animated skeleton placeholders during loading
- Clear indication that data is being fetched
- Smooth transitions from skeleton to content
- Professional, polished feel
- Improved perceived performance

### Accessibility

All skeleton components include proper accessibility features:
- `role="status"` for screen readers
- `aria-busy="true"` to indicate loading state
- Semantic HTML structure
- Proper ARIA labels where needed

### Code Quality Improvements

**Consistency:**
- All loading states follow the same pattern
- Reusable components reduce duplication
- Centralized skeleton styling

**Maintainability:**
- Changes to skeleton styles update all usages
- Easy to add new skeleton variants
- Clear component naming and organization

**Type Safety:**
- All skeleton components are fully typed
- Props with sensible defaults
- Optional className for customization

### Implementation Notes

**Design Consistency:**

All skeletons maintain the exact layout structure of their loaded counterparts:
- Same number of elements
- Same spacing and padding
- Same responsive grid layouts
- Match actual content proportions

**Animation:**

All skeleton components use the existing `Skeleton` base component with:
- `animate-pulse` for breathing effect
- Consistent timing across all skeletons
- Smooth transitions

**Responsive Design:**

Skeleton layouts are fully responsive:
- Grid layouts adjust based on screen size
- Proper spacing on mobile/tablet/desktop
- Match responsive behavior of actual content

**Performance:**

Skeleton components are lightweight:
- No data fetching
- Simple CSS animations
- Minimal DOM nodes
- Fast rendering

---

## ✅ 11. Individual Submission Tracking & Automatic Grouping

**Spec:** [specs/done/15-individual-submission-tracking.md](specs/done/15-individual-submission-tracking.md)
**PR:** #13
**Completed:** 2025-11-17
**Effort:** 5-7 days

### Summary

Complete redesign of the submission system from team-based submissions (with optional teammates array) to individual member submissions with automatic grouping. This ensures accountability, prevents double-counting of points, and maintains accurate participation tracking.

### Implemented Features

- ✅ Individual submission requirement - each member must submit their own activity
- ✅ Submission type selection ("individual" or "team activity")
- ✅ Automatic submission grouping for team activities (one group per team per day)
- ✅ Daily submission limits per user (configurable per tournament)
- ✅ Multiple individual activities allowed per day (up to limit)
- ✅ Group-based approval workflow for team activities
- ✅ Atomic group approval/rejection (all submissions updated together)
- ✅ Points calculated once per group (no double-counting)
- ✅ Participation rate tracking for team exercise threshold
- ✅ Submission type switching (individual ↔ team, if pending)
- ✅ Group recalculation on submission deletion or state changes

### Backend Implementation

**Schema Changes:**

- `tournaments.maxSubmissionsPerDay` - Optional daily submission limit per user
- `submissions.submissionType` - "individual" or "team" (required)
- `submissions.submissionGroupId` - Reference to submission group (team submissions only)
- `submissions.teammates` - Removed (replaced by individual submissions + grouping)
- `submissionGroups` table - Aggregates team activity submissions by (team, date)
  - Tracks participation rate, team exercise status, and group-level points
  - One group per team per day for team activities
  - Individual submissions are NOT grouped

**New Mutations:**

- `submissionGroups.approve` - Approve entire team activity group atomically
  - Updates all submissions in group to approved
  - Calculates points once at group level
  - Awards team exercise or individual points based on participation rate
- `submissionGroups.reject` - Reject entire group atomically
  - Updates all submissions in group to rejected
  - Removes points from team if previously approved

**Updated Mutations:**

- `submissions.upsert` - Updated to support submission type, daily limits, and grouping
  - Validates daily submission limit (counts individual + team submissions)
  - Prevents duplicate team activity submissions per user per day
  - Auto-creates/joins submission groups for team activities
  - Handles type changes (individual ↔ team) with proper group updates
- `submissions.remove` - Updated to recalculate groups when team submission deleted
  - Adjusts team points based on new participation rate
  - Handles both individual and team submission deletions

**New Queries:**

- `submissionGroups.list` - Query groups with filters (team, tournament, state, date range)
- `submissionGroups.getWithSubmissions` - Get group with all participant details

**Internal Functions:**

- `upsertSubmissionGroup` - Internal function to create/update groups automatically
- `calculateGroupMetrics` - Single source of truth for group calculations
- `recalculateSubmissionPoints` - Recalculates points for submissions when group state changes

### Frontend Implementation

**Tournament Form Updates:**

- Added `maxSubmissionsPerDay` field (optional number input)
- Clear label explaining daily submission limits
- Field appears after team size configuration

**Submission Form Updates:**

- Removed teammates multi-select field (replaced by submission type)
- Added `submissionType` select with two options:
  - Individual (you completed this on your own)
  - Team Activity (multiple members worked together)
- Added daily limit indicator (shows when tournament has `maxSubmissionsPerDay` set)
- Clear visual warning for team activities
- Simplified submission flow - users just select individual or team

**Submissions Page Updates:**

- Updated to display submission type
- Shows grouping information for team activities
- Individual and team submissions clearly distinguished

### Key Features

**Individual Accountability:**

- Every participating team member must create their own submission
- Users explicitly indicate if activity was done alone or with teammates
- Cannot submit on behalf of another member
- Clear audit trail of who submitted when

**Daily Submission Limits:**

- Tournament organizers define `maxSubmissionsPerDay` (optional)
- Limit applies to total submissions per user per day (individual + team combined)
- Default: Unlimited (backwards compatible)
- Validation enforced at submission creation time
- Editing existing submissions doesn't count toward limit

**Automatic Grouping:**

- Only submissions marked as "team activity" are grouped together
- Individual submissions remain standalone (no grouping)
- **Constraint:** Only ONE team activity group allowed per team per day
- **Flexibility:** Multiple individual activities can occur on same day (up to limit)
- Group status derived from individual submission states
- One approval action affects entire team activity group
- Points calculated based on group participation rate

**Participation Tracking:**

- Tracks which members submitted for each team activity date
- Calculates participation rate: `submitted_members / total_team_members` (team activities only)
- Individual activities: participation rate is always 1 (just the submitter)
- Distinguishes between individual exercise and team exercise based on participation rate threshold

**Approval Workflow:**

- **Team Activities:** Admin reviews grouped submissions together
  - Single approval/rejection applies to all submissions in group
  - All individual submissions in group transition to same state
  - Points awarded ONCE per group, not per submission
- **Individual Activities:** Admin reviews and approves each submission independently
  - Each individual submission earns individual exercise points
  - No grouping or coordination required

**No Double-Counting:**

- Points awarded at group level, stored on each individual submission
- Recalculation uses group-based logic
- Deleting one submission recalculates group participation and points
- Team exercise threshold properly enforced

### Edge Cases Handled

**Mixed Activities Same Day:**

- Users can have both individual and team submissions on same day
- Alice does individual workout in morning (submission type: "individual")
- Later, Alice, Bob, Charlie do team workout (each creates "team activity")
- Result: Alice has TWO submissions for the day (one individual, one team)
- Both submissions can be approved independently

**Type Switching:**

- Users can change submission type between individual/team (if pending)
- Individual → Team: joins/creates group, recalculates participation
- Team → Individual: removes from group, becomes standalone
- Cannot switch type if submission already approved

**Daily Limit Enforcement:**

- Counts both individual and team submissions toward limit
- Editing existing submissions does NOT count toward limit
- Deleted submissions do NOT count toward limit
- Limit resets each calendar day

**Group Recalculation:**

- Deleting team submission recalculates group participation rate
- May change from team exercise to individual exercise if participation drops
- Points automatically adjusted based on new participation rate
- Group deleted when all submissions removed

**Late Submission After Approval:**

- System prevents joining team activity group after approval
- Maintains data integrity and prevents point manipulation

**Mixed Tiers in Group:**

- If team members submit different tiers (base vs advanced)
- Group uses highest tier (rewards ambition)
- All submissions in group receive same points

### Migration

**Migration Strategy:**

- Created `migrations.migrateSubmissionsToGroups` (later removed as empty)
- Sets `submissionType` based on teammates array:
  - Has teammates = "team"
  - Otherwise = "individual"
- Creates groups for existing team submissions
- Links submissions to groups and normalizes points
- Backwards compatible with existing data

### Implementation Notes

**Data Model Redesign:**

The old model relied on a single submission with a `teammates` array:
- One user created submission listing other participants
- No verification from listed teammates
- Risk of double-counting if multiple members submitted
- Ambiguous participation tracking

The new model requires individual submissions with automatic grouping:
- Each member creates their own submission
- System automatically groups team activities by (team, date)
- Single source of truth for points (group level)
- Clear participation tracking and accountability

**Benefits:**

- **Accountability:** Every participant must personally confirm participation
- **Prevents Gaming:** One member can't submit on behalf of others
- **Accurate Tracking:** Participation rate based on actual submissions
- **No Double-Counting:** Points awarded once per group
- **Simplified UX:** Users just select "individual" or "team activity"
- **Better Admin Workflow:** Review groups instead of scattered individual submissions
- **Data Integrity:** Automatic grouping prevents inconsistencies

**Performance:**

- Group queries execute efficiently with proper indexes
- Approval mutation updates all grouped submissions atomically
- Real-time UI updates via Convex reactivity
- Supports teams with up to 20 members efficiently

---

## ✅ 12. Enhanced Role-Based Sidebar Navigation

**Spec:** [specs/done/18-sidebar-navigation-enhancements.md](specs/done/18-sidebar-navigation-enhancements.md)
**PR:** #14
**Completed:** 2025-11-17
**Effort:** 1-2 days

### Summary

Complete restructuring of the sidebar navigation to support role-based dashboards with organized sections, notification badges, and placeholder pages for all upcoming role-specific features.

### Implemented Features

- ✅ Role-based sidebar sections (User, Captain, Reviewer, Tournament Manager, Admin, Viewer)
- ✅ Notification badges with real-time counts from Convex queries
- ✅ Conditional section visibility based on user roles
- ✅ Captain section conditional on captaining at least one team
- ✅ 24+ new Lucide icons for role-specific navigation
- ✅ Placeholder pages for all role-based dashboards (25+ pages)
- ✅ Badge count queries for pending actions
- ✅ Internationalization support for all new sidebar items
- ✅ Mobile-responsive design maintained

### Backend Implementation

**New Query Files:**

- `convex/captain.ts` - Captain-specific badge queries
  - `getPendingActionsCount` - Join requests + invitations for captain's teams
  - `getCaptainedTeamsCount` - Count teams user captains (for conditional rendering)
- `convex/reviewer.ts` - Reviewer badge queries
  - `getPendingCount` - Pending submissions for review
  - `getFlaggedCount` - Flagged submissions requiring attention
- `convex/tournamentManager.ts` - Tournament manager queries
  - `getPendingCount` - Pending approvals for assigned tournaments

**Extended Existing Files:**

- `convex/admin.ts` - Added `getAllPendingCount` for system-wide pending submissions
- `convex/submissionGroups.ts` - Added `getPendingCount` for grouped submissions
- `convex/users.ts` - Extended with captain teams count query

**Query Features:**

- All queries include proper role-based access control
- Counts include both individual submissions and submission groups
- Captain badges aggregate across all captain's teams
- Real-time updates via Convex reactive queries
- Returns 0 for unauthorized users (no errors thrown)

### Frontend Implementation

**Enhanced Sidebar (`src/components/app-sidebar.tsx`):**

- Completely restructured with 6 role-based sections
- Extended `SidebarItem` type with:
  - `roles`: array for role-based visibility
  - `requiredCondition`: function for custom conditions (e.g., captain check)
  - `publicAccess`: boolean for unauthenticated access
  - `badge`: object with Convex query for notification counts
- Smart visibility filtering based on roles and conditions
- Empty sections automatically hidden
- Supports both authenticated and public access patterns

**New Component:**

- `src/components/ui/sidebar-badge.tsx` - Dynamic badge component
  - Supports dynamic Convex query strings
  - Shows 99+ for counts over 99
  - Auto-hides when count is 0
  - Validates query format and API availability

**Navigation Sections:**

1. **User Section** (always visible)
   - Dashboard, Tournaments, Teams, Submissions, Submit Activity

2. **Captain Section** (conditional on captaining teams)
   - My Teams, Team Comparison, Invite Member
   - Badge: Pending join requests + invitations

3. **Reviewer Section** (role: reviewer)
   - Review Queue, Review Stats, Flagged Submissions
   - Badges: Pending submissions, Flagged items

4. **Tournament Manager Section** (role: tournament_manager)
   - Manager Dashboard, My Tournaments, Pending Approvals, Analytics
   - Badge: Pending approvals for assigned tournaments

5. **Admin Section** (role: admin)
   - Admin Dashboard, Tournaments, Users, All Submissions, Submission Groups, System Health
   - Badge: System-wide pending counts

6. **Discover/Viewer Section** (public + role: viewer)
   - Public Leaderboards, Live Tournaments, Viewer Dashboard, Favorites

### Placeholder Pages Created

**Captain Routes:**

- `/captain` - Team Captain Dashboard
- `/captain/comparison` - Team Comparison View

**Reviewer Routes:**

- `/reviewer` - Review Queue Dashboard
- `/reviewer/statistics` - Review Statistics
- `/reviewer/flagged` - Flagged Submissions

**Tournament Manager Routes:**

- `/tournament-manager` - Manager Dashboard
- `/tournament-manager/tournaments` - Assigned Tournaments
- `/tournament-manager/approvals` - Pending Approvals
- `/tournament-manager/analytics` - Tournament Analytics

**Admin Routes:**

- `/admin` - Admin Dashboard (placeholder)
- `/admin/system` - System Health Monitoring

**Viewer Routes:**

- `/viewer` - Viewer Dashboard
- `/viewer/favorites` - Favorite Tournaments
- `/public/leaderboards` - Public Leaderboards
- `/public/live` - Live Tournaments Feed

All placeholder pages use consistent pattern with icon, title, and spec reference.

### Internationalization

**Updates to `messages/en.json`:**

- Added translation keys for all new sidebar sections
- Complete coverage for captain, reviewer, manager, admin, and viewer sections
- Maintains i18n best practices

### Implementation Notes

**Foundation for Future Dashboards:**

This implementation establishes the complete navigation structure needed for:
- Spec 07: Admin Dashboard
- Spec 11: Tournament Manager Dashboard
- Spec 12: Reviewer Dashboard
- Spec 13: Team Captain Dashboard
- Spec 14: Viewer/Public Dashboard

By implementing the sidebar first with placeholders, future dashboard implementations can focus purely on functionality without navigation concerns.

**Conditional Rendering Logic:**

- Role-based sections check user roles array
- Captain section uses custom condition checking `captainedTeamsCount > 0`
- Public access items show for unauthenticated users
- Empty sections (no visible items) are automatically filtered out

**Badge Integration:**

- Badges use dynamic query strings (e.g., "captain.getPendingActionsCount")
- Parsed and validated at runtime
- Real-time updates via Convex subscriptions
- Graceful degradation if query fails

**Type Safety:**

- All new types properly defined
- TypeScript errors resolved
- Biome linting passes with zero errors

### Benefits

**For Users:**

- Clear organization of features by role
- At-a-glance view of pending actions via badges
- Intuitive navigation to role-specific dashboards
- Reduced clutter (only see relevant sections)

**For Development:**

- Parallel development of dashboards without navigation conflicts
- Placeholder pages enable immediate routing
- Consistent navigation pattern for all future features
- Easy to add new items or sections

**For Platform:**

- Scalable navigation architecture
- Supports unlimited roles and permissions
- Real-time notification system foundation
- Professional, organized user experience

---

## ✅ 13. Tournament Manager Role & Permissions

**Spec:** [specs/done/19-simple-tournament-manager-permissions.md](specs/done/19-simple-tournament-manager-permissions.md)
**PR:** #15
**Completed:** 2025-11-18
**Effort:** 1-2 days

### Summary

Complete tournament manager role implementation allowing delegation of tournament operations without granting full admin access. Tournament managers can create tournaments, manage submissions, and access specialized dashboards.

### Implemented Features

- ✅ Tournament manager role with scoped permissions
- ✅ Tournament manager dashboard with statistics
- ✅ Pending submissions queue for tournament managers
- ✅ Tournament management permissions (create, edit, determine winner)
- ✅ Submission approval permissions (approve, reject, remove)
- ✅ Team management permissions (remove teams, recalculate points)
- ✅ Activity feed showing tournament events
- ✅ Quick action buttons for common tasks
- ✅ Sidebar integration with notification badge

### Backend Implementation

**Mutations with tournament_manager Access:**

- `tournaments.upsert` - Create and edit tournaments (line 229-231 in tournaments.ts)
- `tournaments.determineWinner` - Set tournament winner (line 506-508)
- `submissions.approve` - Approve submissions (lines 670-674 in submissions.ts)
- `submissions.reject` - Reject submissions (lines 741-745)
- `submissions.remove` - Remove submissions (line 620)
- `teams.removeUserTeam` - Remove teams (with admin check)
- `teams.recalculatePoints` - Recalculate team points (admin utility)

**Note:** Tournament deletion remains admin-only for safety.

**New Queries:**

- `tournamentManager.getDashboardStats` - Tournament/team/submission statistics
  - Categorizes tournaments by status (active/upcoming/ended)
  - Counts total teams and pending submissions
  - Returns comprehensive dashboard metrics
- `tournamentManager.getRecentActivity` - Timeline of tournament events
  - Team creation events with creator names
  - Submission approval/rejection events
  - Sorted by timestamp, limited to 30 most recent
- `tournamentManager.getPendingCount` - Badge count for pending submissions
- `tournamentManager.getSubmissions` - All submissions with filters

### Frontend Implementation

**Dashboard Page:**

- `/tournament-manager` - Tournament Manager Dashboard
  - Overview statistics with stat cards
  - Quick action buttons (Create Tournament, View Pending, Manage Teams)
  - List of all tournaments with filter/sort
  - Real-time activity feed
  - Role badge indicator (Admin vs Tournament Manager)
  - Permission check with redirect for unauthorized users

**Submissions Page:**

- `/tournament-manager/submissions` - Dedicated submissions management
  - Filter by tournament dropdown
  - Filter by status (all/pending/approved/rejected)
  - Reuses existing SubmissionsDataTable component
  - Shows submission count
  - Permission check with redirect

**Components:**

- `TournamentManagerStatsCards` - Overview statistics display
- `ManagedTournamentsList` - Tournament list with filters
- `TournamentManagerActivityFeed` - Real-time event timeline
- `TournamentManagerQuickActions` - Quick access buttons

**User Hook:**

- `useUser.isTournamentManager` - Helper for role checking (lines 11-12 in useUser.ts)

### Sidebar Integration

**Location:** `src/components/app-sidebar.tsx`

- ✅ Tournament Manager section shows for both admin AND tournament_manager roles
- ✅ Navigation items: Dashboard, Tournaments, Submissions
- ✅ Badge shows pending submission count

### Permission Model

**Tournament Managers Can:**

- Create and edit tournaments (not delete)
- Approve/reject/remove submissions
- View all teams and submissions
- Determine tournament winners
- Recalculate team points
- Access tournament statistics

**Restricted to Admins:**

- Delete tournaments
- Manage users and roles
- System-wide administration

### Implementation Notes

**Delegation Without Risk:**

The tournament_manager role enables operational delegation while maintaining security:
- Cannot delete tournaments (prevents data loss)
- Cannot manage user roles (prevents privilege escalation)
- Cannot access system settings (protects configuration)
- Full visibility into tournament operations
- All necessary management capabilities

**Benefits:**

- **Scalability:** Distribute tournament management workload
- **Security:** Scoped permissions prevent accidental damage
- **Efficiency:** Dedicated dashboard for tournament operations
- **Accountability:** Clear role separation and audit trail

---

## ✅ 14. Dark Theme System

**Spec:** [specs/done/21-dark-theme-system.md](specs/done/21-dark-theme-system.md)
**PR:** #16
**Completed:** 2025-11-19
**Effort:** 2-3 days

### Summary

Complete dark theme implementation with three modes (Light, Dark, System), persistent user preferences, FOUC prevention, and comprehensive dark mode styling across all UI components.

### Implemented Features

- ✅ Three theme modes: Light, Dark, System (follows OS preference)
- ✅ LocalStorage persistence with "theme-preference" key
- ✅ Real-time system preference detection via matchMedia API
- ✅ FOUC (Flash of Unstyled Content) prevention
- ✅ Theme switcher components (dropdown and toggle variants)
- ✅ Dark mode CSS variables for all UI components
- ✅ Smooth theme transitions without page reload
- ✅ Proper integration in root layout

### Core Theme System

**Theme Hook (`src/hooks/use-theme.tsx`):**

- `ThemeProvider` component - React Context for theme state management
  - Manages theme state (light/dark/system)
  - Persists to localStorage
  - Listens to system preference changes
  - Applies theme class to document root
- `useTheme` hook - Provides theme state and setTheme function
- System preference detection with MediaQuery API
- Automatic theme application on preference change

**FOUC Prevention (`src/components/theme-script.tsx`):**

- Inline script that runs before React hydration
- Reads localStorage and applies theme immediately
- Prevents flash of wrong theme on page load
- Handles system preference detection synchronously

### Theme UI Components

**ThemeSwitcher (`src/components/theme-switcher.tsx`):**

- Dropdown button for header/toolbar placement
- Shows current theme icon (Sun/Moon/Monitor)
- Three options with check marks
- Icons from Lucide React

**ThemeToggle (`src/components/theme-toggle.tsx`):**

- Segmented control for settings page
- Three buttons with icons
- Active state highlighting
- Better for dedicated settings UI

**Theme Configuration (`src/lib/theme-config.ts`):**

- Theme options with labels and icons
- Type-safe theme definitions
- Reusable across components

### Dark Mode Styling

**CSS Variables (`src/app/globals.css`):**

- Custom variant: `@custom-variant dark (&:is(.dark *))`
- Complete dark mode color palette using OKLCH
- Card variant overrides (admin, info, dashed cards)
- Button color variants for all states
- Badge color variants
- Calendar state colors (approved/pending/rejected)
- Submission card colors
- Form input and select colors
- Proper contrast ratios for accessibility

**Key Color Adjustments:**

- Background: Light bg → Dark bg with proper contrast
- Text: Dark text → Light text for readability
- Borders: Subtle borders adjusted for dark mode
- Hover/Active states: Appropriately dimmed/brightened
- Status colors: Green/yellow/red adjusted for dark backgrounds

### Root Layout Integration

**Location:** `src/app/layout.tsx`

- ✅ `suppressHydrationWarning` on html tag (prevents theme mismatch warnings)
- ✅ ThemeScript in <head> before body content
- ✅ ThemeProvider wrapping entire app
- ✅ Children rendered within theme context

### Settings Page Integration

**Location:** `src/app/(all)/settings/page.tsx`

- ✅ Theme Preferences section
- ✅ ThemeToggle component for selection
- ✅ Explanation of each theme mode
- ✅ Responsive layout

### Implementation Notes

**Default Mode:** System (respects OS/browser dark mode preference)

**Storage Key:** `theme-preference` in localStorage

**Theme Values:**
- `"light"` - Always light theme
- `"dark"` - Always dark theme
- `"system"` - Follows OS preference

**MediaQuery Listener:**

Automatically updates theme when user changes OS dark mode setting while app is open. No page reload needed.

**Accessibility:**

- WCAG AA contrast ratios maintained in both themes
- Keyboard navigation fully supported
- Screen reader support with proper labels
- Touch-friendly controls (min 44px targets)

### Benefits

**For Users:**

- Choose preferred theme mode
- Automatic system preference following
- Consistent experience across sessions
- No jarring theme flash on load

**For Platform:**

- Modern, professional appearance
- Reduced eye strain in low-light environments
- Matches user expectations (most platforms support dark mode)
- Improved accessibility options

**For Development:**

- Tailwind CSS v4 native dark mode support
- CSS variables make future color changes easy
- Type-safe theme management
- Reusable theme components

---

## ✅ 15. Active Sidebar Navigation Highlighting

**Spec:** [specs/done/23-active-sidebar-navigation.md](specs/done/23-active-sidebar-navigation.md)
**PR:** #17
**Completed:** 2025-11-20
**Effort:** 0.5-1 day

### Summary

Visual highlighting system for sidebar navigation items to clearly indicate the current page/section the user is viewing, with support for exact and partial route matching.

### Implemented Features

- ✅ Active route detection with useActiveRoute hook
- ✅ Exact matching for dashboard routes
- ✅ Partial matching for section routes with nested pages
- ✅ Visual highlighting with background color change
- ✅ Accessibility support with aria-current attribute
- ✅ Route boundary handling to prevent false positives
- ✅ Trailing slash normalization

### Route Matching Hook

**Location:** `src/hooks/useActiveRoute.ts`

**Features:**

- `useActiveRoute` hook with `isActive(href, exact)` function
- Uses Next.js `usePathname` for current route detection
- Path normalization (removes trailing slashes, preserves root `/`)
- Exact matching: Only matches exact path
  - Example: `/dashboard` matches `/dashboard` but NOT `/dashboard-admin`
- Partial matching: Matches path and subpaths
  - Example: `/tournaments` matches `/tournaments`, `/tournaments/123`, `/tournaments/123/leaderboard`
- Edge case handling:
  - Root path (`/`) only matches exactly
  - Prevents false positives like `/team` matching `/teams`
  - Handles paths with and without trailing slashes

### Sidebar Integration

**Location:** `src/components/app-sidebar.tsx`

**Implementation:**

- Hook imported and used in `AppSidebar` component (line 48)
- `isActive` called for each menu item (line 456)
- Active state passed to `SidebarMenuButton` via `isActive` prop (line 460)
- `aria-current="page"` attribute set on active items (line 461)
- Configured exact matching for all dashboard routes:
  - `/viewer`, `/dashboard`, `/admin`, `/tournament-manager`, `/reviewer`, `/captain`
- Partial matching for section routes:
  - `/tournaments`, `/teams`, `/submissions`, etc.

**Code Example:**

```typescript
const active = isActive(item.href, item.exact);

<SidebarMenuButton asChild isActive={active}>
  <Link href={item.href} aria-current={active ? "page" : undefined}>
    {/* ... */}
  </Link>
</SidebarMenuButton>
```

### Visual States

**Active State Styling:**

The `SidebarMenuButton` component already handles active state styling via `data-[active=true]`:
- Background: `bg-sidebar-accent` (neutral gray with good contrast)
- Font weight: `font-medium` (slightly bolder text)
- Works in both light and dark themes

**Color Customization:**

Updated `globals.css` to use more pronounced sidebar accent colors:
- Light mode: Darker neutral gray (lightness 0.88, chroma 0.005)
- Dark mode: Lighter neutral gray (lightness 0.32, chroma 0.008)
- True neutral grays that maintain design consistency

### Accessibility

**WCAG AA Compliance:**

- `aria-current="page"` on active navigation items
- Semantic HTML with proper link elements
- Keyboard navigation fully supported (Tab, Enter, Space)
- Screen reader announces current page
- Sufficient color contrast ratios

### Implementation Notes

**Route Matching Logic:**

1. Normalize both pathname and href (remove trailing slashes)
2. If exact match required, compare paths directly
3. For partial matching:
   - Exact match OR
   - Path starts with href + `/` (ensures proper boundary)
4. Special case: Root path (`/`) only matches exactly

**Prevents False Positives:**

- `/dashboard` does NOT match `/dashboard-admin`
- `/team` does NOT match `/teams`
- `/tournaments` DOES match `/tournaments/123`

**Benefits:**

- Clear visual indication of current location
- Improved navigation UX
- Reduces user confusion
- Professional, polished feel
- Better accessibility

---

## ✅ 16. Submission Card View with Image Gallery

**Spec:** [specs/done/24-submission-card-view.md](specs/done/24-submission-card-view.md)
**PR:** #18
**Completed:** 2025-11-20
**Effort:** 2-3 days

### Summary

Complete redesign of submission display from table-based layout to card-based layout with prominent image gallery, lightbox modal, and improved mobile experience.

### Implemented Features

- ✅ Card-based submission layout (replaces table view)
- ✅ Visual prominence for submission images
- ✅ Image gallery with lightbox modal
- ✅ Thumbnail strip for multiple images
- ✅ Two-image side-by-side layout when 2+ images exist
- ✅ Navigation arrows in lightbox
- ✅ Image counter in lightbox
- ✅ Responsive design (mobile-first)
- ✅ Contextual actions placed alongside each submission
- ✅ Search, filter, and sort capabilities
- ✅ Real-time updates via Convex mutations
- ✅ Dark mode support

### Component Architecture

**Main Components:**

1. **SubmissionCard** (`src/components/submissions/submission-card.tsx`)
   - Horizontal layout: image left, details right
   - Responsive (vertical on mobile, horizontal on desktop)
   - Hover shadow effect
   - Integrates all sub-components

2. **SubmissionCardImage** (`src/components/submissions/submission-card-image.tsx`)
   - Empty state with dashed border when no images
   - Two-image grid when 2+ images (400x400px each)
   - Single large image when 1 image (800x800px)
   - Thumbnail strip for 3+ images (64x64px thumbnails)
   - "+N more" badge for additional images
   - Lightbox modal with Dialog component
   - Navigation arrows (previous/next)
   - Image counter display
   - Lazy loading for performance
   - Hover scale effect (group-hover:scale-105)

3. **SubmissionCardDetails** (`src/components/submissions/submission-card-details.tsx`)
   - State badges with color coding (approved/pending/rejected)
   - Tier badges (base/advanced)
   - Team exercise indicator badge
   - Points earned display
   - Metadata grid with icons:
     - Calendar icon for date
     - Users icon for team name
     - User icon for submitter name
   - Description with line clamping (line-clamp-3)
   - Dark mode support with proper colors

4. **SubmissionCardActions** (`src/components/submissions/submission-card-actions.tsx`)
   - Permission-based action visibility
   - Admin actions: Approve, Reject
   - Owner actions: Edit (if pending), Delete
   - Border separator for visual organization
   - Returns null when no actions available

5. **SubmissionCardList** (`src/components/submissions/submission-card-list.tsx`)
   - CardGrid wrapper with single column layout
   - Empty state handling
   - Maps over submissions array
   - Passes callbacks for all actions
   - Maintains consistent spacing

### Page Integration

**Location:** `src/app/(all)/submissions/page.tsx`

**Implementation:**

- Three sections using SubmissionCardList:
  1. Your Submissions (lines 257-270)
  2. Pending Submissions (lines 273-286)
  3. All Submissions (lines 288-295)
- Tab system with calendar and list views (lines 184-300)
- Data augmentation with team/user information (lines 111-134)
- Action callbacks connected to mutations (approve, reject, edit, delete)
- Real-time updates via Convex subscriptions

### Image Gallery Features

**Lightbox Modal:**

- Full-screen dialog overlay
- Large image display (1200x1200px for quality)
- Navigation controls (previous/next arrows)
- Image counter (e.g., "2 / 5")
- Close button
- Click outside to close
- Keyboard navigation support

**Image Layout Logic:**

- **No images:** Dashed border placeholder with message
- **1 image:** Single large image centered
- **2 images:** Side-by-side grid (2 columns)
- **3+ images:** First 2 large, next 2 as thumbnails, "+N more" badge

**Next.js Image Optimization:**

- Explicit width/height for all Image components
- Prevents layout shift during loading
- Enables Next.js automatic optimization
- Lazy loading for off-screen images

### Dark Mode Support

**Color Variables:**

All submission card colors adapted for dark mode:
- State colors (approved green, pending yellow, rejected red)
- Background colors with proper contrast
- Border colors visible in both themes
- Badge colors with sufficient contrast
- Hover states appropriately adjusted

### Responsive Design

**Mobile (< 768px):**

- Vertical card layout (image top, details bottom)
- Full-width images
- Stacked metadata
- Touch-friendly action buttons

**Desktop (≥ 768px):**

- Horizontal card layout (image left, details right)
- Two-column image grid
- Side-by-side metadata
- Hover effects

### Benefits

**For Users:**

- Images are immediately visible (not hidden in modals)
- Better visual context for submissions
- Easier to scan and browse submissions
- Improved mobile experience
- Faster visual identification

**For Admins:**

- Quickly review submissions with visual context
- Actions placed alongside each submission
- No need to click into detail page for approval
- Efficient bulk review workflow

**For Platform:**

- Modern, polished UI
- Better image prominence
- Improved engagement with visual content
- Consistent with modern web patterns

### Performance Optimizations

- Lazy loading for images
- Next.js Image component optimization
- Efficient re-renders with proper keys
- Real-time updates without full page reload

---

## ✅ 17. Unified Dashboard Landing Page

**Spec:** [specs/done/28-unified-dashboard-landing-page.md](specs/done/28-unified-dashboard-landing-page.md)
**PR:** #21
**Completed:** 2025-11-25
**Effort:** 3-4 days

### Summary

Comprehensive, role-aware unified dashboard serving as the main landing page for all authenticated users, providing personalized at-a-glance information, real-time data updates, and quick access to common actions.

### Implemented Features

- ✅ Personalized welcome section with user name and status
- ✅ At-a-glance statistics (teams, tournaments, submissions)
- ✅ My Active Tournaments widget with team information
- ✅ My Teams widget with points and member counts
- ✅ Recent Activity Feed with 15 most recent events
- ✅ Team Invitations widget with accept/reject actions
- ✅ Quick Actions Panel (browse, submit, view teams)
- ✅ Upcoming Deadlines widget for tournaments ending soon
- ✅ Admin Overview Card with system statistics (admin-only)
- ✅ Real-time updates via Convex subscriptions
- ✅ Responsive 3-column layout (desktop), stacked (mobile)
- ✅ Loading skeletons for all widgets
- ✅ Empty states with helpful CTAs

### Backend Implementation

**Queries Created (convex/dashboard.ts):**

- `getUserDashboardData` - Comprehensive user dashboard data (lines 14-82)
  - Fetches user's teams with tournament info
  - Calculates active tournaments count
  - Counts pending submissions and invitations
  - Returns aggregated data for all user widgets

- `getAdminDashboardData` - Admin-specific system statistics (lines 84-153)
  - Total users count with "new this week" tracking
  - Tournament breakdown by status (active/upcoming/ended)
  - Total teams count
  - Submission counts by state (pending/approved/rejected)
  - Admin-only with role check

- `getRecentActivity` - Activity feed timeline (lines 155-254)
  - Last 15 activities relevant to user
  - Submission approvals/rejections
  - New team member joins
  - Join request responses (for captains)
  - Icon indicators and relative timestamps
  - Navigation links for clickable activities

- `getUpcomingDeadlines` - Tournament deadline tracker (lines 256-305)
  - Tournaments ending within 7 days
  - Filters to user's participating teams
  - Calculates days remaining
  - Sorted by proximity to deadline
  - Type-safe filtering with predicates

### Frontend Implementation

**Components Created (src/components/dashboard/):**

1. **UnifiedDashboard** (`unified-dashboard.tsx`) - Main orchestrator
   - Responsive 3-column layout (desktop), stacked (mobile)
   - Fetches all dashboard data via Convex hooks
   - Wires 9 child widgets together
   - Role-aware rendering (admin card shows only for admins)
   - Loading skeleton while data fetches

2. **DashboardHeader** (`dashboard-header.tsx`) - Welcome section
   - Personalized greeting with user's name
   - Active tournament count in status text
   - Uses SectionHeader component for consistency

3. **UserStatsGrid** (`user-stats-grid.tsx`) - Statistics cards
   - 3-card grid: My Teams, Active Tournaments, Pending Submissions
   - Color-coded icons (blue, green, yellow)
   - Responsive grid layout

4. **AdminOverviewCard** (`admin-overview-card.tsx`) - Admin stats
   - System-wide statistics dashboard
   - Quick action buttons to management pages
   - Purple variant styling for visual distinction
   - Only visible to admin users

5. **MyActiveTournamentsWidget** (`my-active-tournaments-widget.tsx`)
   - Filters teams to active tournaments only
   - Shows tournament and team names
   - Captain badge indicators
   - Empty state with CTA to browse tournaments

6. **MyTeamsWidget** (`my-teams-widget.tsx`)
   - Displays all user's teams
   - Shows: team name, tournament, members, points
   - Captain badge for team leaders
   - Empty state with helpful message

7. **RecentActivityFeed** (`recent-activity-feed.tsx`)
   - Timeline display of 15 most recent activities
   - Icon map for activity types (check, x, users, user-plus)
   - Relative timestamps with date-fns
   - Optional navigation links
   - Proper key handling (timestamp instead of index)

8. **TeamInvitationsWidget** (`team-invitations-widget.tsx`)
   - Wrapper for existing TeamInvitationsList component
   - Shows pending invitations only
   - Reuses established invitation handling

9. **QuickActionsPanel** (`quick-actions-panel.tsx`)
   - 4-button grid: Browse, Submit, Teams, New Submission
   - Context-aware (disables "New Submission" if no active teams)
   - Responsive grid (2 cols mobile, 4 cols desktop)
   - Icon-based buttons

10. **UpcomingDeadlinesWidget** (`upcoming-deadlines-widget.tsx`)
    - Shows tournaments ending within 7 days
    - Countdown display ("Ends in 3 days")
    - Color-coded urgency badges ("Urgent" ≤3 days, "Soon" >3 days)
    - Links to tournament leaderboards
    - Empty state message

**Supporting Card Components:**

- `UserTeamCard` (`src/components/teams/user-team-card.tsx`) - Reusable team card
- `UserTournamentCard` (`src/components/tournaments/user-tournament-card.tsx`) - Reusable tournament card

### Page Integration

**Location:** `src/app/(all)/dashboard/page.tsx`

- Imports and renders UnifiedDashboard component
- Replaces old basic UserDashboard component
- Real-time updates via Convex subscriptions
- Single loading state for entire dashboard

### Key Features

**Personalization:**

- Welcome message with user's name
- Custom dashboard data per user
- Role-aware widgets (admin-only sections)
- Context-sensitive quick actions

**Real-Time Updates:**

- All data via Convex reactive queries
- Instant reflection of changes (submissions, teams, tournaments)
- Activity feed updates in real-time
- No manual refresh needed

**Responsive Design:**

- 3-column desktop layout
- 2-column tablet layout
- Single column mobile layout
- Touch-friendly buttons and cards
- Optimized spacing for all screen sizes

**Empty States:**

- Helpful messages for each widget
- Clear CTAs to resolve empty state
- Encouraging onboarding flow
- Never shows blank widgets

**Performance:**

- Single dashboard query reduces network calls
- Parallel data fetching in backend
- Skeleton loading states prevent layout shift
- Efficient re-renders with proper React keys

### Benefits

**For Users:**

- Centralized hub for all tournament activity
- At-a-glance view of teams, tournaments, and pending actions
- Quick access to common workflows
- Reduced navigation friction
- Clear visibility into recent events
- Never miss important deadlines

**For Captains:**

- See all teams they manage
- Pending join requests in activity feed
- Quick access to team management
- Tournament deadline awareness

**For Admins:**

- System-wide statistics overview
- Pending submission alerts
- Quick links to admin pages
- Maintain awareness of platform health

**For Platform:**

- Increased user engagement (immediate value on login)
- Improved retention (surfacing actionable info)
- Reduced support burden (clear CTAs and guidance)
- Professional, polished user experience
- Better onboarding flow

### Implementation Notes

**Design Consistency:**

All widgets follow shadcn/ui patterns:
- Card-based layout with consistent padding
- SectionHeader components for titles
- Badge components for status indicators
- Button components with icons
- Responsive grid utilities

**Type Safety:**

- All queries return properly typed data
- Components use TypeScript interfaces
- Type-safe Convex API imports
- No `any` types used

**Accessibility:**

- Semantic HTML structure
- Proper heading hierarchy
- ARIA labels where needed
- Keyboard navigation support
- Screen reader friendly

**Code Quality:**

- Reusable card components extracted
- Clear separation of concerns
- Single responsibility per component
- Documented with inline comments where needed
- Follows project conventions

**Scalability Notes:**

Backend includes TODO comment for admin dashboard scalability:
- Current `.collect()` approach acceptable for MVP (<10k records)
- Future optimizations documented:
  - Dedicated aggregation tables
  - Incremental counters
  - Caching layer
  - Background refresh jobs
- Optimization deferred to post-MVP

---

## Infrastructure & Foundation

The following foundational systems were already in place before feature development:

### Authentication & User Management

- Clerk OAuth integration
- User profile syncing via webhooks
- JWT token validation
- Session management

### Role-Based Access Control

- Roles table with admin/user roles
- UserRoles junction table
- Permission checks in mutations
- Admin route protection

### Tournament Management

- Tournament CRUD operations (admin)
- Date range validation
- Team size constraints
- Tournament status tracking (upcoming/active/ended)

### Submission System

- Submission creation by team members
- Approval workflow (pending/approved/rejected)
- Admin submission review
- Image uploads and storage

---

## Summary Statistics

### Development Effort

- **Total Completed:** 34-43 days of development
- **Features Completed:** 17 major features
- **PRs Merged:** 21 pull requests
- **Files Modified:** 270+ files across backend and frontend

### Code Metrics

- **Backend Functions:** 80+ Convex mutations and queries (including role-specific badge queries)
- **Frontend Components:** 60+ React components (including 7 skeleton components, sidebar badge, 25+ placeholder pages)
- **Database Tables:** 16 Convex tables (including submissionGroups)
- **Type Safety:** 0 TypeScript errors, 0 linting errors

### Feature Coverage

- ✅ Team Management (create, edit, delete, join, leave)
- ✅ Team Member Management (invite, remove, transfer captaincy)
- ✅ Scoring & Leaderboards (points, rankings, statistics)
- ✅ Role Management (assign, remove, audit)
- ✅ Tournament Manager Role (scoped permissions, dedicated dashboard)
- ✅ User Self-Service (teams, invitations, requests)
- ✅ Submission Calendar (visual progress tracking, statistics)
- ✅ Submission Detail Pages (comprehensive submission view, approval workflow)
- ✅ Submission Card View (image gallery, lightbox, responsive design)
- ✅ Individual Submission Tracking (accountability, automatic grouping, daily limits)
- ✅ Role-Based Navigation (sidebar sections, badges, conditional rendering)
- ✅ Active Navigation Highlighting (current page indication)
- ✅ Dark Theme System (light/dark/system modes with persistence)
- ✅ Unified Dashboard Landing Page (personalized hub, real-time widgets, role-aware)
- ✅ Code Quality (type safety, validation, linting)
- ✅ Data Fetching Optimization (getDetails pattern, 30-75% performance improvement)
- ✅ Loading States (comprehensive skeleton screens across all pages)

### User Experience

- Real-time updates via Convex reactivity
- Toast notifications for all actions
- **Complete skeleton loading states** across all pages and components
- 30-75% faster page loads with optimized data fetching
- Comprehensive error handling
- Responsive design with Tailwind CSS
- Professional, polished UI with smooth loading transitions

---

## Recent Merges

- **PR #21:** Unified Dashboard Landing Page (11/25/2025) ⭐ **NEW**
- **PR #19:** i18n Fixes (11/20/2025)
- **PR #18:** Submission Card View with Image Gallery (11/20/2025)
- **PR #17:** Active Sidebar Navigation Highlighting (11/20/2025)
- **PR #16:** Dark Theme System (11/19/2025)
- **PR #15:** Tournament Manager Role & Permissions (11/18/2025)
- **PR #14:** Enhanced Role-Based Sidebar Navigation (11/17/2025)
- **PR #13:** Individual Submission Tracking & Automatic Grouping (11/17/2025)
- **PR #12:** Comprehensive Code Cleanup (11/16/2025)
- **PR #11:** Loading States / Skeleton Screens (11/14/2025)
- **PR #10:** Detail Cards Data Fetching Refactor (11/14/2025)
- **PR #9:** Submission Detail Page (11/14/2025)
- **PR #8:** Submission Calendar (11/13/2025)
- **PR #7:** User Avatar/Sidebar (11/13/2025)
- **PR #6:** Admin Role Management (11/12/2025)
- **PR #5:** Leaderboard & Scoring (11/12/2025)
- **PR #4:** Code Quality Fixes (11/11/2025)
- **PR #3:** Team Deletion (11/11/2025)
- **PR #2:** CI/CD Workflow (11/11/2025)
- **PR #1:** Team Joining (11/07/2025)

---

## What's Next?

See [MISSING.md](MISSING.md) for remaining features and priorities.

**Critical:** None remaining! All critical MVP features are complete.

**High Priority:**

- Reviewer Dashboard (1-2 days) - navigation/placeholders done
- Image Upload System (2-3 days) - spec ready (26-submission-image-upload-s3-abstraction.md)

**Medium Priority:**

- Team Captain Dashboard (1-1.5 days) - navigation/placeholders done
- Complete Admin Dashboard (1.5 days) - navigation/placeholders done
- Notifications System (3-4 days) - spec complete
- Viewer/Public Dashboard (1.5-2 days) - navigation/placeholders done

**Overall MVP Status:** 99%+ complete for core MVP, 98%+ complete for enhanced MVP
