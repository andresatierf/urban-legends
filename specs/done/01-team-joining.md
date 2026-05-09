# Team Joining / Self-Service

**Priority:** CRITICAL
**Status:** Not Implemented
**Estimated Effort:** 3-5 days

## Problem Statement

Currently, only admins can create teams and add members to teams. Users have no way to:

- Create their own teams for tournaments
- Join existing teams
- Request to join teams
- Leave teams they're part of

This creates a bottleneck where every user action requires admin intervention, preventing the platform from scaling.

## Current State

### What Exists

- `teams.create` mutation (admin-only)
- `teams.addMember` mutation (admin-only, by email)
- `teams.removeMember` mutation (admin-only)
- `teams.listMembers` query
- Basic team display in UI

### Barriers

- Admin-only enforcement in backend (line 183 of `convex/teams.ts`)
- No invitation or join request system
- No UI for users to browse available teams
- No UI for team captains to manage join requests

## Requirements

### Functional Requirements

1. **User Team Creation**
   - Users can create teams for tournaments they're eligible for
   - Creator automatically becomes team captain
   - Must respect tournament team size constraints (min/max)
   - Team names must be unique within a tournament

2. **Join Existing Team**
   - Users can browse teams in tournaments they're interested in
   - Users can request to join open teams
   - Team captains can approve/reject join requests
   - Users can cancel pending join requests

3. **Team Invitations**
   - Team captains can invite users by email
   - Invited users receive notification
   - Users can accept/reject invitations
   - Invitations expire after 7 days

4. **Leave Team**
   - Users can leave teams they're part of
   - Cannot leave if they're the last member (must delete team instead)
   - Captains leaving must transfer captaincy or delete team

5. **Team Visibility**
   - Public teams: anyone can request to join
   - Private teams: invite-only
   - Tournament detail page shows teams with join status

### Non-Functional Requirements

- Join requests processed within 500ms
- Real-time updates when join requests are approved/rejected
- Email notifications for invitations (optional for MVP)
- Audit trail of team membership changes

## Database Schema Changes

### New Tables

```typescript
// convex/schema.ts

teamInvitations: defineTable({
  teamId: v.id("teams"),
  invitedUserId: v.id("users"),
  invitedEmail: v.string(),
  invitedBy: v.id("users"),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("rejected"),
    v.literal("cancelled"),
    v.literal("expired")
  ),
  expiresAt: v.string(), // ISO date
  createdAt: v.string(),
  respondedAt: v.optional(v.string()),
})
  .index("by_team", ["teamId"])
  .index("by_user", ["invitedUserId"])
  .index("by_email", ["invitedEmail"])
  .index("by_status", ["status"])
  .index("by_team_and_status", ["teamId", "status"]),

joinRequests: defineTable({
  teamId: v.id("teams"),
  userId: v.id("users"),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("cancelled")
  ),
  message: v.optional(v.string()), // User's message to team
  createdAt: v.string(),
  respondedAt: v.optional(v.string()),
  respondedBy: v.optional(v.id("users")),
})
  .index("by_team", ["teamId"])
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_team_and_status", ["teamId", "status"]),
```

### Modified Tables

```typescript
// Add to teams table
teams: defineTable({
  name: v.string(),
  tournamentId: v.id("tournaments"),
  createdBy: v.id("users"),
  visibility: v.union(v.literal("public"), v.literal("private")), // NEW
  maxMembers: v.optional(v.number()), // NEW (respects tournament constraints)
});
```

## Backend Implementation

### New Mutations

#### `teams.createUserTeam`

```typescript
// Allow users to create their own teams
export const createUserTeam = mutation({
  args: {
    name: v.string(),
    tournamentId: v.id("tournaments"),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate tournament exists and is active
    // Check if user already has a team in this tournament
    // Validate team name uniqueness within tournament
    // Create team with user as captain
    // Return team ID
  },
});
```

#### `teams.requestToJoin`

```typescript
export const requestToJoin = mutation({
  args: {
    teamId: v.id("teams"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate team exists and is public
    // Check if user already in team or has pending request
    // Validate team has space (maxMembers check)
    // Create join request
    // Notify team captain (future: notifications)
    // Return request ID
  },
});
```

#### `teams.approveJoinRequest`

```typescript
export const approveJoinRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate user is team captain or admin
    // Get join request and validate status is "pending"
    // Check team still has space
    // Add user to team as "member"
    // Update request status to "approved"
    // Return success
  },
});
```

#### `teams.rejectJoinRequest`

```typescript
// Similar to approve, but sets status to "rejected"
```

#### `teams.inviteMember`

```typescript
export const inviteMember = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate user is team captain or admin
    // Look up user by email
    // Check if user already in team or has pending invitation
    // Create invitation with 7-day expiry
    // Send email notification (future)
    // Return invitation ID
  },
});
```

#### `teams.respondToInvitation`

```typescript
export const respondToInvitation = mutation({
  args: {
    invitationId: v.id("teamInvitations"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate invitation belongs to user
    // Check invitation hasn't expired
    // If accept: add user to team
    // Update invitation status
    // Return success
  },
});
```

#### `teams.leaveTeam`

```typescript
export const leaveTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate user is in team
    // If captain: check if other members exist (must transfer or delete)
    // Remove user from teamMembers
    // If last member: delete team
    // Return success
  },
});
```

#### `teams.transferCaptaincy`

```typescript
export const transferCaptaincy = mutation({
  args: {
    teamId: v.id("teams"),
    newCaptainId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Validate current user is captain
    // Validate new captain is team member
    // Update both users' roles
    // Return success
  },
});
```

### New Queries

#### `teams.listJoinRequests`

```typescript
export const listJoinRequests = query({
  args: {
    teamId: v.id("teams"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Return join requests for team with user details
  },
});
```

#### `teams.listUserInvitations`

```typescript
export const listUserInvitations = query({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Return invitations for current user or specified user
  },
});
```

#### `teams.getUserJoinRequest`

```typescript
export const getUserJoinRequest = query({
  args: {
    teamId: v.id("teams"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check if user has pending join request for team
  },
});
```

## Frontend Implementation

### New Components

#### `CreateTeamDialog`

**Location:** `src/components/teams/create-team-dialog.tsx`

- Modal dialog with form
- Tournament selector (dropdown)
- Team name input
- Visibility selector (Public/Private)
- Submit creates team via `teams.createUserTeam`
- Redirect to team detail page on success

#### `JoinTeamButton`

**Location:** `src/components/teams/join-team-button.tsx`

- Button component that checks join eligibility
- Shows different states:
  - "Join Team" (can join)
  - "Request Sent" (pending request)
  - "Already Joined" (is member)
  - "Team Full" (max members reached)
  - "Private Team" (must be invited)
- Clicking opens confirmation dialog or message input
- Calls `teams.requestToJoin` mutation

#### `JoinRequestsList`

**Location:** `src/components/teams/join-requests-list.tsx`

- Table showing pending join requests
- Displays user info, message, date
- Approve/Reject action buttons
- Only visible to team captains and admins
- Real-time updates via Convex query

#### `TeamInvitationsList`

**Location:** `src/components/teams/team-invitations-list.tsx`

- Shows user's pending invitations
- Accept/Reject buttons
- Shows team name, tournament, who invited
- Displayed on dashboard or dedicated page

#### `InviteMemberDialog`

**Location:** `src/components/teams/invite-member-dialog.tsx`

- Email input form
- Validates email format
- Shows if user exists
- Calls `teams.inviteMember` mutation
- Success toast on send

### Modified Components

#### `TournamentDetailsCard`

**Location:** `src/components/tournaments/tournament-details-card.tsx`

- Add "Create Team" button (if user doesn't have team)
- Show user's current team if exists
- Show available teams with "Join" buttons

#### `TeamDetailsCard`

**Location:** `src/components/teams/team-details-card.tsx`

- Add "Join Requests" section (captains only)
- Add "Invite Member" button (captains only)
- Add "Leave Team" button (members)
- Show member roles (Captain badge)

### New Pages

#### `/tournaments/[id]/teams`

**Location:** `src/app/(all)/tournaments/[id]/teams/page.tsx`

- Browse all teams in tournament
- Filter by public/private
- Show team size (3/5 members)
- Join buttons for each team
- "Create Team" button at top

## User Flows

### Flow 1: User Creates Team

1. User navigates to tournament detail page
2. Clicks "Create Team" button
3. Dialog opens with form
4. User enters team name, selects visibility
5. Submits form
6. Team created, user becomes captain
7. Redirected to team detail page
8. Can now invite members or wait for join requests

### Flow 2: User Joins Public Team

1. User browses teams in tournament
2. Finds team with open slots
3. Clicks "Join Team" button
4. (Optional) Enters message to team
5. Join request created with "pending" status
6. Toast: "Join request sent to team captain"
7. User can see "Request Sent" status on team
8. Team captain sees notification/request in their dashboard
9. Captain approves request
10. User added to team, receives notification
11. Team appears in user's teams list

### Flow 3: Captain Invites Member

1. Captain navigates to team detail page
2. Clicks "Invite Member" button
3. Dialog opens with email input
4. Enters user's email
5. Invitation created
6. Email sent to user (future)
7. Invited user sees invitation in dashboard
8. User clicks "Accept"
9. User added to team
10. Captain sees user in team roster

### Flow 4: User Leaves Team

1. User navigates to team detail page
2. Clicks "Leave Team" button
3. Confirmation dialog: "Are you sure?"
4. Confirms action
5. If captain and other members exist: prompted to transfer captaincy
6. User removed from team
7. Redirected to tournaments page
8. Toast: "You left [Team Name]"

## Testing Checklist

### Unit Tests

- [ ] Team creation validates tournament constraints
- [ ] Cannot join team twice
- [ ] Cannot join if team is full
- [ ] Cannot join private team without invitation
- [ ] Captain can approve join requests
- [ ] Non-captains cannot approve join requests
- [ ] Invitation expiry works correctly
- [ ] Cannot leave team if last captain (without transferring)

### Integration Tests

- [ ] Create team → Join request → Approve → User in team
- [ ] Invite member → Accept → User in team
- [ ] Leave team updates submission eligibility
- [ ] Transfer captaincy updates permissions
- [ ] Full team rejects new join requests

### UI Tests

- [ ] Join button shows correct state
- [ ] Join requests list updates in real-time
- [ ] Invitations appear in user dashboard
- [ ] Toast notifications appear on actions
- [ ] Forms validate inputs correctly

## Edge Cases

1. **User deletes account with pending join requests**
   - Join requests marked as cancelled
   - Team rosters updated

2. **Tournament ends mid-join-request**
   - Can still join team (for historical record)
   - Cannot create new teams

3. **Team reaches max size while request pending**
   - Request automatically rejected with message
   - User notified

4. **Captain leaves without transferring**
   - If other members exist: auto-promote oldest member
   - If no members: delete team

5. **Duplicate team names**
   - Validate uniqueness within tournament
   - Show error message with suggestion

6. **User invited to multiple teams in same tournament**
   - Can only join one team per tournament
   - Accepting one invitation cancels others

## Future Enhancements

- Email notifications for invitations and approvals
- Team chat/messaging
- Public team profiles
- Team statistics and history
- Waitlist for full teams
- Co-captain role
- Team tags/categories
- Search and filter teams by criteria

## Dependencies

- Existing Convex backend
- Existing Clerk authentication
- TanStack Form for form handling
- Shadcn/ui components (Dialog, Button, Table)
- Toast notification system (sonner)

## Migration Plan

1. **Phase 1: Schema Changes**
   - Add new tables to schema
   - Deploy schema changes
   - No user-facing changes yet

2. **Phase 2: Backend Implementation**
   - Implement all mutations and queries
   - Test via Convex dashboard
   - Keep admin-only team creation as fallback

3. **Phase 3: Frontend Implementation**
   - Build components incrementally
   - Start with team creation
   - Then join requests
   - Then invitations
   - Deploy features as completed

4. **Phase 4: Testing & Refinement**
   - End-to-end testing
   - Bug fixes
   - Performance optimization
   - Remove or repurpose admin team creation

## Success Metrics

- 80%+ of teams created by users (not admins)
- <5% of join requests rejected
- Average time from join request to approval: <24 hours
- 90%+ of invitations accepted within 3 days
- Zero permission-related security issues
