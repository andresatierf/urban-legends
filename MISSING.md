# Missing Features for MVP

This document outlines the features that are missing or incomplete for a Minimum Viable Product (MVP) of the Urban Legends tournament tracking platform.

## Current State

The codebase is approximately **60-70% complete** for MVP. Core infrastructure is solid:

- ✅ Authentication & user management (Clerk integration)
- ✅ Role-based access control
- ✅ Tournament management (admin)
- ✅ Submission creation and approval workflow
- ✅ Basic team management (admin-only)

## Critical Blockers (Must Have)

These features are **required** for a functional MVP and block the user journey:

### 1. Team Joining / Self-Service ([spec](specs/team-joining.md))

**Status:** ❌ Not Implemented
**Priority:** CRITICAL

**Problem:** Users cannot join tournaments or teams without admin intervention. Team creation is admin-only.

**Impact:** Prevents users from participating in tournaments independently.

**Required:**

- User self-service team creation for tournaments
- Join existing teams (with captain approval)
- Leave teams
- Team invitation system

### 2. Leaderboard & Scoring System ([spec](specs/leaderboard-scoring.md))

**Status:** ❌ Not Implemented
**Priority:** CRITICAL

**Problem:** No point tracking, no rankings, no tournament winners.

**Impact:** Cannot determine tournament outcomes or display competitive standings.

**Required:**

- Add points field to teams schema
- Point calculation logic (approved submissions = points)
- Leaderboard query and UI
- Tournament winner determination

### 3. Team Edit/Delete ([spec](specs/team-edit-delete.md))

**Status:** ❌ Backend Missing
**Priority:** CRITICAL

**Problem:** Teams cannot be edited or deleted after creation. UI has non-functional buttons.

**Impact:** No way to fix mistakes or clean up abandoned teams.

**Required:**

- `teams.update` mutation
- `teams.delete` mutation
- Wire up Edit/Delete buttons in UI
- Permission checks (captains + admins only)

## High Priority (Should Have)

These features significantly improve user experience but don't block core flows:

### 4. Submission Progress Calendar ([spec](specs/submission-calendar.md))

**Status:** ⚠️ Commented Out (77 lines of code exist)
**Priority:** HIGH

**Problem:** Users can't visualize their daily submission progress.

**Impact:** Hard to track completion and identify missing days.

**Required:**

- Uncomment and fix calendar grid UI
- Show submission status by date (submitted/missing/approved/rejected)
- Visual progress indicators for tournaments

### 5. Admin Role Management UI ([spec](specs/admin-role-management.md))

**Status:** ⚠️ Backend Complete, UI Missing
**Priority:** HIGH

**Problem:** Cannot assign/remove admin roles from the UI. `addUserRole` mutation is an empty stub.

**Impact:** Admins must be assigned programmatically or via database.

**Required:**

- Complete `addUserRole` and `removeUserRole` mutations
- Add role selector to user details page
- Confirmation dialogs for role changes

### 6. Team Member Management UI ([spec](specs/team-member-management.md))

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

### 7. Complete Admin Dashboard ([spec](specs/admin-dashboard.md))

**Status:** ⚠️ Placeholder Only
**Priority:** MEDIUM

**Problem:** Dashboard links to `/admin` but page doesn't exist. Stats are shown on user dashboard instead.

**Impact:** No centralized admin view.

**Required:**

- Create `/admin` route
- Centralized stats (tournaments, teams, users, submissions)
- Quick actions for admin tasks
- Recent activity feed

### 8. Notifications System

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

| Feature                   | Effort   | Blockers        |
| ------------------------- | -------- | --------------- |
| Team Joining/Self-Service | 3-5 days | Critical        |
| Leaderboard & Scoring     | 2-3 days | Critical        |
| Team Edit/Delete          | 1 day    | Critical        |
| Submission Calendar       | 1-2 days | High Priority   |
| Admin Role Management UI  | 1 day    | High Priority   |
| Team Member Management UI | 1-2 days | High Priority   |
| Admin Dashboard           | 2 days   | Medium Priority |
| Notifications             | 3-4 days | Medium Priority |

**Total for Critical MVP:** ~6-9 days
**Total for High Priority:** ~9-12 days
**Total for Complete MVP:** ~14-20 days

## Next Steps

1. **Week 1:** Complete critical blockers (team joining, leaderboard, team edit/delete)
2. **Week 2:** Implement high priority features (calendar, role management, member management)
3. **Week 3:** Polish and medium priority features (admin dashboard, notifications)

Refer to individual spec files in the `specs/` directory for detailed implementation plans.
