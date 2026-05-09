# Spec 24: Submission Card View Presentation

**Status**: Draft
**Created**: 2025-11-20
**Owner**: Andre
**Related**: Spec 23 (Image Upload Backend)

## Overview

Transform the submission display from a table-based layout to a card-based list view that shows submission images on the left and details/actions on the right. This provides a more visual, scannable interface for reviewing submissions with photographic proof.

## Motivation

The current table-based submission view is optimized for dense data display but doesn't effectively showcase submission images, which are a critical component for verifying activity completion. A card-based layout provides:

- **Visual prominence** for submission images (primary proof of activity)
- **Better mobile experience** with stacked card layouts
- **Improved scannability** with clear visual separation between submissions
- **Contextual actions** placed alongside each submission
- **Flexible layout** that adapts to varying content (1-3 images, different description lengths)

## Goals

1. Replace table-based submission views with card-based layouts
2. Display submission image(s) prominently on the left side of each card
3. Show submission details and metadata on the right side
4. Include contextual actions (approve, reject, edit, delete) on each card
5. Support responsive design (stack vertically on mobile)
6. Maintain performance with lazy image loading
7. Preserve existing filtering and sorting capabilities

## Non-Goals

- Image upload functionality (covered in Spec 23)
- Backend image storage implementation (covered in Spec 23)
- Changing submission calendar view (stays as calendar)
- Redesigning the submission form
- Adding new submission fields

## Technical Design

### 1. Component Architecture

**New Components**:

```
src/components/submissions/
├── submission-card.tsx          # Individual card component
├── submission-card-list.tsx     # List container with filtering
├── submission-card-image.tsx    # Image display component (left side)
├── submission-card-details.tsx  # Details component (right side)
└── submission-card-actions.tsx  # Action buttons component
```

**Component Hierarchy**:

```
SubmissionCardList
└─ Filter/Sort Controls
└─ SubmissionCard (repeated)
   ├─ SubmissionCardImage (left)
   └─ div (right)
      ├─ SubmissionCardDetails
      └─ SubmissionCardActions
```

### 2. SubmissionCard Component

**File**: `src/components/submissions/submission-card.tsx`

```typescript
"use client";

import { type Doc } from "convex/_generated/dataModel";
import { SubmissionCardImage } from "./submission-card-image";
import { SubmissionCardDetails } from "./submission-card-details";
import { SubmissionCardActions } from "./submission-card-actions";

interface SubmissionCardProps {
  submission: Doc<"submissions"> & {
    team: Doc<"teams">;
    user: Doc<"users">;
  };
  images: Array<{
    _id: string;
    url: string;
    filename: string;
  }>;
  currentUser: Doc<"users">;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SubmissionCard({
  submission,
  images,
  currentUser,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: SubmissionCardProps) {
  const isAdmin = currentUser.roleNames.includes("admin") ||
                  currentUser.roleNames.includes("tournament_manager");
  const isOwner = submission.userId === currentUser._id;

  return (
    <div className="flex flex-col lg:flex-row gap-4 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Left: Image Display */}
      <div className="w-full lg:w-64 shrink-0">
        <SubmissionCardImage images={images} />
      </div>

      {/* Right: Details and Actions */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Details Section */}
        <SubmissionCardDetails
          submission={submission}
          team={submission.team}
          user={submission.user}
        />

        {/* Actions Section */}
        <SubmissionCardActions
          submission={submission}
          isAdmin={isAdmin}
          isOwner={isOwner}
          onApprove={onApprove}
          onReject={onReject}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
```

**Key Features**:

- Horizontal layout on desktop (image left, details right)
- Vertical stack on mobile (image top, details bottom)
- Hover effect with shadow transition
- Clean separation of image, details, and actions

### 3. SubmissionCardImage Component

**File**: `src/components/submissions/submission-card-image.tsx`

```typescript
"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubmissionCardImageProps {
  images: Array<{
    _id: string;
    url: string;
    filename: string;
  }>;
}

export function SubmissionCardImage({ images }: SubmissionCardImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">No images</p>
        </div>
      </div>
    );
  }

  const primaryImage = images[0];
  const hasMultiple = images.length > 1;

  return (
    <>
      {/* Primary Image Display */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setCurrentIndex(0);
            setLightboxOpen(true);
          }}
          className="group relative block w-full overflow-hidden rounded-lg"
        >
          <img
            src={primaryImage.url}
            alt={primaryImage.filename}
            className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          {hasMultiple && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
              +{images.length - 1} more
            </div>
          )}
        </button>

        {/* Thumbnail Strip (if multiple images) */}
        {hasMultiple && (
          <div className="mt-2 flex gap-2">
            {images.slice(1, 3).map((img, idx) => (
              <button
                key={img._id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx + 1);
                  setLightboxOpen(true);
                }}
                className="relative h-16 w-16 overflow-hidden rounded border hover:ring-2 hover:ring-primary"
              >
                <img
                  src={img.url}
                  alt={img.filename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            {images.length > 3 && (
              <div className="flex h-16 w-16 items-center justify-center rounded border bg-muted text-xs font-medium">
                +{images.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <div className="relative">
            <img
              src={images[currentIndex]?.url}
              alt={images[currentIndex]?.filename}
              className="h-auto w-full max-h-[70vh] object-contain"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev === 0 ? images.length - 1 : prev - 1
                    )
                  }
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev === images.length - 1 ? 0 : prev + 1
                    )
                  }
                >
                  <ChevronRight />
                </Button>
              </>
            )}

            <div className="mt-4 text-center">
              <p className="text-sm font-medium">{images[currentIndex]?.filename}</p>
              {images.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  {currentIndex + 1} / {images.length}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Key Features**:

- Large primary image with aspect ratio preservation
- "+N more" badge for multiple images
- Thumbnail strip showing up to 2 additional images
- Click to open lightbox with full-size view
- Keyboard navigation in lightbox
- Empty state for submissions without images
- Lazy loading for performance

### 4. SubmissionCardDetails Component

**File**: `src/components/submissions/submission-card-details.tsx`

```typescript
"use client";

import { type Doc } from "convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, User, Users } from "lucide-react";
import { format } from "date-fns";

interface SubmissionCardDetailsProps {
  submission: Doc<"submissions">;
  team: Doc<"teams">;
  user: Doc<"users">;
}

export function SubmissionCardDetails({
  submission,
  team,
  user,
}: SubmissionCardDetailsProps) {
  const stateColors = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    deleted: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const tierColors = {
    base: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className="flex-1 space-y-3">
      {/* Header: Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className={stateColors[submission.state]}>
          {submission.state.charAt(0).toUpperCase() + submission.state.slice(1)}
        </Badge>
        {submission.tier && (
          <Badge className={tierColors[submission.tier]}>
            {submission.tier === "base" ? "Base Tier" : "Advanced Tier"}
          </Badge>
        )}
        {submission.submissionType === "team" && (
          <Badge variant="outline">
            <Users className="mr-1 h-3 w-3" />
            Team Exercise
          </Badge>
        )}
        {submission.pointsEarned && submission.pointsEarned > 0 && (
          <Badge variant="outline">
            <Trophy className="mr-1 h-3 w-3" />
            {submission.pointsEarned} points
          </Badge>
        )}
      </div>

      {/* Metadata Grid */}
      <div className="grid gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(submission.date), "MMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{team.name}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{user.name}</span>
        </div>
      </div>

      {/* Description */}
      {submission.description && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {submission.description}
          </p>
        </div>
      )}
    </div>
  );
}
```

**Key Features**:

- Color-coded state badges (pending/approved/rejected)
- Tier indicator (base/advanced)
- Team exercise badge
- Points earned display
- Metadata with icons (date, team, user)
- Description with line clamping (max 3 lines)

### 5. SubmissionCardActions Component

**File**: `src/components/submissions/submission-card-actions.tsx`

```typescript
"use client";

import { type Doc } from "convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Check, X, Edit, Trash2 } from "lucide-react";

interface SubmissionCardActionsProps {
  submission: Doc<"submissions">;
  isAdmin: boolean;
  isOwner: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SubmissionCardActions({
  submission,
  isAdmin,
  isOwner,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: SubmissionCardActionsProps) {
  const isPending = submission.state === "pending";
  const canApprove = isAdmin && isPending && onApprove;
  const canReject = isAdmin && isPending && onReject;
  const canEdit = isOwner && submission.state !== "approved" && onEdit;
  const canDelete = (isAdmin || isOwner) && onDelete;

  // Don't render if no actions available
  if (!canApprove && !canReject && !canEdit && !canDelete) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-t pt-3">
      {/* Admin Actions */}
      {canApprove && (
        <Button
          size="sm"
          variant="default"
          className="bg-green-600 hover:bg-green-700"
          onClick={onApprove}
        >
          <Check className="mr-1 h-4 w-4" />
          Approve
        </Button>
      )}
      {canReject && (
        <Button
          size="sm"
          variant="destructive"
          onClick={onReject}
        >
          <X className="mr-1 h-4 w-4" />
          Reject
        </Button>
      )}

      {/* Owner Actions */}
      {canEdit && (
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
        >
          <Edit className="mr-1 h-4 w-4" />
          Edit
        </Button>
      )}
      {canDelete && (
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      )}
    </div>
  );
}
```

**Key Features**:

- Conditional rendering based on permissions
- Admin actions: Approve (green), Reject (red)
- Owner actions: Edit, Delete
- Icon + text labels
- Responsive button sizing
- Hidden when no actions available

### 6. SubmissionCardList Component

**File**: `src/components/submissions/submission-card-list.tsx`

```typescript
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { SubmissionCard } from "./submission-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SubmissionCardListProps {
  submissions: Array<Doc<"submissions"> & {
    team: Doc<"teams">;
    user: Doc<"users">;
  }>;
  currentUser: Doc<"users">;
  onApprove?: (submissionId: string) => void;
  onReject?: (submissionId: string) => void;
  onEdit?: (submissionId: string) => void;
  onDelete?: (submissionId: string) => void;
}

export function SubmissionCardList({
  submissions,
  currentUser,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: SubmissionCardListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.team.name.toLowerCase().includes(query) ||
          s.user.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
      );
    }

    // State filter
    if (stateFilter !== "all") {
      filtered = filtered.filter((s) => s.state === stateFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "points-desc":
          return (b.pointsEarned || 0) - (a.pointsEarned || 0);
        case "points-asc":
          return (a.pointsEarned || 0) - (b.pointsEarned || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [submissions, searchQuery, stateFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by team, user, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="points-desc">Most Points</SelectItem>
              <SelectItem value="points-asc">Least Points</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredSubmissions.length} of {submissions.length} submissions
      </div>

      {/* Submission Cards */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No submissions found</p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission._id}
              submission={submission}
              images={[]} // Will be fetched per card
              currentUser={currentUser}
              onApprove={() => onApprove?.(submission._id)}
              onReject={() => onReject?.(submission._id)}
              onEdit={() => onEdit?.(submission._id)}
              onDelete={() => onDelete?.(submission._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

**Key Features**:

- Search across team name, user name, and description
- Filter by status (all/pending/approved/rejected)
- Sort by date or points (ascending/descending)
- Results counter
- Empty state message
- Responsive filter controls

### 7. Integration with Existing Pages

**Pages to Update**:

1. **`/submissions` (All Submissions Page)**
   - Replace `SubmissionsDataTable` with `SubmissionCardList`
   - Keep existing query logic
   - Maintain admin filtering

2. **`/teams/[id]` (Team Submissions)**
   - Replace table with `SubmissionCardList`
   - Filter to team's submissions only

3. **`/tournaments/[id]/submissions` (Tournament Submissions)**
   - Replace table with `SubmissionCardList`
   - Filter to tournament's submissions

**Example Integration** (`src/app/(all)/submissions/page.tsx`):

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { SubmissionCardList } from "@/components/submissions/submission-card-list";
import { useMutation } from "convex/react";

export default function SubmissionsPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const submissions = useQuery(api.submissions.list);
  const approve = useMutation(api.submissions.approve);
  const reject = useMutation(api.submissions.reject);
  const remove = useMutation(api.submissions.remove);

  if (!currentUser || !submissions) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">All Submissions</h1>
        <p className="text-muted-foreground">
          Review and manage tournament submissions
        </p>
      </div>

      <SubmissionCardList
        submissions={submissions}
        currentUser={currentUser}
        onApprove={(id) => approve({ submissionId: id })}
        onReject={(id) => reject({ submissionId: id })}
        onDelete={(id) => remove({ submissionId: id })}
      />
    </div>
  );
}
```

## UI/UX Considerations

### Visual Hierarchy

1. **Image First**: Images are the primary proof, so they get prominent left placement
2. **Status Second**: State badges are immediately visible at top of details
3. **Metadata Third**: Date, team, user information in scannable format
4. **Actions Last**: Contextual actions at bottom, separated by border

### Responsive Design

**Desktop (lg and above)**:

```
┌─────────────────────────────────────────────────┐
│ [Image]    │ [Badges]                           │
│            │ [Metadata: Date, Team, User]       │
│            │ [Description]                      │
│            │ ──────────────────────────         │
│            │ [Approve] [Reject] [Edit] [Delete] │
└─────────────────────────────────────────────────┘
```

**Mobile (< lg)**:

```
┌───────────────────┐
│     [Image]       │
├───────────────────┤
│ [Badges]          │
│ [Metadata]        │
│ [Description]     │
│ ───────────       │
│ [Actions]         │
└───────────────────┘
```

### Performance Optimizations

1. **Lazy Image Loading**: Use `loading="lazy"` on all images
2. **Virtual Scrolling**: Consider react-window for 100+ submissions
3. **Optimistic Updates**: Show action results immediately
4. **Skeleton Loading**: Show card skeletons while data loads
5. **Intersection Observer**: Only fetch images when cards enter viewport

## Migration Strategy

### Phase 1: Parallel Implementation

- Build new card components alongside existing table
- Add feature flag or route parameter to toggle views
- Test with subset of users

### Phase 2: Gradual Rollout

- Default to card view for new users
- Allow existing users to toggle (user preference)
- Monitor performance and user feedback

### Phase 3: Full Replacement

- Remove table implementation
- Remove toggle controls
- Update documentation

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels on badges and buttons
- **Focus Management**: Visible focus states on all controls
- **Color Contrast**: All text meets WCAG AA standards
- **Semantic HTML**: Use proper heading hierarchy

## Open Questions

1. **Virtual Scrolling**: Should we implement virtual scrolling for large lists (100+ submissions)?
   - **Recommendation**: Start without, add if performance issues arise

2. **Card Density**: Should we offer compact/comfortable/spacious view options?
   - **Recommendation**: Start with one density, add variants if requested

3. **Bulk Actions**: How do users approve/reject multiple submissions at once?
   - **Recommendation**: Phase 2 feature - add checkboxes and bulk action toolbar

4. **Animation**: Should cards animate in on load?
   - **Recommendation**: Subtle fade-in only, avoid distracting animations

## Success Metrics

- Card view loads in < 2 seconds for 50 submissions
- Images load progressively (no layout shift)
- All actions functional with keyboard only
- Mobile layout works on screens down to 320px width
- User satisfaction increase (collect feedback)

## Dependencies

**Existing Components** (no new packages needed):

- `@/components/ui/badge`
- `@/components/ui/button`
- `@/components/ui/dialog`
- `@/components/ui/input`
- `@/components/ui/select`
- `lucide-react` icons

**Related Specs**:

- Spec 23: Submission Image Upload Backend (provides image data)
