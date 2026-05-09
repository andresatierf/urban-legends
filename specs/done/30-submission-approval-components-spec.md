# Submission Approval Components Specification

**Status**: Draft
**Created**: 2025-11-28
**Complexity**: Medium
**Priority**: High

---

## Executive Summary

This specification defines a unified component architecture for submission approval across the Urban Legends tournament platform. Currently, submission review is split between `/manage/submissions` (tournament manager interface) and `/reviewer` (reviewer interface), with inconsistent UI patterns and duplicated logic. This spec consolidates these into reusable, composable components that handle both individual submissions and team submission groups, providing a consistent experience while supporting role-specific workflows.

**Primary Benefits**:

- **Consistency**: Unified UI patterns across admin and reviewer workflows
- **Reusability**: Share components between multiple routes with different configurations
- **Maintainability**: Single source of truth for submission display and approval logic
- **Extensibility**: Easy to add new features (image galleries, bulk actions, etc.)

**Timeline Estimate**: Medium (2-3 days implementation + testing)

---

## 1. Current State Analysis

### Existing Routes

#### `/manage/submissions` (Tournament Manager)

**File**: `src/app/(protected)/manage/submissions/page.tsx`

**Current Functionality**:

- Displays all submissions across all tournaments
- Three tabs: All, Pending, Done (resolved)
- Search and sort functionality (by date, points)
- Uses `SubmissionCardList` component
- Approve/Reject/Delete actions
- Role check: `admin` or `tournament_manager`

**Backend Query**: `api.tournamentManager.getSubmissions`

**Current Issues**:

- No image display (images array always empty in SubmissionCardList)
- No group submission support visible in UI
- Basic filtering only

#### `/reviewer` (Reviewer Dashboard)

**File**: `src/app/(protected)/reviewer/page.tsx`

**Current Functionality**:

- Displays pending items only (individual + groups)
- Tournament filter dropdown
- Unified view of individual submissions and team activity groups
- Approve/Reject actions with toast notifications
- Shows participation rate for team activities
- Role check: `reviewer` or `admin`

**Backend Query**: `api.reviewer.getPendingSubmissions`

**Current Issues**:

- No image display
- No detailed view (modal/expansion)
- Limited metadata shown
- No batch operations

### Existing Components

#### `SubmissionCard` (`src/components/submissions/submission-card.tsx`)

**Purpose**: Display a single submission with image, details, and actions

**Props**:

```typescript
{
  submission: Doc<"submissions"> & { team, user }
  images: Array<{ _id, url, filename }>  // Currently always empty
  currentUser: UserWithRoles
  onApprove?, onReject?, onEdit?, onDelete?
}
```

**Layout**: Horizontal card with image on left, details/actions on right

**Sub-components**:

- `SubmissionCardImage`: Image gallery with lightbox
- `SubmissionCardDetails`: Badges, metadata, description
- `SubmissionCardActions`: Action buttons (approve/reject/edit/delete)

#### `SubmissionCardList` (`src/components/submissions/submission-card-list.tsx`)

**Purpose**: Render array of submissions using `CardGrid`

**Issues**:

- Always passes empty images array
- No support for submission groups
- Basic wrapper around `CardGrid`

#### `ReviewCard` (inline in `reviewer/page.tsx`)

**Purpose**: Display submission or group for review

**Issues**:

- Not reusable (defined inline)
- Duplicate logic with `SubmissionCard`
- No image support
- No expansion/detail view

### Backend Functions

#### Individual Submissions

- `api.submissions.approve(submissionId)` - Approves individual or all in group
- `api.submissions.reject(submissionId)` - Rejects individual
- `api.submissions.remove(submissionId)` - Soft delete
- `api.submissions.getDetails(submissionId)` - Full details with permissions

#### Submission Groups

- `api.submissionGroups.approve(groupId)` - Approves all in group
- `api.submissionGroups.reject(groupId)` - Rejects all in group
- `api.submissionGroups.getWithSubmissions(groupId)` - Group + submissions

#### Queries

- `api.tournamentManager.getSubmissions()` - All submissions with user/team
- `api.reviewer.getPendingSubmissions({ tournamentId? })` - Unified pending items

### Image Storage Gap

**Critical Finding**: There is **no image storage implementation** in the codebase. The `images` prop in `SubmissionCardImage` is always an empty array. The schema has no `images` or `files` table.

**Impact on Spec**: This specification will design components to support images when storage is implemented, but will gracefully handle the current no-image state.

---

## 2. Feature Requirements

### Functional Requirements

#### FR1: Single Submission Display Component

- Display individual submission with all metadata
- Show submission state badge (pending/approved/rejected/deleted)
- Display tier (base/advanced) and type (individual/team)
- Show team name, submitter name, date, points earned
- Display description if provided
- Support image gallery (empty state when no images)
- Show approval/rejection controls based on permissions
- Display "managed by" user if approved/rejected
- Expandable detail view option

#### FR2: Submission Group Display Component

- Display team activity group with aggregated data
- Show group state, tier, participation metrics
- List all participants in the group
- Show team exercise qualification status
- Display total points for group
- Support expanding to show individual submissions
- Approve/reject affects entire group
- Show submission count and participation rate

#### FR3: Unified Submission List Component

- Render mixed list of individuals and groups
- Support sorting (date, points, state)
- Support filtering (search, state, tournament, team)
- Pagination or virtual scrolling for large lists
- Empty state messaging
- Loading skeleton states
- Real-time updates via Convex subscriptions

#### FR4: Image Gallery Component

- Display up to 4 images in grid (2x2 for 4+, single for 1, side-by-side for 2-3)
- Thumbnail strip for images beyond primary display
- Lightbox modal for full-size viewing
- Navigation between images in lightbox
- Empty state with placeholder icon
- Lazy loading for performance
- Image counter badge

#### FR5: Approval Action Controls

- Context-aware button visibility (permissions, state)
- Approve button (green) - only for pending items
- Reject button (red) - only for pending items
- Delete button (outline) - for admin/owner
- Edit button (outline) - for owner on non-approved items
- Optimistic UI updates with rollback on error
- Toast notifications for success/failure
- Confirmation dialogs for destructive actions
- Loading states during mutations

#### FR6: Review Queue Interface

- Filter by tournament
- Show pending count
- Display items in chronological order (newest first)
- Clearly distinguish individual vs team submissions
- Show reviewer statistics (approved/rejected counts)
- Empty state when no pending items

### Non-Functional Requirements

#### NFR1: Performance

- List rendering optimized for 100+ items
- Image lazy loading
- Optimistic updates for instant feedback
- Debounced search input (300ms)
- Efficient Convex queries (indexed)

#### NFR2: Accessibility

- Keyboard navigation for lists and galleries
- ARIA labels for all interactive elements
- Focus management in modals
- Screen reader announcements for state changes
- Color contrast meets WCAG AA standards

#### NFR3: Mobile Responsiveness

- Cards stack vertically on mobile
- Touch-friendly action buttons (min 44px target)
- Responsive image gallery
- Mobile-optimized lightbox
- Collapsible sections for space efficiency

#### NFR4: Real-time Updates

- Submissions update automatically when state changes
- Pending counts update in real-time
- Optimistic UI with Convex reactivity
- Conflict resolution (submission approved by another reviewer)

---

## 3. Technical Design

### Component Architecture

```
src/components/submissions/
├── review/                              # NEW - Approval-focused components
│   ├── submission-review-card.tsx       # Unified card for individual/group
│   ├── submission-review-list.tsx       # List with filtering/sorting
│   ├── submission-detail-modal.tsx      # Expanded detail view
│   ├── submission-approval-actions.tsx  # Approve/reject controls
│   └── group-participants-list.tsx      # Show group members
│
├── display/                             # REFACTORED - Display components
│   ├── submission-card.tsx              # Existing, enhanced
│   ├── submission-card-image.tsx        # Existing, enhanced
│   ├── submission-card-details.tsx      # Existing, enhanced
│   ├── submission-card-actions.tsx      # Existing, moved here
│   └── submission-metadata.tsx          # NEW - Reusable metadata display
│
└── submission-card-list.tsx             # Existing, enhanced
```

### Data Models (TypeScript Interfaces)

```typescript
// Extended submission with context
interface SubmissionWithContext {
  submission: Doc<"submissions">;
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  submitter: UserWithRoles;
  images: SubmissionImage[];
  teammates?: UserWithRoles[]; // For team submissions
  managedBy?: UserWithRoles;
  isTeamExercise: boolean;
  participationRate: number;
}

// Group with context
interface GroupWithContext {
  group: Doc<"submissionGroups">;
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  submissions: Array<Doc<"submissions"> & { user: Doc<"users"> }>;
  submitters: UserWithRoles[];
  images: SubmissionImage[]; // Aggregated from all submissions
  managedBy?: UserWithRoles;
}

// Unified review item (discriminated union)
type ReviewItem =
  | { type: "individual"; data: SubmissionWithContext }
  | { type: "group"; data: GroupWithContext };

// Image placeholder (for future implementation)
interface SubmissionImage {
  _id: string;
  url: string;
  filename: string;
  submissionId: Id<"submissions">;
  uploadedAt: string;
}

// Filter/sort state
interface ReviewListFilters {
  search: string;
  states: Array<"pending" | "approved" | "rejected" | "deleted">;
  tournamentId?: Id<"tournaments">;
  teamId?: Id<"teams">;
  sortBy: "date-desc" | "date-asc" | "points-desc" | "points-asc";
}

// Permissions
interface ReviewPermissions {
  canApprove: boolean;
  canReject: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canViewDetails: boolean;
}
```

### Component Specifications

#### 1. `SubmissionReviewCard` (NEW)

**Purpose**: Unified card component that displays either an individual submission or a group, optimized for review workflows.

**Props**:

```typescript
interface SubmissionReviewCardProps {
  item: ReviewItem;
  variant?: "compact" | "detailed";
  showActions?: boolean;
  onApprove?: () => void | Promise<void>;
  onReject?: () => void | Promise<void>;
  onViewDetails?: () => void;
  currentUser: UserWithRoles;
}
```

**Behavior**:

- Renders different content based on `item.type`
- For individuals: Shows submitter, single description
- For groups: Shows participant list, participation rate, team exercise indicator
- Variant `compact` hides description, shows less metadata (for lists)
- Variant `detailed` shows full information (for single view or modal)
- Actions are optional (can be read-only view)
- Loading states during async actions
- Optimistic updates with rollback

**Layout (Compact)**:

```
┌─────────────────────────────────────────────────────────────┐
│ [Image Grid]  │ [Badges: State, Tier, Type]                 │
│               │ Team Name | Tournament Name                 │
│   (150px)     │ Submitted by User on Date                   │
│               │ [Approve] [Reject]                          │
└─────────────────────────────────────────────────────────────┘
```

**Layout (Detailed)**:

```
┌─────────────────────────────────────────────────────────────┐
│                        Image Gallery                        │
│                     [2x2 grid or single]                    │
├─────────────────────────────────────────────────────────────┤
│ [Badges: State, Tier, Type, Points]                        │
│                                                             │
│ Team: Team Name | Tournament: Tournament Name              │
│ Date: YYYY-MM-DD | Submitted by: User Name                 │
│                                                             │
│ Description:                                                │
│ Lorem ipsum dolor sit amet...                              │
│                                                             │
│ [Group Specific]                                            │
│ Participants (3/5): Alice, Bob, Charlie                    │
│ ✓ Qualifies as team exercise (60% participation)           │
│                                                             │
│ Managed by: Admin Name (if approved/rejected)              │
│                                                             │
│ [Approve Team Activity] [Reject]                           │
└─────────────────────────────────────────────────────────────┘
```

**Code Example**:

```typescript
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ReviewItem } from "./types";
import { SubmissionImageGallery } from "./submission-image-gallery";
import { SubmissionMetadata } from "../display/submission-metadata";
import { GroupParticipantsList } from "./group-participants-list";

interface SubmissionReviewCardProps {
  item: ReviewItem;
  variant?: "compact" | "detailed";
  showActions?: boolean;
  onApprove?: () => void | Promise<void>;
  onReject?: () => void | Promise<void>;
  onViewDetails?: () => void;
  currentUser: UserWithRoles;
}

export function SubmissionReviewCard({
  item,
  variant = "compact",
  showActions = true,
  onApprove,
  onReject,
  onViewDetails,
  currentUser,
}: SubmissionReviewCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsApproving(true);
    try {
      await onApprove();
      toast.success(
        item.type === "group" ? "Team activity approved" : "Submission approved"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsRejecting(true);
    try {
      await onReject();
      toast.success(
        item.type === "group" ? "Team activity rejected" : "Submission rejected"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setIsRejecting(false);
    }
  };

  if (item.type === "individual") {
    const { submission, team, tournament, submitter, images } = item.data;
    const isPending = submission.state === "pending";
    const canApprove = isPending && onApprove;
    const canReject = isPending && onReject;

    return (
      <Card>
        <CardHeader className={variant === "compact" ? "pb-3" : undefined}>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant={submission.state}>{submission.state}</Badge>
                <Badge className="bg-blue-100 text-blue-800">Individual</Badge>
                <Badge>{submission.tier === "base" ? "Base" : "Advanced"}</Badge>
                {submission.pointsEarned > 0 && (
                  <Badge variant="outline">{submission.pointsEarned} pts</Badge>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{team.name}</p>
                <p className="text-muted-foreground">{tournament.name}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {variant === "detailed" && images.length > 0 && (
            <SubmissionImageGallery images={images} className="mb-4" />
          )}

          <SubmissionMetadata
            submitter={submitter.name}
            date={submission.date}
            description={variant === "detailed" ? submission.description : undefined}
          />
        </CardContent>

        {showActions && (canApprove || canReject) && (
          <CardFooter className="gap-2">
            {canApprove && (
              <Button
                size="sm"
                color="green"
                onClick={handleApprove}
                disabled={isApproving}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                {isApproving ? "Approving..." : "Approve"}
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                color="destructive"
                onClick={handleReject}
                disabled={isRejecting}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    );
  }

  // Group rendering
  const { group, team, tournament, submitters } = item.data;
  const isPending = group.state === "pending";
  const canApprove = isPending && onApprove;
  const canReject = isPending && onReject;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={group.state}>{group.state}</Badge>
              <Badge className="bg-green-100 text-green-800">Team Activity</Badge>
              <Badge>{group.tier === "base" ? "Base" : "Advanced"}</Badge>
              {group.pointsEarned > 0 && (
                <Badge variant="outline">{group.pointsEarned} pts</Badge>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{team.name}</p>
              <p className="text-muted-foreground">{tournament.name}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <GroupParticipantsList
          submitters={submitters}
          participantCount={group.participantCount}
          totalMembers={group.totalTeamMembers}
          isTeamExercise={group.isTeamExercise}
          participationRate={group.participationRate}
        />

        {variant === "detailed" && group.date && (
          <p className="text-muted-foreground text-sm">
            Activity date: {new Date(group.date).toLocaleDateString()}
          </p>
        )}
      </CardContent>

      {showActions && (canApprove || canReject) && (
        <CardFooter className="gap-2">
          {canApprove && (
            <Button
              size="sm"
              color="green"
              onClick={handleApprove}
              disabled={isApproving}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {isApproving ? "Approving..." : "Approve Team Activity"}
            </Button>
          )}
          {canReject && (
            <Button
              size="sm"
              color="destructive"
              onClick={handleReject}
              disabled={isRejecting}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {isRejecting ? "Rejecting..." : "Reject"}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
```

#### 2. `SubmissionReviewList` (NEW)

**Purpose**: Filterable, sortable list of review items with search and state management.

**Props**:

```typescript
interface SubmissionReviewListProps {
  items: ReviewItem[];
  currentUser: UserWithRoles;
  onApprove: (item: ReviewItem) => void | Promise<void>;
  onReject: (item: ReviewItem) => void | Promise<void>;
  showFilters?: boolean;
  defaultFilters?: Partial<ReviewListFilters>;
  emptyMessage?: string;
  variant?: "compact" | "detailed";
}
```

**Features**:

- Search box (filters by team name, submitter name, description)
- State filter (pending/approved/rejected/all)
- Sort dropdown (date, points)
- Debounced search (300ms)
- Empty state with custom message
- Loading skeleton
- Virtual scrolling for 100+ items (optional)

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│ [Search: "team name..."]     [Sort: Newest First ▼]        │
│ [State: All ▼]                                              │
├─────────────────────────────────────────────────────────────┤
│ Showing 12 of 45 submissions                                │
├─────────────────────────────────────────────────────────────┤
│ [SubmissionReviewCard]                                      │
│ [SubmissionReviewCard]                                      │
│ [SubmissionReviewCard]                                      │
│ ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

#### 3. `GroupParticipantsList` (NEW)

**Purpose**: Display participants in a team activity group with visual indicators.

**Props**:

```typescript
interface GroupParticipantsListProps {
  submitters: UserWithRoles[];
  participantCount: number;
  totalMembers: number;
  isTeamExercise: boolean;
  participationRate: number;
}
```

**Layout**:

```
Participants (3/5):
Alice Johnson, Bob Smith, Charlie Davis

✓ Qualifies as team exercise (60% participation)
```

**Code Example**:

```typescript
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GroupParticipantsList({
  submitters,
  participantCount,
  totalMembers,
  isTeamExercise,
  participationRate,
}: GroupParticipantsListProps) {
  return (
    <div className="space-y-2 text-sm">
      <p>
        <span className="font-medium">Participants ({participantCount}/{totalMembers}):</span>{" "}
        {submitters.map((s) => s.name).join(", ")}
      </p>

      <p
        className={cn("flex items-center gap-1", {
          "text-green-600": isTeamExercise,
          "text-red-600": !isTeamExercise,
        })}
      >
        {isTeamExercise ? (
          <Check className="h-3 w-3" />
        ) : (
          <X className="h-3 w-3" />
        )}
        {isTeamExercise ? "Qualifies" : "Does not qualify"} as team exercise (
        {Math.round(participationRate * 100)}% participation)
      </p>
    </div>
  );
}
```

#### 4. `SubmissionImageGallery` (Enhanced)

**Purpose**: Reusable image gallery component with lightbox (based on existing `SubmissionCardImage`).

**Changes from existing**:

- Extract as standalone component
- Add `className` prop for flexibility
- Support configurable grid layout
- Add image loading states
- Add error state for failed image loads

**Props**:

```typescript
interface SubmissionImageGalleryProps {
  images: SubmissionImage[];
  layout?: "grid" | "single" | "carousel";
  maxDisplay?: number; // Default 4
  className?: string;
}
```

#### 5. `SubmissionMetadata` (NEW)

**Purpose**: Reusable metadata display component for submission details.

**Props**:

```typescript
interface SubmissionMetadataProps {
  submitter: string;
  date: string;
  description?: string;
  managedBy?: string;
  compact?: boolean;
}
```

**Layout**:

```
Submitted by: Alice Johnson
Date: 2025-11-28
Description: Completed 30-minute cardio session at local gym.
Approved by: Admin User
```

### Backend Requirements

#### New Queries/Mutations

**No new backend functions required!** Existing functions are sufficient:

**Existing Queries** (already implemented):

- `api.submissions.getDetails(submissionId)` - Returns full context including teammates, permissions
- `api.submissionGroups.getWithSubmissions(groupId)` - Returns group with all submissions
- `api.reviewer.getPendingSubmissions({ tournamentId? })` - Returns unified review items
- `api.tournamentManager.getSubmissions()` - Returns all submissions with context

**Existing Mutations** (already implemented):

- `api.submissions.approve(submissionId)` - Approves individual or entire group
- `api.submissions.reject(submissionId)` - Rejects individual submission
- `api.submissionGroups.approve(groupId)` - Approves entire group
- `api.submissionGroups.reject(groupId)` - Rejects entire group

#### Future Backend (Image Storage)

When image storage is implemented, add:

```typescript
// Future schema addition
images: defineTable({
  submissionId: v.id("submissions"),
  storageId: v.id("_storage"),
  filename: v.string(),
  mimeType: v.string(),
  sizeBytes: v.number(),
  uploadedAt: v.string(),
}).index("by_submission", ["submissionId"]);

// Future query
export const getSubmissionImages = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("images")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .collect();

    return Promise.all(
      images.map(async (img) => ({
        _id: img._id,
        url: await ctx.storage.getUrl(img.storageId),
        filename: img.filename,
        submissionId: img.submissionId,
        uploadedAt: img.uploadedAt,
      })),
    );
  },
});
```

### Integration Points

#### Route: `/manage/submissions`

**Changes**:

```typescript
// Before
import { SubmissionCardList } from "@/components/submissions/submission-card-list";

// After
import { SubmissionReviewList } from "@/components/submissions/review/submission-review-list";

// Replace SubmissionCardList with SubmissionReviewList
<SubmissionReviewList
  items={transformedItems}  // Convert to ReviewItem[]
  currentUser={user}
  onApprove={(item) => handleApprove(item)}
  onReject={(item) => handleReject(item)}
  showFilters={true}
  variant="compact"
/>
```

**Backend Query Enhancement**:

```typescript
// Current: api.tournamentManager.getSubmissions returns submissions with user/team
// Need to transform to ReviewItem[] format

const submissions = useQuery(api.tournamentManager.getSubmissions, {});

const reviewItems: ReviewItem[] = useMemo(() => {
  if (!submissions) return [];

  return submissions.map((s) => ({
    type: "individual" as const,
    data: {
      submission: s,
      team: s.team,
      tournament: s.tournament,
      submitter: s.user,
      images: [], // TODO: Fetch when storage implemented
      isTeamExercise: false,
      participationRate: 0,
    },
  }));
}, [submissions]);
```

#### Route: `/reviewer`

**Changes**:

```typescript
// Before: Custom ReviewCard component inline

// After: Use SubmissionReviewCard
import { SubmissionReviewCard } from "@/components/submissions/review/submission-review-card";

// The getPendingSubmissions query already returns the right format!
const pendingData = useQuery(api.reviewer.getPendingSubmissions, { tournamentId });

// Map to ReviewItem
const reviewItems: ReviewItem[] = useMemo(() => {
  if (!pendingData) return [];

  return pendingData.items.map((item) => {
    if (item.type === "individual") {
      return {
        type: "individual" as const,
        data: {
          submission: item.submission,
          team: item.team,
          tournament: item.tournament,
          submitter: item.submitter,
          images: [],
          isTeamExercise: false,
          participationRate: 0,
        },
      };
    } else {
      return {
        type: "group" as const,
        data: {
          group: item.group,
          team: item.team,
          tournament: item.tournament,
          submissions: item.submissions,
          submitters: item.submitters,
          images: [],
        },
      };
    }
  });
}, [pendingData]);

// Render
<div className="space-y-4">
  {reviewItems.map((item) => (
    <SubmissionReviewCard
      key={item.type === "individual" ? item.data.submission._id : item.data.group._id}
      item={item}
      currentUser={user}
      onApprove={
        item.type === "individual"
          ? () => handleApproveIndividual(item.data.submission._id)
          : () => handleApproveGroup(item.data.group._id)
      }
      onReject={
        item.type === "individual"
          ? () => handleRejectIndividual(item.data.submission._id)
          : () => handleRejectGroup(item.data.group._id)
      }
    />
  ))}
</div>
```

---

## 4. Implementation Plan

### Phase 1: Foundation Components (Day 1 - Morning)

**Tasks**:

1. Create `src/components/submissions/review/types.ts` with TypeScript interfaces
2. Create `GroupParticipantsList` component
3. Create `SubmissionMetadata` component
4. Refactor `SubmissionCardImage` → `SubmissionImageGallery` (make reusable)
5. Write Storybook stories for basic components (optional)

**Deliverables**:

- 3 new utility components
- 1 refactored component
- Type definitions

### Phase 2: Core Review Components (Day 1 - Afternoon + Day 2 - Morning)

**Tasks**:

1. Create `SubmissionReviewCard` component
   - Individual submission rendering
   - Group submission rendering
   - Action buttons with loading states
   - Variant support (compact/detailed)
2. Create `SubmissionReviewList` component
   - Search/filter/sort logic
   - Empty states
   - Loading states
3. Write unit tests for key logic

**Deliverables**:

- 2 new major components
- Test coverage for filtering/sorting

### Phase 3: Route Integration (Day 2 - Afternoon)

**Tasks**:

1. Refactor `/manage/submissions` page
   - Replace `SubmissionCardList` with `SubmissionReviewList`
   - Transform data to `ReviewItem[]` format
   - Test all tabs (All, Pending, Done)
   - Verify search/sort/filter works
2. Refactor `/reviewer` page
   - Replace inline `ReviewCard` with `SubmissionReviewCard`
   - Transform data to `ReviewItem[]` format
   - Verify tournament filter works
   - Test approve/reject flows
3. Update existing components to use new utilities where applicable

**Deliverables**:

- 2 refactored routes
- Consistent UI across both pages

### Phase 4: Polish & Testing (Day 3)

**Tasks**:

1. Add loading skeletons to lists
2. Implement optimistic updates with rollback
3. Add keyboard shortcuts (optional)
   - `a` = approve first pending
   - `r` = reject first pending
   - Arrow keys = navigate list
4. Mobile responsiveness testing
5. Accessibility audit (ARIA labels, focus management)
6. Cross-browser testing (Chrome, Firefox, Safari)
7. Manual testing scenarios:
   - Approve individual submission
   - Approve team activity group
   - Reject submission
   - Delete submission
   - Search and filter
   - Sort by different criteria
   - Empty states
   - Error states (network failure)
8. Update documentation

**Deliverables**:

- Polished, production-ready components
- Accessibility compliance
- Updated CLAUDE.md if needed

### Phase 5: Documentation (Day 3 - End)

**Tasks**:

1. Add component documentation (TSDoc)
2. Create usage examples in comments
3. Update CLAUDE.md with new component patterns
4. Create migration guide for future refactors

**Deliverables**:

- Comprehensive documentation
- Usage examples

---

## 5. Migration Strategy

### Backward Compatibility

**Existing Components**: Keep existing components functional during transition:

- `SubmissionCard` - Keep as-is, used in other routes (user submissions page)
- `SubmissionCardList` - Can be deprecated after migration
- `SubmissionCardImage` - Refactor to `SubmissionImageGallery` with backward-compatible wrapper

**Migration Path**:

1. Phase 1-2: Build new components alongside existing ones
2. Phase 3: Migrate routes one at a time
3. Phase 4: Deprecate old components (add comments)
4. Future: Remove deprecated components when confident

### Data Transformation

**Challenge**: Backend returns different shapes for different queries.

**Solution**: Create transformation utilities:

```typescript
// src/components/submissions/review/transforms.ts

export function submissionToReviewItem(
  submission: Doc<"submissions"> & { team: Doc<"teams">; user: Doc<"users"> },
  tournament: Doc<"tournaments">,
  images: SubmissionImage[] = [],
): ReviewItem {
  return {
    type: "individual",
    data: {
      submission,
      team: submission.team,
      tournament,
      submitter: submission.user as UserWithRoles,
      images,
      isTeamExercise: false,
      participationRate: 0,
    },
  };
}

export function groupToReviewItem(
  group: Doc<"submissionGroups">,
  team: Doc<"teams">,
  tournament: Doc<"tournaments">,
  submissions: Array<Doc<"submissions"> & { user: Doc<"users"> }>,
  images: SubmissionImage[] = [],
): ReviewItem {
  return {
    type: "group",
    data: {
      group,
      team,
      tournament,
      submissions,
      submitters: submissions.map((s) => s.user as UserWithRoles),
      images,
    },
  };
}
```

---

## 6. Testing Approach

### Unit Tests

**Components to Test**:

- `GroupParticipantsList` - Verify formatting, team exercise indicator
- `SubmissionMetadata` - Verify all fields render correctly
- Filter/sort logic in `SubmissionReviewList`

**Tools**: Vitest + React Testing Library

**Example Test**:

```typescript
describe("GroupParticipantsList", () => {
  it("shows team exercise indicator when participation >= threshold", () => {
    const { getByText } = render(
      <GroupParticipantsList
        submitters={mockSubmitters}
        participantCount={3}
        totalMembers={5}
        isTeamExercise={true}
        participationRate={0.6}
      />
    );

    expect(getByText(/Qualifies as team exercise/)).toBeInTheDocument();
  });

  it("shows warning when participation < threshold", () => {
    const { getByText } = render(
      <GroupParticipantsList
        submitters={mockSubmitters}
        participantCount={2}
        totalMembers={5}
        isTeamExercise={false}
        participationRate={0.4}
      />
    );

    expect(getByText(/Does not qualify/)).toBeInTheDocument();
  });
});
```

### Integration Tests

**Scenarios**:

1. Reviewer approves individual submission → submission disappears from pending
2. Admin rejects team activity → all submissions in group marked rejected
3. Search filters list correctly
4. Sort changes order
5. Empty state shows when no items match filter

### Manual Testing Checklist

- [ ] Individual submission displays correctly
- [ ] Group submission displays correctly
- [ ] Approve button only shows for pending items
- [ ] Approve action succeeds and updates UI
- [ ] Reject action succeeds and updates UI
- [ ] Toast notifications appear for success/error
- [ ] Search filters by team name
- [ ] Search filters by submitter name
- [ ] Search filters by description
- [ ] Sort by date (asc/desc) works
- [ ] Sort by points (asc/desc) works
- [ ] Tournament filter works in reviewer page
- [ ] Empty state shows appropriate message
- [ ] Loading state shows skeleton
- [ ] Mobile layout is usable
- [ ] Keyboard navigation works
- [ ] Screen reader announces state changes
- [ ] Images display when array is non-empty (future)
- [ ] Lightbox opens on image click (future)

---

## 7. Open Questions & Decisions Needed

### Q1: Image Storage Implementation

**Question**: When should image storage be implemented, and what service should be used?

**Options**:

1. **Convex File Storage** - Native solution, integrated with backend
2. **Cloudinary** - CDN, image optimization, transformations
3. **Vercel Blob** - Simple, integrated with Vercel deployment
4. **AWS S3** - Scalable, industry standard

**Recommendation**: Start with Convex File Storage for simplicity, migrate to CDN later if needed for optimization.

**Decision Required**: Product team

**Impact on Spec**: Component APIs already designed to support images via URL array. Implementation can be deferred.

### Q2: Bulk Operations

**Question**: Should reviewers be able to approve/reject multiple submissions at once?

**Use Case**: Tournament manager has 50 pending submissions from a one-day event, wants to approve all from a specific team.

**Options**:

1. Add checkbox selection to `SubmissionReviewList`
2. Add "Approve All Filtered" button (dangerous)
3. No bulk operations (review individually)

**Recommendation**: Phase 2 feature - add checkbox selection with "Approve Selected" action. Requires backend mutation for batch approval.

**Decision Required**: Product team

**Impact on Spec**: Minor enhancement to `SubmissionReviewList`, new backend mutation.

### Q3: Rejection Feedback

**Question**: Should rejections include a reason/comment for the submitter?

**Current State**: Submissions just marked "rejected" with no feedback.

**Options**:

1. Add optional rejection reason (text field)
2. Add predefined rejection reasons (dropdown)
3. Add both (dropdown + optional note)
4. No feedback (current state)

**Recommendation**: Add optional text field for rejection notes. Store in `submissions.rejectionReason` field.

**Decision Required**: Product team

**Impact on Spec**:

- Schema change: Add `rejectionReason?: v.string()` to submissions table
- UI change: Show textarea on reject action
- Display rejection reason in submission details

### Q4: Notification System

**Question**: Should submitters be notified when their submission is approved/rejected?

**Options**:

1. Email notifications (requires email service)
2. In-app notifications (toast on next login)
3. Notification center/bell icon
4. No notifications

**Recommendation**: Start with in-app toast notifications (simple), add email later.

**Decision Required**: Product team

**Impact on Spec**: Separate feature, not part of component spec.

### Q5: Reviewer Assignment

**Question**: Should submissions be assigned to specific reviewers, or can any reviewer approve?

**Current State**: Any reviewer/admin can approve any submission.

**Options**:

1. Tournament-based assignment (reviewer assigned to specific tournaments)
2. Team-based assignment
3. Round-robin assignment
4. Open queue (current state)

**Recommendation**: Keep open queue for simplicity. Add assignment system later if review volume increases.

**Decision Required**: Product team

**Impact on Spec**: Backend queries would filter by assignment, frontend components unchanged.

---

## 8. Success Metrics

### Component Quality

- [ ] All props have TypeScript types
- [ ] All components have TSDoc documentation
- [ ] All interactive elements have ARIA labels
- [ ] All components are mobile-responsive
- [ ] Loading states defined for all async actions
- [ ] Error states defined for all failure scenarios

### Functional Completeness

- [ ] Individual submissions display correctly
- [ ] Group submissions display correctly
- [ ] Approve/reject actions work for both types
- [ ] Search filters correctly
- [ ] Sort changes order correctly
- [ ] Empty states show appropriate messages
- [ ] Real-time updates work (Convex reactivity)

### User Experience

- [ ] Actions complete in <500ms (perceived performance)
- [ ] Toast notifications appear for all state changes
- [ ] No layout shift during loading
- [ ] Keyboard navigation works
- [ ] Touch targets are ≥44px on mobile
- [ ] Color contrast meets WCAG AA

### Code Quality

- [ ] No prop drilling (use composition)
- [ ] Reusable components extracted
- [ ] No duplicated logic between routes
- [ ] Follows existing shadcn/ui patterns
- [ ] Tailwind classes sorted (Biome)
- [ ] Double quotes for strings (Biome)

---

## 9. Future Enhancements (Not in Scope)

### Phase 2 Features

1. **Detailed Modal View**
   - Click submission → open modal with full details
   - Navigate between submissions in modal
   - Approve/reject from modal

2. **Batch Operations**
   - Checkbox selection
   - "Approve Selected" button
   - Backend mutation for batch approval

3. **Rejection Feedback**
   - Optional rejection reason
   - Display reason to submitter
   - Predefined reason templates

4. **Advanced Filtering**
   - Date range picker
   - Tier filter (base/advanced)
   - Points range filter
   - User filter

5. **Export/Reporting**
   - Export submission list to CSV
   - Generate approval/rejection report
   - Review statistics by reviewer

### Future Integration

6. **Image Storage**
   - Convex File Storage integration
   - Upload flow in submission form
   - Image optimization/thumbnails
   - Multiple image support

7. **Submission History/Audit Log**
   - Track all state changes
   - Show approval/rejection timeline
   - Revert actions (admin only)

8. **Mobile App Support**
   - Review submissions on mobile
   - Push notifications
   - Camera upload for images

---

## 10. Appendix

### File Structure (After Implementation)

```
src/
├── components/
│   └── submissions/
│       ├── review/                              # NEW
│       │   ├── submission-review-card.tsx
│       │   ├── submission-review-list.tsx
│       │   ├── group-participants-list.tsx
│       │   ├── types.ts
│       │   └── transforms.ts
│       │
│       ├── display/                             # REFACTORED
│       │   ├── submission-card.tsx
│       │   ├── submission-image-gallery.tsx     # Renamed from submission-card-image
│       │   ├── submission-card-details.tsx
│       │   ├── submission-card-actions.tsx
│       │   └── submission-metadata.tsx          # NEW
│       │
│       └── submission-card-list.tsx             # DEPRECATED (keep for compatibility)
│
└── app/
    └── (protected)/
        ├── manage/
        │   └── submissions/
        │       └── page.tsx                     # REFACTORED
        │
        └── reviewer/
            ├── page.tsx                         # REFACTORED
            └── statistics/
                └── page.tsx                     # Unchanged
```

### Dependencies

**Existing (Already in Project)**:

- `@tanstack/react-table` - Not used in this spec
- `convex` - Backend queries/mutations
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `class-variance-authority` - Badge variants
- `tailwind-merge` + `clsx` - Class merging

**No New Dependencies Required**

### Related Specifications

- **Spec 20**: UTC Date Migration (affects date display in metadata)
- **Spec 28**: Team Activity Groups (implements group submission logic)
- **Spec 29**: Tournament Manager Dashboard (uses same submission data)
- **Future Spec**: Image Storage Implementation (will populate images array)

### Design Mockups

_(Include Figma/design tool links here if available)_

### API Reference

**Convex Functions Used**:

```typescript
// Queries
api.submissions.getDetails(submissionId: Id<"submissions">)
→ Returns: { submission, team, tournament, submitter, teammates, managedByUser, isTeamExercise, canEdit, canApprove, canReject, canDelete }

api.submissionGroups.getWithSubmissions(groupId: Id<"submissionGroups">)
→ Returns: { ...group, submissions: [...] }

api.reviewer.getPendingSubmissions({ tournamentId?: Id<"tournaments"> })
→ Returns: { items: ReviewItem[], total: number, hasMore: boolean }

api.tournamentManager.getSubmissions()
→ Returns: Array<Doc<"submissions"> & { team, user }>

// Mutations
api.submissions.approve(submissionId: Id<"submissions">)
→ Approves individual or all in group if team submission

api.submissions.reject(submissionId: Id<"submissions">)
→ Rejects individual submission

api.submissionGroups.approve(groupId: Id<"submissionGroups">)
→ Approves all submissions in group

api.submissionGroups.reject(groupId: Id<"submissionGroups">)
→ Rejects all submissions in group
```

---

## Summary

This specification provides a complete blueprint for unified submission approval components that consolidate the existing `/manage/submissions` and `/reviewer` interfaces into a consistent, reusable component architecture. The design prioritizes:

1. **Reusability**: Components can be used in multiple contexts with different configurations
2. **Consistency**: Same UI patterns across admin and reviewer workflows
3. **Extensibility**: Easy to add new features (images, bulk actions, rejection feedback)
4. **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
5. **Performance**: Optimistic updates, debounced search, efficient rendering

The implementation is broken into phases that can be completed incrementally without breaking existing functionality. All backend requirements are already satisfied by existing Convex functions, minimizing risk and scope.

**Next Steps**: Review this spec with the team, make decisions on open questions, and begin Phase 1 implementation.
