# Submission Detail Page

**Priority:** HIGH
**Status:** Planning
**Estimated Effort:** 2-3 days

## Problem Statement

Currently, the submission detail page at `/submissions/[submissionId]` only displays an edit form without showing comprehensive information about the submission. Users (team members, captains, admins) need a dedicated view to:

- Review submission details (date, description, tier, points earned)
- See submission status and approval/rejection information
- Understand who submitted the activity and who participated
- View tournament and team context
- Access approval management controls (admins only)
- Navigate to related entities (team, tournament, user profiles)

This feature addresses the need for transparency in the submission approval workflow and provides a single source of truth for submission information.

## Current State

### What Exists

**Submission Schema** (`/home/andre/dev/urban-legends/convex/schema.ts`, lines 67-92):

```typescript
submissions: defineTable({
  userId: v.id("users"),
  teamId: v.id("teams"),
  tournamentId: v.id("tournaments"),
  date: v.string(),
  description: v.optional(v.string()),
  teammates: v.array(v.id("users")),
  state: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("deleted"),
  ),
  createdBy: v.id("users"),
  managedBy: v.optional(v.id("users")), // Admin who approved/rejected/deleted
  tier: v.union(v.literal("base"), v.literal("advanced")),
  pointsEarned: v.number(), // Calculated when approved
});
```

**Existing Backend Functions** (`/home/andre/dev/urban-legends/convex/submissions.ts`):

- `get` (line 88): Fetches a submission by ID but only returns it if the current user is the owner
- `getById` (line 194): Fetches submission by ID with basic auth check
- `approve` (line 311): Admin-only mutation with scoring logic
- `reject` (line 396): Admin-only mutation with point deduction
- `remove` (line 203): Mutation to mark submission as deleted

**Existing UI Components**:

- `SubmissionsDataTable` (`/home/andre/dev/urban-legends/src/components/submissions/submissions-data-table.tsx`): Shows submissions in table format with actions
- `DetailsCard` (`/home/andre/dev/urban-legends/src/components/details-card.tsx`): Reusable card component for displaying entity details with actions
- `Badge` component with state variants (approved, pending, rejected, deleted)

**Current Page** (`/home/andre/dev/urban-legends/src/app/(all)/submissions/[submissionId]/page.tsx`):

- Currently only shows edit form via `UpsertSubmissionFormDialog`
- Uses `api.submissions.get` query which restricts access to submission owner only
- No comprehensive detail view implemented

### What's Missing

- Comprehensive detail view showing all submission information
- Display of related entities (team name, tournament name, submitter info, teammate details)
- Approval/rejection metadata (who managed it, when)
- Admin-specific controls (approve, reject actions)
- Permission logic allowing team members and admins to view submissions (not just owner)
- Navigation to related entities
- Point calculation display with tier information
- Submission timeline/history

### Evidence

**Permission Patterns**:

- Admin validation: `/home/andre/dev/urban-legends/convex/users.ts`, lines 140-147 (`validateIsAdmin`)
- Team membership checks: `/home/andre/dev/urban-legends/convex/submissions.ts`, lines 116-126
- Role-based access: User object includes `roleNames` array with roles like "admin"

**Detail Page Patterns**:

- Team detail page: `/home/andre/dev/urban-legends/src/app/(all)/teams/[teamId]/page.tsx`
  - Uses multiple queries to fetch related data
  - Displays team card with actions based on user role
  - Shows member lists and related information
- Tournament detail page: `/home/andre/dev/urban-legends/src/app/(all)/tournaments/[tournamentId]/page.tsx`
  - Similar pattern with DetailsCard component
  - Conditional rendering based on user permissions

**Flexible Scoring System** (`/home/andre/dev/urban-legends/convex/submissions.ts`, lines 345-369):

- Points calculated based on tier (base/advanced)
- Team exercise detection using participation rate threshold
- Different point values for individual vs team exercises
- Scoring config stored in tournament

## Requirements

### Functional Requirements

1. **Submission Information Display**
   - User story: "As a user, I want to view complete submission details so that I understand what was submitted and its current status"
   - Display: date, description, tier (base/advanced), state (badge), points earned
   - Show submission metadata: creation time, last update time (if available)
   - Display team exercise vs individual exercise classification

2. **Submitter and Participant Information**
   - User story: "As a team member, I want to see who submitted an activity and who participated so that I can verify team participation"
   - Display submitter's name and email
   - List all teammates who participated in the activity
   - Link to user profiles (if such pages exist or will be created)

3. **Tournament and Team Context**
   - User story: "As a user, I want to see which team and tournament this submission belongs to so that I have full context"
   - Display team name with link to team detail page
   - Display tournament name with link to tournament detail page
   - Show tournament scoring configuration relevant to this submission

4. **Approval/Rejection Metadata**
   - User story: "As a team member, I want to see who approved or rejected my submission and when so that I understand the review process"
   - For approved submissions: show who approved, when (if timestamp available), points awarded
   - For rejected submissions: show who rejected, when (if timestamp available)
   - For deleted submissions: show who deleted, when (if timestamp available)
   - Display any comments or reason (future enhancement - not in current schema)

5. **Admin Actions**
   - User story: "As an admin, I want to approve, reject, or delete submissions from the detail page so that I can manage submissions efficiently"
   - Show Approve button for pending submissions (admins only)
   - Show Reject button for pending submissions (admins only)
   - Show Delete button for approved/pending submissions (admins and submission owner)
   - Show re-approve capability (if submission was previously rejected)
   - Confirmation dialogs for destructive actions

6. **Permission-Based Access Control**
   - User story: "As a team captain, I want to view all my team's submissions so that I can monitor team activity"
   - Allow access to submission if:
     - User is the submission owner, OR
     - User is a member of the submission's team, OR
     - User is an admin
   - Display different actions based on user role

7. **Edit Access**
   - User story: "As a submitter, I want to edit my pending submission from the detail page so that I can correct mistakes"
   - Show Edit button for submission owner (if submission is not approved)
   - Navigate to edit form or open edit dialog

### Non-Functional Requirements

- **Performance**: Page loads in <1 second with efficient query resolution
- **Security**: Strict permission checks on backend query to prevent unauthorized access
- **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
- **Mobile**: Fully responsive design, works well on small screens
- **Real-time Updates**: Use Convex subscriptions to reflect approval/rejection changes immediately

## Database Schema Changes

**No schema changes required.** The existing `submissions` table has all necessary fields:

- `managedBy`: Already tracks which admin approved/rejected/deleted the submission
- `state`: Tracks approval status
- `pointsEarned`: Calculated on approval
- `tier`: Base or advanced classification
- Related IDs: `userId`, `teamId`, `tournamentId`, `teammates`

**Future Enhancement**: Consider adding these fields for richer functionality:

- `managedAt: v.optional(v.string())` - Timestamp when submission was approved/rejected
- `rejectionReason: v.optional(v.string())` - Admin's reason for rejection
- `_creationTime` - Convex automatically provides this

## Backend Implementation

### New Queries

#### `submissions.getDetail`

**Purpose:** Fetch comprehensive submission details with related entities for the detail page

**Parameters:**

- `submissionId: Id<"submissions">` - The submission to retrieve

**Returns:**

```typescript
{
  submission: Doc<"submissions">;
  team: Doc<"teams"> | null;
  tournament: Doc<"tournaments"> | null;
  submitter: Doc<"users"> & { roles: Doc<"roles">[]; roleNames: string[] };
  teammates: (Doc<"users"> & { roles: Doc<"roles">[]; roleNames: string[] })[];
  managedByUser: (Doc<"users"> & { roles: Doc<"roles">[]; roleNames: string[] }) | null;
  isTeamExercise: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canDelete: boolean;
}
```

**Permission:**

- User must be authenticated
- User must be either:
  - The submission owner (userId matches)
  - A member of the submission's team
  - An admin

**Implementation:**

```typescript
export const getDetail = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const isAdmin = currentUser.roleNames.includes("admin");

    // Fetch submission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check if user is team member
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", submission.teamId).eq("userId", currentUser._id),
      )
      .first();

    // Permission check: must be owner, team member, or admin
    const isOwner = submission.userId === currentUser._id;
    const isTeamMember = !!membership;
    if (!isOwner && !isTeamMember && !isAdmin) {
      throw new Error("You do not have permission to view this submission");
    }

    // Fetch related entities
    const [team, tournament, submitter] = await Promise.all([
      ctx.db.get(submission.teamId),
      ctx.db.get(submission.tournamentId),
      ctx.db.get(submission.userId),
    ]);

    if (!submitter) {
      throw new Error("Submitter not found");
    }

    // Fetch submitter with roles
    const submitterRoles = await getRolesForUser(ctx, submitter._id);
    const submitterWithRoles = {
      ...submitter,
      roles: submitterRoles,
      roleNames: submitterRoles.map(({ name }) => name),
    };

    // Fetch teammates
    const teammates = await Promise.all(
      submission.teammates.map(async (teammateId) => {
        const user = await ctx.db.get(teammateId);
        if (!user) return null;
        const roles = await getRolesForUser(ctx, user._id);
        return {
          ...user,
          roles,
          roleNames: roles.map(({ name }) => name),
        };
      }),
    );
    const validTeammates = teammates.filter(
      (t): t is NonNullable<typeof t> => t !== null,
    );

    // Fetch managedBy user if exists
    let managedByUser = null;
    if (submission.managedBy) {
      const managedUser = await ctx.db.get(submission.managedBy);
      if (managedUser) {
        const roles = await getRolesForUser(ctx, managedUser._id);
        managedByUser = {
          ...managedUser,
          roles,
          roleNames: roles.map(({ name }) => name),
        };
      }
    }

    // Calculate if this is a team exercise
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", submission.teamId))
      .collect();
    const totalTeamMembers = teamMembers.length;
    const participantCount = Math.min(
      totalTeamMembers,
      submission.teammates.length + 1,
    );
    const participationRate =
      totalTeamMembers > 0 ? participantCount / totalTeamMembers : 0;
    const scoringConfig = tournament?.scoringConfig || {
      individualPoints: { base: 1, advanced: 1 },
      teamExercisePoints: { base: 1, advanced: 1 },
      teamExerciseThreshold: 0.5,
    };
    const isTeamExercise =
      participationRate >= scoringConfig.teamExerciseThreshold;

    // Calculate permissions
    const canEdit = isOwner && submission.state !== "approved";
    const canApprove = isAdmin && submission.state === "pending";
    const canReject = isAdmin && submission.state === "pending";
    const canDelete =
      (isAdmin || isOwner) &&
      submission.state !== "deleted" &&
      submission.state !== "rejected";

    return {
      submission,
      team,
      tournament,
      submitter: submitterWithRoles,
      teammates: validTeammates,
      managedByUser,
      isTeamExercise,
      canEdit,
      canApprove,
      canReject,
      canDelete,
    };
  },
});
```

**Edge Cases:**

- Submission not found: Throw error
- Team/tournament deleted but submission exists: Handle null gracefully in UI
- Teammates deleted from system: Filter out null users
- No managedBy user (pending submissions): Show "Pending review" instead
- User not authorized: Throw permission error

**Helper Function Import:**

```typescript
// Need to import or define getRolesForUser
// This function already exists in users.ts but is not exported
// Either export it or duplicate the logic
```

## Frontend Implementation

### Modified Query

**Location:** `convex/submissions.ts`

**Changes:**

- Add the new `getDetail` query as documented above
- Export helper function `getRolesForUser` from `users.ts` or duplicate in submissions.ts

### New Components

#### `SubmissionDetailsCard`

**Location:** `src/components/submissions/submission-details-card.tsx`

**Purpose:** Display comprehensive submission information in a card format similar to TeamDetailsCard and TournamentDetailsCard

**Props:**

```typescript
interface SubmissionDetailsCardProps {
  submissionId: Id<"submissions">;
  className?: string;
}
```

**Features:**

- Displays submission date, description, tier, state (badge), points earned
- Shows team exercise classification
- Links to team and tournament pages
- Displays submitter information with teammate list
- Shows approval/rejection metadata (who managed, when if available)
- Action menu with Edit, Approve, Reject, Delete buttons (role-based)
- Uses DetailsCard component for consistent styling

**UI Patterns:**

- Uses `DetailsCard` from `src/components/details-card.tsx`
- Uses `Badge` component for state display
- Uses `Button` and `DropdownMenu` for actions
- Follows team-details-card.tsx pattern

**Code Structure:**

```typescript
"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, Pencil, Trash2, Trophy, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DetailsCard } from "@/components/details-card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { UpsertSubmissionFormDialog } from "../form/upsert-submission-form";

interface SubmissionDetailsCardProps {
  submissionId: Id<"submissions">;
  className?: string;
}

export function SubmissionDetailsCard({
  submissionId,
  className,
}: SubmissionDetailsCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch submission details
  const data = useQuery(
    api.submissions.getDetail,
    submissionId ? { submissionId } : "skip"
  );

  // Mutations
  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);
  const removeSubmission = useMutation(api.submissions.remove);

  const handleApprove = useCallback(async () => {
    try {
      await approveSubmission({ submissionId });
      toast.success("Submission approved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve submission"
      );
    }
  }, [approveSubmission, submissionId]);

  const handleReject = useCallback(async () => {
    try {
      await rejectSubmission({ submissionId });
      toast.success("Submission rejected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject submission"
      );
    }
  }, [rejectSubmission, submissionId]);

  const handleDelete = useCallback(async () => {
    try {
      await removeSubmission({ submissionId });
      toast.success("Submission deleted successfully");
      router.push("/submissions");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete submission"
      );
    }
  }, [removeSubmission, submissionId, router]);

  // Build details array
  const details = useMemo(() => {
    if (!data) return [];

    return [
      {
        key: "Date",
        value: data.submission.date,
      },
      {
        key: "Status",
        value: <Badge variant={data.submission.state}>{data.submission.state}</Badge>,
      },
      {
        key: "Tier",
        value: (
          <Badge variant={data.submission.tier === "advanced" ? "default" : "secondary"}>
            {data.submission.tier}
          </Badge>
        ),
      },
      {
        key: "Exercise Type",
        value: data.isTeamExercise ? "Team Exercise" : "Individual Exercise",
      },
      {
        key: "Points Earned",
        value: `${data.submission.pointsEarned} pts`,
      },
      {
        key: "Team",
        value: data.team ? (
          <Link
            href={`/teams/${data.team._id}`}
            className="text-blue-600 hover:underline"
          >
            {data.team.name}
          </Link>
        ) : (
          "Unknown"
        ),
      },
      {
        key: "Tournament",
        value: data.tournament ? (
          <Link
            href={`/tournaments/${data.tournament._id}`}
            className="text-blue-600 hover:underline"
          >
            {data.tournament.name}
          </Link>
        ) : (
          "Unknown"
        ),
      },
      {
        key: "Submitted By",
        value: `${data.submitter.name} (${data.submitter.email})`,
      },
      {
        key: "Teammates",
        value:
          data.teammates.length > 0
            ? data.teammates.map((t) => t.name).join(", ")
            : "None",
      },
      ...(data.submission.state !== "pending" && data.managedByUser
        ? [
            {
              key:
                data.submission.state === "approved"
                  ? "Approved By"
                  : data.submission.state === "rejected"
                    ? "Rejected By"
                    : "Deleted By",
              value: `${data.managedByUser.name} (${data.managedByUser.email})`,
            },
          ]
        : []),
    ];
  }, [data]);

  // Build actions array
  const actions = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "View Team",
        href: `/teams/${data.submission.teamId}`,
        icon: Users,
        condition: true,
        external: true,
      },
      {
        label: "View Tournament",
        href: `/tournaments/${data.submission.tournamentId}`,
        icon: Trophy,
        condition: true,
        external: true,
        separator: "after" as const,
      },
      {
        label: "Edit Submission",
        onClick: () => setEditDialogOpen(true),
        icon: Pencil,
        condition: data.canEdit,
      },
      {
        label: "Approve",
        onClick: handleApprove,
        icon: Check,
        condition: data.canApprove,
      },
      {
        label: "Reject",
        onClick: handleReject,
        icon: X,
        condition: data.canReject,
      },
      {
        label: "Delete Submission",
        onClick: handleDelete,
        icon: Trash2,
        condition: data.canDelete,
        separator: "before" as const,
      },
    ];
  }, [data, handleApprove, handleReject, handleDelete]);

  if (!data) return null; // TODO: Add skeleton

  return (
    <>
      <UpsertSubmissionFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        submission={data.submission}
      />
      <DetailsCard
        title={`Submission - ${data.submission.date}`}
        description={data.submission.description || "No description provided."}
        details={details}
        actions={actions}
        className={className}
      />
    </>
  );
}
```

**Accessibility:**

- ARIA labels on action buttons
- Keyboard navigation through dropdown menu
- Screen reader announcements for state changes
- Color contrast compliant badges

#### `SubmitterInfo`

**Location:** `src/components/submissions/submitter-info.tsx`

**Purpose:** Display submitter and teammate information in a dedicated section

**Props:**

```typescript
interface SubmitterInfoProps {
  submitter: Doc<"users"> & { roleNames: string[] };
  teammates: (Doc<"users"> & { roleNames: string[] })[];
}
```

**Features:**

- Displays submitter name, email, and avatar (if available)
- Lists all teammates with their details
- Shows admin badge if submitter/teammate is admin
- Responsive grid layout

**Code Structure:**

```typescript
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Doc } from "../../../convex/_generated/dataModel";

interface SubmitterInfoProps {
  submitter: Doc<"users"> & { roleNames: string[] };
  teammates: (Doc<"users"> & { roleNames: string[] })[];
}

export function SubmitterInfo({ submitter, teammates }: SubmitterInfoProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Submitter */}
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{getInitials(submitter.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{submitter.name}</p>
                <Badge variant="secondary">Submitter</Badge>
                {submitter.roleNames.includes("admin") && (
                  <Badge variant="default">Admin</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{submitter.email}</p>
            </div>
          </div>

          {/* Teammates */}
          {teammates.length > 0 && (
            <>
              <hr />
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm font-medium">
                  Teammates ({teammates.length})
                </p>
                {teammates.map((teammate) => (
                  <div key={teammate._id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(teammate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{teammate.name}</p>
                        {teammate.roleNames.includes("admin") && (
                          <Badge variant="default">Admin</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {teammate.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Modified Pages

#### `/submissions/[submissionId]/page.tsx`

**Location:** `src/app/(all)/submissions/[submissionId]/page.tsx`

**Changes Needed:**

- Replace the current edit-only view with comprehensive detail page
- Use new `SubmissionDetailsCard` component
- Add `SubmitterInfo` component
- Add back navigation
- Update page title

**Complete Implementation:**

```typescript
"use client";

import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { SubmissionDetailsCard } from "@/components/submissions/submission-details-card";
import { SubmitterInfo } from "@/components/submissions/submitter-info";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ submissionId: Id<"submissions"> }>;
};

export default function SubmissionDetailsPage({ params }: Props) {
  const { submissionId } = use(params);
  const data = useQuery(
    api.submissions.getDetail,
    submissionId ? { submissionId } : "skip"
  );

  if (!data) return null; // TODO: add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Submission Details">
        <Button variant="outline" asChild>
          <Link href="/submissions">
            <ArrowLeft />
            Back to Submissions
          </Link>
        </Button>
      </SectionHeader>

      <SubmissionDetailsCard submissionId={submissionId} />

      <SectionHeader title="Participants" />
      <SubmitterInfo
        submitter={data.submitter}
        teammates={data.teammates}
      />
    </>
  );
}
```

**Impact:**

- Provides comprehensive detail view instead of edit-only view
- Improves user experience for reviewing submissions
- Enables team members and admins to view submissions they didn't create

## UI/UX Considerations

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ Section Header: "Submission Details"               │
│ [Back to Submissions Button]                       │
├─────────────────────────────────────────────────────┤
│ SubmissionDetailsCard                               │
│ ┌─────────────────────────────────────────────────┐│
│ │ Title: "Submission - 2025-11-13"        [Actions]││
│ │ Description: "Completed 30 min workout"          ││
│ ├─────────────────────────────────────────────────┤│
│ │ Date: 2025-11-13                                 ││
│ │ Status: [approved badge]                         ││
│ │ Tier: [advanced badge]                           ││
│ │ Exercise Type: Team Exercise                     ││
│ │ Points Earned: 3 pts                             ││
│ │ Team: [link] Alpha Team                          ││
│ │ Tournament: [link] Winter Challenge 2025         ││
│ │ Submitted By: John Doe (john@example.com)        ││
│ │ Teammates: Jane Smith, Bob Johnson               ││
│ │ Approved By: Admin User (admin@example.com)      ││
│ └─────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│ Section Header: "Participants"                      │
├─────────────────────────────────────────────────────┤
│ SubmitterInfo                                       │
│ ┌─────────────────────────────────────────────────┐│
│ │ Participants                                     ││
│ ├─────────────────────────────────────────────────┤│
│ │ [Avatar] John Doe [Submitter] [Admin?]          ││
│ │          john@example.com                        ││
│ │ ─────────────────────────────────────────────── ││
│ │ Teammates (2)                                    ││
│ │ [Avatar] Jane Smith [Admin?]                     ││
│ │          jane@example.com                        ││
│ │ [Avatar] Bob Johnson                             ││
│ │          bob@example.com                         ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Visual Design

- **Color Scheme:**
  - Approved: Green badge (`bg-green-100 text-green-800`)
  - Pending: Yellow badge (`bg-yellow-100 text-yellow-800`)
  - Rejected: Red badge (`bg-red-100 text-red-800`)
  - Deleted: Destructive badge
  - Advanced tier: Primary badge
  - Base tier: Secondary badge

- **Typography:**
  - Page title: `text-xl font-semibold`
  - Section headers: Default from `SectionHeader` component
  - Detail keys: `font-semibold`
  - Detail values: `text-gray-700`
  - Participant names: `font-medium`
  - Emails: `text-sm text-muted-foreground`

- **Spacing:**
  - Card padding: `p-4`
  - Detail row gap: `gap-2`
  - Section spacing: Default from layout
  - Participant list spacing: `space-y-3` or `space-y-4`

- **Icons:**
  - Back: `ArrowLeft`
  - Edit: `Pencil`
  - Approve: `Check`
  - Reject: `X`
  - Delete: `Trash2`
  - Team: `Users`
  - Tournament: `Trophy`

### Interactions

- **Hover States:**
  - Links (team, tournament): Underline on hover
  - Action buttons: Standard button hover effects
  - Dropdown menu items: Background change

- **Loading States:**
  - Show skeleton while data loads (future enhancement)
  - Show null return for now (`if (!data) return null;`)
  - Disable action buttons during mutation execution

- **Error States:**
  - Toast notifications for mutation errors
  - Permission denied: Error thrown from backend, caught by Convex
  - Not found: Error thrown from backend

- **Empty States:**
  - No teammates: Show "None"
  - No description: Show "No description provided."
  - Unknown team/tournament: Show "Unknown"

- **Success States:**
  - Approve: Toast "Submission approved successfully", real-time update
  - Reject: Toast "Submission rejected", real-time update
  - Delete: Toast "Submission deleted successfully", redirect to /submissions

### Responsive Design

- **Mobile (<768px):**
  - DetailsCard actions move to dropdown menu
  - Participant cards stack vertically
  - Detail key-value pairs remain in column layout
  - Avatars remain visible

- **Tablet (768-1024px):**
  - Similar to mobile with more breathing room
  - Actions still in dropdown for consistency

- **Desktop (>1024px):**
  - External actions (View Team, View Tournament) displayed as buttons
  - Other actions in dropdown menu
  - Maximum width constraints from card components

### Accessibility

- **Keyboard Navigation:**
  - Tab through action buttons
  - Arrow keys in dropdown menu
  - Enter/Space to activate buttons
  - Escape to close dropdown

- **Screen Readers:**
  - ARIA label on "More Options" button
  - State badges have semantic colors and text
  - Links announced as links with destination
  - Button purposes clearly labeled

- **Focus Management:**
  - Visible focus indicators
  - Focus returns to trigger after closing dropdown
  - Focus trapped in dialogs (edit form)

- **Color Contrast:**
  - Badge colors meet WCAG AA standards
  - Link colors have sufficient contrast
  - Text on backgrounds meets 4.5:1 ratio

## Testing Checklist

### Unit Tests

- [ ] `getDetail` query returns correct data structure
- [ ] Permission logic correctly allows/denies access
- [ ] Team exercise calculation matches approval logic
- [ ] Null handling for deleted related entities
- [ ] Role-based permission flags (canEdit, canApprove, etc.) are correct

### Integration Tests

- [ ] Submission owner can view their submission
- [ ] Team member can view team submission
- [ ] Admin can view any submission
- [ ] Non-team member cannot view submission (permission error)
- [ ] Approve mutation updates state and points correctly
- [ ] Reject mutation updates state correctly
- [ ] Delete mutation navigates to /submissions
- [ ] Real-time updates reflect immediately on state change

### UI Tests

- [ ] SubmissionDetailsCard renders all fields correctly
- [ ] Badges display correct colors for each state
- [ ] Links to team and tournament navigate correctly
- [ ] Edit button shows only when canEdit is true
- [ ] Approve/Reject buttons show only for admins on pending submissions
- [ ] Delete button shows when canDelete is true
- [ ] SubmitterInfo displays submitter and teammates
- [ ] Avatar initials generated correctly
- [ ] Admin badges show for admin users
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Loading state handled gracefully

### User Acceptance Tests

- [ ] Team member can view and understand submission details
- [ ] Admin can approve a pending submission from detail page
- [ ] Admin can reject a pending submission from detail page
- [ ] Submission owner can edit pending submission
- [ ] Submission owner can delete their submission
- [ ] Admin can delete any submission
- [ ] Approved submission shows who approved it
- [ ] Rejected submission shows who rejected it
- [ ] Team and tournament links work correctly
- [ ] Back navigation returns to submissions list

## Performance Optimization

### Query Optimization

- Single query fetches all related data (submission, team, tournament, users) to minimize round trips
- Use indexed queries for team membership lookup (`by_team_and_user`)
- Batch fetch teammates with Promise.all
- Consider caching tournament scoring config (already in tournament document)

### Frontend Optimization

- Memoize details and actions arrays with useMemo
- Use Convex's built-in real-time subscriptions (no manual polling)
- Lazy load edit dialog (only renders when opened)
- Consider skeleton loading state for better perceived performance

### Database Optimization

- Existing indexes support efficient queries:
  - `by_team` for team membership checks
  - `by_team_and_user` for permission validation
- No additional indexes needed for this feature

## Edge Cases

1. **Submission Not Found**
   - Scenario: User navigates to invalid submission ID
   - Expected Behavior: Backend throws "Submission not found" error
   - Implementation: Error boundary or error toast in UI

2. **User Not Authorized**
   - Scenario: User tries to access submission from different team
   - Expected Behavior: Backend throws permission error
   - Implementation: Error boundary catches and shows "Access denied" message

3. **Team or Tournament Deleted**
   - Scenario: Related entities deleted but submission exists
   - Expected Behavior: Show "Unknown" for deleted entities, prevent null reference errors
   - Implementation: Null checks in UI (`data.team ? ... : "Unknown"`)

4. **Teammates Removed from System**
   - Scenario: User deleted from Clerk/system but still in teammates array
   - Expected Behavior: Filter out null users from teammates list
   - Implementation: `teammates.filter((t) => t !== null)` in query

5. **Pending Submission with No managedBy**
   - Scenario: Submission never reviewed yet
   - Expected Behavior: Don't show "Approved By" field
   - Implementation: Conditional rendering based on state and managedByUser

6. **Re-approval After Rejection**
   - Scenario: Admin wants to approve previously rejected submission
   - Expected Behavior: Allow approval, recalculate points, update team score
   - Implementation: Backend approve mutation already handles state transitions

7. **Concurrent Approval/Rejection**
   - Scenario: Two admins approve/reject same submission simultaneously
   - Expected Behavior: Last write wins (Convex handles consistency)
   - Implementation: Real-time updates ensure both admins see final state

8. **Edit After Approval**
   - Scenario: User tries to edit approved submission
   - Expected Behavior: Edit button not shown (canEdit = false)
   - Implementation: Permission check in backend prevents unauthorized edits

9. **Delete Rejected Submission**
   - Scenario: User tries to delete rejected submission
   - Expected Behavior: Delete button not shown, backend prevents action
   - Implementation: Backend remove mutation checks state !== "rejected"

10. **Empty Description**
    - Scenario: Submission created without description
    - Expected Behavior: Show "No description provided."
    - Implementation: `description || "No description provided."`

## Future Enhancements

- Add `managedAt` timestamp field to track when submission was reviewed
- Add `rejectionReason` field for admin feedback on rejected submissions
- Create submission history/timeline showing all state changes
- Add ability to comment on submissions (like PR comments)
- Implement submission comparison view (before/after edits)
- Add submission analytics (approval rate, average review time)
- Create batch approval interface for admins
- Add email notifications for submission state changes
- Implement submission templates or categories
- Add file/image upload support for proof of activity
- Create submission calendar view showing team's activity history

## Dependencies

### Backend Dependencies

- Existing queries:
  - `users.getCurrentUserOrThrow` - Authentication
  - Helper function to get user roles (need to export or duplicate)
- Existing mutations:
  - `submissions.approve` - Approval logic
  - `submissions.reject` - Rejection logic
  - `submissions.remove` - Deletion logic
- Database tables:
  - `submissions`, `teams`, `tournaments`, `users`, `teamMembers`, `userRoles`, `roles`

### Frontend Dependencies

- UI components:
  - `DetailsCard` (`src/components/details-card.tsx`)
  - `Badge` (`src/components/ui/badge.tsx`)
  - `Button` (`src/components/ui/button.tsx`)
  - `Card`, `CardContent`, `CardHeader`, `CardTitle` (`src/components/ui/card.tsx`)
  - `Avatar`, `AvatarFallback` (`src/components/ui/avatar.tsx`)
  - `DropdownMenu` components
  - `SectionHeader` (`src/components/section-header.tsx`)
- Libraries:
  - Convex React (`useQuery`, `useMutation`)
  - Next.js (`Link`, `useRouter`, `use`)
  - Lucide React (icons)
  - sonner (toast)
- Hooks:
  - `useUser` (`src/hooks/useUser.tsx`)
- Forms:
  - `UpsertSubmissionFormDialog` (for edit functionality)

### External Dependencies

- None (no third-party APIs or external services required)

## Migration Plan

### Phase 1: Backend Implementation (Estimated: 4-6 hours)

1. Create helper function for fetching user with roles
   - Export `getRolesForUser` from `users.ts` OR
   - Duplicate function in `submissions.ts`
2. Implement `submissions.getDetail` query
   - Add permission checks
   - Fetch all related entities
   - Calculate derived fields (isTeamExercise, permissions)
   - Test in Convex dashboard with various user roles
3. Verify existing mutations work correctly
   - Test approve, reject, remove with detail page workflow

**Acceptance Criteria:**

- Query returns complete data structure
- Permission checks work for owner, team member, admin
- Non-authorized users get proper error
- All edge cases handled (null entities, deleted users)

### Phase 2: Frontend Components (Estimated: 6-8 hours)

1. Create `SubmissionDetailsCard` component
   - Implement detail display with DetailsCard
   - Add action handlers for approve, reject, delete
   - Integrate edit dialog
   - Test with various submission states
2. Create `SubmitterInfo` component
   - Display submitter with avatar
   - Display teammates list
   - Show admin badges appropriately
3. Test components in isolation
   - Verify responsive design
   - Check accessibility
   - Test all user interactions

**Acceptance Criteria:**

- Components render correctly with mock data
- All actions trigger correct mutations
- Responsive on mobile/tablet/desktop
- Accessible via keyboard and screen reader

### Phase 3: Page Integration (Estimated: 2-3 hours)

1. Update `/submissions/[submissionId]/page.tsx`
   - Replace edit-only view with detail view
   - Add SubmissionDetailsCard
   - Add SubmitterInfo
   - Add navigation
2. Test complete user flow
   - Navigate from submissions list to detail page
   - Perform actions (approve, reject, edit, delete)
   - Verify navigation to team/tournament pages
   - Test back navigation

**Acceptance Criteria:**

- Page displays complete submission information
- All links navigate correctly
- Actions work as expected
- Real-time updates reflect immediately

### Phase 4: Testing & Polish (Estimated: 3-4 hours)

1. Run full test checklist
   - Unit tests for query logic
   - Integration tests for mutations
   - UI tests for components
   - UAT scenarios
2. Fix bugs and edge cases
3. Improve UX
   - Add loading skeletons
   - Polish toast messages
   - Improve error messages
4. Performance optimization
   - Verify query efficiency
   - Check for unnecessary re-renders

**Acceptance Criteria:**

- All tests pass
- No console errors or warnings
- Smooth user experience
- Good performance metrics

### Phase 5: Code Review & Deployment (Estimated: 2-3 hours)

1. Code review
   - Follow Biome formatting rules
   - Ensure sorted Tailwind classes
   - Verify TypeScript types
   - Check CLAUDE.md compliance
2. Documentation
   - Update CLAUDE.md if needed
   - Add JSDoc comments
3. Deploy to production
4. Monitor for issues
5. Gather user feedback

**Acceptance Criteria:**

- Code passes review
- Biome checks pass
- Successfully deployed
- No production errors

**Total Estimated Effort:** 2-3 days (17-24 hours of focused work)

## Success Metrics

**Adoption:**

- 80% of users who view submissions use the detail page within first week
- Average time on detail page: 30-60 seconds (indicates engagement)

**Performance:**

- Page loads in <1 second (data fetch + render)
- Query execution time: <200ms
- Mutation success rate: >99%

**Quality:**

- Error rate: <1% of page views
- Zero permission bypass incidents
- Accessibility score: 100 (Lighthouse)

**User Satisfaction:**

- Positive feedback on submission transparency
- Reduced confusion about submission status
- Faster admin approval workflow

**Business Impact:**

- Increased submission approval rate (less confusion = more approvals)
- Reduced support requests about submission status
- Improved team engagement metrics

## Open Questions

- [ ] Should we add timestamps for when submissions are created/updated? (Convex provides `_creationTime` but not update time)
- [ ] Do we want to add a rejection reason field for admins to provide feedback?
- [ ] Should submission history/timeline be part of MVP or future enhancement?
- [ ] Is there a user profile page we can link to from submitter/teammate names?
- [ ] Should we allow admins to edit other users' submissions?
- [ ] Do we want to add file/image attachments in the future? (impacts schema)
- [ ] Should we implement submission comments/discussion thread?

## Notes

- This feature significantly improves transparency in the submission approval workflow
- The permission model (owner + team member + admin) balances privacy with team visibility
- Real-time updates via Convex ensure all users see consistent state
- The DetailsCard pattern provides visual consistency across the app
- Consider adding analytics tracking for admin actions (approve/reject/delete rates)
- Future enhancement: Create a "Review Queue" page for admins with batch operations
- The flexible scoring calculation is already implemented in the approve mutation; detail page just displays the result
- Team exercise classification helps users understand why they earned certain points
- This page can serve as the foundation for future submission-related features (comments, history, attachments)
