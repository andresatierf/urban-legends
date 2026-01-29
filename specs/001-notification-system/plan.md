# Implementation Plan: In-App Notification System

**Branch**: `001-notification-system` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-notification-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an in-app notification system that notifies users of actions relevant to them (team invitations, submission approvals/rejections, tournament status changes, role assignments). The system supports 23 notification types across 4 categories (Team, Submission, Tournament, Role/Admin), with real-time delivery via Convex subscriptions, read/unread state management, and a notification dropdown accessible from the header.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (React 19), Convex backend
**Primary Dependencies**: Next.js 15, React 19, Convex (serverless backend), Clerk (authentication), Tailwind CSS, Radix UI, TanStack Form, shadcn/ui patterns
**Storage**: Convex database with real-time subscriptions
**Testing**: Vitest for unit tests, Playwright for E2E (see research.md)
**Target Platform**: Web application (modern browsers)
**Project Type**: Web (Next.js App Router frontend + Convex backend)
**Performance Goals**:
  - Notification delivery latency <3 seconds
  - Notification list load time <1 second for 100 notifications
  - Real-time updates across multiple browser tabs
  - Support 50 concurrent notification deliveries
**Constraints**:
  - In-app only (no email or external notification systems)
  - 90-day notification retention
  - Real-time sync via Convex subscriptions (no polling)
  - Must integrate with existing RBAC system
**Scale/Scope**:
  - 23 notification types across 4 categories
  - ~8 new Convex functions (queries/mutations/actions)
  - ~5 new React components
  - 1 new database table + 1 preferences table
  - Integration touchpoints in ~10 existing Convex mutations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: Type-Safe Architecture ✅ PASS

**Status**: COMPLIANT

- Notification schema will be defined in `convex/schema.ts` using Convex validators
- All notification types will use TypeScript enums/unions
- Related entity IDs will use typed IDs (e.g., `v.id("teams")`, `v.id("tournaments")`)
- React components will have explicit TypeScript interfaces
- No `any` types permitted

**Action Required**: None

---

### Gate 2: Real-Time Data Integrity ✅ PASS

**Status**: COMPLIANT

- All notification reads via Convex queries using `useQuery` hook
- All notification mutations via Convex mutations (mark as read, create notification)
- Convex subscriptions for real-time updates (no polling)
- Notification creation triggered server-side from existing mutations
- Idempotent notification creation to handle retries

**Action Required**: None

---

### Gate 3: Code Quality Enforcement ✅ PASS

**Status**: COMPLIANT

- All code will pass Biome linting and formatting
- Tailwind classes will be sorted via `useSortedClasses` rule
- Double quotes for strings (Biome convention)
- No ESLint/Prettier configurations

**Action Required**: None

---

### Gate 4: Role-Based Access Control ✅ PASS

**Status**: COMPLIANT

- Notification queries will use `getCurrentUserOrThrow(ctx)` to ensure authentication
- Role-specific notifications (reviewer, tournament_manager) will check user roles
- Team captain notifications will check team membership and role
- All authorization checks server-side in Convex functions

**Action Required**: None

---

### Gate 5: Modern UI Patterns ✅ PASS

**Status**: COMPLIANT

- Notification dropdown will use Radix UI primitives (Popover/DropdownMenu)
- Styling via Tailwind CSS with `cn()` utility
- Component variants via CVA if needed
- TanStack patterns for any complex state management
- Server components by default, "use client" only where necessary

**Action Required**: None

---

### Gate 6: Component-Driven Development ✅ PASS

**Status**: COMPLIANT

- Notification components in `/components/notifications/`
- Reusable UI primitives in `/components/ui/`
- Custom hooks in `/hooks/` (e.g., `useNotifications`, `useUnreadCount`)
- Single responsibility principle for components
- Kebab-case file names

**Action Required**: None

---

### Overall Assessment

**Status**: ✅ ALL GATES PASS

This feature aligns fully with the Urban Legends constitution. No violations or complexity justifications required.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Convex Backend (serverless functions)
convex/
├── schema.ts                    # Add notifications + notificationPreferences tables
├── notifications.ts             # NEW: queries/mutations for notifications
├── notifications/               # NEW: helper utilities
│   ├── triggers.ts             # Notification creation helpers
│   └── types.ts                # TypeScript types/enums for notification types
├── crons.ts                     # NEW: Scheduled jobs for time-based notifications
├── tournaments.ts               # MODIFY: Add notification triggers
├── teams.ts                     # MODIFY: Add notification triggers
├── submissions.ts               # MODIFY: Add notification triggers
├── admin.ts                     # MODIFY: Add notification triggers for role changes
└── users.ts                     # MODIFY: Add notification triggers if needed

# Next.js Frontend
src/
├── app/
│   ├── (all)/                  # Protected routes
│   │   ├── notifications/       # NEW: Full notifications page
│   │   │   └── page.tsx
│   │   └── layout.tsx          # MODIFY: Add NotificationIndicator to header
│   └── layout.tsx
├── components/
│   ├── notifications/           # NEW: Notification components
│   │   ├── notification-dropdown.tsx      # Dropdown panel with recent 5
│   │   ├── notification-indicator.tsx     # Bell icon with badge
│   │   ├── notification-list.tsx          # Full list component
│   │   ├── notification-item.tsx          # Individual notification
│   │   └── notification-actions.tsx       # Action buttons (Accept/Reject/View)
│   └── ui/                      # Existing reusable UI components
├── hooks/
│   ├── use-notifications.ts     # NEW: useQuery wrapper for notifications
│   └── use-unread-count.ts      # NEW: Real-time unread count hook
└── lib/
    └── notification-utils.ts    # NEW: Helper functions (formatting, routing)

# Tests (to be determined in research phase)
tests/ or __tests__/
└── [structure TBD based on testing framework]
```

**Structure Decision**: This is a web application using Next.js 15 App Router (frontend) with Convex serverless backend. The structure follows the existing Urban Legends architecture:
- **Backend**: Convex functions in `/convex/` directory
- **Frontend**: React components in `/src/app/` (pages) and `/src/components/` (UI components)
- **Shared logic**: Hooks in `/src/hooks/`, utilities in `/src/lib/`

This feature adds:
- 1 new Convex module (`notifications.ts`) with queries/mutations
- 1 new Convex subdirectory (`notifications/`) for helpers
- 1 new frontend page (`/notifications`)
- 5-7 new React components in `/components/notifications/`
- 2-3 new custom hooks
- Modifications to existing Convex functions to trigger notifications

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations or complexity justifications required.

All design decisions align with the Urban Legends constitution and follow existing codebase patterns.

---

## Planning Phase Summary

### Phase 0: Research ✅ COMPLETE

**Artifact**: [`research.md`](./research.md)

All technical unknowns resolved:
- **Testing Framework**: Vitest for unit tests, Playwright for E2E (no existing framework in project)
- **Convex Scheduled Jobs**: Built-in cron jobs via `crons.ts` for time-based notifications
- **Real-Time Subscriptions**: Standard `useQuery` hook with automatic reactivity
- **Notification Retention**: 90-day soft delete with daily cron cleanup
- **Radix UI Components**: Popover primitive (already exists in project at `/src/components/ui/popover.tsx`)
- **Idempotent Creation**: Compound unique indexes with check-then-insert pattern

### Phase 1: Design & Contracts ✅ COMPLETE

**Artifacts**:
- [`data-model.md`](./data-model.md) - Database schema with 2 tables, 3 indexes, 23 notification types
- [`contracts/queries.md`](./contracts/queries.md) - 4 query functions (list, getUnreadCount, recent, get)
- [`contracts/mutations.md`](./contracts/mutations.md) - 5 mutation functions (create, markAsRead, markAllAsRead, deleteNotification, createBulkNotifications)
- [`contracts/actions.md`](./contracts/actions.md) - 6 scheduled jobs for time-based notifications and cleanup
- [`contracts/triggers.md`](./contracts/triggers.md) - 15 event triggers across teams/submissions/admin modules
- [`quickstart.md`](./quickstart.md) - Step-by-step implementation guide with 11 phases

**Agent Context**: Updated `CLAUDE.md` with notification system technologies

### Phase 2: Task Generation (Next Step)

**Command**: `/speckit.tasks`

This will generate `tasks.md` with dependency-ordered implementation tasks based on the design artifacts.

### Constitution Re-Check (Post-Design)

All gates continue to pass after detailed design:
- ✅ Type-safe architecture maintained (Convex validators + TypeScript)
- ✅ Real-time data integrity via Convex subscriptions
- ✅ Code quality enforcement (Biome linting/formatting)
- ✅ RBAC properly implemented (role-specific notifications)
- ✅ Modern UI patterns (Radix UI Popover, Tailwind CSS)
- ✅ Component-driven development (organized by feature)

**No new violations introduced during design phase.**

---

## Implementation Readiness

**Status**: ✅ READY FOR TASK GENERATION

All design artifacts complete and validated. The feature is ready to move to Phase 2 (task generation) via `/speckit.tasks` command, followed by implementation via `/speckit.implement`.

**Estimated Implementation Scope**:
- Backend: ~8 new Convex functions + 15 trigger integrations
- Frontend: ~5 new React components + 2 custom hooks
- Testing: ~20 unit tests + ~5 E2E test scenarios
- Total LOC: ~1,500-2,000 lines of code
