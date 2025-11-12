# Missing Features for MVP

This document outlines the features that are missing or incomplete for a Minimum Viable Product (MVP) of the Urban Legends tournament tracking platform.

## Current State

The codebase is approximately **75-80% complete** for MVP. Core infrastructure is solid:

- ✅ Authentication & user management (Clerk integration)
- ✅ Role-based access control
- ✅ Tournament management (admin)
- ✅ Submission creation and approval workflow
- ✅ **Team joining and self-service** (PR #1 - COMPLETE)
- ✅ **Code quality and type safety** (PR #4 - COMPLETE)
- ✅ Team management (admin-only)

## Completed Features

### ✅ 1. Team Joining / Self-Service ([spec](specs/done/01-team-joining.md))

**Status:** ✅ Implemented (PR #1)
**Completed:** 2025-11-11

**Implemented:**
- ✅ User self-service team creation for tournaments
- ✅ Join existing teams (with captain approval via join requests)
- ✅ Leave teams
- ✅ Team invitation system by email
- ✅ Accept/reject invitations
- ✅ Cancel join requests

### ✅ 8. Code Quality Fixes ([spec](specs/done/08-code-quality-fixes.md))

**Status:** ✅ Implemented (PR #4)
**Completed:** 2025-11-12

**Implemented:**
- ✅ Fixed all TypeScript type errors
- ✅ Removed non-null assertions with proper validation
- ✅ Environment variable validation at startup
- ✅ Webhook validation improvements
- ✅ Fixed linting errors (0 errors, 2 acceptable warnings)

## Critical Blockers (Must Have)

These features are **required** for a functional MVP and block the user journey:

### 1. Leaderboard & Scoring System ([spec](specs/02-leaderboard-scoring.md))

**Status:** ❌ Not Implemented
**Priority:** CRITICAL

**Problem:** No point tracking, no rankings, no tournament winners.

**Impact:** Cannot determine tournament outcomes or display competitive standings.

**Required:**

- Add points field to teams schema
- Point calculation logic (approved submissions = points)
- Leaderboard query and UI
- Tournament winner determination

### 2. Team Edit Functionality ([spec](specs/03-team-edit-delete.md))

**Status:** ⚠️ Partially Implemented (Delete done in PR #3, Edit missing)
**Priority:** CRITICAL

**Problem:** Teams can be deleted but cannot be edited. UI has non-functional Edit button.

**Impact:** No way to fix typos in team names or update team settings.

**Completed:**
- ✅ `teams.removeUserTeam` mutation (captain can delete their team)
- ✅ Permission checks (captains + admins only)

**Still Required:**

- ❌ `teams.update` mutation
- ❌ Edit team form/dialog in UI
- ❌ Wire up Edit button in UI

## High Priority (Should Have)

These features significantly improve user experience but don't block core flows:

### 3. Submission Progress Calendar ([spec](specs/04-submission-calendar.md))

**Status:** ⚠️ Commented Out (77 lines of code exist)
**Priority:** HIGH

**Problem:** Users can't visualize their daily submission progress.

**Impact:** Hard to track completion and identify missing days.

**Required:**

- Uncomment and fix calendar grid UI
- Show submission status by date (submitted/missing/approved/rejected)
- Visual progress indicators for tournaments

### 4. Admin Role Management UI ([spec](specs/05-admin-role-management.md))

**Status:** ⚠️ Backend Complete, UI Missing
**Priority:** HIGH

**Problem:** Cannot assign/remove admin roles from the UI. `addUserRole` mutation is an empty stub.

**Impact:** Admins must be assigned programmatically or via database.

**Required:**

- Complete `addUserRole` and `removeUserRole` mutations
- Add role selector to user details page
- Confirmation dialogs for role changes

### 5. Team Member Management UI ([spec](specs/06-team-member-management.md))

**Status:** ⚠️ Backend Complete, UI Missing
**Priority:** HIGH

**Problem:** No UI to add/remove team members. Backend mutations exist but are unused.

**Impact:** Team captains cannot manage their rosters.

**Required:**

- Add member management section to team details page
- Wire up `addMember` and `removeMember` mutations
- Add member invite by email UI
- Display member roles (captain vs. member)

## Medium Priority (Nice to Have)

These features enhance the platform but are not essential for MVP launch:

### 6. Complete Admin Dashboard ([spec](specs/07-admin-dashboard.md))

**Status:** ⚠️ Placeholder Only
**Priority:** MEDIUM

**Problem:** Dashboard links to `/admin` but page doesn't exist. Stats are shown on user dashboard instead.

**Impact:** No centralized admin view.

**Required:**

- Create `/admin` route
- Centralized stats (tournaments, teams, users, submissions)
- Quick actions for admin tasks
- Recent activity feed

### 7. Notifications System

**Status:** ❌ Not Implemented
**Priority:** MEDIUM

**Problem:** No notifications for submission approvals, team invites, or tournament events.

**Impact:** Users must manually check for updates.

**Required:**

- In-app notification system
- Email notifications (optional)
- Notification preferences

## Technical Debt

Additional issues that should be addressed:

- **15+ "TODO: Add skeleton" comments** - Missing loading states
- **Empty onClick handlers** - Tournament action buttons (Edit Tournament, Manage Teams)
- **"TODO: Add teams table"** in user details page (line 36 of `/users/[userId]/page.tsx`)
- **Commented form validators** - onBlur/onSubmit validators in forms
- **"TODO: figure this out"** in `lib/utils.ts` (utility functions)
- **Missing validation** - Users can only edit their own teams (security)

## Estimated Effort

| Feature                   | Effort   | Blockers        | Status      |
| ------------------------- | -------- | --------------- | ----------- |
| Team Joining/Self-Service | 3-5 days | Critical        | ✅ Complete |
| Code Quality Fixes        | 1 day    | Technical Debt  | ✅ Complete |
| Leaderboard & Scoring     | 2-3 days | Critical        | ❌ Pending  |
| Team Edit (Update)        | 0.5 days | Critical        | ❌ Pending  |
| Team Delete               | 0.5 days | Critical        | ✅ Complete |
| Submission Calendar       | 1-2 days | High Priority   | ❌ Pending  |
| Admin Role Management UI  | 1 day    | High Priority   | ❌ Pending  |
| Team Member Management UI | 1-2 days | High Priority   | ❌ Pending  |
| Admin Dashboard           | 2 days   | Medium Priority | ❌ Pending  |
| Notifications             | 3-4 days | Medium Priority | ❌ Pending  |

**Completed:** ~5 days
**Remaining for Critical MVP:** ~3-4 days (Leaderboard + Team Edit)
**Remaining for High Priority:** ~6-9 days
**Remaining for Complete MVP:** ~11-17 days

## Progress Summary

- **Overall Completion:** ~75-80% of MVP
- **Critical Features:** 2/3 complete (Team Joining ✅, Code Quality ✅, Leaderboard ❌, Team Edit/Delete ⚠️)
- **Recent Merges:**
  - PR #1: Team Joining (11/11/2025)
  - PR #3: Team Deletion (11/11/2025)
  - PR #4: Code Quality Fixes (11/12/2025)

## Next Steps

1. **Immediate:** Leaderboard & Scoring (2-3 days) - highest priority blocker
2. **Next:** Team Edit mutation and UI (0.5 days) - complete spec #3
3. **Then:** High priority features (calendar, role management, member management)

Refer to individual spec files in the `specs/` directory for detailed implementation plans.
