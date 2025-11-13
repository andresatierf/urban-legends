# Missing Features for MVP

This document outlines the features that are missing or incomplete for a Minimum Viable Product (MVP) of the Urban Legends tournament tracking platform.

## Current State

The codebase is approximately **95%+ complete** for MVP. All critical features are implemented!

### ✅ Core Infrastructure (Complete)

- ✅ Authentication & user management (Clerk integration)
- ✅ Role-based access control
- ✅ Tournament management (admin)
- ✅ Submission creation and approval workflow

### ✅ Critical Features (All Complete!)

- ✅ **Team management** (create, edit, delete, join, leave) - PR #1, #3
- ✅ **Leaderboard and scoring system** - PR #5
- ✅ **Admin role management UI** - PR #6
- ✅ **Code quality and type safety** - PR #4

### ⚠️ High Priority Features (Still Needed)

- ❌ Submission progress calendar
- ❌ Team member management UI
- ❌ Loading states / skeleton screens

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

### 2. Team Member Management UI ([spec](specs/06-team-member-management.md))

**Status:** ⚠️ Backend Complete, UI Missing
**Priority:** HIGH
**Effort:** 1-2 days

**Problem:** Backend mutations exist (`addMember`, `removeMember`) but no UI to use them.

**Impact:** Team captains cannot add/remove members through the UI. Currently relies on invitation system only.

**Required:**

- Add member management section to team details page
- Wire up `addMember` and `removeMember` mutations
- Add UI to directly add users to team
- Display member roles (captain vs. member)
- Remove member button with confirmation

**Backend Ready:**

- ✅ `teams.addMember` mutation exists (line 267 in convex/teams.ts)
- ✅ `teams.removeMember` mutation exists (line 302 in convex/teams.ts)

### 3. Loading States / Skeleton Screens ([spec](specs/10-loading-states.md))

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

## Medium Priority (Nice to Have)

These features enhance the platform but are not essential for MVP launch:

### 4. Complete Admin Dashboard ([spec](specs/07-admin-dashboard.md))

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

### 5. Notifications System

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

### 6. Code Cleanup ([spec](specs/09-code-cleanup.md))

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

- **High Priority:** 4-7 days (Calendar + Member Mgmt + Loading States)
- **Medium Priority:** 7-10 days (Admin Dashboard + Notifications + Code Cleanup)
- **Total Remaining:** 11-17 days

---

## Progress Summary

- **Overall Completion:** 95%+ of MVP core functionality
- **Critical Features:** ✅ **ALL COMPLETE!**
  - ✅ Team Management (create, edit, delete, join, leave)
  - ✅ Leaderboard & Scoring System
  - ✅ Admin Role Management
  - ✅ Code Quality & Type Safety
- **High Priority Features:** 0/3 complete
  - ❌ Submission Calendar
  - ❌ Team Member Management UI
  - ❌ Loading States
- **Medium Priority Features:** 0/3 complete
  - ❌ Admin Dashboard
  - ❌ Notifications
  - ❌ Code Cleanup

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

1. **Loading States** (1-2 days) - Quick win, improves UX across entire app

   - Skeleton component exists, just needs to be used
   - 7 pages need updates

2. **Submission Calendar** (1-2 days) - High user value

   - Visual progress tracking
   - Helps users stay on track with daily submissions

3. **Team Member Management UI** (1-2 days) - Complete team management

   - Backend ready, just needs UI
   - Captains can manage their teams more directly

4. **Admin Dashboard** (2 days) - Admin convenience
   - Centralized admin view
   - Quick access to common tasks

**After these 4 features:** The platform will be feature-complete for MVP launch!

---

## Reference

- **Completed Features:** See [COMPLETED.md](COMPLETED.md) for detailed implementation notes
- **Feature Specs:** See `specs/` directory for detailed implementation plans
- **Done Specs:** See `specs/done/` for completed feature specifications
