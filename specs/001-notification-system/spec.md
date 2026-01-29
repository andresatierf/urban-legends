# Feature Specification: In-App Notification System

**Feature Branch**: `001-notification-system`
**Created**: 2026-01-29
**Status**: Draft
**Input**: User description: "Build a notification system (in-app only, no e-mail or other external systems) that notifies the users of actions relevant to them."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Recent Notifications (Priority: P1)

As a tournament participant, I need to see notifications about important events that affect me (team invitations, submission approvals/rejections, tournament status changes) so that I stay informed about activities requiring my attention without having to navigate through multiple pages.

**Why this priority**: This is the core value of a notification system - surfacing relevant information to users proactively. Without this, the notification system provides no value.

**Independent Test**: Can be fully tested by triggering various events (team invitation, submission approval) and verifying the notification appears in the user's notification list with correct content and timestamp.

**Acceptance Scenarios**:

1. **Given** I am a user logged into the system, **When** I am invited to join a team, **Then** I see a notification "You've been invited to join [Team Name]" in my notification list
2. **Given** I am a team captain who submitted an activity, **When** an admin approves my submission, **Then** I see a notification "[Submission Title] has been approved" in my notification list
3. **Given** I am a team member, **When** an admin rejects our team's submission, **Then** I see a notification "[Submission Title] was rejected: [reason]" with the reason visible in my notification list
4. **Given** I am a tournament participant, **When** a tournament I'm registered for starts in 24 hours, **Then** I see a notification "[Tournament Name] starts in 24 hours"
5. **Given** I am a team member, **When** another teammate submits an activity, **Then** I see a notification "[Teammate Name] submitted [Activity] for [Date]"
6. **Given** I am a tournament participant, **When** winners are announced, **Then** I see a notification with winner details and my team's placement (if applicable)
7. **Given** I am removed from a team, **When** the removal occurs, **Then** I see a notification "You've been removed from [Team Name]"
8. **Given** I have multiple notifications, **When** I view my notification list, **Then** I see them ordered by most recent first with clear timestamps

---

### User Story 2 - Mark Notifications as Read (Priority: P2)

As a user, I need to mark notifications as read so that I can distinguish between new information requiring my attention and information I've already reviewed.

**Why this priority**: Essential for notification management, but the system provides value even without this (users can still see notifications). This builds on P1 by adding state management.

**Independent Test**: Can be fully tested by creating notifications, marking them as read, and verifying visual distinction between read/unread states and that read count updates correctly.

**Acceptance Scenarios**:

1. **Given** I have unread notifications, **When** I click on a notification, **Then** it is marked as read and the visual indicator changes
2. **Given** I have unread notifications, **When** I click "Mark all as read", **Then** all notifications show as read and the unread count resets to zero
3. **Given** I have a mix of read and unread notifications, **When** I view my notification list, **Then** unread notifications are visually distinguished (e.g., bold text, colored indicator)
4. **Given** I have unread notifications, **When** I view the notification indicator, **Then** I see a badge showing the count of unread notifications

---

### User Story 3 - Notification Indicator & Quick Access (Priority: P3)

As a user, I need to access notifications quickly from anywhere in the application so that I don't have to navigate to a dedicated page to stay informed.

**Why this priority**: Improves user experience and discoverability, but notifications are still accessible even if users must navigate to a dedicated page. Enhances P1 and P2 functionality.

**Independent Test**: Can be fully tested by triggering notifications while on various pages, verifying the indicator badge updates in real-time, and that clicking the indicator shows recent notifications without full page navigation.

**Acceptance Scenarios**:

1. **Given** I am on any page in the application, **When** a new notification arrives, **Then** the notification indicator badge updates in real-time without page refresh
2. **Given** I have unread notifications, **When** I click the notification bell icon in the header, **Then** a dropdown panel shows my 5 most recent notifications
3. **Given** I view notifications in the dropdown panel, **When** I click "View all notifications", **Then** I navigate to the full notifications page
4. **Given** I click on a notification in the dropdown, **When** the notification is actionable (e.g., team invitation), **Then** I navigate to the relevant page (e.g., team invitation page)

---

### User Story 4 - Role-Specific and Aggregated Notifications (Priority: P3)

As a user with administrative or management responsibilities, I need to receive notifications relevant to my role (pending approvals, flagged submissions, daily digests) so that I can efficiently manage my responsibilities without constantly checking multiple pages.

**Why this priority**: Essential for users with elevated permissions, but the core notification system (P1-P2) provides value for all users. This extends the system to support workflow management for admins, reviewers, and tournament managers.

**Independent Test**: Can be fully tested by assigning roles to users, triggering role-specific events (flagging a submission, assigning tournament manager), and verifying role-specific notifications appear only for users with appropriate permissions.

**Acceptance Scenarios**:

1. **Given** I am assigned as a reviewer, **When** a submission is flagged for review, **Then** I see a notification "Submission flagged for review: [Submission Title]"
2. **Given** I am assigned as a tournament manager, **When** the assignment occurs, **Then** I see a notification "You've been assigned as manager for [Tournament Name]"
3. **Given** I am granted admin role, **When** the role is assigned, **Then** I see a notification "Admin role granted"
4. **Given** I have my admin role revoked, **When** the role is removed, **Then** I see a notification "Admin role revoked"
5. **Given** I have pending actions (unapproved submissions, pending invitations), **When** the daily digest runs, **Then** I see an aggregated notification "[X] items require your attention"
6. **Given** I am a team captain, **When** a user requests to join my team, **Then** I see a notification "[User Name] wants to join [Team Name]" with action buttons

---

### Edge Cases

- What happens when a notification references an entity that has been deleted (e.g., team deleted after invitation sent)?
- How does the system handle notifications for users who are no longer part of a team/tournament?
- What happens if a user receives an extremely high volume of notifications in a short time?
- How does the system handle notifications for events that occur while a user is offline?
- What happens if a notification action (e.g., "view team") requires permissions the user no longer has?
- How are notifications cleaned up to prevent indefinite database growth?
- What happens if a user is granted then revoked the same role multiple times in quick succession?
- How does the system handle notifications for a tournament manager who is assigned then immediately removed?
- What happens if a submission is flagged for review but the reviewer role is revoked before they view it?
- How does the daily digest handle users with zero pending items?
- What happens if multiple team members submit activities simultaneously (notification storm)?
- How does the system handle captain role transfer when the new captain hasn't logged in yet?
- What happens if a team join request is approved/rejected after the team is deleted?
- How are time-sensitive notifications (24-hour warnings) handled across different time zones?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST create notifications for the following event categories (23 types total):

  **Team Events (9 types):**

  - Team invitation received
  - Team join request received (for captains only)
  - Join request approved
  - Join request rejected
  - Member joined team (notify other team members)
  - Member left team (notify captain and remaining members)
  - Removed from team (notify the removed user)
  - Captain role transferred to you
  - Captain role transferred from you to another member
  - Team deleted (notify all current members)

  **Submission Events (5 types):**

  - Submission approved (notify team captain and submitter)
  - Submission rejected with reason visible (notify team captain and submitter)
  - Submission group auto-created when team exercise threshold met (notify team members)
  - Teammate submitted activity (daily progress notification for team members)
  - Submission flagged for review (notify assigned reviewers)

  **Tournament Events (6 types):**

  - Tournament starting in 24 hours (notify all registered participants)
  - Tournament started (notify all registered participants)
  - Tournament ending in 24 hours (notify all active participants)
  - Tournament ended (notify all participants)
  - Tournament winner announced (notify all participants, highlight winners)
  - Assigned as tournament manager (notify the assigned user)

  **Role/Admin Events (3 types):**

  - Role granted: admin, reviewer, tournament_manager, or viewer (notify the user)
  - Role revoked: any role removal (notify the user)
  - Pending items require attention: aggregated daily digest (notify users with pending actions)

- **FR-002**: System MUST display notifications in a centralized notification list accessible to the user

- **FR-003**: System MUST show notifications in reverse chronological order (most recent first)

- **FR-004**: System MUST display the following information for each notification:

  - Notification title/message
  - Timestamp (relative time for recent, absolute for older)
  - Read/unread status
  - Associated action link (if applicable)

- **FR-005**: Users MUST be able to mark individual notifications as read

- **FR-006**: Users MUST be able to mark all notifications as read at once

- **FR-007**: System MUST provide a notification indicator (badge) showing the count of unread notifications

- **FR-008**: System MUST update the unread notification count in real-time when new notifications arrive

- **FR-009**: System MUST provide a dropdown panel accessible from the notification indicator showing recent notifications (latest 5)

- **FR-010**: Notifications MUST be user-specific (users only see notifications relevant to them)

- **FR-011**: System MUST handle notifications for deleted entities gracefully (show message indicating entity no longer exists)

- **FR-012**: Clicking an actionable notification MUST navigate the user to the relevant page or entity

- **FR-013**: System MUST persist read/unread status so it survives page refreshes and logout/login cycles

- **FR-014**: System MUST send time-based notifications (24-hour warnings) at appropriate times before tournament events

- **FR-015**: System MUST aggregate daily digest notifications to include counts and summaries of pending actions

- **FR-016**: System MUST include relevant metadata in notifications (rejection reason for submissions, role name for role changes, winner details for tournament results)

- **FR-017**: System MUST provide actionable buttons in notifications where appropriate (Accept/Reject for team invitations, View for flagged submissions)

- **FR-018**: Team join request notifications MUST only be visible to team captains

- **FR-019**: Reviewer-specific notifications (flagged submissions) MUST only be visible to users with reviewer role

- **FR-020**: Tournament manager assignment notifications MUST only be sent to the assigned user

- **FR-021**: System MUST send team activity notifications to all team members except the submitter

- **FR-022**: System MUST send team membership change notifications (joins, leaves, removals) to all affected parties with appropriate messaging

- **FR-023**: System MUST automatically archive or delete notifications for deleted entities after displaying appropriate error message

- **FR-024**: Captain role transfer notifications MUST be sent to both the old captain and new captain with different messaging

- **FR-025**: Daily digest notifications MUST not be sent to users with zero pending items

- **FR-026**: System MUST handle rapid-fire notifications (multiple submissions in short time) without creating duplicate or redundant notifications

### Key Entities

- **Notification**: A message to a user about an event. Contains:

  - Recipient user reference
  - Notification type (one of 23 types organized in 4 categories):
    - **Team**: team_invitation_received, team_join_request_received, join_request_approved, join_request_rejected, member_joined_team, member_left_team, removed_from_team, captain_role_transferred_to, captain_role_transferred_from, team_deleted
    - **Submission**: submission_approved, submission_rejected, submission_group_auto_created, teammate_submitted, submission_flagged_for_review
    - **Tournament**: tournament_starting_24h, tournament_started, tournament_ending_24h, tournament_ended, tournament_winner_announced, assigned_as_tournament_manager
    - **Role/Admin**: role_granted, role_revoked, pending_items_digest
  - Title text
  - Body text (optional, for additional context like rejection reason, role name, digest summary)
  - Related entity ID (team ID, submission ID, tournament ID, role name, etc.)
  - Related entity type (team, submission, tournament, role, user)
  - Read status (boolean)
  - Creation timestamp
  - Link/action URL (optional, where user should navigate when clicking)
  - Action metadata (optional, for buttons like "Accept Invitation", "View Submission", "View Team")

- **NotificationPreference**: User preferences for notification behavior (future extensibility). Contains:
  - User reference
  - Notification type enabled/disabled flags (for future filtering)

### Assumptions

- Notifications are informational with optional action buttons (Accept/Reject, View); users cannot reply or send custom messages
- All notification triggers happen server-side (Convex mutations triggered by relevant events)
- Notification delivery latency under 3 seconds is acceptable (real-time but not instant)
- 90-day retention is sufficient for tournament lifecycle (most tournaments complete within this timeframe)
- Users accessing the system from multiple devices/tabs should see consistent notification state
- Notification text is system-generated (no user-customizable templates)
- Notifications are only in English (internationalization is a future enhancement)
- Daily digest runs once per day at a fixed time (e.g., 9:00 AM user local time or UTC)
- Time-based notifications (24-hour warnings) are scheduled using server-side jobs
- Users with elevated roles (admin, reviewer, tournament_manager) receive role-specific notifications in addition to standard user notifications
- Tournament winners are determined by existing leaderboard/scoring logic (out of scope for this feature)
- Submission groups are auto-created by existing submission logic when team exercise thresholds are met (out of scope for this feature)
- Team join requests are handled by existing team management logic (notifications only surface the events)
- All notification types support graceful degradation when related entities are deleted

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users receive notifications for all 23 notification types within 3 seconds of the event occurring

- **SC-002**: Users can view all their notifications and identify unread items without navigating away from their current page

- **SC-003**: Users can mark notifications as read and see the unread count update immediately

- **SC-004**: 90% of users who receive notifications successfully navigate to the related content when clicking actionable notifications

- **SC-005**: Notification list loads and displays within 1 second for users with up to 100 notifications

- **SC-006**: System maintains accurate read/unread status across multiple browser tabs/windows for the same user

- **SC-007**: Users see their notification count update in real-time across all open sessions when new notifications arrive

- **SC-008**: Notification system handles at least 50 concurrent notification deliveries without performance degradation

- **SC-009**: Time-based notifications (24-hour tournament warnings) are delivered within 5 minutes of the scheduled time

- **SC-010**: Daily digest notifications accurately aggregate all pending items and are delivered at the scheduled time

- **SC-011**: Role-specific notifications (reviewer, tournament manager) are only visible to users with appropriate permissions

- **SC-012**: Team captains receive join request notifications within 3 seconds of request submission

- **SC-013**: Users who click on actionable notifications (team invitations, join requests) successfully complete the intended action 90% of the time
