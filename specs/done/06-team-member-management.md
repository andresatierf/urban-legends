# Team Member Management UI

**Priority:** HIGH
**Status:** Backend Complete, UI Missing
**Estimated Effort:** 1-2 days

## Problem Statement

Team captains cannot manage their team rosters from the UI. While backend mutations exist (`teams.addMember`, `teams.removeMember`), there is no UI to:

- Add members to team by email
- Remove members from team
- View member roles (captain vs. member)
- Transfer captaincy
- Promote members to co-captain (future)

The team detail page shows a list of members but provides no management capabilities.

## Current State

### What Exists

- `teams.addMember` mutation (admin-only currently)
- `teams.removeMember` mutation (admin-only currently)
- `teams.listMembers` query
- Team detail page displays members
- Basic member list UI

### What's Missing

- UI to add members to team
- UI to remove members from team
- Role badges showing captain vs. member
- Permission checks (captains should be able to manage)
- Invite by email form
- Transfer captaincy UI
- Member count validation (min/max team size)

### Evidence

- Backend mutations exist but no UI calls them
- Team detail page shows members but no actions
- "TODO: add members if provided" in `teams.create` (line 203 of `convex/teams.ts`)

## Requirements

### Functional Requirements

1. **View Team Roster**
   - Display all team members with names and avatars
   - Show role badges (Captain, Member)
   - Display join date
   - Show member activity stats (submissions contributed)

2. **Add Members**
   - Captain can add members by email
   - Validate user exists in system
   - Validate user not already on team
   - Validate team size constraints (min/max)
   - Send notification to added user

3. **Remove Members**
   - Captain can remove members (except captain)
   - Members can remove themselves (leave team)
   - Confirmation required
   - Cannot remove if it would violate min team size
   - Removed user loses access to team

4. **Manage Captaincy**
   - Captain can transfer captaincy to another member
   - Confirmation required
   - Original captain becomes regular member
   - New captain gets full permissions

5. **Permissions**
   - Team captain can manage all members
   - Admins can manage any team
   - Regular members can only leave team (not remove others)
   - Cannot perform actions that violate tournament constraints

### Non-Functional Requirements

- Member operations complete in <500ms
- Real-time roster updates (Convex reactivity)
- Validation before destructive operations
- Clear error messages for constraint violations
- Mobile-friendly UI

## Database Schema Changes

No schema changes required. Current schema supports all features:

```typescript
// Existing schema
teamMembers: defineTable({
  teamId: v.id("teams"),
  userId: v.id("users"),
  role: v.union(v.literal("member"), v.literal("captain")),
})
  .index("by_team", ["teamId"])
  .index("by_user", ["userId"])
  .index("by_team_and_user", ["teamId", "userId"]),
```

Optional additions for enhanced features:

```typescript
// Optional: Track when members joined
teamMembers: defineTable({
  teamId: v.id("teams"),
  userId: v.id("users"),
  role: v.union(v.literal("member"), v.literal("captain")),
  joinedAt: v.optional(v.string()), // NEW
  invitedBy: v.optional(v.id("users")), // NEW
});
```

## Backend Implementation

### Modified Mutations (Update Permissions)

#### `teams.addMember` (allow captains, not just admins)

```typescript
export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);

    if (!team) {
      throw new Error("Team not found");
    }

    // Check permissions: must be captain or admin
    const isAdmin = currentUser.roles.includes("admin");
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", currentUser._id),
      )
      .first();

    const isCaptain = membership?.role === "captain";

    if (!isAdmin && !isCaptain) {
      throw new Error("Only team captains and admins can add members");
    }

    // Find user by email
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!targetUser) {
      throw new Error(`User with email ${args.email} not found`);
    }

    // Check if user already in team
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", targetUser._id),
      )
      .first();

    if (existingMember) {
      throw new Error("User is already a member of this team");
    }

    // Check team size constraints
    const tournament = await ctx.db.get(team.tournamentId);
    const currentMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (
      tournament?.teamMaxSize &&
      currentMembers.length >= tournament.teamMaxSize
    ) {
      throw new Error(`Team is full (max ${tournament.teamMaxSize} members)`);
    }

    // Check if user already on another team in this tournament
    const userTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", targetUser._id))
      .collect();

    for (const userTeam of userTeams) {
      const otherTeam = await ctx.db.get(userTeam.teamId);
      if (otherTeam?.tournamentId === team.tournamentId) {
        throw new Error("User is already on another team in this tournament");
      }
    }

    // Add member
    await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      userId: targetUser._id,
      role: "member",
      joinedAt: new Date().toISOString(),
      invitedBy: currentUser._id,
    });

    // TODO: Send notification to user

    return { success: true, userId: targetUser._id };
  },
});
```

#### `teams.removeMember` (allow captains, not just admins)

```typescript
export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);

    if (!team) {
      throw new Error("Team not found");
    }

    // Get target member
    const targetMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.userId),
      )
      .first();

    if (!targetMember) {
      throw new Error("User is not a member of this team");
    }

    // Check permissions
    const isAdmin = currentUser.roles.includes("admin");
    const currentMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", currentUser._id),
      )
      .first();

    const isCaptain = currentMembership?.role === "captain";
    const isSelf = currentUser._id === args.userId;

    // Permission logic:
    // - Admin can remove anyone
    // - Captain can remove anyone except captain
    // - Member can remove self only
    if (!isAdmin && !isCaptain && !isSelf) {
      throw new Error("You don't have permission to remove this member");
    }

    if (targetMember.role === "captain" && !isAdmin) {
      throw new Error("Cannot remove team captain. Transfer captaincy first.");
    }

    // Check min team size
    const tournament = await ctx.db.get(team.tournamentId);
    const currentMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (
      tournament?.teamMinSize &&
      currentMembers.length <= tournament.teamMinSize
    ) {
      throw new Error(
        `Cannot remove member. Team must have at least ${tournament.teamMinSize} members.`,
      );
    }

    // Remove member
    await ctx.db.delete(targetMember._id);

    // TODO: Notify removed user

    return { success: true };
  },
});
```

### New Mutations

#### `teams.transferCaptaincy`

```typescript
export const transferCaptaincy = mutation({
  args: {
    teamId: v.id("teams"),
    newCaptainId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);

    if (!team) {
      throw new Error("Team not found");
    }

    // Verify current user is captain or admin
    const isAdmin = currentUser.roles.includes("admin");
    const currentMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", currentUser._id),
      )
      .first();

    const isCaptain = currentMembership?.role === "captain";

    if (!isAdmin && !isCaptain) {
      throw new Error("Only team captain or admin can transfer captaincy");
    }

    // Verify new captain is team member
    const newCaptainMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.newCaptainId),
      )
      .first();

    if (!newCaptainMembership) {
      throw new Error("New captain must be a team member");
    }

    if (newCaptainMembership.role === "captain") {
      throw new Error("User is already the team captain");
    }

    // Get current captain
    const currentCaptain = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .first();

    if (!currentCaptain) {
      throw new Error("Team has no captain");
    }

    // Update both members
    await ctx.db.patch(currentCaptain._id, { role: "member" });
    await ctx.db.patch(newCaptainMembership._id, { role: "captain" });

    // TODO: Notify both users

    return { success: true };
  },
});
```

### Enhanced Queries

#### `teams.listMembersWithDetails`

```typescript
export const listMembersWithDetails = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);

        // Count submissions by this user for this team
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_user_and_team", (q) =>
            q.eq("userId", member.userId).eq("teamId", args.teamId),
          )
          .collect();

        const approvedSubmissions = submissions.filter(
          (s) => s.state === "approved",
        );

        return {
          _id: member._id,
          userId: member.userId,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "",
          role: member.role,
          joinedAt: member.joinedAt,
          submissionCount: submissions.length,
          approvedSubmissionCount: approvedSubmissions.length,
        };
      }),
    );

    // Sort: captain first, then by join date
    return membersWithDetails.sort((a, b) => {
      if (a.role === "captain") return -1;
      if (b.role === "captain") return 1;
      return (a.joinedAt || "").localeCompare(b.joinedAt || "");
    });
  },
});
```

## Frontend Implementation

### New Components

#### `TeamMembersList`

**Location:** `src/components/teams/team-members-list.tsx`

```typescript
interface TeamMembersListProps {
  teamId: Id<"teams">;
  canManage: boolean; // Is user captain or admin?
}

// Features:
// - Table/card list of members
// - User avatar + name + email
// - Role badge (Captain/Member)
// - Join date
// - Submission count
// - Action buttons (Remove, Transfer) for captains
// - "Add Member" button at top
```

#### `AddMemberDialog`

**Location:** `src/components/teams/add-member-dialog.tsx`

```typescript
interface AddMemberDialogProps {
  teamId: Id<"teams">;
  currentMemberCount: number;
  maxMembers?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Features:
// - Dialog with email input form
// - Email validation
// - Shows if user exists (async lookup)
// - Shows warning if team nearly full
// - Calls `teams.addMember` mutation
// - Success toast
// - Error handling
```

#### `RemoveMemberDialog`

**Location:** `src/components/teams/remove-member-dialog.tsx`

```typescript
interface RemoveMemberDialogProps {
  teamId: Id<"teams">;
  member: {
    userId: Id<"users">;
    userName: string;
    role: "captain" | "member";
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Features:
// - Confirmation dialog
// - Warning if removing captain (suggest transfer)
// - "Are you sure you want to remove [Name]?"
// - Calls `teams.removeMember` mutation
// - Success toast
// - Error handling (min team size, captain removal)
```

#### `TransferCaptaincyDialog`

**Location:** `src/components/teams/transfer-captaincy-dialog.tsx`

```typescript
interface TransferCaptaincyDialogProps {
  teamId: Id<"teams">;
  currentCaptain: string;
  members: Array<{ userId: Id<"users">; userName: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Features:
// - Dialog with member dropdown
// - Select new captain from members
// - Warning: "You will lose captain privileges"
// - Type current captain name to confirm
// - Calls `teams.transferCaptaincy` mutation
// - Success toast and page refresh
```

#### `MemberRoleBadge`

**Location:** `src/components/teams/member-role-badge.tsx`

```typescript
interface MemberRoleBadgeProps {
  role: "captain" | "member";
}

// Features:
// - Badge with icon
// - Captain: Crown icon, gold/yellow background
// - Member: User icon, blue background
// - Tooltip on hover explaining role
```

### Modified Components

#### `TeamDetailsCard`

**Location:** `src/components/teams/team-details-card.tsx`

Add team roster section:

```typescript
// Below team info, add:
<div className="mt-6">
  <h3 className="text-lg font-semibold mb-4">Team Members</h3>
  <TeamMembersList
    teamId={team._id}
    canManage={isCaptainOrAdmin}
  />
</div>
```

### Modified Pages

#### `/teams/[id]/page.tsx`

**Location:** `src/app/(all)/teams/[id]/page.tsx`

Enhance to show member management:

```typescript
export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const user = useUser();
  const team = useQuery(api.teams.get, { teamId: params.id as Id<"teams"> });
  const members = useQuery(api.teams.listMembersWithDetails, {
    teamId: params.id as Id<"teams">,
  });

  const currentMember = members?.find((m) => m.userId === user?._id);
  const isCaptain = currentMember?.role === "captain";
  const isAdmin = user?.roles.includes("admin");
  const canManage = isCaptain || isAdmin;

  return (
    <div>
      <TeamDetailsCard team={team} />

      {/* Member Management Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Team Roster ({members?.length || 0} members)</CardTitle>
            {canManage && (
              <Button onClick={() => setAddMemberOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TeamMembersList
            teamId={params.id as Id<"teams">}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

## User Flows

### Flow 1: Captain Adds Member

1. Captain navigates to team detail page
2. Clicks "Add Member" button
3. Dialog opens with email input
4. Types member's email: "<alice@example.com>"
5. System validates email format
6. System checks if user exists (shows checkmark if found)
7. Captain clicks "Add"
8. Mutation validates:
   - Team not full
   - User not on another team in tournament
   - User exists
9. Member added to team
10. Toast: "Alice added to team"
11. Alice appears in roster immediately
12. Alice receives notification (future)

### Flow 2: Member Leaves Team

1. Member navigates to their team page
2. Clicks "Leave Team" button (own row in roster)
3. Confirmation dialog: "Are you sure you want to leave Dragons?"
4. Clicks "Leave"
5. Mutation validates:
   - Would not violate min team size
   - User is not captain (suggests transfer first)
6. Member removed from teamMembers
7. Redirected to tournaments page
8. Toast: "You left Dragons"
9. Cannot access team anymore

### Flow 3: Captain Removes Member

1. Captain viewing team roster
2. Sees member "Bob" with "Remove" button
3. Clicks "Remove" button
4. Confirmation dialog:
   - "Remove Bob from Dragons?"
   - "Bob will lose access to this team"
5. Captain clicks "Confirm"
6. Mutation runs: `teams.removeMember`
7. Bob removed from roster
8. Bob row disappears
9. Toast: "Bob removed from team"
10. Bob notified (future)

### Flow 4: Transfer Captaincy

1. Captain decides to step down
2. Clicks "Transfer Captaincy" in actions menu
3. Dialog opens with member dropdown
4. Selects "Alice" as new captain
5. Warning: "You will become a regular member"
6. Types "Dragons" to confirm
7. Clicks "Transfer"
8. Mutation updates both roles:
   - Current captain → member
   - Alice → captain
9. Page refreshes
10. Alice now has crown badge
11. Original captain loses management buttons
12. Toast: "Captaincy transferred to Alice"

### Flow 5: Error - Team Full

1. Captain tries to add 6th member to 5-person team
2. Types email and clicks "Add"
3. Mutation rejects: "Team is full (max 5 members)"
4. Error dialog:
   - "Team is full"
   - "Maximum members: 5"
   - "Remove a member to add new ones"
5. Add operation cancelled
6. No changes to roster

## UI/UX Considerations

### Member List Layout

**Desktop:**

```
┌─────────────────────────────────────────────┐
│ 👤 Alice Johnson          [Captain]  [Remove]│
│    alice@example.com      15 submissions    │
│    Joined: Nov 1, 2024                      │
├─────────────────────────────────────────────┤
│ 👤 Bob Smith              [Member]   [Remove]│
│    bob@example.com        12 submissions    │
│    Joined: Nov 2, 2024                      │
└─────────────────────────────────────────────┘
```

**Mobile:**

```
┌──────────────────────────┐
│ 👤 Alice Johnson         │
│ [Captain]                │
│ alice@example.com        │
│ 15 submissions           │
│ [Remove]                 │
├──────────────────────────┤
│ 👤 Bob Smith             │
│ [Member]                 │
│ bob@example.com          │
│ 12 submissions           │
│ [Remove]                 │
└──────────────────────────┘
```

### Role Badge Design

```typescript
<Badge variant="captain">
  <Crown className="w-3 h-3 mr-1" />
  Captain
</Badge>

<Badge variant="member">
  <User className="w-3 h-3 mr-1" />
  Member
</Badge>
```

### Permission-Based UI

- Captain sees: Add Member, Remove buttons, Transfer Captaincy
- Member sees: Only "Leave Team" button (on their own row)
- Admin sees: Full management capabilities
- Non-member sees: Read-only roster

## Testing Checklist

### Unit Tests

- [ ] Only captains and admins can add members
- [ ] Only captains and admins can remove members
- [ ] Members can remove themselves (leave)
- [ ] Cannot remove captain without transfer
- [ ] Cannot exceed max team size
- [ ] Cannot go below min team size
- [ ] User cannot join multiple teams in same tournament

### Integration Tests

- [ ] Add member → User appears in roster
- [ ] Remove member → User disappears from roster
- [ ] Transfer captaincy → Roles swap correctly
- [ ] Leave team → User redirected
- [ ] UI buttons hidden for non-captains

### UI Tests

- [ ] Role badges display correctly
- [ ] Add member dialog validates email
- [ ] Remove confirmation appears
- [ ] Toast notifications show
- [ ] Loading states render
- [ ] Error messages clear and helpful

## Security Considerations

1. **Permission Validation**
   - All mutations check user is captain or admin
   - Frontend also hides UI (defense in depth)

2. **Email Validation**
   - Validate email format client-side
   - Validate user exists server-side
   - Prevent adding non-existent users

3. **Team Constraints**
   - Enforce min/max team size
   - Prevent users on multiple teams in same tournament
   - Prevent orphaned teams (at least 1 member)

4. **Captain Protection**
   - Cannot remove captain directly
   - Must transfer captaincy first
   - Ensures team always has leadership

## Edge Cases

1. **Last member leaves team**
   - Team becomes empty
   - Options:
     - Auto-delete team
     - Mark team as inactive
     - Prevent if min size > 0

2. **Captain removed by admin**
   - Auto-promote oldest member
   - Or require admin to transfer first

3. **User deleted while in team**
   - TeamMember records orphaned
   - Clean up via scheduled job

4. **Concurrent member additions**
   - Race condition: team becomes over-full
   - Validation catches, rejects one request

5. **Member added twice simultaneously**
   - Unique index on (teamId, userId) prevents duplicates
   - Second request fails gracefully

## Migration Plan

1. **Update Backend Permissions**
   - Modify `addMember` to allow captains
   - Modify `removeMember` to allow captains
   - Implement `transferCaptaincy` mutation
   - Test in Convex dashboard

2. **Add Optional Schema Fields**
   - Add `joinedAt` to teamMembers (optional)
   - Add `invitedBy` to teamMembers (optional)
   - Backfill existing records with nulls
   - Deploy schema changes

3. **Build UI Components**
   - Create TeamMembersList component
   - Create AddMemberDialog component
   - Create RemoveMemberDialog component
   - Create TransferCaptaincyDialog component
   - Test in isolation

4. **Integrate with Pages**
   - Update team detail page
   - Add member management section
   - Wire up mutations
   - Test end-to-end

5. **Deploy & Monitor**
   - Deploy to production
   - Monitor for errors
   - Watch for constraint violations
   - Gather user feedback

## Success Metrics

- 90%+ of member additions successful on first try
- <5% of teams violate size constraints
- Zero unauthorized member removals
- 95%+ of captains successfully manage teams without help
- Average time to add member: <30 seconds

## Future Enhancements

- Bulk member import (CSV upload)
- Co-captain role (shared management)
- Member invitations (request-to-join flow)
- Member profiles (bio, stats, achievements)
- Team chat/messaging
- Activity log (who joined/left when)
- Member permissions (who can submit, who can approve)
- Waitlist for full teams
- Member search/filter in roster
