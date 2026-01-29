# Tasks: In-App Notification System

**Feature Branch**: `001-notification-system`
**Input**: Design documents from `/specs/001-notification-system/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are NOT explicitly requested in the feature specification. Test tasks are excluded from this implementation plan.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `convex/` - Convex serverless functions
- **Frontend**: `src/` - Next.js App Router + React components
- **Hooks**: `src/hooks/` - Custom React hooks
- **Components**: `src/components/` - Reusable UI components

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and database schema

- [X] T001 Add notifications table to Convex schema in convex/schema.ts with indexes
- [X] T002 [P] Add notificationPreferences table to Convex schema in convex/schema.ts
- [X] T003 [P] Create notification types constants file in convex/notifications/types.ts
- [X] T004 Verify schema deployed successfully via Convex Dashboard

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core notification infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Create internal mutation `create` in convex/notifications.ts with idempotency
- [X] T006 [P] Create query `list` with pagination in convex/notifications.ts
- [X] T007 [P] Create query `getUnreadCount` in convex/notifications.ts
- [X] T008 [P] Create query `recent` for dropdown in convex/notifications.ts
- [X] T009 [P] Create query `get` single notification in convex/notifications.ts
- [X] T010 [P] Create mutation `markAsRead` in convex/notifications.ts
- [X] T011 [P] Create mutation `markAllAsRead` in convex/notifications.ts
- [X] T012 [P] Create mutation `deleteNotification` (soft delete) in convex/notifications.ts
- [X] T013 [P] Create internal mutation `cleanupOldNotifications` in convex/notifications.ts
- [X] T014 Create notification triggers helper file in convex/notifications/triggers.ts
- [X] T015 Setup cron jobs in convex/crons.ts for cleanup and time-based notifications
- [X] T016 [P] Create custom hook `useNotifications` in src/hooks/use-notifications.ts
- [X] T017 [P] Create custom hook `useUnreadCount` in src/hooks/use-unread-count.ts
- [X] T018 [P] Create utility functions in src/lib/notification-utils.ts (formatting, routing)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Recent Notifications (Priority: P1) 🎯 MVP

**Goal**: Users can see notifications about important events (team invitations, submission approvals/rejections, tournament status changes) so they stay informed without navigating through multiple pages.

**Independent Test**: Trigger various events (team invitation, submission approval) and verify the notification appears in the user's notification list with correct content and timestamp.

### Implementation for User Story 1

#### Backend: Event Triggers (can be parallelized by module)

- [X] T019 [P] [US1] Add team invitation notification trigger in convex/teamInvitations.ts `inviteMember` mutation
- [X] T020 [P] [US1] Add join request notification trigger in convex/joinRequests.ts `requestToJoin` mutation
- [X] T021 [P] [US1] Add join request approved notification trigger in convex/joinRequests.ts `respondToJoinRequest` mutation
- [X] T022 [P] [US1] Add join request rejected notification trigger in convex/joinRequests.ts `respondToJoinRequest` mutation
- [X] T023 [P] [US1] Add member joined notification trigger in convex/teamInvitations.ts `respondToInvitation` and convex/joinRequests.ts `respondToJoinRequest` mutations
- [X] T024 [P] [US1] Add member removed notification trigger in convex/teams.ts `removeMember` mutation
- [X] T025 [P] [US1] Add submission approved notification trigger in convex/submissions.ts `approve` mutation
- [X] T026 [P] [US1] Add submission rejected notification trigger in convex/submissions.ts `reject` mutation
- [X] T027 [P] [US1] Add teammate submitted notification trigger in convex/submissions.ts `upsert` mutation
- [X] T028 [P] [US1] Add tournament starting in 24h cron job in convex/crons.ts (already implemented)
- [X] T029 [P] [US1] Add winner announced notification logic in convex/tournaments.ts `determineWinner` mutation

#### Frontend: Notification Display Components

- [X] T030 [US1] Create NotificationItem component in src/components/notifications/notification-item.tsx
- [X] T031 [US1] Create NotificationList component in src/components/notifications/notification-list.tsx
- [X] T032 [US1] Create full notifications page in src/app/(protected)/notifications/page.tsx
- [X] T033 [US1] Add routing and navigation for notifications page

**Checkpoint**: At this point, User Story 1 should be fully functional - users can view their notifications on a dedicated page with correct timestamps and sorting.

---

## Phase 4: User Story 2 - Mark Notifications as Read (Priority: P2)

**Goal**: Users can mark notifications as read to distinguish between new information requiring attention and information already reviewed.

**Independent Test**: Create notifications, mark them as read, verify visual distinction between read/unread states and that read count updates correctly.

### Implementation for User Story 2

- [X] T034 [P] [US2] Update NotificationItem component to mark as read onClick in src/components/notifications/notification-item.tsx
- [X] T035 [P] [US2] Add "Mark all as read" button to NotificationList in src/components/notifications/notification-list.tsx
- [X] T036 [US2] Add visual indicators for read/unread state in NotificationItem (bold text, colored dot)
- [X] T037 [US2] Verify unread count updates in real-time across tabs

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can view notifications and manage read/unread status.

---

## Phase 5: User Story 3 - Notification Indicator & Quick Access (Priority: P3)

**Goal**: Users can access notifications quickly from anywhere in the application via a dropdown bell icon with badge showing unread count.

**Independent Test**: Trigger notifications while on various pages, verify the indicator badge updates in real-time, and clicking the indicator shows recent notifications without full page navigation.

### Implementation for User Story 3

- [ ] T038 [P] [US3] Create NotificationIndicator component in src/components/notifications/notification-indicator.tsx
- [ ] T039 [US3] Create NotificationDropdown component with Radix Popover in src/components/notifications/notification-dropdown.tsx
- [ ] T040 [US3] Integrate NotificationDropdown into app header in src/app/(all)/layout.tsx
- [ ] T041 [US3] Add real-time badge update logic using useUnreadCount hook
- [ ] T042 [US3] Add "View all notifications" link in dropdown to full page
- [ ] T043 [US3] Implement conditional query (skip when dropdown closed) for performance

**Checkpoint**: All core user stories (US1, US2, US3) should now be independently functional - users can view, manage, and quickly access notifications from anywhere.

---

## Phase 6: User Story 4 - Role-Specific and Aggregated Notifications (Priority: P3)

**Goal**: Users with administrative or management responsibilities receive role-specific notifications (pending approvals, flagged submissions, daily digests) relevant to their role.

**Independent Test**: Assign roles to users, trigger role-specific events (flag submission, assign tournament manager), verify role-specific notifications appear only for users with appropriate permissions.

### Implementation for User Story 4

#### Backend: Role-Specific Triggers

- [ ] T044 [P] [US4] Add submission flagged for review notification trigger in convex/submissions.ts `flagForReview` mutation
- [ ] T045 [P] [US4] Add tournament manager assigned notification trigger in convex/tournaments.ts `assignManager` mutation
- [ ] T046 [P] [US4] Add role granted notification trigger in convex/admin.ts `assignRole` mutation
- [ ] T047 [P] [US4] Add role revoked notification trigger in convex/admin.ts `revokeRole` mutation
- [ ] T048 [US4] Create daily digest cron job in convex/notifications.ts `sendDailyDigest` with aggregation logic
- [ ] T049 [US4] Add pending items count logic for digest notifications

#### Frontend: Role-Specific UI

- [ ] T050 [P] [US4] Add action buttons to NotificationItem for actionable notifications in src/components/notifications/notification-actions.tsx
- [ ] T051 [US4] Add role-specific filtering in NotificationList (optional enhancement)
- [ ] T052 [US4] Verify role-specific notifications only visible to authorized users

**Checkpoint**: All user stories (US1-US4) should now be independently functional - complete notification system with role-based features.

---

## Phase 7: Scheduled Jobs & Time-Based Notifications

**Purpose**: Automated notifications for tournament lifecycle events

- [ ] T053 [P] Implement `checkTournamentStarted` cron job in convex/notifications.ts
- [ ] T054 [P] Implement `checkTournamentEnding24h` cron job in convex/notifications.ts
- [ ] T055 [P] Implement `checkTournamentEnded` cron job in convex/notifications.ts
- [ ] T056 Verify all cron jobs scheduled correctly in Convex Dashboard
- [ ] T057 Test tournament notifications fire at correct times (use manual "Run Now" in dashboard)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T058 [P] Add NotificationActions component for Accept/Reject buttons in src/components/notifications/notification-actions.tsx
- [ ] T059 [P] Implement graceful handling of deleted entities in notification display
- [ ] T060 [P] Add relative time formatting (formatDistanceToNow) to notifications
- [ ] T061 Add loading states and skeleton UI to all notification components
- [ ] T062 Add error boundaries for notification components
- [ ] T063 [P] Run Biome linting and formatting on all modified files (bun run lint:fix, bun run format:fix)
- [ ] T064 [P] Verify 90-day retention cleanup cron runs correctly
- [ ] T065 [P] Add missing team deletion trigger if deleteTeam mutation exists in convex/teams.ts
- [ ] T066 [P] Add missing captain transfer trigger if transferCaptain mutation exists in convex/teams.ts
- [ ] T067 Test notification system end-to-end per quickstart.md guide
- [ ] T068 Verify real-time updates work across multiple browser tabs
- [ ] T069 Performance test: Load 100 notifications and verify <1 second load time
- [ ] T070 Verify notification delivery latency <3 seconds for all event types

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Scheduled Jobs (Phase 7)**: Depends on Foundational phase - can run in parallel with user stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1 and US2 but independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Extends notification system with role features, independently testable

### Within Each User Story

- Backend event triggers marked [P] can run in parallel (different mutations in different files)
- Frontend components should be built in order: Item → List → Page (dependencies)
- Notification dropdown should be built after NotificationItem and NotificationIndicator exist

### Parallel Opportunities

**Phase 1 (Setup):**
- T002 and T003 can run in parallel with T001 (different concerns)

**Phase 2 (Foundational):**
- All queries (T006-T009) can run in parallel
- All mutations (T010-T013) can run in parallel
- Hooks (T016-T017) can run in parallel
- T014, T015, T018 are independent and can run in parallel with above

**Phase 3 (User Story 1):**
- All event triggers (T019-T029) can run in parallel (different files/mutations)
- Frontend components must be sequential (T030 → T031 → T032 → T033)

**Phase 4 (User Story 2):**
- T034 and T035 can run in parallel (separate concerns within components)

**Phase 5 (User Story 3):**
- T038 and T039 can run in parallel initially (separate components)
- T040-T043 are sequential (integration and optimization)

**Phase 6 (User Story 4):**
- All backend triggers (T044-T049) can run in parallel
- All frontend tasks (T050-T052) can run in parallel

**Phase 7 (Scheduled Jobs):**
- T053-T055 can run in parallel (independent cron jobs)

**Phase 8 (Polish):**
- T058, T059, T060, T063, T064, T065, T066 can all run in parallel (independent improvements)

---

## Parallel Example: User Story 1 Backend Triggers

```bash
# Launch all event triggers for User Story 1 together:
Task: "Add team invitation notification trigger in convex/teams.ts"
Task: "Add join request notification trigger in convex/teams.ts"
Task: "Add submission approved notification trigger in convex/submissions.ts"
Task: "Add submission rejected notification trigger in convex/submissions.ts"
Task: "Add tournament starting notification cron job in convex/notifications.ts"
# All modify different functions/files - can work in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (can users see notifications?)
5. Deploy/demo if ready

**MVP Scope**: ~1,200 LOC
- Backend: 8 Convex functions + 9 event triggers
- Frontend: 3 components (NotificationItem, NotificationList, NotificationPage)
- Result: Users can view all 9 core notification types on dedicated page

### Incremental Delivery (Recommended)

1. **Sprint 1**: Setup + Foundational + User Story 1 → Foundation + Viewing (MVP!)
   - Deploy: Users can see notifications
   - Value: Visibility into system events

2. **Sprint 2**: User Story 2 → Read Status Management
   - Deploy: Users can mark notifications as read
   - Value: Notification management and reduced clutter

3. **Sprint 3**: User Story 3 → Quick Access
   - Deploy: Notification dropdown in header
   - Value: Improved UX and accessibility

4. **Sprint 4**: User Story 4 + Scheduled Jobs → Role Features + Automation
   - Deploy: Role-specific notifications and automated reminders
   - Value: Power user features and proactive notifications

5. **Sprint 5**: Polish → Production Ready
   - Deploy: Final production release
   - Value: Stability, performance, edge case handling

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (1-2 days)
2. Once Foundational is done:
   - **Developer A**: User Story 1 backend triggers (T019-T029)
   - **Developer B**: User Story 1 frontend components (T030-T033)
   - **Developer C**: User Story 2 read status features (T034-T037)
   - **Developer D**: Scheduled jobs (Phase 7, T053-T057)
3. Stories complete and integrate independently
4. Each developer validates their user story independently before integration

---

## Critical Path Analysis

**Longest Sequential Path** (minimum time to MVP):
1. T001 (schema notifications) → T005 (create mutation) → T019 (first trigger) → T030 (NotificationItem) → T031 (NotificationList) → T032 (Page) → T033 (routing)

**Estimated**: 7-9 tasks on critical path, ~30-40 other tasks can be parallelized

**Optimization**: Maximize parallel work in Phase 2 (Foundational) and Phase 3 (US1 backend triggers)

---

## Notes

- [P] tasks = different files, no dependencies - can be worked on simultaneously
- [Story] label maps task to specific user story for traceability and independent testing
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- File paths assume Urban Legends project structure (convex/ for backend, src/ for frontend)
- All Convex functions must use proper authorization (getCurrentUserOrThrow)
- All mutations creating notifications should use try-catch to prevent blocking
- Notification triggers use idempotency pattern via by_user_type_entity index
- Soft delete pattern (isDeleted flag) used instead of hard delete
- Real-time updates automatic via Convex useQuery hook - no manual cache invalidation needed

---

## Task Count Summary

- **Total Tasks**: 70
- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 14 tasks (CRITICAL PATH - blocks all stories)
- **Phase 3 (User Story 1)**: 15 tasks
- **Phase 4 (User Story 2)**: 4 tasks
- **Phase 5 (User Story 3)**: 6 tasks
- **Phase 6 (User Story 4)**: 9 tasks
- **Phase 7 (Scheduled Jobs)**: 5 tasks
- **Phase 8 (Polish)**: 13 tasks

**Parallelizable**: ~50 tasks marked [P] (71% of all tasks)
**Sequential**: ~20 tasks on critical dependencies

**MVP Scope** (Phases 1-3): 33 tasks = ~47% of total work = Full US1 functionality

---

## Suggested MVP Scope

**Minimum Viable Product**: User Story 1 Only
- **Phases**: Setup + Foundational + User Story 1
- **Tasks**: T001-T033 (33 tasks)
- **Outcome**: Users can view all core notifications on dedicated page
- **Estimated LOC**: ~1,200 lines
- **Value**: Immediate visibility into system events

**Enhanced MVP**: Add User Story 2
- **Phases**: Setup + Foundational + US1 + US2
- **Tasks**: T001-T037 (37 tasks)
- **Outcome**: Users can view and manage notification read status
- **Estimated LOC**: ~1,400 lines
- **Value**: Notification management and reduced noise

**Recommended First Release**: US1 + US2 + US3
- **Phases**: Setup + Foundational + US1 + US2 + US3
- **Tasks**: T001-T043 (43 tasks)
- **Outcome**: Full notification system with quick access dropdown
- **Estimated LOC**: ~1,600 lines
- **Value**: Production-ready core notification system

---

**Document Status**: Complete
**Generated**: 2026-01-29
**Based On**: spec.md (user stories), plan.md (architecture), data-model.md (schema), contracts/ (API design)
**Ready for Implementation**: Yes via `/speckit.implement` command
