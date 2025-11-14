# Loading States: Implement Skeleton Screens

**Priority:** High
**Status:** Ready for Implementation
**Estimated Effort:** 1-2 days

---

## Problem Statement

The application has **two loading state issues**:

1. **Missing Loading States**: 9 locations with `TODO: Add skeleton` comments where data loading is not handled, causing blank screens
2. **Inconsistent Implementations**: 4 components with inline skeleton code that should be extracted into reusable components

When data is being fetched from Convex, users see either a blank screen or a flash of empty content before the actual data appears.

**User Experience Impact:**

- **Jarring Experience**: Pages "pop in" suddenly rather than loading gracefully
- **Perceived Performance**: Users may think the app is broken or slow
- **Lack of Feedback**: No indication that data is being loaded
- **Poor UX Standard**: Modern apps use skeleton screens to indicate loading states

**Code Quality Impact:**

- **Duplication**: ~100 lines of duplicate inline skeleton code across 4 components
- **Inconsistency**: Different skeleton implementations for similar UI patterns
- **Maintainability**: Changes to skeleton styles require updating multiple locations

---

## Current State

### What Exists

**Skeleton Component:**

- ✅ Basic `Skeleton` component exists at `src/components/ui/skeleton.tsx`
- ✅ Used in `sidebar.tsx` for menu loading states
- ✅ Supports customizable sizing and styling via className

**Component Structure:**

```typescript
<Skeleton className="h-4 w-full" />  // Simple animated placeholder
```

### Existing Loading States (Need Extraction)

**4 Components with Inline Skeleton Implementations:**

These components have custom loading states that should be extracted into reusable skeleton components for consistency:

1. **`src/components/teams/team-statistics-card.tsx:40-54`**

   - Type: Grid of 6 stat cards (2 columns on md, 3 on lg)
   - Implementation: Inline Card skeleton with animate-pulse
   - Should use: StatCardsGridSkeleton (new component)

2. **`src/components/tournaments/tournament-leaderboard.tsx:71-105`**

   - Type: Table with 4 columns (Rank, Team Name, Points, Members), 5 rows
   - Implementation: Inline table skeleton with custom styling
   - Should use: TableSkeleton (with leaderboard-specific styling)

3. **`src/components/tournaments/leaderboard-podium.tsx:53-68`**

   - Type: Grid of 3 podium cards with icon, title, and score placeholders
   - Implementation: Inline Card skeleton grid
   - Should use: PodiumSkeleton (new component)

4. **`src/components/tournaments/winner-announcement.tsx:18-32`**
   - Type: Single highlighted card with title and content sections
   - Implementation: Inline div skeletons in Card
   - Should use: WinnerAnnouncementSkeleton (new component)

### What's Missing

**9 Components/Pages Without Loading States:**

1. **`src/components/tournaments/tournament-details-card.tsx:68`**

   - Component: `TournamentDetailsCard`
   - Type: DetailsCard with title, description, and key-value details
   - Loading condition: `tournament === undefined`

2. **`src/app/(all)/users/page.tsx:22`**

   - Component: Users list page
   - Type: Table with Name, Email, Roles columns
   - Loading condition: `!users`

3. **`src/components/users/user-details-card.tsx:10`**

   - Component: `UserDetailsCard`
   - Type: DetailsCard with user information
   - Loading condition: `!user`
   - Note: User is passed as prop, may need parent handling

4. **`src/app/(all)/users/[userId]/page.tsx:23`**

   - Component: User detail page
   - Type: Page with UserDetailsCard and teams section
   - Loading condition: `!user`

5. **`src/components/teams/team-details-card.tsx:122`**

   - Component: `TeamDetailsCard`
   - Type: DetailsCard with team information and members
   - Loading condition: `team === undefined`

6. **`src/app/(all)/submissions/[submissionId]/page.tsx:24`**

   - Component: Submission detail page
   - Type: Page with submission card and details
   - Loading condition: `!submission`

7. **`src/app/(all)/tournaments/page.tsx:36`**

   - Component: Tournaments list page
   - Type: Grid layout with TournamentCard components (2 columns on XL screens)
   - Loading condition: `!userTournaments`

8. **`src/app/(all)/tournaments/[tournamentId]/page.tsx:75`**

   - Component: Tournament detail page
   - Type: Page with TournamentDetailsCard, tabs, and team cards
   - Loading condition: `!tournament`

9. **`src/app/(all)/teams/[teamId]/page.tsx:38`**
   - Component: Team detail page
   - Type: Page with TeamDetailsCard and member sections
   - Loading condition: `!team || !members`

### Evidence

All instances found via:

```bash
grep -ri "TODO.*skeleton" src/
```

See lines referenced above for exact locations.

---

## Requirements

### Functional Requirements

1. **Create Reusable Skeleton Components**

   - DetailsCardSkeleton for card-based loading states
   - TableSkeleton for table-based loading states
   - CardGridSkeleton for grid-based loading states
   - PageSkeleton for full page loading states
   - StatCardsGridSkeleton for statistics cards grid
   - PodiumSkeleton for leaderboard podium display
   - WinnerAnnouncementSkeleton for winner card

2. **Extract Existing Inline Skeletons**

   - Extract team-statistics-card inline skeleton to StatCardsGridSkeleton
   - Refactor tournament-leaderboard to use TableSkeleton
   - Extract leaderboard-podium inline skeleton to PodiumSkeleton
   - Extract winner-announcement inline skeleton to WinnerAnnouncementSkeleton

3. **Replace All TODO Comments**

   - Replace `return null` with appropriate skeleton components
   - Maintain proper component structure and sizing
   - Ensure skeletons match the layout of loaded content

4. **Consistent Animation**

   - Use existing `animate-pulse` from Skeleton component
   - Ensure consistent timing across all skeletons

5. **Accessible Loading States**
   - Add `aria-busy="true"` to loading containers
   - Add `role="status"` to skeleton wrappers
   - Include screen reader text for loading states

### Non-Functional Requirements

1. **Visual Consistency**: Skeleton sizes should closely match actual content
2. **Performance**: Skeletons should render immediately without delay
3. **Maintainability**: Create reusable skeleton components to avoid duplication
4. **Responsive**: Skeletons should adapt to different screen sizes like actual content
5. **Smooth Transitions**: No flash of loading state for fast queries (optional: delay skeleton by 200ms)

---

## Frontend Implementation

### Phase 1: Create Reusable Skeleton Components

#### 1.1 DetailsCardSkeleton Component

**File:** `src/components/ui/details-card-skeleton.tsx`

```typescript
import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  detailsCount?: number;
  showActions?: boolean;
  className?: string;
};

export function DetailsCardSkeleton({
  detailsCount = 4,
  showActions = true,
  className
}: Props) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between">
          <div className="flex-1 space-y-2">
            {/* Title */}
            <Skeleton className="h-7 w-3/4" />
            {/* Description */}
            <Skeleton className="h-4 w-full" />
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {Array.from({ length: detailsCount }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Usage:**

```typescript
if (tournament === undefined) {
  return <DetailsCardSkeleton detailsCount={5} />;
}
```

#### 1.2 TableSkeleton Component

**File:** `src/components/ui/table-skeleton.tsx`

```typescript
import { Card } from "./card";
import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

type Props = {
  columns: number;
  rows?: number;
  headers?: string[];
  className?: string;
};

export function TableSkeleton({
  columns,
  rows = 5,
  headers,
  className
}: Props) {
  return (
    <Card className={className}>
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            {headers ? (
              headers.map((header) => (
                <TableHead key={header} className="p-3">
                  {header}
                </TableHead>
              ))
            ) : (
              Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i} className="p-3">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex} className="p-3">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
```

**Usage:**

```typescript
if (!users) {
  return <TableSkeleton columns={3} headers={["Name", "Email", "Roles"]} rows={5} />;
}
```

#### 1.3 CardGridSkeleton Component

**File:** `src/components/ui/card-grid-skeleton.tsx`

```typescript
import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  count?: number;
  className?: string;
};

export function CardGridSkeleton({ count = 4, className }: Props) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Usage:**

```typescript
if (!tournaments) {
  return (
    <>
      <SectionHeader as="h1" title="Tournaments" />
      <CardGridSkeleton
        count={6}
        className="grid min-w-max grid-cols-1 gap-2 xl:grid-cols-2"
      />
    </>
  );
}
```

#### 1.4 StatCardsGridSkeleton Component

**File:** `src/components/ui/stat-cards-grid-skeleton.tsx`

```typescript
import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  count?: number;
  className?: string;
};

export function StatCardsGridSkeleton({ count = 6, className }: Props) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent className="pt-2">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Usage:**

```typescript
// In team-statistics-card.tsx
if (stats === undefined || team === undefined) {
  return (
    <StatCardsGridSkeleton
      count={6}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    />
  );
}
```

#### 1.5 PodiumSkeleton Component

**File:** `src/components/ui/podium-skeleton.tsx`

```typescript
import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  className?: string;
};

export function PodiumSkeleton({ className }: Props) {
  return (
    <div className={className}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col items-center p-6">
            <Skeleton className="mb-4 h-12 w-12 rounded-full" />
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Usage:**

```typescript
// In leaderboard-podium.tsx
if (leaderboard === undefined) {
  return <PodiumSkeleton className="grid grid-cols-1 gap-4 md:grid-cols-3" />;
}
```

#### 1.6 WinnerAnnouncementSkeleton Component

**File:** `src/components/ui/winner-announcement-skeleton.tsx`

```typescript
import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

type Props = {
  className?: string;
};

export function WinnerAnnouncementSkeleton({ className }: Props) {
  return (
    <Card className={`border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 ${className}`}>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardContent>
    </Card>
  );
}
```

**Usage:**

```typescript
// In winner-announcement.tsx
if (winner === undefined) {
  return <WinnerAnnouncementSkeleton />;
}
```

#### 1.7 PageSkeleton Component

**File:** `src/components/ui/page-skeleton.tsx`

```typescript
import { SectionHeader } from "../section-header";
import { DetailsCardSkeleton } from "./details-card-skeleton";
import { Skeleton } from "./skeleton";

type Props = {
  showHeader?: boolean;
  headerTitle?: string;
  sections?: number;
};

export function PageSkeleton({
  showHeader = true,
  headerTitle = "Loading...",
  sections = 2
}: Props) {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      {showHeader && <SectionHeader as="h1" title={headerTitle} />}

      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="space-y-4">
          {i > 0 && <Skeleton className="h-6 w-48" />}
          <DetailsCardSkeleton />
        </div>
      ))}

      <span className="sr-only">Loading content...</span>
    </div>
  );
}
```

### Phase 2: Implement Skeletons in Components

#### 2.1 TournamentDetailsCard

**File:** `src/components/tournaments/tournament-details-card.tsx:68`

**Before:**

```typescript
if (tournament === undefined) return null; // TODO: Add skeleton
```

**After:**

```typescript
import { DetailsCardSkeleton } from "../ui/details-card-skeleton";

// ... in component
if (tournament === undefined) {
  return <DetailsCardSkeleton detailsCount={5} className={className} />;
}
```

#### 2.2 Users List Page

**File:** `src/app/(all)/users/page.tsx:22`

**Before:**

```typescript
if (!users) return null; // TODO: Add skeleton
```

**After:**

```typescript
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { SectionHeader } from "@/components/section-header";

// ... in component
if (!users) {
  return (
    <>
      <SectionHeader as="h1" title="Users" />
      <TableSkeleton
        columns={3}
        headers={["Name", "Email", "Roles"]}
        rows={8}
      />
    </>
  );
}
```

#### 2.3 UserDetailsCard

**File:** `src/components/users/user-details-card.tsx:10`

**Before:**

```typescript
if (!user) return null; // TODO: Add skeleton
```

**After:**

```typescript
import { DetailsCardSkeleton } from "../ui/details-card-skeleton";

// ... in component
if (!user) {
  return <DetailsCardSkeleton detailsCount={1} className={className} />;
}
```

#### 2.4 User Detail Page

**File:** `src/app/(all)/users/[userId]/page.tsx:23`

**Before:**

```typescript
if (!user) return null; // TODO: Add skeleton
```

**After:**

```typescript
import { PageSkeleton } from "@/components/ui/page-skeleton";

// ... in component
if (!user) {
  return <PageSkeleton headerTitle="User Details" sections={2} />;
}
```

#### 2.5 TeamDetailsCard

**File:** `src/components/teams/team-details-card.tsx:122`

**Before:**

```typescript
if (team === undefined) return null; // TODO: Add skeleton
```

**After:**

```typescript
import { DetailsCardSkeleton } from "../ui/details-card-skeleton";

// ... in component
if (team === undefined) {
  return <DetailsCardSkeleton detailsCount={4} className={className} />;
}
```

#### 2.6 Submission Detail Page

**File:** `src/app/(all)/submissions/[submissionId]/page.tsx:24`

**Before:**

```typescript
if (!submission) return null; // TODO: add skeleton
```

**After:**

```typescript
import { PageSkeleton } from "@/components/ui/page-skeleton";

// ... in component
if (!submission) {
  return <PageSkeleton headerTitle="Submission Details" sections={1} />;
}
```

#### 2.7 Tournaments List Page

**File:** `src/app/(all)/tournaments/page.tsx:36`

**Before:**

```typescript
if (!userTournaments) return null; // TODO: Add skeleton
```

**After:**

```typescript
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";

// ... in component
if (!userTournaments) {
  return (
    <>
      <SectionHeader as="h1" title="Tournaments">
        {isAdmin && <UpsertTournamentFormDialog />}
      </SectionHeader>
      <CardGridSkeleton
        count={6}
        className="grid min-w-max grid-cols-1 gap-2 xl:grid-cols-2"
      />
    </>
  );
}
```

#### 2.8 Tournament Detail Page

**File:** `src/app/(all)/tournaments/[tournamentId]/page.tsx:75`

**Before:**

```typescript
if (!tournament) return null; // TODO: Add skeleton
```

**After:**

```typescript
import { PageSkeleton } from "@/components/ui/page-skeleton";

// ... in component
if (!tournament) {
  return <PageSkeleton headerTitle="Tournament Details" sections={2} />;
}
```

#### 2.9 Team Detail Page

**File:** `src/app/(all)/teams/[teamId]/page.tsx:38`

**Before:**

```typescript
if (!team || !members) return null; // TODO: Add skeleton
```

**After:**

```typescript
import { PageSkeleton } from "@/components/ui/page-skeleton";

// ... in component
if (!team || !members) {
  return <PageSkeleton headerTitle="Team Details" sections={3} />;
}
```

### Phase 3: Extract Existing Inline Skeletons

#### 3.1 TeamStatisticsCard

**File:** `src/components/teams/team-statistics-card.tsx:39-55`

**Before:**

```typescript
if (stats === undefined || team === undefined) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-5 w-32 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-20 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**After:**

```typescript
import { StatCardsGridSkeleton } from "../ui/stat-cards-grid-skeleton";

// ... in component
if (stats === undefined || team === undefined) {
  return (
    <StatCardsGridSkeleton
      count={6}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    />
  );
}
```

#### 3.2 TournamentLeaderboard

**File:** `src/components/tournaments/tournament-leaderboard.tsx:71-105`

**Before:**

```typescript
if (leaderboard === undefined) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Team Name</TableHead>
            <TableHead className="w-24 text-right">Points</TableHead>
            <TableHead className="w-24 text-right">Members</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton
            <TableRow key={i}>
              <TableCell>
                <div className="h-5 w-8 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="ml-auto h-5 w-12 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="ml-auto h-5 w-12 animate-pulse rounded bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**After:**

```typescript
import { TableSkeleton } from "../ui/table-skeleton";

// ... in component
if (leaderboard === undefined) {
  return (
    <TableSkeleton
      columns={4}
      headers={["Rank", "Team Name", "Points", "Members"]}
      rows={5}
      className="overflow-hidden"
    />
  );
}
```

**Note:** The existing border and rounded styling is maintained by TableSkeleton which wraps Table in a Card.

#### 3.3 LeaderboardPodium

**File:** `src/components/tournaments/leaderboard-podium.tsx:53-68`

**Before:**

```typescript
if (leaderboard === undefined) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton
        <Card key={i} className="animate-pulse">
          <CardContent className="flex flex-col items-center p-6">
            <div className="mb-4 h-16 w-16 rounded-full bg-muted" />
            <div className="mb-2 h-6 w-32 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**After:**

```typescript
import { PodiumSkeleton } from "../ui/podium-skeleton";

// ... in component
if (leaderboard === undefined) {
  return <PodiumSkeleton className="grid grid-cols-1 gap-4 md:grid-cols-3" />;
}
```

#### 3.4 WinnerAnnouncement

**File:** `src/components/tournaments/winner-announcement.tsx:18-32`

**Before:**

```typescript
if (winner === undefined) {
  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
```

**After:**

```typescript
import { WinnerAnnouncementSkeleton } from "../ui/winner-announcement-skeleton";

// ... in component
if (winner === undefined) {
  return <WinnerAnnouncementSkeleton />;
}
```

---

## UI/UX Considerations

### Design Principles

1. **Match Content Layout**

   - Skeletons should mirror the structure of loaded content
   - Use similar spacing, sizing, and card layouts
   - Maintain responsive grid/table layouts

2. **Visual Hierarchy**

   - Larger skeletons for titles (h-6 to h-7)
   - Medium skeletons for descriptions (h-4)
   - Smaller skeletons for labels (h-3 to h-4)

3. **Animation Timing**

   - Use existing `animate-pulse` from Tailwind
   - Consider adding optional delay (200ms) before showing skeleton to avoid flash on fast loads

4. **Color and Contrast**
   - Use `bg-accent` (existing pattern from skeleton.tsx)
   - Ensure sufficient contrast for visibility
   - Maintain consistency with design system

### Accessibility

**ARIA Attributes:**

```typescript
<div role="status" aria-busy="true">
  {/* Skeleton content */}
  <span className="sr-only">Loading content...</span>
</div>
```

**Screen Reader Considerations:**

- Add hidden text describing loading state
- Use `aria-busy` to indicate dynamic content
- Ensure focus management during state transitions

---

## Testing Strategy

### Manual Testing Checklist

**For Each New Loading State (9 components):**

- [ ] Skeleton appears immediately when loading
- [ ] Skeleton size/shape matches actual content
- [ ] Animation is smooth and consistent
- [ ] No layout shift when content loads
- [ ] Responsive behavior matches actual content
- [ ] Accessible via keyboard navigation
- [ ] Screen reader announces loading state

**For Each Refactored Component (4 components):**

- [ ] Skeleton appearance unchanged after refactoring
- [ ] No visual regressions
- [ ] Animation timing remains the same
- [ ] Layout and spacing maintained
- [ ] Component still functions correctly

**Visual Regression:**

- [ ] Compare skeleton layouts side-by-side with loaded content
- [ ] Test on different screen sizes (mobile, tablet, desktop)
- [ ] Verify grid/table layouts maintain structure
- [ ] Verify refactored components look identical to before

**Performance:**

- [ ] Skeletons render within 50ms
- [ ] No noticeable delay before skeleton appears
- [ ] Smooth transition from skeleton to content
- [ ] No performance degradation in refactored components

### Automated Tests (Optional)

```typescript
// Example Jest/Testing Library test
describe("TournamentDetailsCard", () => {
  it("shows skeleton while loading", () => {
    const { getByRole } = render(
      <TournamentDetailsCard tournamentId="123" />
    );

    expect(getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows content after loading", async () => {
    const { findByText } = render(
      <TournamentDetailsCard tournamentId="123" />
    );

    expect(await findByText("Tournament Name")).toBeInTheDocument();
  });
});
```

---

## Edge Cases and Considerations

### Fast Network Connections

- **Problem**: Skeleton may flash briefly before content loads
- **Solution**: Add optional 200ms delay before showing skeleton
- **Implementation**: Use `useDeferredValue` or custom hook with delay

```typescript
// Optional enhancement
function useDelayedLoading(isLoading: boolean, delay = 200) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowSkeleton(true), delay);
      return () => clearTimeout(timer);
    }
    setShowSkeleton(false);
  }, [isLoading, delay]);

  return showSkeleton;
}
```

### Multiple Loading States

- **Problem**: Some pages have multiple queries (e.g., team + members)
- **Solution**: Show skeleton if ANY required data is loading
- **Example**: `if (!team || !members) return <PageSkeleton />;`

### Error States

- **Problem**: Skeleton doesn't handle query errors
- **Solution**: Add error handling after this spec (separate concern)
- **Note**: Error states are a separate feature not covered here

### Partial Data

- **Problem**: Some data may be optional (e.g., description field)
- **Solution**: Skeleton shows all possible fields, actual component hides optional ones
- **Trade-off**: Slight visual difference, but better than complex conditional skeletons

---

## Success Metrics

1. **Completion**

   - All 9 TODO comments replaced with skeleton implementations
   - All 4 inline skeletons extracted to reusable components
   - Zero `return null` for loading states in production code
   - Zero duplicate inline skeleton implementations

2. **Code Quality**

   - 7 reusable skeleton components created
   - Consistent patterns across all loading states
   - Reduced code duplication (removed ~100 lines of inline skeletons)
   - Improved maintainability

3. **Visual Quality**

   - Skeleton layouts match actual content structure
   - No visible layout shifts during load
   - Consistent animation across all components
   - Existing loading states maintain their visual appearance

4. **Accessibility**

   - All skeletons have proper ARIA attributes
   - Screen readers announce loading states
   - Keyboard navigation works during loading

5. **Performance**

   - Skeletons render in <50ms
   - No performance degradation vs. inline implementations
   - Bundle size increase <8KB (minified + gzipped) for all 7 components

6. **User Feedback**
   - Improved perceived performance
   - Reduced confusion about "blank" screens
   - Positive feedback on loading experience

---

## Migration & Deployment

### Pre-Deployment Checklist

- [ ] All 9 new loading states implemented
- [ ] All 4 inline skeletons refactored to use reusable components
- [ ] 7 skeleton components created and tested
- [ ] Visual comparison completed (skeleton vs. content)
- [ ] Refactored components maintain visual appearance
- [ ] Accessibility testing completed
- [ ] Build succeeds without errors
- [ ] Biome linting passes

### Deployment Steps

1. **Phase 1**: Create core skeleton component files (4 components)
2. **Phase 2**: Update components with new skeletons (9 components)
3. **Phase 3**: Create specialized skeletons and refactor existing components (3 + 4 components)
4. Test locally with network throttling
5. Verify no visual regressions in refactored components
6. Merge PR to main branch
7. Deploy to production
8. Monitor user feedback and metrics

### Post-Deployment Verification

- [ ] All pages show skeletons when loading
- [ ] Refactored components display skeletons correctly
- [ ] No visual regressions in leaderboard, podium, stats, or winner components
- [ ] No console errors or warnings
- [ ] Lighthouse accessibility score maintained or improved
- [ ] No user complaints about blank screens
- [ ] Analytics show improved time-to-interactive perception

### Rollback Procedure

If critical issues discovered:

1. Revert PR merge in git
2. Redeploy previous version
3. Investigate issues in development
4. Fix and redeploy

Low risk: Changes are purely visual enhancements with no logic changes.

---

## Future Enhancements

### Optional Delayed Loading

Add delayed skeleton display to avoid flash on fast connections:

```typescript
const showSkeleton = useDelayedLoading(isLoading, 200);
if (showSkeleton) return <Skeleton />;
```

### Shimmer Effect

Enhance animation with shimmer/shine effect:

```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

### Progressive Loading

Show skeleton for individual cards as they load (for paginated data):

```typescript
{items.map((item) =>
  item ? <Card data={item} /> : <CardSkeleton />
)}
```

### Skeleton Variants

Create specialized skeletons for complex layouts:

- `DashboardSkeleton` for multi-widget layouts
- `CalendarSkeleton` for submission calendar (spec 04)
- `LeaderboardSkeleton` for leaderboard tables (spec 02)

---

## Dependencies

**Blocked By:**

- None (can be implemented immediately)

**Blocks:**

- None (standalone improvement)

**Related Specs:**

- Spec 04 (submission-calendar) - Will need CalendarSkeleton
- Spec 07 (admin-dashboard) - Will need DashboardSkeleton
- Future error handling spec - Should complement skeleton states

---

## Notes

- This is a **pure UX enhancement** with no backend changes required
- Low risk: Only affects loading states, no logic changes
- High value: Significantly improves perceived performance
- Reusable skeleton components benefit future features
- Should be implemented before major feature work for consistent UX

---

## Appendix: Component Summary

### Components to Create

| Component                  | File                                  | Purpose                               | Props                                      |
| -------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------ |
| DetailsCardSkeleton        | `ui/details-card-skeleton.tsx`        | Card with title, description, details | `detailsCount`, `showActions`, `className` |
| TableSkeleton              | `ui/table-skeleton.tsx`               | Table with headers and rows           | `columns`, `rows`, `headers`, `className`  |
| CardGridSkeleton           | `ui/card-grid-skeleton.tsx`           | Grid of card skeletons                | `count`, `className`                       |
| StatCardsGridSkeleton      | `ui/stat-cards-grid-skeleton.tsx`     | Statistics cards grid                 | `count`, `className`                       |
| PodiumSkeleton             | `ui/podium-skeleton.tsx`              | Leaderboard podium display            | `className`                                |
| WinnerAnnouncementSkeleton | `ui/winner-announcement-skeleton.tsx` | Winner announcement card              | `className`                                |
| PageSkeleton               | `ui/page-skeleton.tsx`                | Full page with header and sections    | `showHeader`, `headerTitle`, `sections`    |

### Components to Update (New Loading States)

| Component             | File                                                 | Type  | Skeleton            |
| --------------------- | ---------------------------------------------------- | ----- | ------------------- |
| TournamentDetailsCard | `components/tournaments/tournament-details-card.tsx` | Card  | DetailsCardSkeleton |
| UsersPage             | `app/(all)/users/page.tsx`                           | Table | TableSkeleton       |
| UserDetailsCard       | `components/users/user-details-card.tsx`             | Card  | DetailsCardSkeleton |
| UserDetailPage        | `app/(all)/users/[userId]/page.tsx`                  | Page  | PageSkeleton        |
| TeamDetailsCard       | `components/teams/team-details-card.tsx`             | Card  | DetailsCardSkeleton |
| SubmissionDetailPage  | `app/(all)/submissions/[submissionId]/page.tsx`      | Page  | PageSkeleton        |
| TournamentsPage       | `app/(all)/tournaments/page.tsx`                     | Grid  | CardGridSkeleton    |
| TournamentDetailPage  | `app/(all)/tournaments/[tournamentId]/page.tsx`      | Page  | PageSkeleton        |
| TeamDetailPage        | `app/(all)/teams/[teamId]/page.tsx`                  | Page  | PageSkeleton        |

### Components to Refactor (Extract Existing Skeletons)

| Component             | File                                                | Current               | New Skeleton               |
| --------------------- | --------------------------------------------------- | --------------------- | -------------------------- |
| TeamStatisticsCard    | `components/teams/team-statistics-card.tsx`         | Inline grid skeleton  | StatCardsGridSkeleton      |
| TournamentLeaderboard | `components/tournaments/tournament-leaderboard.tsx` | Inline table skeleton | TableSkeleton              |
| LeaderboardPodium     | `components/tournaments/leaderboard-podium.tsx`     | Inline card grid      | PodiumSkeleton             |
| WinnerAnnouncement    | `components/tournaments/winner-announcement.tsx`    | Inline card skeleton  | WinnerAnnouncementSkeleton |

### Implementation Order

**Recommended order (least to most complex):**

**Phase 1: Create Core Skeleton Components**

1. Create DetailsCardSkeleton (simplest, most reused)
2. Create TableSkeleton
3. Create CardGridSkeleton
4. Create PageSkeleton

**Phase 2: Add Missing Loading States** 5. Update all DetailsCard components (3 components) 6. Update UsersPage with TableSkeleton (1 component) 7. Update TournamentsPage with CardGridSkeleton (1 component) 8. Update all page components with PageSkeleton (4 pages)

**Phase 3: Extract Existing Skeletons** 9. Create StatCardsGridSkeleton 10. Create PodiumSkeleton 11. Create WinnerAnnouncementSkeleton 12. Refactor TeamStatisticsCard 13. Refactor TournamentLeaderboard 14. Refactor LeaderboardPodium 15. Refactor WinnerAnnouncement

**Total: 7 new skeleton components, 9 new loading states, 4 refactored components**
