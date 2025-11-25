# Missing Features for MVP

This document outlines the features that are missing or incomplete for a Minimum Viable Product (MVP) of the Urban Legends tournament tracking platform.

## Current State

The codebase is approximately **99%+ complete** for core MVP, **98%+ complete** for enhanced MVP!

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
- ✅ **Tournament manager role & permissions** - PR #15
- ✅ **Dark theme system** - PR #16
- ✅ **Active sidebar navigation** - PR #17
- ✅ **Submission card view with image gallery** - PR #18
- ✅ **Code quality and type safety** - PR #4, #12, #19
- ✅ **Submission progress calendar** - PR #8
- ✅ **Submission detail page** - PR #9
- ✅ **Detail cards data fetching refactor** - PR #10
- ✅ **Loading states / skeleton screens** - PR #11
- ✅ **Individual submission tracking & automatic grouping** - PR #13
- ✅ **Role-based sidebar navigation with badges** - PR #14

### ⚠️ High Priority Features (Still Needed)

- ❌ Reviewer Dashboard (navigation/placeholders complete)
- ❌ Image Upload System (spec ready: 26-submission-image-upload-s3-abstraction.md)

**Note:** For details on completed features, see [COMPLETED.md](COMPLETED.md)

---

## High Priority (Should Have)

These features significantly improve user experience and should be implemented soon:

### 1. Image Upload System ([spec](specs/26-submission-image-upload-s3-abstraction.md))

**Status:** ⚠️ Spec Complete - Implementation Pending
**Priority:** HIGH
**Effort:** 2-3 days

**Problem:** Current placeholder image URLs need actual image upload functionality.

**Spec Completed:**

- ✅ S3-compatible storage abstraction layer
- ✅ Multi-provider support (AWS S3, Cloudflare R2, Supabase Storage)
- ✅ Image optimization pipeline (resize, WebP conversion, thumbnails)
- ✅ Secure upload flow with presigned URLs
- ✅ Database schema updates for image metadata
- ✅ Frontend upload UI with progress indicators
- ✅ Migration strategy from placeholder URLs

**Required for Implementation:**

- Backend: Storage abstraction layer (`convex/storage/`)
- Backend: Image optimization service
- Backend: Presigned URL generation mutations
- Frontend: Image upload component with drag-and-drop
- Frontend: Progress indicators and error handling
- Database: Image metadata tracking
- Configuration: Storage provider setup (env vars)

**Benefits:** Real image upload functionality, optimized delivery, CDN integration, improved performance.

### 2. Reviewer Dashboard ([spec](specs/12-reviewer-dashboard.md))

**Status:** ⚠️ Navigation & Placeholders Complete (PR #14) - Dashboard Implementation Pending
**Priority:** HIGH
**Effort:** 1-2 days (reduced from 2-3 days due to navigation foundation)

**Foundation Completed (PR #14):**

- ✅ Sidebar navigation section with badges
- ✅ Placeholder pages created (`/reviewer`, `/reviewer/statistics`, `/reviewer/flagged`)
- ✅ Badge count queries (`reviewer.getPendingCount`, `reviewer.getFlaggedCount`)
- ✅ Routing structure established

**Still Required:**

- Review queue dashboard with all pending submissions
- Inline approve/reject actions with keyboard shortcuts
- Bulk review operations
- Review statistics and performance tracking
- Dispute resolution workflow
- Permission checks allowing reviewer role for mutations

**Benefits:** Enables dedicated content moderation role, improves submission review efficiency, separates concerns from admin role.

## Medium Priority (Nice to Have)

These features enhance the platform but are not essential for MVP launch:

### 3. Team Captain Dashboard ([spec](specs/13-team-captain-dashboard.md))

**Status:** ⚠️ Navigation & Placeholders Complete (PR #14) - Dashboard Implementation Pending
**Priority:** MEDIUM
**Effort:** 1-1.5 days (reduced from 2 days due to navigation foundation)

**Foundation Completed (PR #14):**

- ✅ Sidebar navigation section with conditional rendering (only visible if user captains teams)
- ✅ Placeholder pages created (`/captain`, `/captain/comparison`)
- ✅ Badge count query (`captain.getPendingActionsCount` - join requests + invitations)
- ✅ Captain teams count query (`captain.getCaptainedTeamsCount`)
- ✅ Routing structure established

**Still Required:**

- Centralized dashboard showing all teams user captains
- Consolidated pending actions (join requests, invitations) across all teams
- Team performance comparison view
- Aggregated statistics across all captain's teams
- Quick navigation and management actions
- Activity feed across all teams

**Benefits:** Improves efficiency for captains managing multiple teams, reduces likelihood of missed actions.

### 4. Complete Admin Dashboard ([spec](specs/07-admin-dashboard.md))

**Status:** ⚠️ Navigation & Placeholders Complete (PR #14) - Dashboard Implementation Pending
**Priority:** MEDIUM
**Effort:** 1.5 days (reduced from 2 days due to navigation foundation)

**Foundation Completed (PR #14):**

- ✅ Sidebar navigation section for admin
- ✅ Placeholder pages created (`/admin`, `/admin/system`)
- ✅ Badge count query (`admin.getAllPendingCount`)
- ✅ Routing structure established
- ✅ All admin links properly organized in sidebar

**Still Required:**

- Centralized stats dashboard (tournaments, teams, users, submissions)
- Quick actions for common admin tasks
- Recent activity feed
- System health indicators
- Dashboard implementation with comprehensive metrics

### 5. Notifications System ([spec](specs/18-notifications-system.md))

**Status:** ⚠️ Spec Complete - Implementation Pending
**Priority:** MEDIUM
**Effort:** 3-4 days

**Problem:** No notifications for important events.

**Impact:** Users must manually check for updates (submission approvals, team invites, tournament events).

**Spec Completed:**

- ✅ Comprehensive 23 notification event types defined
- ✅ Real-time notification system design (Convex subscriptions)
- ✅ Database schema (notifications, notificationPreferences tables)
- ✅ Backend implementation (queries, mutations, helpers, cron jobs)
- ✅ Frontend components (NotificationBell, NotificationPanel, NotificationItem)
- ✅ Full notification history page and settings page
- ✅ Integration points with existing mutations identified
- ✅ Email notification architecture (optional Phase 2)

**Required for Implementation:**

- In-app notification system with real-time updates
- Notification bell icon with unread count badge
- Notification dropdown panel (last 50 notifications)
- Full notification history page (/notifications)
- Notification preferences page (/settings/notifications)
- Mark as read functionality (single/bulk)
- 90-day retention with automatic cleanup (cron job)
- Integration with all existing event triggers (teams, submissions, tournaments, roles)
- Email notifications (optional Phase 2 enhancement)

### 6. Viewer & Public Dashboard ([spec](specs/14-viewer-public-dashboard.md))

**Status:** ⚠️ Navigation & Placeholders Complete (PR #14) - Dashboard Implementation Pending
**Priority:** LOW-MEDIUM
**Effort:** 1.5-2 days (reduced from 2-3 days due to navigation foundation)

**Foundation Completed (PR #14):**

- ✅ Sidebar navigation section for viewer/discover
- ✅ Placeholder pages created (`/viewer`, `/viewer/favorites`, `/public/leaderboards`, `/public/live`)
- ✅ Public access flags in sidebar configuration
- ✅ Routing structure established

**Still Required:**

- Public tournament discovery page (unauthenticated access)
- Public leaderboard views with real-time updates
- Public team profiles (with privacy controls)
- Viewer dashboard for authenticated users with viewer role
- Social sharing features (Open Graph tags, embeddable widgets)
- Favorite tournaments for viewers
- SEO optimization for public pages
- Middleware changes to allow public routes

**Benefits:** Increases platform visibility, enables spectators and potential participants to explore, supports marketing and recruitment, builds community engagement.

**Note:** Requires middleware changes to allow public (unauthenticated) routes. Privacy controls must be implemented to protect user data.

---

## Technical Debt

Minor issues that should be addressed when time permits:

### Code TODOs

- **"TODO: figure this out"** in `lib/utils.ts:8` (utility functions - may need investigation)
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

### ✅ Completed (31-39 days)

- Team Joining/Self-Service (3-5 days)
- Leaderboard & Scoring (2-3 days)
- Team Edit & Delete (0.5 days)
- Admin Role Management (1 day)
- Tournament Manager Role & Permissions (1-2 days)
- Dark Theme System (2-3 days)
- Active Sidebar Navigation (0.5-1 day)
- Submission Card View with Image Gallery (2-3 days)
- Code Quality Fixes (1 day) + Code Cleanup (1 day) + i18n Fixes (0.5 day)
- Submission Calendar (1-2 days)
- Submission Detail Page (2-3 days)
- Detail Cards Data Fetching Refactor (2-3 days)
- Loading States / Skeleton Screens (1-2 days)
- Individual Submission Tracking & Automatic Grouping (5-7 days)
- Enhanced Role-Based Sidebar Navigation (1-2 days)

### ⚠️ Remaining for Full Enhanced MVP

- **High Priority:** 3-4 days (Image Upload + Reviewer dashboard)
- **Medium Priority:** 6-8 days (Team Captain + Admin Dashboard + Notifications + Viewer Dashboard)
- **Total Remaining:** 9-12 days

**Note:** Effort estimates reduced by ~30% due to PR #14 and #15 completing navigation foundation, badge queries, placeholder pages, and tournament manager implementation.

---

## Progress Summary

- **Overall Completion:** 98%+ of enhanced MVP functionality (99%+ of core MVP)
- **Critical Features:** ✅ **ALL COMPLETE!**
  - ✅ Team Management (create, edit, delete, join, leave)
  - ✅ Team Member Management UI (invite, remove, transfer captaincy)
  - ✅ Leaderboard & Scoring System
  - ✅ Admin Role Management
  - ✅ Tournament Manager Role & Permissions
  - ✅ Dark Theme System
  - ✅ Active Sidebar Navigation
  - ✅ Submission Card View with Image Gallery
  - ✅ Code Quality & Type Safety + Code Cleanup
  - ✅ Submission Calendar
  - ✅ Submission Detail Page
  - ✅ Detail Cards Data Fetching Refactor
  - ✅ Loading States / Skeleton Screens
  - ✅ Individual Submission Tracking & Automatic Grouping
  - ✅ Enhanced Role-Based Sidebar Navigation
- **High Priority Features:** 0/2 complete
  - ❌ Image Upload System (spec ready)
  - ⚠️ Reviewer Dashboard (navigation/placeholders done)
- **Medium Priority Features:** 0/4 complete (navigation foundation done)
  - ⚠️ Team Captain Dashboard (placeholders + queries done)
  - ⚠️ Admin Dashboard (placeholders + queries done)
  - ❌ Notifications (spec complete)
  - ⚠️ Viewer & Public Dashboard (placeholders done)

### Recent Merges

- **PR #19:** i18n Fixes (11/20/2025) ⭐ **NEW**
- **PR #18:** Submission Card View with Image Gallery (11/20/2025) ⭐ **NEW**
- **PR #17:** Active Sidebar Navigation Highlighting (11/20/2025) ⭐ **NEW**
- **PR #16:** Dark Theme System (11/19/2025) ⭐ **NEW**
- **PR #15:** Tournament Manager Role & Permissions (11/18/2025) ⭐ **NEW**
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

## Next Steps

### Recommended Priority Order

#### Phase 1: Core UX Improvements ✅ **COMPLETE!**

~~1. **Loading States** (1-2 days)~~ - ✅ **COMPLETED in PR #11**
~~2. **Submission Calendar** (1-2 days)~~ - ✅ **COMPLETED in PR #8**
~~3. **Detail Cards Refactor** (2-3 days)~~ - ✅ **COMPLETED in PR #10**

**After Phase 1:** ✅ Core user experience is complete for basic MVP!

#### Phase 2: Role-Based Dashboards (9-13 days) - IN PROGRESS

1. **Tournament Manager Dashboard** (3-4 days) - Enables delegation

   - Critical for scaling tournament operations
   - Allows tournament management without full admin access

2. **Reviewer Dashboard** (2-3 days) - Improves moderation

   - Dedicated content moderation workflow
   - Separates review role from admin role

3. **Team Captain Dashboard** (2 days) - Captain efficiency

   - Multi-team management
   - Consolidated pending actions

4. **Admin Dashboard** (2 days) - Admin convenience
   - Centralized admin view
   - Quick access to common tasks

**After Phase 2:** All role-based interfaces complete!

#### Phase 3: Optional Enhancements (5-10 days)

5. **Notifications System** (3-4 days) - User engagement
6. **Viewer/Public Dashboard** (2-3 days) - External visibility

---

## Reference

- **Completed Features:** See [COMPLETED.md](COMPLETED.md) for detailed implementation notes
- **Feature Specs:** See `specs/` directory for detailed implementation plans
- **Done Specs:** See `specs/done/` for completed feature specifications
