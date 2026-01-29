# Notification Triggers API Contract

**Version**: 1.0.0
**Last Updated**: 2026-01-29

This document specifies which existing mutations need to trigger notification creation. Each trigger includes the event, affected users, notification type, and implementation guidance.

---

## Team-Related Triggers

### `teams.ts` - Team Invitation Triggers

#### `inviteUser` → `team_invitation_received`

**Event**: User is invited to join a team

**Affected Users**: Invited user

**Implementation Location**: `/convex/teams.ts` - `inviteUser` mutation

**Trigger Logic**:

```typescript
export const inviteUser = mutation({
  args: {
    teamId: v.id("teams"),
    invitedUserId: v.id("users"),
    invitedEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // ... existing invitation logic ...

    const invitation = await ctx.db.insert("teamInvitations", {
      teamId: args.teamId,
      invitedUserId: args.invitedUserId,
      invitedEmail: args.invitedEmail,
      invitedBy: currentUser._id,
      status: "pending",
      expiresAt: /* ... */,
      createdAt: nowUTC(),
    });

    // CREATE NOTIFICATION
    await ctx.runMutation(internal.notifications.create, {
      userId: args.invitedUserId,
      type: "team_invitation_received",
      title: `You've been invited to join ${team.name}`,
      body: `${currentUser.name} invited you to join their team for the tournament`,
      relatedEntityId: args.teamId,
      relatedEntityType: "team",
      actionUrl: `/teams/${args.teamId}/invitations`,
      actionMetadata: { invitationId: invitation },
    });

    return invitation;
  }
});
```

**Notification Fields**:
- **Type**: `team_invitation_received`
- **Title**: `"You've been invited to join {teamName}"`
- **Body**: `"{inviterName} invited you to join their team for the tournament"`
- **Action URL**: `/teams/{teamId}/invitations`
- **Action Metadata**: `{ invitationId }`

---

#### `acceptInvitation` → `member_joined_team`

**Event**: User accepts team invitation

**Affected Users**: All existing team members (except the new joiner)

**Implementation Location**: `/convex/teams.ts` - `acceptInvitation` mutation

**Trigger Logic**:

```typescript
export const acceptInvitation = mutation({
  args: { invitationId: v.id("teamInvitations") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    const team = await ctx.db.get(invitation.teamId);
    if (!team) throw new Error("Team not found");

    // ... existing acceptance logic ...

    await ctx.db.insert("teamMembers", {
      teamId: invitation.teamId,
      userId: currentUser._id,
      role: "member",
    });

    await ctx.db.patch(args.invitationId, {
      status: "accepted",
      respondedAt: nowUTC(),
    });

    // CREATE NOTIFICATIONS for existing team members
    const existingMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", invitation.teamId))
      .collect();

    const notificationPromises = existingMembers
      .filter(m => m.userId !== currentUser._id) // Don't notify the new joiner
      .map(member =>
        ctx.runMutation(internal.notifications.create, {
          userId: member.userId,
          type: "member_joined_team",
          title: `${currentUser.name} joined ${team.name}`,
          body: `Your team now has ${existingMembers.length + 1} members`,
          relatedEntityId: invitation.teamId,
          relatedEntityType: "team",
          actionUrl: `/teams/${invitation.teamId}`,
        })
      );

    await Promise.all(notificationPromises);

    return { success: true };
  }
});
```

**Notification Fields**:
- **Type**: `member_joined_team`
- **Title**: `"{newMemberName} joined {teamName}"`
- **Body**: `"Your team now has {totalMembers} members"`
- **Action URL**: `/teams/{teamId}`

---

#### `requestToJoin` → `team_join_request_received`

**Event**: User requests to join a team

**Affected Users**: Team captain(s) only

**Implementation Location**: `/convex/teams.ts` - `requestToJoin` mutation

**Trigger Logic**:

```typescript
export const requestToJoin = mutation({
  args: {
    teamId: v.id("teams"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // ... existing request logic ...

    const joinRequest = await ctx.db.insert("joinRequests", {
      teamId: args.teamId,
      userId: currentUser._id,
      status: "pending",
      message: args.message,
      createdAt: nowUTC(),
    });

    // CREATE NOTIFICATIONS for team captains only
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const captains = teamMembers.filter(m => m.role === "captain");

    const notificationPromises = captains.map(captain =>
      ctx.runMutation(internal.notifications.create, {
        userId: captain.userId,
        type: "team_join_request_received",
        title: `${currentUser.name} wants to join ${team.name}`,
        body: args.message || "New join request pending your approval",
        relatedEntityId: args.teamId,
        relatedEntityType: "team",
        actionUrl: `/teams/${args.teamId}/requests`,
        actionMetadata: { joinRequestId: joinRequest },
      })
    );

    await Promise.all(notificationPromises);

    return joinRequest;
  }
});
```

**Notification Fields**:
- **Type**: `team_join_request_received`
- **Title**: `"{userName} wants to join {teamName}"`
- **Body**: User's message or `"New join request pending your approval"`
- **Action URL**: `/teams/{teamId}/requests`
- **Action Metadata**: `{ joinRequestId }`
- **Recipients**: Team captains only (FR-018)

---

#### `approveJoinRequest` → `join_request_approved`

**Event**: Captain approves join request

**Affected Users**: Requester + existing team members

**Implementation Location**: `/convex/teams.ts` - `approveJoinRequest` mutation

**Trigger Logic**:

```typescript
export const approveJoinRequest = mutation({
  args: { joinRequestId: v.id("joinRequests") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const joinRequest = await ctx.db.get(args.joinRequestId);
    if (!joinRequest) throw new Error("Join request not found");

    const team = await ctx.db.get(joinRequest.teamId);
    if (!team) throw new Error("Team not found");

    // ... existing approval logic ...

    await ctx.db.insert("teamMembers", {
      teamId: joinRequest.teamId,
      userId: joinRequest.userId,
      role: "member",
    });

    await ctx.db.patch(args.joinRequestId, {
      status: "approved",
      respondedAt: nowUTC(),
      respondedBy: currentUser._id,
    });

    // NOTIFY REQUESTER
    await ctx.runMutation(internal.notifications.create, {
      userId: joinRequest.userId,
      type: "join_request_approved",
      title: `Your request to join ${team.name} was approved`,
      body: `Welcome to the team! You can now participate in tournament activities`,
      relatedEntityId: joinRequest.teamId,
      relatedEntityType: "team",
      actionUrl: `/teams/${joinRequest.teamId}`,
    });

    // NOTIFY EXISTING TEAM MEMBERS (same as acceptInvitation)
    const existingMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", joinRequest.teamId))
      .collect();

    const newMember = await ctx.db.get(joinRequest.userId);

    const memberNotificationPromises = existingMembers
      .filter(m => m.userId !== joinRequest.userId)
      .map(member =>
        ctx.runMutation(internal.notifications.create, {
          userId: member.userId,
          type: "member_joined_team",
          title: `${newMember?.name} joined ${team.name}`,
          body: `Your team now has ${existingMembers.length + 1} members`,
          relatedEntityId: joinRequest.teamId,
          relatedEntityType: "team",
          actionUrl: `/teams/${joinRequest.teamId}`,
        })
      );

    await Promise.all(memberNotificationPromises);

    return { success: true };
  }
});
```

**Notification Fields (Requester)**:
- **Type**: `join_request_approved`
- **Title**: `"Your request to join {teamName} was approved"`
- **Body**: `"Welcome to the team! You can now participate in tournament activities"`
- **Action URL**: `/teams/{teamId}`

**Notification Fields (Existing Members)**:
- Same as `member_joined_team` above

---

#### `rejectJoinRequest` → `join_request_rejected`

**Event**: Captain rejects join request

**Affected Users**: Requester only

**Implementation Location**: `/convex/teams.ts` - `rejectJoinRequest` mutation

**Trigger Logic**:

```typescript
export const rejectJoinRequest = mutation({
  args: {
    joinRequestId: v.id("joinRequests"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const joinRequest = await ctx.db.get(args.joinRequestId);
    if (!joinRequest) throw new Error("Join request not found");

    const team = await ctx.db.get(joinRequest.teamId);
    if (!team) throw new Error("Team not found");

    // ... existing rejection logic ...

    await ctx.db.patch(args.joinRequestId, {
      status: "rejected",
      respondedAt: nowUTC(),
      respondedBy: currentUser._id,
    });

    // NOTIFY REQUESTER
    await ctx.runMutation(internal.notifications.create, {
      userId: joinRequest.userId,
      type: "join_request_rejected",
      title: `Your request to join ${team.name} was declined`,
      body: args.reason || "Your join request was not accepted at this time",
      relatedEntityId: joinRequest.teamId,
      relatedEntityType: "team",
      actionUrl: `/teams`,
    });

    return { success: true };
  }
});
```

**Notification Fields**:
- **Type**: `join_request_rejected`
- **Title**: `"Your request to join {teamName} was declined"`
- **Body**: Rejection reason or `"Your join request was not accepted at this time"`
- **Action URL**: `/teams`

---

#### `removeMember` → `removed_from_team`

**Event**: Captain removes a member from team

**Affected Users**: Removed member + remaining team members

**Implementation Location**: `/convex/teams.ts` - `removeMember` mutation

**Trigger Logic**:

```typescript
export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const removedUser = await ctx.db.get(args.userId);
    if (!removedUser) throw new Error("User not found");

    // ... existing removal logic ...

    const membershipToRemove = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.userId)
      )
      .first();

    if (membershipToRemove) {
      await ctx.db.delete(membershipToRemove._id);
    }

    // NOTIFY REMOVED USER
    await ctx.runMutation(internal.notifications.create, {
      userId: args.userId,
      type: "removed_from_team",
      title: `You've been removed from ${team.name}`,
      body: `You are no longer a member of this team`,
      relatedEntityId: args.teamId,
      relatedEntityType: "team",
      actionUrl: `/teams`,
    });

    // NOTIFY REMAINING TEAM MEMBERS
    const remainingMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const memberNotificationPromises = remainingMembers.map(member =>
      ctx.runMutation(internal.notifications.create, {
        userId: member.userId,
        type: "member_left_team",
        title: `${removedUser.name} left ${team.name}`,
        body: `Your team now has ${remainingMembers.length} members`,
        relatedEntityId: args.teamId,
        relatedEntityType: "team",
        actionUrl: `/teams/${args.teamId}`,
      })
    );

    await Promise.all(memberNotificationPromises);

    return { success: true };
  }
});
```

**Notification Fields (Removed User)**:
- **Type**: `removed_from_team`
- **Title**: `"You've been removed from {teamName}"`
- **Body**: `"You are no longer a member of this team"`
- **Action URL**: `/teams`

**Notification Fields (Remaining Members)**:
- **Type**: `member_left_team`
- **Title**: `"{userName} left {teamName}"`
- **Body**: `"Your team now has {remainingCount} members"`
- **Action URL**: `/teams/{teamId}`

---

#### `transferCaptain` → `captain_role_transferred_to` + `captain_role_transferred_from`

**Event**: Captain role is transferred to another member

**Affected Users**: New captain + old captain

**Implementation Location**: `/convex/teams.ts` - `transferCaptain` mutation (may need to be created)

**Trigger Logic**:

```typescript
export const transferCaptain = mutation({
  args: {
    teamId: v.id("teams"),
    newCaptainUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const newCaptain = await ctx.db.get(args.newCaptainUserId);
    if (!newCaptain) throw new Error("User not found");

    // ... existing transfer logic ...

    // Update old captain to member
    const oldCaptainMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", currentUser._id)
      )
      .first();

    if (oldCaptainMembership) {
      await ctx.db.patch(oldCaptainMembership._id, { role: "member" });
    }

    // Update new captain
    const newCaptainMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.newCaptainUserId)
      )
      .first();

    if (newCaptainMembership) {
      await ctx.db.patch(newCaptainMembership._id, { role: "captain" });
    }

    // NOTIFY NEW CAPTAIN
    await ctx.runMutation(internal.notifications.create, {
      userId: args.newCaptainUserId,
      type: "captain_role_transferred_to",
      title: `You are now captain of ${team.name}`,
      body: `${currentUser.name} transferred the captain role to you`,
      relatedEntityId: args.teamId,
      relatedEntityType: "team",
      actionUrl: `/teams/${args.teamId}`,
    });

    // NOTIFY OLD CAPTAIN
    await ctx.runMutation(internal.notifications.create, {
      userId: currentUser._id,
      type: "captain_role_transferred_from",
      title: `You transferred captain role for ${team.name}`,
      body: `${newCaptain.name} is now the team captain`,
      relatedEntityId: args.teamId,
      relatedEntityType: "team",
      actionUrl: `/teams/${args.teamId}`,
    });

    return { success: true };
  }
});
```

**Notification Fields (New Captain)**:
- **Type**: `captain_role_transferred_to`
- **Title**: `"You are now captain of {teamName}"`
- **Body**: `"{oldCaptainName} transferred the captain role to you"`
- **Action URL**: `/teams/{teamId}`

**Notification Fields (Old Captain)**:
- **Type**: `captain_role_transferred_from`
- **Title**: `"You transferred captain role for {teamName}"`
- **Body**: `"{newCaptainName} is now the team captain"`
- **Action URL**: `/teams/{teamId}`

---

#### `deleteTeam` → `team_deleted`

**Event**: Team is deleted

**Affected Users**: All team members

**Implementation Location**: `/convex/teams.ts` - `deleteTeam` mutation (may need to be created)

**Trigger Logic**:

```typescript
export const deleteTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Get all members before deletion
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // ... existing deletion logic ...

    // NOTIFY ALL MEMBERS
    const notificationPromises = teamMembers.map(member =>
      ctx.runMutation(internal.notifications.create, {
        userId: member.userId,
        type: "team_deleted",
        title: `${team.name} has been deleted`,
        body: `The team was disbanded by ${currentUser.name}`,
        relatedEntityId: args.teamId,
        relatedEntityType: "team",
        actionUrl: `/teams`,
      })
    );

    await Promise.all(notificationPromises);

    // Delete team and related data
    await ctx.db.delete(args.teamId);

    return { success: true };
  }
});
```

**Notification Fields**:
- **Type**: `team_deleted`
- **Title**: `"{teamName} has been deleted"`
- **Body**: `"The team was disbanded by {captainName}"`
- **Action URL**: `/teams`

---

## Submission-Related Triggers

### `submissions.ts` - Submission State Changes

#### `approve` → `submission_approved`

**Event**: Admin approves a submission

**Affected Users**: Team captain + submitter (if different)

**Implementation Location**: `/convex/submissions.ts` - `approve` mutation (may need to be created)

**Trigger Logic**:

```typescript
export const approve = mutation({
  args: {
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const team = await ctx.db.get(submission.teamId);
    if (!team) throw new Error("Team not found");

    // ... existing approval logic ...

    await ctx.db.patch(args.submissionId, {
      state: "approved",
      managedBy: currentUser._id,
    });

    await recalculateSubmissionPoints(ctx, {
      submissionId: args.submissionId,
      previousState: "pending",
      managedBy: currentUser._id,
    });

    await recalculateTeamPoints(ctx, submission.teamId);

    // Get team captain(s)
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
      .collect();

    const captains = teamMembers.filter(m => m.role === "captain");
    const submitter = await ctx.db.get(submission.userId);

    const recipientIds = [
      ...captains.map(c => c.userId),
      submission.userId, // Include submitter
    ];

    // Remove duplicates (in case submitter is captain)
    const uniqueRecipientIds = [...new Set(recipientIds)];

    // NOTIFY CAPTAIN AND SUBMITTER
    const notificationPromises = uniqueRecipientIds.map(userId =>
      ctx.runMutation(internal.notifications.create, {
        userId,
        type: "submission_approved",
        title: "Submission approved",
        body: `${submission.description || 'Your submission'} for ${team.name} has been approved`,
        relatedEntityId: args.submissionId,
        relatedEntityType: "submission",
        actionUrl: `/submissions/${args.submissionId}`,
      })
    );

    await Promise.all(notificationPromises);

    return { success: true };
  }
});
```

**Notification Fields**:
- **Type**: `submission_approved`
- **Title**: `"Submission approved"`
- **Body**: `"{submissionDescription} for {teamName} has been approved"`
- **Action URL**: `/submissions/{submissionId}`
- **Recipients**: Team captain + submitter

---

#### `reject` → `submission_rejected`

**Event**: Admin rejects a submission

**Affected Users**: Team captain + submitter

**Implementation Location**: `/convex/submissions.ts` - `reject` mutation (may need to be created)

**Trigger Logic**:

```typescript
export const reject = mutation({
  args: {
    submissionId: v.id("submissions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const team = await ctx.db.get(submission.teamId);
    if (!team) throw new Error("Team not found");

    // ... existing rejection logic ...

    await ctx.db.patch(args.submissionId, {
      state: "rejected",
      managedBy: currentUser._id,
    });

    // Get team captain(s) and submitter
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
      .collect();

    const captains = teamMembers.filter(m => m.role === "captain");

    const recipientIds = [
      ...captains.map(c => c.userId),
      submission.userId,
    ];

    const uniqueRecipientIds = [...new Set(recipientIds)];

    // NOTIFY CAPTAIN AND SUBMITTER (include rejection reason)
    const notificationPromises = uniqueRecipientIds.map(userId =>
      ctx.runMutation(internal.notifications.create, {
        userId,
        type: "submission_rejected",
        title: "Submission rejected",
        body: `${submission.description || 'Your submission'} was rejected: ${args.reason}`,
        relatedEntityId: args.submissionId,
        relatedEntityType: "submission",
        actionUrl: `/submissions/${args.submissionId}`,
      })
    );

    await Promise.all(notificationPromises);

    return { success: true };
  }
});
```

**Notification Fields**:
- **Type**: `submission_rejected`
- **Title**: `"Submission rejected"`
- **Body**: `"{submissionDescription} was rejected: {reason}"`
- **Action URL**: `/submissions/{submissionId}`
- **Recipients**: Team captain + submitter

---

#### `create` (submission) → `teammate_submitted`

**Event**: Team member submits an activity

**Affected Users**: All team members except submitter

**Implementation Location**: `/convex/submissions.ts` - `create` mutation

**Trigger Logic**:

```typescript
export const create = mutation({
  args: {
    teamId: v.id("teams"),
    tournamentId: v.id("tournaments"),
    date: v.string(),
    description: v.optional(v.string()),
    submissionType: v.union(v.literal("individual"), v.literal("team")),
    tier: v.union(v.literal("base"), v.literal("advanced")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // ... existing submission creation logic ...

    const submission = await ctx.db.insert("submissions", {
      userId: currentUser._id,
      teamId: args.teamId,
      tournamentId: args.tournamentId,
      date: args.date,
      description: args.description,
      submissionType: args.submissionType,
      tier: args.tier,
      state: "pending",
      createdBy: currentUser._id,
      pointsEarned: 0,
    });

    // NOTIFY TEAM MEMBERS (except submitter)
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Use daily digest pattern to prevent notification spam (FR-026)
    const recipientIds = teamMembers
      .map(m => m.userId)
      .filter(id => id !== currentUser._id);

    for (const userId of recipientIds) {
      // Check if notification for today already exists
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_user_type_entity", (q) =>
          q
            .eq("userId", userId)
            .eq("type", "teammate_submitted")
            .eq("relatedEntityType", "team")
            .eq("relatedEntityId", `${args.teamId}_${today}`)
        )
        .first();

      if (!existing) {
        // Create new notification for today
        await ctx.runMutation(internal.notifications.create, {
          userId,
          type: "teammate_submitted",
          title: "Team activity today",
          body: `${currentUser.name} submitted ${args.description || 'an activity'}`,
          relatedEntityId: `${args.teamId}_${today}`,
          relatedEntityType: "team",
          actionUrl: `/teams/${args.teamId}`,
        });
      } else {
        // Update existing notification (optional: aggregate count)
        const currentBody = existing.body || "";
        const newBody = `${currentBody}\n${currentUser.name} submitted ${args.description || 'an activity'}`;
        await ctx.db.patch(existing._id, { body: newBody });
      }
    }

    return submission;
  }
});
```

**Notification Fields**:
- **Type**: `teammate_submitted`
- **Title**: `"Team activity today"`
- **Body**: `"{teammateNam} submitted {activityDescription}"`
- **Action URL**: `/teams/{teamId}`
- **Recipients**: All team members except submitter
- **Idempotency**: One notification per team per day (prevents spam)

---

## Role/Admin-Related Triggers

### `admin.ts` - Role Management Triggers

#### `assignRole` → `role_granted`

**Event**: Admin grants a role to a user

**Affected Users**: User receiving the role

**Implementation Location**: `/convex/admin.ts` - `assignRole` mutation (may need to be created)

**Trigger Logic**:

```typescript
export const assignRole = mutation({
  args: {
    userId: v.id("users"),
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    await validateMinimumRole(ctx, currentUser._id, "admin");

    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .first();

    if (!role) throw new Error("Role not found");

    // ... existing role assignment logic ...

    const userRole = await ctx.db.insert("userRoles", {
      userId: args.userId,
      roleId: role._id,
      assignedBy: currentUser._id,
      assignedAt: nowUTC(),
    });

    // NOTIFY USER
    await ctx.runMutation(internal.notifications.create, {
      userId: args.userId,
      type: "role_granted",
      title: `${role.displayName} role granted`,
      body: `You've been granted ${role.displayName} permissions by ${currentUser.name}`,
      relatedEntityId: role._id,
      relatedEntityType: "role",
      actionUrl: "/dashboard",
    });

    return userRole;
  }
});
```

**Notification Fields**:
- **Type**: `role_granted`
- **Title**: `"{roleDisplayName} role granted"`
- **Body**: `"You've been granted {roleDisplayName} permissions by {adminName}"`
- **Action URL**: `/dashboard`

---

#### `revokeRole` → `role_revoked`

**Event**: Admin revokes a role from a user

**Affected Users**: User losing the role

**Implementation Location**: `/convex/admin.ts` - `revokeRole` mutation (may need to be created)

**Trigger Logic**:

```typescript
export const revokeRole = mutation({
  args: {
    userId: v.id("users"),
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    await validateMinimumRole(ctx, currentUser._id, "admin");

    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .first();

    if (!role) throw new Error("Role not found");

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user_role", (q) =>
        q.eq("userId", args.userId).eq("roleId", role._id)
      )
      .first();

    if (!userRole) throw new Error("User does not have this role");

    // ... existing revocation logic ...

    await ctx.db.delete(userRole._id);

    // NOTIFY USER
    await ctx.runMutation(internal.notifications.create, {
      userId: args.userId,
      type: "role_revoked",
      title: `${role.displayName} role revoked`,
      body: `Your ${role.displayName} permissions have been removed`,
      relatedEntityId: role._id,
      relatedEntityType: "role",
      actionUrl: "/dashboard",
    });

    return { success: true };
  }
});
```

**Notification Fields**:
- **Type**: `role_revoked`
- **Title**: `"{roleDisplayName} role revoked"`
- **Body**: `"Your {roleDisplayName} permissions have been removed"`
- **Action URL**: `/dashboard`

---

## Summary Table

| Event | Notification Type | Recipients | Implementation Location |
|-------|-------------------|------------|------------------------|
| Team invitation | `team_invitation_received` | Invited user | `teams.ts` → `inviteUser` |
| Join request | `team_join_request_received` | Team captains | `teams.ts` → `requestToJoin` |
| Join approved | `join_request_approved` | Requester | `teams.ts` → `approveJoinRequest` |
| Join rejected | `join_request_rejected` | Requester | `teams.ts` → `rejectJoinRequest` |
| Member joined | `member_joined_team` | Existing members | `teams.ts` → `acceptInvitation`, `approveJoinRequest` |
| Member removed | `removed_from_team` | Removed user | `teams.ts` → `removeMember` |
| Member left | `member_left_team` | Remaining members | `teams.ts` → `removeMember` |
| Captain transferred | `captain_role_transferred_to` | New captain | `teams.ts` → `transferCaptain` |
| Captain transferred | `captain_role_transferred_from` | Old captain | `teams.ts` → `transferCaptain` |
| Team deleted | `team_deleted` | All members | `teams.ts` → `deleteTeam` |
| Submission approved | `submission_approved` | Captain + submitter | `submissions.ts` → `approve` |
| Submission rejected | `submission_rejected` | Captain + submitter | `submissions.ts` → `reject` |
| Teammate submitted | `teammate_submitted` | Team members (not submitter) | `submissions.ts` → `create` |
| Role granted | `role_granted` | User | `admin.ts` → `assignRole` |
| Role revoked | `role_revoked` | User | `admin.ts` → `revokeRole` |

---

## Implementation Checklist

For each trigger implementation:

1. ✅ Import `internal.notifications.create` at the top of the file
2. ✅ Add notification creation call after the main mutation logic
3. ✅ Use `await ctx.runMutation(internal.notifications.create, { ... })`
4. ✅ Ensure idempotency using proper `relatedEntityId` patterns
5. ✅ Include all required notification fields (userId, type, title)
6. ✅ Use descriptive titles and bodies with dynamic values (team names, user names, etc.)
7. ✅ Set appropriate `actionUrl` for navigation
8. ✅ Test trigger fires correctly and notification appears in user's list
9. ✅ Verify real-time updates work (notification appears without page refresh)
10. ✅ Add unit test covering the notification creation

---

## Error Handling in Triggers

Notification creation should not block the main mutation:

```typescript
// Recommended pattern: Log errors but don't throw
try {
  await ctx.runMutation(internal.notifications.create, { ... });
} catch (error) {
  console.error("Failed to create notification:", error);
  // Don't throw - allow main mutation to succeed
}
```

**Rationale**: If notification creation fails (e.g., database issue), the primary operation (team creation, submission approval) should still succeed. Users can be notified via other channels or retry.

---

## Testing Triggers

Use Vitest with `convex-test` to verify notifications are created:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

test("team invitation creates notification", async () => {
  const t = convexTest(schema);

  // Create users and team
  const inviterId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: "inviter@test.com",
      name: "Inviter",
      externalId: "inviter123",
    });
  });

  const inviteeId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: "invitee@test.com",
      name: "Invitee",
      externalId: "invitee123",
    });
  });

  // Invite user (should create notification)
  await t.mutation(api.teams.inviteUser, {
    teamId: /* ... */,
    invitedUserId: inviteeId,
    invitedEmail: "invitee@test.com",
  });

  // Verify notification created
  const notifications = await t.run(async (ctx) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_and_deleted", (q) => q.eq("userId", inviteeId))
      .collect();
  });

  expect(notifications).toHaveLength(1);
  expect(notifications[0].type).toBe("team_invitation_received");
  expect(notifications[0].title).toContain("invited to join");
});
```
