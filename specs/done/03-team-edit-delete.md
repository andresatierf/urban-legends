# Team Edit/Delete Functionality

**Priority:** CRITICAL
**Status:** Backend Missing, UI Stubbed
**Estimated Effort:** 1 day

## Problem Statement

Teams cannot be modified or deleted after creation. This prevents:

- Fixing typos in team names
- Changing team settings (visibility, max members)
- Removing abandoned or duplicate teams
- Cleaning up test data

The UI has "Edit" and "Delete" buttons in `TeamDetailsCard` component but they have empty onClick handlers (`onClick: () => {}`). No backend mutations exist for these operations.

## Current State

### What Exists

- `teams.create` mutation (admin-only)
- `teams.addMember` and `teams.removeMember` mutations
- UI buttons for Edit/Delete (non-functional)
- Team detail pages displaying team info

### What's Missing

- No `teams.update` mutation
- No `teams.delete` mutation
- No edit team form/dialog
- No delete confirmation dialog
- No permission checks for who can edit/delete

### Evidence

- Lines 53-63 in `src/components/teams/team-details-card.tsx`:

```typescript
{
  label: "Edit",
  onClick: () => {}, // Empty handler
},
{
  label: "Delete",
  onClick: () => {}, // Empty handler
}
```

## Requirements

### Functional Requirements

1. **Edit Team**

   - Team captains and admins can edit team details
   - Editable fields:
     - Team name (unique within tournament)
     - Visibility (public/private) - if implemented
     - Max members (within tournament constraints) - if implemented
   - Cannot change tournament association
   - Edit history logged (optional for MVP)

2. **Delete Team**

   - Team captains and admins can delete teams
   - Soft delete vs hard delete options:
     - **Soft delete (recommended):** Mark team as deleted, hide from lists
     - **Hard delete:** Remove team and all associations
   - Cannot delete team with submissions (must be handled)
   - Confirmation dialog required
   - All team members removed from team

3. **Permissions**

   - Team captain can edit/delete their team
   - Admins can edit/delete any team
   - Regular members cannot edit/delete

4. **Cascade Behavior**
   - Deleting team: what happens to submissions?
     - Option A: Delete all submissions (hard)
     - Option B: Keep submissions, mark team as deleted (recommended)
     - Option C: Prevent deletion if submissions exist
   - Team members automatically removed
   - Join requests cancelled
   - Invitations cancelled

### Non-Functional Requirements

- Edit/delete operations complete in <500ms
- Confirmation dialogs prevent accidental deletions
- Audit trail of changes (who edited what when)
- Graceful error handling if team has dependencies

## Database Schema Changes

### Modified Tables

```typescript
// convex/schema.ts

teams: defineTable({
  name: v.string(),
  tournamentId: v.id("tournaments"),
  createdBy: v.id("users"),
  points: v.number(),
  lastActivityAt: v.optional(v.string()),
  deletedAt: v.optional(v.string()), // NEW - for soft delete
  deletedBy: v.optional(v.id("users")), // NEW - who deleted it
});
```

### New Tables (Optional - for audit trail)

```typescript
// Optional: track edit history
teamEditHistory: defineTable({
  teamId: v.id("teams"),
  editedBy: v.id("users"),
  editedAt: v.string(),
  changes: v.object({
    field: v.string(),
    oldValue: v.any(),
    newValue: v.any(),
  }), // What changed
})
  .index("by_team", ["teamId"])
  .index("by_user", ["editedBy"]),
```

## Backend Implementation

### New Mutations

#### `teams.update`

```typescript
export const update = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    maxMembers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);

    if (!team) {
      throw new Error("Team not found");
    }

    // Check permissions: must be captain or admin
    const isAdmin = user.roles.includes("admin");
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    const isCaptain = membership?.role === "captain";

    if (!isAdmin && !isCaptain) {
      throw new Error("Only team captains and admins can edit teams");
    }

    // Validate name uniqueness if changed
    if (args.name && args.name !== team.name) {
      const existing = await ctx.db
        .query("teams")
        .withIndex("by_tournament_and_name", (q) =>
          q.eq("tournamentId", team.tournamentId).eq("name", args.name),
        )
        .first();

      if (existing) {
        throw new Error("Team name already exists in this tournament");
      }
    }

    // Validate maxMembers against tournament constraints
    if (args.maxMembers !== undefined) {
      const tournament = await ctx.db.get(team.tournamentId);
      if (tournament?.teamMaxSize && args.maxMembers > tournament.teamMaxSize) {
        throw new Error(
          `Max members cannot exceed tournament limit of ${tournament.teamMaxSize}`,
        );
      }
    }

    // Update team
    const updates: Partial<typeof team> = {};
    if (args.name) updates.name = args.name;
    if (args.visibility) updates.visibility = args.visibility;
    if (args.maxMembers !== undefined) updates.maxMembers = args.maxMembers;

    await ctx.db.patch(args.teamId, updates);

    // Optional: Create audit log entry
    // await ctx.db.insert("teamEditHistory", {
    //   teamId: args.teamId,
    //   editedBy: user._id,
    //   editedAt: new Date().toISOString(),
    //   changes: { ... },
    // });

    return { success: true };
  },
});
```

#### `teams.delete` (Soft Delete - Recommended)

```typescript
export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
    force: v.optional(v.boolean()), // Hard delete flag (admin only)
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);

    if (!team) {
      throw new Error("Team not found");
    }

    // Check permissions
    const isAdmin = user.roles.includes("admin");
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    const isCaptain = membership?.role === "captain";

    if (!isAdmin && !isCaptain) {
      throw new Error("Only team captains and admins can delete teams");
    }

    // Check for submissions
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (submissions.length > 0 && !args.force) {
      throw new Error(
        "Cannot delete team with submissions. Contact admin for force delete.",
      );
    }

    if (args.force && !isAdmin) {
      throw new Error("Only admins can force delete teams");
    }

    if (args.force) {
      // HARD DELETE (admin only, dangerous)
      // 1. Delete all team members
      const members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();

      for (const member of members) {
        await ctx.db.delete(member._id);
      }

      // 2. Delete all submissions (or mark as deleted)
      for (const submission of submissions) {
        await ctx.db.delete(submission._id);
        // Or: await ctx.db.patch(submission._id, { state: "deleted" });
      }

      // 3. Cancel join requests
      const joinRequests = await ctx.db
        .query("joinRequests")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();

      for (const request of joinRequests) {
        await ctx.db.patch(request._id, { status: "cancelled" });
      }

      // 4. Cancel invitations
      const invitations = await ctx.db
        .query("teamInvitations")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();

      for (const invitation of invitations) {
        await ctx.db.patch(invitation._id, { status: "cancelled" });
      }

      // 5. Delete team
      await ctx.db.delete(args.teamId);
    } else {
      // SOFT DELETE (recommended)
      await ctx.db.patch(args.teamId, {
        deletedAt: new Date().toISOString(),
        deletedBy: user._id,
      });

      // Remove all team members (they can't access deleted team)
      const members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();

      for (const member of members) {
        await ctx.db.delete(member._id);
      }

      // Cancel pending join requests
      const joinRequests = await ctx.db
        .query("joinRequests")
        .withIndex("by_team_and_status", (q) =>
          q.eq("teamId", args.teamId).eq("status", "pending"),
        )
        .collect();

      for (const request of joinRequests) {
        await ctx.db.patch(request._id, { status: "cancelled" });
      }

      // Cancel pending invitations
      const invitations = await ctx.db
        .query("teamInvitations")
        .withIndex("by_team_and_status", (q) =>
          q.eq("teamId", args.teamId).eq("status", "pending"),
        )
        .collect();

      for (const invitation of invitations) {
        await ctx.db.patch(invitation._id, { status: "cancelled" });
      }
    }

    return { success: true, deleted: true };
  },
});
```

### Modified Queries

#### `teams.list` (exclude soft-deleted teams)

```typescript
// Add filter to existing query:
.filter((q) => q.eq(q.field("deletedAt"), undefined))
```

#### `teams.get` (check for soft delete)

```typescript
// After fetching team, check:
if (team.deletedAt) {
  throw new Error("Team has been deleted");
}
```

## Frontend Implementation

### New Components

#### `EditTeamDialog`

**Location:** `src/components/teams/edit-team-dialog.tsx`

```typescript
interface EditTeamDialogProps {
  teamId: Id<"teams">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Features:
// - Dialog with form
// - Pre-filled with current team data
// - Name input (required)
// - Visibility selector (if implemented)
// - Max members input (if implemented)
// - Submit calls `teams.update` mutation
// - Toast on success
// - Error handling
```

#### `DeleteTeamDialog`

**Location:** `src/components/teams/delete-team-dialog.tsx`

```typescript
interface DeleteTeamDialogProps {
  teamId: Id<"teams">;
  teamName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Features:
// - Confirmation dialog
// - Warning message about consequences
// - "Type team name to confirm" input (for extra safety)
// - Cancel button (default focus)
// - Delete button (red, destructive)
// - Calls `teams.deleteTeam` mutation
// - Redirects to tournaments page on success
// - Shows error if team has submissions (suggests admin help)
```

### Modified Components

#### `TeamDetailsCard`

**Location:** `src/components/teams/team-details-card.tsx`

Replace empty onClick handlers:

```typescript
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

// In actions array:
{
  label: "Edit",
  onClick: () => setEditDialogOpen(true),
},
{
  label: "Delete",
  onClick: () => setDeleteDialogOpen(true),
}

// Add to component:
<EditTeamDialog
  teamId={team._id}
  open={editDialogOpen}
  onOpenChange={setEditDialogOpen}
/>
<DeleteTeamDialog
  teamId={team._id}
  teamName={team.name}
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
/>
```

### Permission Checks in UI

```typescript
// Only show Edit/Delete buttons if user is captain or admin
const canEdit = useCanEditTeam(teamId); // Custom hook

const actions = [
  ...(canEdit
    ? [
        { label: "Edit", onClick: () => setEditDialogOpen(true) },
        { label: "Delete", onClick: () => setDeleteDialogOpen(true) },
      ]
    : []),
  // other actions
];
```

### Custom Hook

```typescript
// src/hooks/useCanEditTeam.ts
export function useCanEditTeam(teamId: Id<"teams">) {
  const user = useUser();
  const membership = useQuery(api.teams.getUserMembership, {
    teamId,
    userId: user?._id,
  });

  if (!user) return false;
  if (user.roles.includes("admin")) return true;
  if (membership?.role === "captain") return true;

  return false;
}
```

## User Flows

### Flow 1: Edit Team Name

1. Captain navigates to team detail page
2. Clicks "Edit" button in actions menu
3. Dialog opens with current team data
4. Changes team name from "Dragons" to "Fire Dragons"
5. Clicks "Save"
6. Mutation validates name is unique
7. Team updated in database
8. Dialog closes
9. Toast: "Team updated successfully"
10. Page refreshes with new name

### Flow 2: Delete Team (No Submissions)

1. Captain decides to disband team
2. Clicks "Delete" button
3. Confirmation dialog appears:
   - "Are you sure you want to delete Fire Dragons?"
   - "This will remove all members and cannot be undone."
   - "Type 'Fire Dragons' to confirm"
4. Captain types team name
5. Clicks "Delete Team" (red button)
6. Mutation soft deletes team
7. All members removed
8. Join requests cancelled
9. User redirected to tournaments page
10. Toast: "Team deleted successfully"

### Flow 3: Delete Team (Has Submissions - Error)

1. Captain tries to delete team with submissions
2. Clicks "Delete" button
3. Types team name to confirm
4. Clicks "Delete Team"
5. Mutation throws error: "Cannot delete team with submissions"
6. Error shown in dialog:
   - "This team has 15 submissions and cannot be deleted."
   - "Contact an admin for assistance."
7. Captain closes dialog
8. Team remains active

### Flow 4: Admin Force Delete

1. Admin navigates to team with submissions
2. Clicks "Delete" button
3. Admin sees additional checkbox: "Force delete (removes submissions)"
4. Checks force delete option
5. Types team name to confirm
6. Clicks "Delete Team"
7. Hard delete mutation runs:
   - Deletes team members
   - Deletes submissions
   - Cancels requests/invitations
   - Deletes team
8. Success toast
9. Redirected to tournaments page

## Edge Cases

1. **Two captains try to edit simultaneously**

   - Last write wins (Convex handles atomicity)
   - Consider optimistic locking with version field (advanced)

2. **User deletes team while viewing team page**

   - Query returns "Team not found"
   - Show error page with "This team has been deleted"
   - Link to browse other teams

3. **Team deleted while user submitting for that team**

   - Submission creation fails with "Team not found"
   - User sees error message

4. **Rename team to existing name**

   - Validation fails
   - Error: "Team name 'Dragons' already exists in this tournament"

5. **Non-captain tries to edit via API**

   - Mutation rejects with permission error
   - 401 Unauthorized

6. **Deleted team still shows in old leaderboards**
   - Historical data preserved
   - Show "(deleted)" suffix on team name

## Testing Checklist

### Unit Tests

- [ ] Only captains and admins can update teams
- [ ] Cannot rename to duplicate name
- [ ] Cannot delete team with submissions (without force)
- [ ] Soft delete hides team from lists
- [ ] Hard delete removes all associations
- [ ] Join requests cancelled on delete
- [ ] Team members removed on delete

### Integration Tests

- [ ] Edit team → name updates in all views
- [ ] Delete team → redirects user correctly
- [ ] Delete team → members removed from roster
- [ ] Force delete → submissions also deleted
- [ ] Non-captain cannot edit → shows error

### UI Tests

- [ ] Edit dialog pre-fills current data
- [ ] Delete confirmation requires typing team name
- [ ] Toast notifications appear on success
- [ ] Error messages display correctly
- [ ] Buttons hidden for non-captains
- [ ] Loading states during mutations

## Security Considerations

1. **Permission Checks**

   - All mutations verify user is captain or admin
   - UI also hides buttons for non-authorized users

2. **Name Validation**

   - Prevent SQL injection (not applicable with Convex)
   - Sanitize special characters
   - Length limits (max 50 characters)

3. **Cascade Behavior**

   - Soft delete prevents data loss
   - Force delete requires admin role
   - Audit trail of who deleted what

4. **Rate Limiting**
   - Prevent spam deletion/recreation of teams
   - Consider cooldown period (optional)

## Migration Plan

1. **Schema Update**

   - Add `deletedAt` and `deletedBy` fields to teams table
   - Deploy schema changes (non-breaking)

2. **Backend Implementation**

   - Implement `teams.update` mutation
   - Implement `teams.deleteTeam` mutation
   - Update existing queries to filter deleted teams
   - Test in Convex dashboard

3. **Frontend Implementation**

   - Create EditTeamDialog component
   - Create DeleteTeamDialog component
   - Update TeamDetailsCard with working handlers
   - Test locally

4. **Deployment**

   - Deploy backend changes first
   - Deploy frontend changes
   - Test in production with test team

5. **Monitoring**
   - Watch for errors in mutations
   - Monitor deletion rates (should be low)
   - Check for orphaned data

## Success Metrics

- Zero unauthorized edit/delete attempts bypass permissions
- <5% of teams deleted within 24 hours of creation (suggests better UX needed)
- 95%+ of deletes are soft deletes (not force)
- Edit operations complete in <500ms (p95)
- Zero data loss incidents from deletions

## Future Enhancements

- Restore deleted teams (within 30 days)
- Team archive feature (instead of delete)
- Transfer team ownership (change captain)
- Bulk edit teams (admin only)
- Edit history view (audit log UI)
- Email notification to members when team deleted
- Team merge functionality (combine two teams)
