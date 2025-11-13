# Missing Features for MVP

This document outlines the features that are missing or incomplete for a Minimum Viable Product (MVP) of the Urban Legends tournament tracking platform.

## Current State

The codebase is approximately **97%+ complete** for MVP. All critical features are implemented!

### ✅ Core Infrastructure (Complete)

- ✅ Authentication & user management (Clerk integration)
- ✅ Role-based access control
- ✅ Tournament management (admin)
- ✅ Submission creation and approval workflow

### ✅ Critical Features (All Complete!)

- ✅ **Team management** (create, edit, delete, join, leave) - PR #1, #3
- ✅ **Team member management UI** (invite, remove, transfer captaincy) - PR #1
- ✅ **Leaderboard and scoring system** - PR #5
- ✅ **Admin role management UI** - PR #6
- ✅ **Code quality and type safety** - PR #4

### ⚠️ High Priority Features (Still Needed)

- ❌ Submission progress calendar
- ❌ Loading states / skeleton screens
- ❌ Tournament Manager Dashboard
- ❌ Reviewer Dashboard

**Note:** For details on completed features, see [COMPLETED.md](COMPLETED.md)

---

## High Priority (Should Have)

These features significantly improve user experience and should be implemented soon:

### 1. Submission Progress Calendar ([spec](specs/04-submission-calendar.md))

**Status:** ❌ Not Implemented
**Priority:** HIGH
**Effort:** 1-2 days

**Problem:** Users can't visualize their daily submission progress.

**Impact:** Hard to track completion and identify missing days. Users need a visual way to see their tournament progress.

**Required:**

- Create calendar grid UI component
- Show submission status by date (submitted/missing/approved/rejected)
- Visual progress indicators for tournaments
- Date highlighting for active/completed days
- Integration with tournament date ranges

**Note:** A basic UI calendar component exists (`src/components/ui/calendar.tsx`) but needs to be adapted for submission tracking.

### 2. Loading States / Skeleton Screens ([spec](specs/10-loading-states.md))

**Status:** ⚠️ Partial - Skeleton component exists, not used
**Priority:** HIGH
**Effort:** 1-2 days

**Problem:** 7 locations return `null` during loading. Users see blank screens or flashes of empty content.

**Impact:** Poor perceived performance, jarring user experience, lack of visual feedback during data fetching.

**Locations Needing Skeletons:**

1. `/tournaments/[tournamentId]/page.tsx:70` - Tournament detail
2. `/tournaments/page.tsx:36` - Tournament list
3. `/submissions/[submissionId]/page.tsx:24` - Submission detail
4. `/teams/[teamId]/page.tsx:38` - Team detail
5. `/users/[userId]/page.tsx:23` - User detail
6. `/users/[userId]/page.tsx:24` - User not found
7. `/users/page.tsx:23` - Users list

**Required:**

- Create reusable skeleton components (DetailsCardSkeleton, TableSkeleton, CardGridSkeleton, PageSkeleton)
- Replace all `return null` loading states with appropriate skeletons
- Add ARIA attributes for accessibility (`aria-busy`, `role="status"`)
- Ensure skeletons match actual content layout

**Note:** Base `Skeleton` component already exists (`src/components/ui/skeleton.tsx`), just needs to be composed into layouts.

### 3. Tournament Manager Dashboard ([spec](specs/11-tournament-manager-dashboard.md))

**Status:** ❌ Not Implemented
**Priority:** HIGH
**Effort:** 3-4 days

**Problem:** The `tournament_manager` role exists but has no dedicated interface. Tournament managers cannot execute their role-specific functions without full admin access.

**Impact:** Cannot delegate tournament management responsibilities. Tournament managers have no way to manage their assigned tournaments, approve submissions, or access tournament analytics.

**Required:**

- Tournament assignment system (admins assign managers to specific tournaments)
- Tournament manager dashboard showing assigned tournaments
- Scoped submission approval queue (only for managed tournaments)
- Tournament analytics and statistics
- Team oversight for managed tournaments
- Permission checks allowing tournament_manager role

**Benefits:** Enables delegation of tournament management without giving full admin access, scales tournament operations.

### 4. Reviewer Dashboard ([spec](specs/12-reviewer-dashboard.md))

**Status:** ❌ Not Implemented
**Priority:** HIGH
**Effort:** 2-3 days

**Problem:** The `reviewer` role exists but has no dedicated interface. Reviewers cannot focus on content moderation without full admin powers.

**Impact:** Forces organizations to give full admin access to users who should only review submissions. No efficient review workflow.

**Required:**

- Review queue dashboard with all pending submissions
- Inline approve/reject actions with keyboard shortcuts
- Bulk review operations
- Review statistics and performance tracking
- Dispute resolution workflow
- Permission checks allowing reviewer role

**Benefits:** Enables dedicated content moderation role, improves submission review efficiency, separates concerns from admin role.

## Medium Priority (Nice to Have)

These features enhance the platform but are not essential for MVP launch:

### 5. Team Captain Dashboard ([spec](specs/13-team-captain-dashboard.md))

**Status:** ⚠️ Partial - Individual team management exists
**Priority:** MEDIUM
**Effort:** 2 days

**Problem:** Team captains who manage multiple teams must navigate to each team page individually. No centralized captain dashboard.

**Impact:** Inefficient management of multiple teams. Potential oversight of pending join requests or invitations across teams.

**Required:**

- Centralized dashboard showing all teams user captains
- Consolidated pending actions (join requests, invitations) across all teams
- Team performance comparison view
- Aggregated statistics across all captain's teams
- Quick navigation and management actions
- Activity feed across all teams

**Benefits:** Improves efficiency for captains managing multiple teams, reduces likelihood of missed actions.

### 6. Complete Admin Dashboard ([spec](specs/07-admin-dashboard.md))

**Status:** ❌ Not Implemented
**Priority:** MEDIUM
**Effort:** 2 days

**Problem:** No dedicated admin dashboard page (`/admin` route doesn't exist).

**Impact:** Admins must navigate to individual sections. No centralized view of system health.

**Required:**

- Create `/admin` route and page
- Centralized stats dashboard (tournaments, teams, users, submissions)
- Quick actions for common admin tasks
- Recent activity feed
- System health indicators

### 7. Notifications System

**Status:** ❌ Not Implemented
**Priority:** MEDIUM
**Effort:** 3-4 days

**Problem:** No notifications for important events.

**Impact:** Users must manually check for updates (submission approvals, team invites, tournament events).

**Required:**

- In-app notification system
- Notification bell icon with count
- Notification list/panel
- Email notifications (optional)
- Notification preferences
- Mark as read functionality

### 8. Code Cleanup ([spec](specs/09-code-cleanup.md))

**Status:** ❌ Not Started
**Priority:** MEDIUM
**Effort:** 2-3 days

**Problem:** Potential unused exports and dead code in codebase.

**Impact:** Increased maintenance burden, confusion for developers, potentially larger bundle size.

**Note:** Needs investigation. Original spec claimed 26 unused exports, but many have since been implemented (e.g., `admin.addUserRole` is now complete, not a stub).

**Required:**

- Audit frontend components for unused exports
- Audit backend functions for unused exports
- Remove demo/legacy components if they exist
- Consolidate duplicate functions
- Document admin utility functions
- Fix or remove unimplemented functions

## Low Priority (Future Enhancements)

These features would be valuable for growth but can be deferred until after MVP launch:

### 9. Viewer & Public Dashboard ([spec](specs/14-viewer-public-dashboard.md))

**Status:** ❌ Not Implemented
**Priority:** LOW-MEDIUM
**Effort:** 2-3 days

**Problem:** The `viewer` role exists but has no interface. No public-facing leaderboards for non-participants to view.

**Impact:** Limits platform visibility and community engagement. Potential participants cannot explore tournaments before signing up. No way to share tournament results publicly.

**Required:**

- Public tournament discovery page (unauthenticated access)
- Public leaderboard views with real-time updates
- Public team profiles (with privacy controls)
- Viewer dashboard for authenticated users with viewer role
- Social sharing features (Open Graph tags, embeddable widgets)
- Favorite tournaments for viewers
- SEO optimization for public pages

**Benefits:** Increases platform visibility, enables spectators and potential participants to explore, supports marketing and recruitment, builds community engagement.

**Note:** Requires middleware changes to allow public (unauthenticated) routes. Privacy controls must be implemented to protect user data.

---

## Technical Debt

Minor issues that should be addressed when time permits:

### Code TODOs

- **Loading states:** 7 locations with `// TODO: Add skeleton` comments (see High Priority #3)
- **"TODO: figure this out"** in `lib/utils.ts:8` (utility functions)
- ~~**"TODO: Add teams table"** in user details page~~ (May no longer be needed with current team display)

### Potential Issues

- **Form validators:** Some commented onBlur/onSubmit validators in forms (verify if intentional)
- **Empty tournament actions:** Some tournament action buttons may have incomplete functionality

**Note:** Many items from the original technical debt list have been resolved:

- ✅ Empty onClick handlers for team edit/delete - Fixed
- ✅ Admin role management stubs - Implemented
- ✅ TypeScript errors and non-null assertions - Fixed in PR #4

---

## Estimated Effort Summary

### ✅ Completed (11-13 days)

- Team Joining/Self-Service (3-5 days)
- Leaderboard & Scoring (2-3 days)
- Team Edit & Delete (0.5 days)
- Admin Role Management (1 day)
- Code Quality Fixes (1 day)

### ⚠️ Remaining for Full MVP

- **High Priority:** 9-13 days (Calendar + Loading States + Tournament Manager + Reviewer)
- **Medium Priority:** 9-13 days (Team Captain + Admin Dashboard + Notifications + Code Cleanup)
- **Low Priority:** 2-3 days (Viewer/Public Dashboard)
- **Total Remaining:** 20-29 days

---

## Progress Summary

- **Overall Completion:** 85%+ of enhanced MVP functionality (97%+ of core MVP)
- **Critical Features:** ✅ **ALL COMPLETE!**
  - ✅ Team Management (create, edit, delete, join, leave)
  - ✅ Team Member Management UI (invite, remove, transfer captaincy)
  - ✅ Leaderboard & Scoring System
  - ✅ Admin Role Management
  - ✅ Code Quality & Type Safety
- **High Priority Features:** 0/4 complete
  - ❌ Submission Calendar
  - ❌ Loading States
  - ❌ Tournament Manager Dashboard
  - ❌ Reviewer Dashboard
- **Medium Priority Features:** 0/4 complete
  - ❌ Team Captain Dashboard
  - ❌ Admin Dashboard
  - ❌ Notifications
  - ❌ Code Cleanup
- **Low Priority Features:** 0/1 complete
  - ❌ Viewer & Public Dashboard

### Recent Merges

- **PR #7:** User Avatar/Sidebar (11/13/2025)
- **PR #6:** Admin Role Management (11/12/2025)
- **PR #5:** Leaderboard & Scoring (11/12/2025)
- **PR #4:** Code Quality Fixes (11/11/2025)
- **PR #3:** Team Deletion (11/11/2025)
- **PR #2:** CI/CD Workflow (11/11/2025)
- **PR #1:** Team Joining (11/07/2025)

---

## Next Steps

### Recommended Priority Order

#### Phase 1: Core UX Improvements (2-4 days)

1. **Loading States** (1-2 days) - Quick win, improves UX across entire app
   - Skeleton component exists, just needs to be used
   - 7 pages need updates

2. **Submission Calendar** (1-2 days) - High user value
   - Visual progress tracking
   - Helps users stay on track with daily submissions

**After Phase 1:** Core user experience is complete for basic MVP!

#### Phase 2: Role-Based Dashboards (9-13 days)

3. **Tournament Manager Dashboard** (3-4 days) - Enables delegation
   - Critical for scaling tournament operations
   - Allows tournament management without full admin access

4. **Reviewer Dashboard** (2-3 days) - Improves moderation
   - Dedicated content moderation workflow
   - Separates review role from admin role

5. **Team Captain Dashboard** (2 days) - Captain efficiency
   - Multi-team management
   - Consolidated pending actions

6. **Admin Dashboard** (2 days) - Admin convenience
   - Centralized admin view
   - Quick access to common tasks

**After Phase 2:** All role-based interfaces complete!

#### Phase 3: Optional Enhancements (5-10 days)

7. **Notifications System** (3-4 days) - User engagement
8. **Code Cleanup** (2-3 days) - Technical debt
9. **Viewer/Public Dashboard** (2-3 days) - External visibility

---

## Reference

- **Completed Features:** See [COMPLETED.md](COMPLETED.md) for detailed implementation notes
- **Feature Specs:** See `specs/` directory for detailed implementation plans
- **Done Specs:** See `specs/done/` for completed feature specifications
