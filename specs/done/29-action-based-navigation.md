# Action-Based Navigation with Role-Specific Sidebar Access

**Status:** Design Specification
**Replaces:** Original role-based dashboard specs (7, 11, 12, 13, 14)
**Priority:** HIGH
**Effort:** 9-12 days (distributed across multiple action pages)

---

## Executive Summary

This specification defines an **action-based navigation system** where pages are organized by **specific actions** (e.g., submission management, team management, tournament management) rather than role-specific dashboards. Each role that needs access to an action page will have a link in their own role-specific sidebar section, enabling multiple roles to access the same action page through their own navigation context.

**Key Principles:**

1. **Action Pages, Not Role Dashboards** - Pages focus on specific actions (e.g., "Manage Submissions", "Review Queue", "Team Management")
2. **Role-Based Sidebar Sections** - Each role has their own sidebar section with links to action pages they can access
3. **Shared Action Pages** - Multiple roles can access the same action page, with permission checks inside the page determining available operations
4. **Flexible Permission Model** - Action pages enforce permissions at the operation level (mutations/queries), not at the page level
5. **Zero Duplication** - No duplicate pages for different roles; one page serves all authorized roles

**Example of Action-Based Approach:**

**BEFORE (Role-Based Dashboards):**

- `/admin/tournaments` - Admin-only tournament management
- `/tournament-manager/tournaments` - Tournament Manager-only tournament management
- Result: Two separate pages with duplicated code

**AFTER (Action-Based Navigation):**

- `/manage/tournaments` - Single tournament management page
- Both Admin AND Tournament Manager access this SAME page through their own sidebar
- Backend enforces role-specific permissions (admin can delete, tournament manager cannot)
- Result: One page, zero duplication

**Benefits:**

- **Eliminates code duplication** - One action page serves multiple roles
- **Clearer separation of concerns** - Actions vs roles are distinct
- **Easier to extend** - Add new roles without duplicating pages
- **Better maintainability** - Permission logic centralized in backend
- **Consistent UX** - Same action looks the same regardless of role
- **Reduced testing burden** - Test one page instead of multiple role-specific pages

---

## Feature Requirements

### Functional Requirements

**Action Pages Must:**

1. Focus on a single, well-defined action or workflow
2. Enforce permissions at the operation level (backend mutations/queries)
3. Display role-appropriate UI based on user's permissions
4. Handle multi-role access gracefully
5. Provide clear feedback when operations fail due to permissions
6. Link back to relevant contexts (teams, tournaments, etc.)

**Sidebar Navigation Must:** 7. Organize links by role-specific sections 8. Show notification badges for pending actions 9. Conditionally render sections based on user's roles 10. Support custom conditions (e.g., Captain section only if user captains teams) 11. Handle public access items (unauthenticated users) 12. Display consistent icons and labels

**Permission Model Must:** 13. Check permissions in backend functions (queries/mutations) 14. Return user-specific data based on role 15. Throw descriptive errors for unauthorized operations 16. Support hierarchical permissions (admin can do everything) 17. Allow role combinations (e.g., admin + tournament_manager)

### Non-Functional Requirements

**Performance:**

- Action pages load in < 2 seconds
- Real-time updates via Convex subscriptions
- Efficient permission checks (no redundant queries)
- Optimistic UI updates for mutations

**Accessibility:**

- WCAG AA compliance
- Keyboard navigation support
- Screen reader friendly
- ARIA labels and roles

**Scalability:**

- Support 6+ roles without navigation complexity
- Handle 100+ action pages if needed
- Efficient sidebar rendering (no performance degradation)

---

## Technical Design

### Role System Overview

The platform has **6 system roles** with hierarchical access:

| Role                 | Hierarchy | Description          | Access Level                                      |
| -------------------- | --------- | -------------------- | ------------------------------------------------- |
| `viewer`             | 5         | Read-only spectator  | View public leaderboards, tournaments             |
| `player`             | 4         | Base user role       | Create teams, join tournaments, submit activities |
| `reviewer`           | 3         | Content moderator    | Approve/reject submissions, handle disputes       |
| `tournament_manager` | 2         | Tournament operator  | Create tournaments, manage submissions, analytics |
| `admin`              | 1         | System administrator | Full access to all operations                     |
| `dev`                | 0         | Developer tools      | Access to debug/demo pages                        |

**Note:** Captain is a **team-based role**, not a system role. It's determined by `teamMembers.role = "captain"`.

---

### Action Page Architecture

#### Action Page Categories

Action pages are grouped into **5 categories**:

1. **Submission Management Actions**
   - Review Queue (`/reviewer`) - Reviewer-focused pending submissions
   - Submissions (`/manage/submissions`) - **Shared**: Admin + Tournament Manager access
   - Submission Groups (`/manage/submission-groups`) - **Shared**: Admin + Tournament Manager access
   - Flagged Submissions (`/reviewer/flagged`) - Disputed/problematic submissions

2. **Team Management Actions**
   - My Teams (`/teams`) - Teams user is part of
   - Captain Dashboard (`/captain`) - Teams user captains (conditional)
   - Team Comparison (`/captain/comparison`) - Performance across captain's teams

3. **Tournament Management Actions**
   - Tournament List (`/tournaments`) - Browse/join tournaments (all users)
   - Tournaments (`/manage/tournaments`) - **Shared**: Admin + Tournament Manager can create/manage

4. **User Management Actions**
   - User Directory (`/users`) - All platform users (admin only)
   - Role Management (integrated in user directory)

5. **Public/Viewer Actions**
   - Public Leaderboards (`/public/leaderboards`) - Unauthenticated access
   - Live Tournaments (`/public/live`) - Real-time feed
   - Viewer Dashboard (`/viewer`) - Favorite tournaments

**Key Principle:** Pages marked **Shared** are accessed by multiple roles through their own sidebar sections, demonstrating the action-based approach.

---

### Sidebar Navigation Structure

The sidebar is organized into **7 sections**, each targeting a specific role or context:

```typescript
// Sidebar Section Structure
type SidebarSection = {
  title: string; // Section header (e.g., "Admin", "Captain")
  roles?: string[]; // Required roles to see section
  condition?: (context) => boolean; // Custom visibility logic
  publicAccess?: boolean; // Visible to unauthenticated users
  items: SidebarItem[]; // Action links in this section
};

type SidebarItem = {
  title: string; // Link label
  href?: string; // Route path
  onClick?: () => void; // Handler for modals/actions
  icon: LucideIcon; // Icon component
  exact?: boolean; // Exact route matching
  roles?: string[]; // Required roles (inherits from section)
  condition?: (context) => boolean; // Custom visibility logic
  badge?: {
    // Notification badge
    query: FunctionReference; // Convex query for count
    color?: BadgeColor; // Badge color variant
    tooltip?: string; // Hover tooltip
  };
};
```

#### Section 1: Viewer/Discover (Public + Viewer Role)

**Purpose:** Public discovery and spectator features

**Visibility:**

- Public items visible to **all users** (including unauthenticated)
- Authenticated viewer items require `viewer` role

**Items:**

| Action               | Route                  | Icon   | Roles  | Public? |
| -------------------- | ---------------------- | ------ | ------ | ------- |
| Public Leaderboards  | `/public/leaderboards` | Trophy | -      | Yes     |
| Live Tournaments     | `/public/live`         | Tv     | -      | Yes     |
| Viewer Dashboard     | `/viewer`              | Eye    | viewer | No      |
| Favorite Tournaments | `/viewer/favorites`    | Star   | viewer | No      |

**Badge:** None

**Implementation Status:**

- ✅ Sidebar navigation created (PR #14)
- ❌ Placeholder pages need implementation

---

#### Section 2: User (Always Visible)

**Purpose:** Core user features available to all authenticated users

**Visibility:** Always visible for authenticated users

**Items:**

| Action         | Route          | Icon            | Roles  | Badge |
| -------------- | -------------- | --------------- | ------ | ----- |
| Dashboard      | `/dashboard`   | LayoutDashboard | -      | -     |
| Tournaments    | `/tournaments` | Trophy          | player | -     |
| Teams          | `/teams`       | Users           | player | -     |
| Submissions    | `/submissions` | ClipboardList   | player | -     |
| New Submission | (modal)        | PlusCircle      | player | -     |

**Badge:** None (personal actions, no pending queue)

**Implementation Status:**

- ✅ All pages fully implemented
- ✅ Dashboard implemented (PR #21)

---

#### Section 3: Captain (Conditional on Captaining Teams)

**Purpose:** Multi-team management for users who captain one or more teams

**Visibility:**

- Only visible if `captainedTeamsCount > 0`
- Custom condition: `condition: ({ captainedTeamsCount }) => captainedTeamsCount > 0`

**Items:**

| Action             | Route                 | Icon      | Roles | Badge                               |
| ------------------ | --------------------- | --------- | ----- | ----------------------------------- |
| My Teams (Captain) | `/captain`            | Shield    | -     | Pending join requests + invitations |
| Team Comparison    | `/captain/comparison` | BarChart3 | -     | -                                   |
| Invite Member      | (modal)               | UserPlus  | -     | -                                   |

**Badge:**

- Query: `api.captain.getPendingActionsCount`
- Shows count of join requests + pending invitations across **all captain's teams**
- Color: Default (blue)

**Implementation Status:**

- ✅ Sidebar navigation created (PR #14)
- ✅ Badge query implemented
- ❌ Captain dashboard placeholder needs implementation

**Permission Logic:**

- Backend queries filter teams where user is captain
- Join request approval limited to captains of that team
- Invitation actions limited to captains

---

#### Section 4: Reviewer (Reviewer Role)

**Purpose:** Content moderation and submission review

**Visibility:** Requires `reviewer` or `admin` role

**Items:**

| Action              | Route                  | Icon       | Roles           | Badge                     |
| ------------------- | ---------------------- | ---------- | --------------- | ------------------------- |
| Review Queue        | `/reviewer`            | FileCheck  | reviewer, admin | Pending submissions count |
| Review Statistics   | `/reviewer/statistics` | TrendingUp | reviewer, admin | -                         |
| Flagged Submissions | `/reviewer/flagged`    | Flag       | reviewer, admin | Flagged count             |

**Badge:**

- **Review Queue:** Shows pending submission count via `api.reviewer.getPendingCount`
- **Flagged:** Shows flagged submission count via `api.reviewer.getFlaggedCount`
- Color: Secondary (yellow) for pending, Destructive (red) for flagged

**Implementation Status:**

- ✅ Sidebar navigation created (PR #14)
- ✅ Badge queries implemented
- ❌ Reviewer dashboard placeholder needs implementation

**Permission Logic:**

- Reviewers can approve/reject any submission
- Cannot delete submissions (admin only)
- Can flag submissions for admin review
- Access to all tournament submissions

---

#### Section 5: Tournament Manager (Tournament Manager Role)

**Purpose:** Tournament creation and operational management

**Visibility:** Requires `tournament_manager` or `admin` role

**Items:**

| Action            | Route                 | Icon      | Roles                     | Badge               |
| ----------------- | --------------------- | --------- | ------------------------- | ------------------- |
| Manager Dashboard | `/tournament-manager` | Briefcase | tournament_manager, admin | -                   |
| Tournaments       | `/manage/tournaments` | Trophy    | tournament_manager, admin | -                   |
| Submissions       | `/manage/submissions` | FileText  | tournament_manager, admin | Pending submissions |

**Note:** Tournament management and submission management pages use `/manage/*` prefix to indicate they are shared action pages (not admin-specific)

**Badge:**

- Query: `api.tournamentManager.getPendingCount`
- Shows pending submissions across all tournaments
- Color: Secondary (yellow)

**Implementation Status:**

- ✅ Sidebar navigation created (PR #14)
- ✅ Badge query implemented
- ✅ Dashboard fully implemented (PR #15)
- ✅ Tournaments page implemented at `/manage/tournaments` (shared with admin)
- ✅ Submissions page implemented at `/manage/submissions` (shared with admin)

**Permission Logic:**

- Can create/edit tournaments (not delete)
- Can approve/reject submissions
- Cannot manage user roles
- Cannot access system administration

---

#### Section 6: Admin (Admin Role)

**Purpose:** System administration and global management

**Visibility:** Requires `admin` role

**Items:**

| Action            | Route                       | Icon     | Roles                     | Badge               |
| ----------------- | --------------------------- | -------- | ------------------------- | ------------------- |
| Admin Dashboard   | `/admin`                    | Shield   | admin                     | -                   |
| Tournaments       | `/manage/tournaments`       | Trophy   | admin, tournament_manager | -                   |
| Users             | `/users`                    | UserCog  | admin                     | -                   |
| Submissions       | `/manage/submissions`       | FileText | admin, tournament_manager | System-wide pending |
| Submission Groups | `/manage/submission-groups` | Layers   | admin, tournament_manager | Pending groups      |
| System Health     | `/admin/system`             | Activity | admin                     | -                   |

**Note:** Pages under `/manage/*` are shared action pages accessible by multiple roles. Admin-specific pages like Admin Dashboard and System Health remain under `/admin/*`.

**Badge:**

- **Submissions:** `api.admin.getAllPendingCount` (system-wide pending submissions)
- **Submission Groups:** `api.submissionGroups.getPendingCount` (pending team activity groups)
- Color: Secondary (yellow)

**Implementation Status:**

- ✅ Sidebar navigation created (PR #14)
- ✅ Badge queries implemented
- ✅ Submissions page implemented at `/manage/submissions` (shared)
- ✅ Submission Groups page implemented at `/manage/submission-groups` (shared)
- ✅ Tournaments page implemented at `/manage/tournaments` (shared)
- ✅ Users page implemented at `/users`
- ❌ Admin Dashboard placeholder needs implementation
- ❌ System Health placeholder needs implementation

**Permission Logic:**

- Full access to all operations
- Can delete any entity (tournaments, teams, submissions, users)
- Can manage all user roles
- Can override any permission check

---

#### Section 7: Dev (Developer Tools)

**Purpose:** Debug tools and component demos

**Visibility:** Requires `dev` role

**Items:**

| Action      | Route              | Icon   | Roles |
| ----------- | ------------------ | ------ | ----- |
| Button Demo | `/dev/button-demo` | Code2  | dev   |
| Card Demo   | `/dev/card-demo`   | Layers | dev   |

**Badge:** None

**Implementation Status:**

- ✅ Fully implemented
- ✅ Demo pages created

---

### Action Page Specifications

Below are detailed specifications for each **action page** that needs implementation or enhancement.

---

## Action Page: Review Queue (`/reviewer`)

**Purpose:** Dedicated submission review interface for reviewers

**Access:** `reviewer` or `admin` role

**Status:** ❌ Placeholder page exists, needs implementation

**Estimated Effort:** 1-2 days

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Review Queue                                    [?] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [All ▼] [Tournament Filter ▼] [Sort: Date ▼]     │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  [Image] Team Alpha - 2024-11-20           │   │
│  │          "Morning workout session..."       │   │
│  │          Base Tier • Individual            │   │
│  │                                             │   │
│  │          [✓ Approve] [✗ Reject] [👁 View]  │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  [Image] Team Beta - 2024-11-19            │   │
│  │          "Team exercise - 4 members..."     │   │
│  │          Advanced Tier • Team Activity     │   │
│  │                                             │   │
│  │          [✓ Approve Group] [✗ Reject] [👁] │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  [Load More...]                                    │
└─────────────────────────────────────────────────────┘
```

### Backend Requirements

**New Queries:**

- `reviewer.getPendingSubmissions(filters: { tournamentId?, teamId?, type?, limit?, offset? })` → Returns paginated pending submissions with:
  - Submission details
  - Team and tournament context
  - Submitter information
  - Image URLs
  - Group information (if team activity)
  - Permission flags (canApprove, canReject, canFlag)

**Existing Mutations (need reviewer role access):**

- `submissions.approve` - Already implemented, add reviewer permission
- `submissions.reject` - Already implemented, add reviewer permission
- `submissionGroups.approve` - Already implemented, add reviewer permission
- `submissionGroups.reject` - Already implemented, add reviewer permission

**New Mutations:**

- `submissions.flag(submissionId, reason)` - Flag submission for admin review
  - Adds flag state to submission
  - Creates notification for admins
  - Reviewer can provide reason

### Frontend Components

**Reuse Existing:**

- `SubmissionCard` component (from PR #18)
- `SubmissionCardList` component
- Inline approve/reject actions

**New Components:**

- `ReviewQueueFilters` - Tournament, team, type filters
- `ReviewQueueStats` - Count of pending by tournament
- `FlagSubmissionDialog` - Modal for flagging with reason input

### Features

1. **Inline Actions:** Approve/reject without navigating away
2. **Keyboard Shortcuts:**
   - `A` = Approve
   - `R` = Reject
   - `F` = Flag
   - `→` = Next submission
   - `←` = Previous submission
3. **Bulk Actions:** Select multiple submissions and approve/reject at once
4. **Filters:** Tournament, team, submission type, date range
5. **Sort:** By date, team, tournament
6. **Pagination:** Load 20 submissions at a time
7. **Real-time Updates:** New submissions appear automatically

### Acceptance Criteria

- ✅ Reviewer can view all pending submissions across tournaments
- ✅ Reviewer can approve individual submissions with one click
- ✅ Reviewer can approve team activity groups atomically
- ✅ Reviewer can reject submissions with reason
- ✅ Reviewer can flag submissions for admin review
- ✅ Keyboard shortcuts work correctly
- ✅ Filters and sorting work correctly
- ✅ Real-time updates reflect new submissions
- ✅ Permission checks prevent unauthorized actions
- ✅ Toast notifications confirm actions

---

## Action Page: Review Statistics (`/reviewer/statistics`)

**Purpose:** Performance metrics for reviewer activity

**Access:** `reviewer` or `admin` role

**Status:** ❌ Placeholder page exists, needs implementation

**Estimated Effort:** 0.5-1 day

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Review Statistics                               [?] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Your Review Performance                            │
│                                                     │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  │
│  │  150   │  │  120   │  │  30    │  │  80%   │  │
│  │ Total  │  │Approved│  │Rejected│  │Approval│  │
│  └────────┘  └────────┘  └────────┘  └────────┘  │
│                                                     │
│  Review Activity (Last 30 Days)                    │
│  [Line Chart: Reviews per day]                     │
│                                                     │
│  Recent Reviews                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Team Alpha - Approved - 2 hours ago       │   │
│  │  Team Beta - Rejected - 5 hours ago        │   │
│  │  Team Gamma - Approved - 1 day ago         │   │
│  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Backend Requirements

**New Queries:**

- `reviewer.getStatistics(userId)` → Returns:
  - Total reviews (all time)
  - Approved count
  - Rejected count
  - Flagged count
  - Approval rate
  - Average review time
  - Reviews by day (last 30 days)
  - Recent review activity (last 20)

### Frontend Components

**New Components:**

- `ReviewerStatsCards` - 4-card grid with metrics
- `ReviewActivityChart` - Line chart of reviews per day (use recharts or similar)
- `RecentReviewsList` - Timeline of recent reviews

### Features

1. Personal performance metrics
2. Visual chart showing review activity over time
3. Recent review history with links to submissions
4. Comparison to platform average (optional)

### Acceptance Criteria

- ✅ Statistics show correct counts
- ✅ Chart displays review activity accurately
- ✅ Recent reviews list shows latest 20 actions
- ✅ Links navigate to submission detail pages
- ✅ Real-time updates reflect new reviews

---

## Action Page: Flagged Submissions (`/reviewer/flagged`)

**Purpose:** Handle disputed or problematic submissions

**Access:** `reviewer` or `admin` role

**Status:** ❌ Placeholder page exists, needs implementation

**Estimated Effort:** 0.5 day

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Flagged Submissions                             [?] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [All ▼] [Sort: Flag Date ▼]                       │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  🚩 Team Alpha - 2024-11-20                │   │
│  │     Reason: "Image quality too low"         │   │
│  │     Flagged by: John Reviewer - 2 days ago │   │
│  │                                             │   │
│  │     [✓ Approve Anyway] [✗ Reject]          │   │
│  │     [↩ Unflag] [👁 View Details]           │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Backend Requirements

**Schema Changes:**

- `submissions.flaggedBy` - Optional user ID who flagged
- `submissions.flaggedAt` - Optional timestamp
- `submissions.flagReason` - Optional string

**New Queries:**

- `reviewer.getFlaggedSubmissions()` → Returns flagged submissions with flag metadata

**New Mutations:**

- `submissions.unflag(submissionId)` - Remove flag, return to pending

### Frontend Components

**Reuse:**

- `SubmissionCard` component with flag indicator

**New:**

- `FlaggedSubmissionCard` - Extended card showing flag metadata

### Features

1. List all flagged submissions
2. Show flag reason and who flagged
3. Actions: Approve anyway, Reject, Unflag (return to pending)
4. Link to full submission detail page

### Acceptance Criteria

- ✅ All flagged submissions displayed
- ✅ Flag metadata shown correctly
- ✅ Actions work (approve, reject, unflag)
- ✅ Unflagging returns submission to pending state
- ✅ Permission checks enforce reviewer role

---

## Action Page: Captain Dashboard (`/captain`)

**Purpose:** Centralized management for users who captain multiple teams

**Access:** Any authenticated user who captains at least one team

**Status:** ❌ Placeholder page exists, needs implementation

**Estimated Effort:** 1-1.5 days

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Team Captain Dashboard                          [?] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Your Teams                                         │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │ Team Alpha  │  │ Team Beta   │  │ Team Gamma  ││
│  │ Tournament A│  │ Tournament B│  │ Tournament A││
│  │ 5 members   │  │ 4 members   │  │ 6 members   ││
│  │ 120 points  │  │ 95 points   │  │ 150 points  ││
│  │ [Manage]    │  │ [Manage]    │  │ [Manage]    ││
│  └─────────────┘  └─────────────┘  └─────────────┘│
│                                                     │
│  Pending Actions (3)                                │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Join Request from John Doe (Team Alpha)   │   │
│  │  [✓ Approve] [✗ Reject]                    │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Invitation sent to jane@example.com       │   │
│  │  (Team Beta) - Pending - Sent 2 days ago   │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  Quick Actions                                      │
│  [+ Invite Member] [📊 Compare Teams]              │
└─────────────────────────────────────────────────────┘
```

### Backend Requirements

**Existing Queries to Reuse:**

- `captain.getCaptainedTeamsCount` - Already implemented
- `captain.getPendingActionsCount` - Already implemented (join requests + invitations)

**New Queries:**

- `captain.getDashboardData()` → Returns:
  - All teams user captains
  - Pending join requests across all teams
  - Pending invitations across all teams
  - Team statistics (members, points, submissions)
  - Tournament context for each team

### Frontend Components

**Reuse:**

- `UserTeamCard` (from unified dashboard)
- `JoinRequestsList` component
- `InvitedUsersList` component
- `InviteMemberDialog`

**New:**

- `CaptainTeamsGrid` - Grid of captain's teams
- `PendingActionsPanel` - Combined join requests + invitations

### Features

1. View all teams user captains in one place
2. See pending actions aggregated across teams
3. Quick approve/reject for join requests
4. View sent invitations status
5. Quick actions: Invite member, compare teams
6. Navigate to individual team pages

### Acceptance Criteria

- ✅ All captain's teams displayed
- ✅ Join requests from all teams shown
- ✅ Invitations from all teams shown
- ✅ Actions work (approve, reject, cancel)
- ✅ Badge count matches pending actions
- ✅ Quick actions open correct dialogs
- ✅ Navigation links work correctly

---

## Action Page: Team Comparison (`/captain/comparison`)

**Purpose:** Compare performance across captain's teams

**Access:** Any authenticated user who captains at least one team

**Status:** ❌ Placeholder page exists, needs implementation

**Estimated Effort:** 0.5 day

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Team Comparison                                 [?] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Performance Comparison                             │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │        │ Team Alpha │ Team Beta │ Team Gamma │ │
│  ├──────────────────────────────────────────────┤ │
│  │ Points │    120     │    95     │    150     │ │
│  │Members │     5      │     4     │     6      │ │
│  │Submiss.│    40      │    32     │    45      │ │
│  │Approval│    85%     │    78%    │    92%     │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  [Bar Chart: Points Comparison]                    │
│                                                     │
│  [Line Chart: Submission Trends (Last 30 Days)]    │
└─────────────────────────────────────────────────────┘
```

### Backend Requirements

**New Queries:**

- `captain.getTeamsComparison()` → Returns comparison metrics for all captain's teams:
  - Points, rank, members
  - Submission count, approval rate
  - Recent activity trends

### Frontend Components

**New:**

- `TeamComparisonTable` - Side-by-side metrics
- `TeamPerformanceChart` - Visual comparison (bar chart)
- `SubmissionTrendsChart` - Line chart over time

### Features

1. Side-by-side team metrics
2. Visual charts comparing performance
3. Trend analysis over time

### Acceptance Criteria

- ✅ Comparison shows all captain's teams
- ✅ Metrics accurate and up-to-date
- ✅ Charts render correctly
- ✅ Empty state if captain has < 2 teams

---

## Action Page: Admin Dashboard (`/admin`)

**Purpose:** Centralized view for system administrators

**Access:** `admin` role only

**Status:** ❌ Placeholder page exists, needs implementation

**Estimated Effort:** 1.5 days

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Admin Dashboard                                 [?] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  System Overview                                    │
│                                                     │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  │
│  │  450   │  │   12   │  │   85   │  │  320   │  │
│  │ Users  │  │Tournam.│  │ Teams  │  │Submiss.│  │
│  └────────┘  └────────┘  └────────┘  └────────┘  │
│                                                     │
│  Pending Actions (15)                               │
│  ┌────────────────────────────────────────────┐   │
│  │  8 Submissions awaiting approval           │   │
│  │  3 Flagged submissions                     │   │
│  │  4 Join requests pending                   │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  Recent Activity                                    │
│  [Timeline of latest system events]                │
│                                                     │
│  Quick Actions                                      │
│  [+ Create Tournament] [👥 Manage Users]           │
│  [📊 View Reports] [⚙️ System Health]              │
└─────────────────────────────────────────────────────┘
```

### Backend Requirements

**Existing Query:**

- `admin.getDashboardData()` - Already implemented (from unified dashboard PR #21)

**Extension Needed:**

- Add flagged submissions count
- Add join requests count (system-wide)
- Add recent activity feed (system-wide events)

### Frontend Components

**Reuse:**

- `AdminOverviewCard` (from unified dashboard PR #21)
- `RecentActivityFeed`

**New:**

- `AdminStatsGrid` - System-wide statistics
- `AdminPendingActionsPanel` - Aggregated pending actions
- `AdminQuickActions` - Button grid for common tasks

### Features

1. System-wide statistics (users, tournaments, teams, submissions)
2. Pending actions aggregated across platform
3. Recent activity feed (system-wide events)
4. Quick actions for common admin tasks
5. Links to management pages

### Acceptance Criteria

- ✅ Statistics show accurate system-wide counts
- ✅ Pending actions link to relevant pages
- ✅ Activity feed shows recent events
- ✅ Quick actions work correctly
- ✅ Real-time updates via Convex subscriptions

---

## Action Page: System Health (`/admin/system`)

**Purpose:** Monitor platform health and performance

**Access:** `admin` role only

**Status:** ❌ Placeholder page exists, needs implementation

**Estimated Effort:** 1 day

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ System Health                                   [?] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Service Status                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  ✅ Convex Backend         Healthy         │   │
│  │  ✅ Clerk Auth            Healthy         │   │
│  │  ✅ Database              Healthy         │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  Database Metrics                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  Tournaments: 12 (0 orphaned)              │   │
│  │  Teams: 85 (2 orphaned)                    │   │
│  │  Submissions: 320 (5 orphaned)             │   │
│  │  Users: 450 (0 inactive sync)              │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  Recent Errors                                      │
│  [List of recent error logs]                       │
│                                                     │
│  Actions                                            │
│  [🔧 Run Data Integrity Check]                     │
│  [🧹 Cleanup Orphaned Records]                     │
└─────────────────────────────────────────────────────┘
```

### Backend Requirements

**New Queries:**

- `admin.getSystemHealth()` → Returns:
  - Service status (Convex, Clerk, etc.)
  - Database metrics (counts, orphaned records)
  - Error logs (last 50)
  - Performance metrics (query times, etc.)

**New Mutations:**

- `admin.runIntegrityCheck()` - Scan for orphaned records
- `admin.cleanupOrphanedRecords()` - Remove orphaned data

### Frontend Components

**New:**

- `ServiceStatusCard` - Service health indicators
- `DatabaseMetricsCard` - Entity counts and issues
- `ErrorLogsList` - Recent error timeline
- `SystemActionsPanel` - Admin utility actions

### Features

1. Real-time service status monitoring
2. Database integrity checks
3. Error log viewing
4. Cleanup utilities for orphaned data

### Acceptance Criteria

- ✅ Service status shows correct state
- ✅ Database metrics accurate
- ✅ Orphaned records detected correctly
- ✅ Cleanup actions work safely
- ✅ Error logs displayed with timestamps

---

## Implementation Plan

### Phase 1: Reviewer Dashboard (2 days)

**Priority:** HIGH - Critical for content moderation scalability

**Tasks:**

1. Implement Review Queue page (`/reviewer`)
   - Backend: Add reviewer permission to submission mutations
   - Backend: Create `reviewer.getPendingSubmissions` query
   - Frontend: Build ReviewQueue component with filters
   - Frontend: Add keyboard shortcuts
2. Implement Review Statistics page (`/reviewer/statistics`)
   - Backend: Create `reviewer.getStatistics` query
   - Frontend: Build statistics dashboard with charts
3. Implement Flagged Submissions page (`/reviewer/flagged`)
   - Backend: Add flag fields to submissions schema
   - Backend: Create `submissions.flag` and `submissions.unflag` mutations
   - Backend: Create `reviewer.getFlaggedSubmissions` query
   - Frontend: Build flagged submissions list with actions

**Deliverables:**

- Fully functional reviewer workflow
- Keyboard shortcuts for efficiency
- Flag system for disputed submissions
- Performance metrics for reviewers

---

### Phase 2: Captain Dashboard (1.5 days)

**Priority:** MEDIUM - Improves captain efficiency

**Tasks:**

1. Implement Captain Dashboard page (`/captain`)
   - Backend: Create `captain.getDashboardData` query
   - Frontend: Build captain teams grid
   - Frontend: Build pending actions panel
2. Implement Team Comparison page (`/captain/comparison`)
   - Backend: Create `captain.getTeamsComparison` query
   - Frontend: Build comparison table and charts

**Deliverables:**

- Centralized captain management hub
- Aggregated pending actions across teams
- Team performance comparison view

---

### Phase 3: Admin Dashboard (2.5 days)

**Priority:** MEDIUM - Admin convenience

**Tasks:**

1. Implement Admin Dashboard page (`/admin`)
   - Backend: Extend `admin.getDashboardData` query
   - Frontend: Build admin overview with stats
   - Frontend: Build pending actions panel
   - Frontend: Build quick actions panel
2. Implement System Health page (`/admin/system`)
   - Backend: Create `admin.getSystemHealth` query
   - Backend: Create integrity check and cleanup mutations
   - Frontend: Build system health monitoring dashboard
   - Frontend: Build admin utility actions

**Deliverables:**

- System-wide admin dashboard
- Platform health monitoring
- Data integrity utilities

---

### Phase 4: Viewer/Public Dashboard (2 days)

**Priority:** LOW - External visibility

**Tasks:**

1. Implement Public Leaderboards page (`/public/leaderboards`)
   - Backend: Create public queries (no auth required)
   - Frontend: Build public leaderboard view
   - Middleware: Allow unauthenticated access to `/public/*`
2. Implement Live Tournaments page (`/public/live`)
   - Backend: Create public live tournament feed query
   - Frontend: Build real-time tournament feed
3. Implement Viewer Dashboard page (`/viewer`)
   - Backend: Create `viewer.getDashboardData` query
   - Frontend: Build viewer dashboard with favorites
4. Implement Favorites page (`/viewer/favorites`)
   - Backend: Create favorites schema and mutations
   - Frontend: Build favorites management

**Deliverables:**

- Public-facing leaderboards
- Real-time tournament feed
- Viewer role dashboard with favorites

---

## Database Schema Changes

### Submissions Table Updates

```typescript
submissions: defineTable({
  // ... existing fields ...

  // NEW: Flag system
  flaggedBy: v.optional(v.id("users")), // User who flagged submission
  flaggedAt: v.optional(v.string()), // When flagged (ISO timestamp)
  flagReason: v.optional(v.string()), // Reason for flag
})
  // ... existing indexes ...
  .index("by_flagged", ["flaggedBy"]); // NEW: Query flagged submissions
```

### New Table: Favorites (for Viewer Dashboard)

```typescript
favorites: defineTable({
  userId: v.id("users"), // User who favorited
  tournamentId: v.id("tournaments"), // Favorited tournament
  createdAt: v.string(), // When favorited
})
  .index("by_user", ["userId"])
  .index("by_tournament", ["tournamentId"])
  .index("by_user_and_tournament", ["userId", "tournamentId"]);
```

---

## Permission Matrix

This table shows which roles can access which action pages:

| Action Page                                            | Admin | Tournament Manager | Reviewer | Captain         | Player          | Viewer | Public |
| ------------------------------------------------------ | ----- | ------------------ | -------- | --------------- | --------------- | ------ | ------ | --- |
| **Submission Management**                              |       |                    |          |                 |                 |        |        |     |
| Review Queue (`/reviewer`)                             | ✅    | ❌                 | ✅       | ❌              | ❌              | ❌     | ❌     |
| Review Statistics (`/reviewer/statistics`)             | ✅    | ❌                 | ✅       | ❌              | ❌              | ❌     | ❌     |
| Flagged Submissions (`/reviewer/flagged`)              | ✅    | ❌                 | ✅       | ❌              | ❌              | ❌     | ❌     |
| **Submissions (`/manage/submissions`)** 🔗             | ✅    | ✅                 | ❌       | ❌              | ❌              | ❌     | ❌     |
| **Submission Groups (`/manage/submission-groups`)** 🔗 | ✅    | ✅                 | ❌       | ❌              | ❌              | ❌     | ❌     |
| **Team Management**                                    |       |                    |          |                 |                 |        |        |     |
| My Teams (`/teams`)                                    | ✅    | ✅                 | ✅       | ✅              | ✅              | ❌     | ❌     |
| Captain Dashboard (`/captain`)                         | ✅    | ✅                 | ✅       | ✅ (if captain) | ✅ (if captain) | ❌     | ❌     |
| Team Comparison (`/captain/comparison`)                | ✅    | ✅                 | ✅       | ✅ (if captain) | ✅ (if captain) | ❌     | ❌     |
| **Tournament Management**                              |       |                    |          |                 |                 |        |        |     |
| Tournament List (`/tournaments`)                       | ✅    | ✅                 | ✅       | ✅              | ✅              | ❌     | ❌     |
| **Tournaments (`/manage/tournaments`)** 🔗             | ✅    | ✅                 | ❌       | ❌              | ❌              | ❌     | ❌     |
| **Dashboards**                                         |       |                    |          |                 |                 |        |        |     |
| Tournament Manager Dashboard (`/tournament-manager`)   | ✅    | ✅                 | ❌       | ❌              | ❌              | ❌     | ❌     |
| Admin Dashboard (`/admin`)                             | ✅    | ❌                 | ❌       | ❌              | ❌              | ❌     | ❌     |
| System Health (`/admin/system`)                        | ✅    | ❌                 | ❌       | ❌              | ❌              | ❌     | ❌     |
| **User Management**                                    |       |                    |          |                 |                 |        |        |     |
| Users Directory (`/users`)                             | ✅    | ❌                 | ❌       | ❌              | ❌              | ❌     | ❌     |
| **Public/Viewer**                                      |       |                    |          |                 |                 |        |        |     |
| Public Leaderboards (`/public/leaderboards`)           | ✅    | ✅                 | ✅       | ✅              | ✅              | ✅     | ✅     |
| Live Tournaments (`/public/live`)                      | ✅    | ✅                 | ✅       | ✅              | ✅              | ✅     | ✅     |
| Viewer Dashboard (`/viewer`)                           | ✅    | ✅                 | ✅       | ✅              | ✅              | ✅     | ❌     |
| Favorites (`/viewer/favorites`)                        | ✅    | ✅                 | ✅       | ✅              | ✅              | ✅     | ❌     |

**Legend:**

- ✅ = Full access
- ❌ = No access
- ✅ (if captain) = Conditional access based on captaining teams
- 🔗 = **Shared action page** accessed by multiple roles through their own sidebar sections

### How Shared Pages Work

Shared action pages (marked with 🔗) demonstrate the core principle of action-based navigation:

**Example: Tournaments Page (`/manage/tournaments`)**

**Accessed By:**

- **Admin Sidebar** → "Admin" section → "Tournaments" link → `/manage/tournaments`
- **Tournament Manager Sidebar** → "Tournament Manager" section → "Tournaments" link → `/manage/tournaments`

**Implementation:**

- **Single page** at `/manage/tournaments`
- **Single component** handles both roles
- **Backend permissions** determine available operations:
  - Admin: Can create, edit, delete tournaments
  - Tournament Manager: Can create, edit tournaments (no delete)
- **UI adapts** based on user's permissions (hide delete button for tournament managers)

**Why `/manage/*` prefix?**

- Makes it clear these are shared action pages, not admin-specific
- Reflects the action (managing resources) rather than a role
- Easier to understand when multiple roles access the same page
- Consistent naming: `/manage/tournaments`, `/manage/submissions`, `/manage/submission-groups`

**Benefits:**

- No code duplication
- Consistent UX across roles
- Single source of truth for tournament management
- Easy to maintain and extend
- Clear semantic meaning (managing vs administering)

---

## Code Examples

### Backend: Permission Check Pattern

All action page queries follow this permission pattern:

```typescript
// convex/reviewer.ts
export const getPendingSubmissions = query({
  args: {
    filters: v.optional(
      v.object({
        tournamentId: v.optional(v.id("tournaments")),
        teamId: v.optional(v.id("teams")),
        limit: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const user = await getCurrentUserOrThrow(ctx);

    // 2. Check role permission
    if (!["admin", "reviewer"].some((r) => user.roleNames.includes(r))) {
      throw new Error("Reviewer or admin access required");
    }

    // 3. Fetch data with role-appropriate filters
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => {
        let filter = q.eq(q.field("state"), "pending");

        // Apply optional filters
        if (args.filters?.tournamentId) {
          filter = q.and(
            filter,
            q.eq(q.field("tournamentId"), args.filters.tournamentId),
          );
        }

        return filter;
      })
      .take(args.filters?.limit ?? 20);

    // 4. Enrich with related data
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        const [team, tournament, submitter] = await Promise.all([
          ctx.db.get(submission.teamId),
          ctx.db.get(submission.tournamentId),
          ctx.db.get(submission.userId),
        ]);

        return {
          ...submission,
          team,
          tournament,
          submitter,
          // Permission flags
          canApprove: true, // Reviewers can approve
          canReject: true, // Reviewers can reject
          canFlag: true, // Reviewers can flag
          canDelete: user.roleNames.includes("admin"), // Only admin
        };
      }),
    );

    return enrichedSubmissions;
  },
});
```

### Backend: Conditional Sidebar Visibility

```typescript
// convex/captain.ts
export const getCaptainedTeamsCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const captainedTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    return captainedTeams.length;
  },
});
```

### Frontend: Action Page with Permission Checks

```typescript
// src/app/(all)/reviewer/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { redirect } from "next/navigation";

export default function ReviewQueuePage() {
  const { user } = useUser();
  const submissions = useQuery(api.reviewer.getPendingSubmissions);
  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);

  // Permission check (redundant with backend, but improves UX)
  if (user && !user.isReviewer && !user.isAdmin) {
    redirect("/dashboard");
  }

  // Loading state
  if (!submissions) {
    return <ReviewQueueSkeleton />;
  }

  // Empty state
  if (submissions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No pending submissions to review.</p>
      </div>
    );
  }

  // Main UI
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Review Queue</h1>

      <SubmissionCardList
        submissions={submissions}
        onApprove={async (id) => {
          await approveSubmission({ submissionId: id });
          toast.success("Submission approved");
        }}
        onReject={async (id) => {
          await rejectSubmission({ submissionId: id });
          toast.success("Submission rejected");
        }}
      />
    </div>
  );
}
```

### Frontend: Sidebar Item with Badge

```typescript
// src/components/app-sidebar.tsx (already implemented)
{
  title: t("reviewer.queue"),
  href: "/reviewer",
  icon: FileCheck,
  badge: {
    query: api.reviewer.getPendingCount,  // Real-time badge count
    color: "secondary",
  },
  exact: true,
}
```

---

## Open Questions & Considerations

### 1. Captain Role Promotion

**Question:** Should captains be promoted to a system role, or remain a team-based role?

**Current:** Captain is team-based (`teamMembers.role = "captain"`). User can captain multiple teams.

**Recommendation:** Keep as team-based role. It's more flexible and accurately represents the relationship. Use conditional sidebar visibility (`captainedTeamsCount > 0`) to show/hide Captain section.

---

### 2. Public Route Middleware

**Question:** How should we handle unauthenticated access to `/public/*` routes?

**Current:** Middleware requires authentication for all `/(all)/*` routes.

**Recommendation:**

- Move `/public/*` routes outside `/(all)` route group to new `/(public)` group
- Update middleware to allow unauthenticated access to `/(public)/*`
- Queries for public routes should not call `getCurrentUserOrThrow()`

---

### 3. Viewer Role Purpose

**Question:** What value does the viewer role provide beyond public access?

**Recommendation:**

- Viewers can favorite tournaments (requires account)
- Viewers can comment on tournaments (future feature)
- Viewers get personalized dashboard with followed tournaments
- Provides "spectator mode" for users who don't participate but follow platform

---

### 4. Keyboard Shortcuts Scope

**Question:** Should keyboard shortcuts be global or page-specific?

**Recommendation:** Page-specific. Only active on Review Queue page. Document shortcuts in page UI. Use clear modifier keys to prevent conflicts (e.g., `Shift+A` for approve).

---

## Success Metrics

### Reviewer Dashboard Success

- **Adoption:** 80%+ of reviewers use Review Queue page weekly
- **Efficiency:** Average review time < 30 seconds per submission
- **Keyboard Shortcuts:** 50%+ of reviewers use keyboard shortcuts
- **Queue Size:** Pending submissions cleared within 24 hours

### Captain Dashboard Success

- **Adoption:** 70%+ of captains with 2+ teams use Captain Dashboard
- **Response Time:** Join requests responded to within 12 hours
- **Team Management:** Invitation acceptance rate > 60%

### Admin Dashboard Success

- **Visibility:** Admins check dashboard daily
- **Action Time:** Pending actions resolved within 24 hours
- **System Health:** Zero critical issues detected
- **Data Integrity:** No orphaned records after weekly cleanup

### Public/Viewer Success

- **Traffic:** 20%+ of platform visitors view public pages without login
- **Conversion:** 10%+ of public viewers create accounts
- **Engagement:** Viewers favorite average of 3 tournaments

---

## Validation Checklist

Before finalizing implementation:

- [ ] All action pages have clear, single-purpose focus
- [ ] Permission checks enforced in backend (mutations/queries)
- [ ] Sidebar navigation correctly shows/hides based on roles
- [ ] Badge counts update in real-time via Convex subscriptions
- [ ] Error messages are descriptive and user-friendly
- [ ] Loading states implemented for all action pages
- [ ] Empty states provide helpful guidance
- [ ] Keyboard navigation works correctly
- [ ] Mobile responsive design for all pages
- [ ] Real-time updates work without page refresh
- [ ] Toast notifications confirm all actions
- [ ] Links navigate to correct destinations
- [ ] Permission matrix accurately reflects access control

---

## References

- **Existing Implementation:** `src/components/app-sidebar.tsx` (PR #14)
- **Role System:** `convex/data.ts` (lines 174-217)
- **Schema:** `convex/schema.ts`
- **Unified Dashboard:** `src/app/(all)/dashboard/page.tsx` (PR #21)
- **Tournament Manager Dashboard:** `src/app/(all)/tournament-manager/page.tsx` (PR #15)
- **Submission Card View:** `src/components/submissions/submission-card.tsx` (PR #18)

---

## Timeline Estimate

**Total Estimated Effort:** 9-12 days

- **Phase 1 (Reviewer):** 2 days
- **Phase 2 (Captain):** 1.5 days
- **Phase 3 (Admin):** 2.5 days
- **Phase 4 (Viewer/Public):** 2 days
- **Testing & Polish:** 1-2 days
- **Documentation:** 0.5 day

**Recommended Approach:** Implement in phases, allowing each phase to be tested and deployed independently. Prioritize Reviewer Dashboard (Phase 1) as it addresses the most pressing operational need.
