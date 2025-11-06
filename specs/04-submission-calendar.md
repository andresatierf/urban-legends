# Submission Progress Calendar

**Priority:** HIGH
**Status:** Commented Out (77 lines of code exist)
**Estimated Effort:** 1-2 days

## Problem Statement

Users have no visual way to:

- See their daily submission progress
- Identify missing days in tournaments
- Track completion streaks
- Quickly understand approval status by date

Currently, submissions are displayed in a table/list format only. A calendar view with color-coded days (submitted/missing/approved/rejected) would significantly improve user experience and encourage daily participation.

## Current State

### What Exists

- 77 lines of commented calendar code in `/submissions/page.tsx` (lines 76-153)
- Commented team selector for multi-team users
- Basic date-based filtering logic
- Submission list view with state badges

### What's Commented

```typescript
// Lines 76-153 in src/app/(all)/submissions/page.tsx
// - Calendar grid component
// - Team selector dropdown
// - Date-based submission status display
// - Visual indicators for submission states
```

### What's Missing

- Working calendar grid UI
- Date cell rendering with submission status
- Click to view/edit submission for date
- Current date highlighting
- Tournament date range restrictions

## Requirements

### Functional Requirements

1. **Calendar Grid Display**

   - Show current month by default
   - Navigate between months (prev/next buttons)
   - Highlight current date
   - Only show dates within active tournament ranges
   - Responsive grid (7 columns for days of week)

2. **Date Cell States**

   - **No submission:** Empty/gray cell
   - **Pending submission:** Yellow/orange cell
   - **Approved submission:** Green cell
   - **Rejected submission:** Red cell
   - **Deleted submission:** Gray with strikethrough (optional)
   - **Future date:** Disabled/faded cell
   - **Outside tournament:** Not selectable

3. **Interactions**

   - Click empty date → Create submission for that date
   - Click date with submission → View/edit submission
   - Hover shows tooltip with submission details
   - Double-click opens submission in modal

4. **Team Selection**

   - If user is on multiple teams, show team selector dropdown
   - Calendar updates to show selected team's submissions
   - Default to most recently active team
   - Remember selection in local storage

5. **Date Navigation**

   - Previous/Next month buttons
   - "Today" button to jump to current date
   - Month/Year picker for quick navigation
   - Keyboard navigation (arrow keys)

6. **Statistics Summary**
   - Show below calendar:
     - Total days in tournament
     - Days with submissions
     - Completion rate percentage
     - Current streak (consecutive days)
     - Approved vs pending count

### Non-Functional Requirements

- Calendar renders in <100ms
- Smooth animations when changing months
- Mobile-friendly (responsive grid)
- Color-blind friendly color scheme
- Accessible (ARIA labels, keyboard navigation)

## Database Schema Changes

No schema changes required. Uses existing:

- `submissions` table with `date`, `state`, `teamId` fields
- `tournaments` table with `startDate`, `endDate` fields

## Backend Implementation

### Existing Queries (Already Available)

#### `submissions.list`

```typescript
// Already supports date range filtering
// Used to fetch submissions for calendar month
```

#### `submissions.getUserSubmissions`

```typescript
// Fetch user's submissions for specific team and date range
// Use this for calendar data
```

### New Queries (Optional - for optimization)

#### `submissions.getMonthSubmissions`

```typescript
export const getMonthSubmissions = query({
  args: {
    teamId: v.id("teams"),
    year: v.number(),
    month: v.number(), // 1-12
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate user is member of team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    // Calculate date range for month
    const startDate = `${args.year}-${String(args.month).padStart(2, "0")}-01`;
    const endDate = new Date(args.year, args.month, 0); // Last day of month
    const endDateStr = endDate.toISOString().split("T")[0];

    // Fetch submissions for month
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team_and_date", (q) => q.eq("teamId", args.teamId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDateStr),
        ),
      )
      .collect();

    // Return map of date -> submission
    return submissions.reduce(
      (acc, sub) => {
        acc[sub.date] = {
          _id: sub._id,
          state: sub.state,
          description: sub.description,
          teammates: sub.teammates,
        };
        return acc;
      },
      {} as Record<string, any>,
    );
  },
});
```

#### `submissions.getTeamStatistics`

```typescript
export const getTeamStatistics = query({
  args: {
    teamId: v.id("teams"),
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    // Calculate:
    // - Total tournament days
    // - Days with submissions
    // - Completion rate
    // - Current streak
    // - Approved/pending/rejected counts

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const today = new Date();
    const relevantEndDate = today < endDate ? today : endDate;

    const totalDays =
      Math.floor(
        (relevantEndDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    const daysWithSubmissions = new Set(submissions.map((s) => s.date)).size;
    const completionRate = (daysWithSubmissions / totalDays) * 100;

    // Calculate streak
    let currentStreak = 0;
    const sortedDates = Array.from(
      new Set(submissions.map((s) => s.date)),
    ).sort();

    // Count backwards from today
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      if (sortedDates.includes(dateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    const stateCounts = {
      approved: submissions.filter((s) => s.state === "approved").length,
      pending: submissions.filter((s) => s.state === "pending").length,
      rejected: submissions.filter((s) => s.state === "rejected").length,
    };

    return {
      totalDays,
      daysWithSubmissions,
      completionRate: Math.round(completionRate),
      currentStreak,
      ...stateCounts,
    };
  },
});
```

## Frontend Implementation

### New Components

#### `SubmissionCalendar`

**Location:** `src/components/submissions/submission-calendar.tsx`

```typescript
interface SubmissionCalendarProps {
  teamId: Id<"teams">;
  tournamentId: Id<"tournaments">;
  onDateClick?: (date: string) => void;
}

// Features:
// - Calendar grid (7x5 or 7x6)
// - Month/year header with navigation
// - Date cells colored by submission state
// - Click handler for dates
// - Tooltips on hover
// - Responsive design
// - Loading skeleton
```

#### `CalendarDateCell`

**Location:** `src/components/submissions/calendar-date-cell.tsx`

```typescript
interface CalendarDateCellProps {
  date: Date;
  submission?: {
    _id: Id<"submissions">;
    state: "pending" | "approved" | "rejected" | "deleted";
    description?: string;
  };
  isToday: boolean;
  isDisabled: boolean;
  onClick: (date: string) => void;
}

// States:
// - Empty: border-dashed, text-gray-400
// - Pending: bg-yellow-100, border-yellow-500
// - Approved: bg-green-100, border-green-500
// - Rejected: bg-red-100, border-red-500
// - Today: ring-2 ring-blue-500
// - Disabled: opacity-50, cursor-not-allowed
```

#### `CalendarHeader`

**Location:** `src/components/submissions/calendar-header.tsx`

```typescript
interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

// Features:
// - Display "Month YYYY"
// - Prev/Next buttons (ChevronLeft/ChevronRight icons)
// - "Today" button
// - Responsive
```

#### `TeamSelector`

**Location:** `src/components/submissions/team-selector.tsx`

```typescript
interface TeamSelectorProps {
  teams: Array<{
    _id: Id<"teams">;
    name: string;
    tournamentId: Id<"tournaments">;
  }>;
  selectedTeamId: Id<"teams">;
  onTeamChange: (teamId: Id<"teams">) => void;
}

// Features:
// - Dropdown with team list
// - Show tournament name for each team
// - Remember selection in localStorage
// - Only show if user has multiple teams
```

#### `CalendarStatistics`

**Location:** `src/components/submissions/calendar-statistics.tsx`

```typescript
interface CalendarStatisticsProps {
  teamId: Id<"teams">;
  tournamentId: Id<"tournaments">;
}

// Displays:
// - Total days: 30
// - Days with submissions: 24 (80%)
// - Current streak: 7 days 🔥
// - Approved: 20 | Pending: 4 | Rejected: 0
// - Progress bar visualization
```

### Modified Pages

#### `/submissions/page.tsx`

**Location:** `src/app/(all)/submissions/page.tsx`

Uncomment and fix calendar code (lines 76-153):

```typescript
export default function SubmissionsPage() {
  const user = useUser();
  const userTeams = useQuery(api.teams.list, { userId: user?._id });

  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Select first team by default
  useEffect(() => {
    if (userTeams && userTeams.length > 0 && !selectedTeamId) {
      const savedTeamId = localStorage.getItem("selectedTeamId");
      const teamId = savedTeamId || userTeams[0]._id;
      setSelectedTeamId(teamId as Id<"teams">);
    }
  }, [userTeams, selectedTeamId]);

  const selectedTeam = userTeams?.find((t) => t._id === selectedTeamId);

  const handleDateClick = (date: string) => {
    // Check if submission exists for date
    // If yes: navigate to edit page
    // If no: navigate to create page with date pre-filled
    router.push(`/submissions/new?date=${date}&teamId=${selectedTeamId}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Submissions</h1>

        <div className="flex gap-4">
          {/* Team Selector (if multiple teams) */}
          {userTeams && userTeams.length > 1 && (
            <TeamSelector
              teams={userTeams}
              selectedTeamId={selectedTeamId}
              onTeamChange={setSelectedTeamId}
            />
          )}

          {/* View Mode Toggle */}
          <ButtonGroup>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
            >
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {selectedTeam && viewMode === "calendar" && (
        <>
          <SubmissionCalendar
            teamId={selectedTeamId}
            tournamentId={selectedTeam.tournamentId}
            onDateClick={handleDateClick}
          />

          <CalendarStatistics
            teamId={selectedTeamId}
            tournamentId={selectedTeam.tournamentId}
          />
        </>
      )}

      {viewMode === "list" && (
        <SubmissionsDataTable /* existing table */ />
      )}
    </div>
  );
}
```

## UI/UX Considerations

### Color Scheme (Accessible)

```typescript
const cellStyles = {
  empty: "border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50",
  pending: "border-2 border-yellow-500 bg-yellow-50 hover:bg-yellow-100",
  approved: "border-2 border-green-500 bg-green-50 hover:bg-green-100",
  rejected: "border-2 border-red-500 bg-red-50 hover:bg-red-100",
  today: "ring-2 ring-blue-500 ring-offset-2",
  disabled: "opacity-50 cursor-not-allowed bg-gray-100",
};
```

### Responsive Design

- **Desktop:** 7-column grid, large cells
- **Tablet:** 7-column grid, medium cells
- **Mobile:** 7-column grid, small cells, scrollable
- **Week view (optional):** Show one week at a time on mobile

### Animations

- Smooth month transitions (slide left/right)
- Hover effects on date cells
- Loading skeletons during data fetch
- Celebration animation for 100% completion

### Tooltips

```typescript
// On hover over date cell:
// ─────────────────────
// Nov 15, 2024
// Status: Approved ✓
// Teammates: Alice, Bob
// "Met at gym for workout"
// Click to edit
// ─────────────────────
```

### Keyboard Navigation

- **Arrow keys:** Navigate between dates
- **Enter/Space:** Open submission for selected date
- **Tab:** Move through focusable elements
- **Escape:** Close modals/dialogs
- **[ / ]:** Previous/Next month

## User Flows

### Flow 1: View Calendar Progress

1. User navigates to `/submissions`
2. Calendar loads with current month
3. User sees color-coded dates:
   - Green for completed days
   - Yellow for pending
   - Gray for missing days
4. User hovers over date to see tooltip
5. Statistics show "24/30 days (80%)"

### Flow 2: Create Submission from Calendar

1. User clicks empty date (e.g., Nov 20)
2. Redirected to `/submissions/new?date=2024-11-20&teamId=xyz`
3. Form pre-filled with date and team
4. User fills description and teammates
5. Submits
6. Redirected back to calendar
7. Date cell now shows yellow (pending)

### Flow 3: Edit Submission from Calendar

1. User clicks date with existing submission
2. Redirected to `/submissions/[id]/edit`
3. User modifies description
4. Saves
5. Returns to calendar
6. Cell remains same color (state unchanged)

### Flow 4: Switch Teams

1. User is on multiple teams
2. Team selector shows "Team A" (current)
3. User clicks dropdown, selects "Team B"
4. Calendar reloads with Team B's submissions
5. Statistics update for Team B
6. Selection saved to localStorage

### Flow 5: Navigate Months

1. User viewing November 2024
2. Clicks "Previous" button
3. Calendar transitions to October 2024
4. Submissions for October displayed
5. User clicks "Today" button
6. Calendar jumps back to current month
7. Current date highlighted with blue ring

## Testing Checklist

### Unit Tests

- [ ] Date cell renders correct color for each state
- [ ] Today's date highlighted correctly
- [ ] Disabled dates not clickable
- [ ] Month navigation updates calendar
- [ ] Team selector updates submissions

### Integration Tests

- [ ] Calendar loads submissions for team
- [ ] Clicking date navigates to correct page
- [ ] Statistics calculate correctly
- [ ] Month transition preserves team selection
- [ ] localStorage persists team selection

### UI Tests

- [ ] Calendar responsive on mobile
- [ ] Tooltips appear on hover
- [ ] Keyboard navigation works
- [ ] Color scheme accessible (WCAG AA)
- [ ] Loading skeletons render
- [ ] Empty state displays correctly

## Accessibility (WCAG 2.1 AA)

### Requirements

1. **Color Contrast**

   - Text on colored backgrounds: 4.5:1 ratio minimum
   - Use patterns/icons in addition to colors for color-blind users

2. **Keyboard Navigation**

   - All interactive elements focusable
   - Visible focus indicators
   - Logical tab order

3. **Screen Readers**

   - ARIA labels for all buttons
   - Calendar role and grid structure
   - Announce state changes

4. **Example ARIA**

```typescript
<div role="grid" aria-label="Submission calendar">
  <div role="row">
    <button
      role="gridcell"
      aria-label="November 15, 2024, submission approved"
      aria-pressed="false"
      tabIndex={0}
    >
      15
    </button>
  </div>
</div>
```

## Performance Optimization

### Data Fetching

- Fetch only current month's submissions (not entire tournament)
- Prefetch adjacent months on hover of prev/next buttons
- Cache submissions in Convex (automatic)

### Rendering

- Virtualize calendar if showing year view (future)
- Memoize date cell components
- Debounce month navigation

### Bundle Size

- Use date-fns for date manipulation (lightweight)
- Avoid full calendar libraries (react-big-calendar, etc.)
- Custom implementation is smaller

## Edge Cases

1. **Tournament spans multiple months**

   - Navigation restricted to tournament date range
   - Gray out dates outside tournament

2. **User switches teams mid-month**

   - Calendar updates immediately
   - Preserve current month view

3. **Submission approved while viewing calendar**

   - Cell updates color in real-time (Convex reactivity)

4. **Today is outside current tournament**

   - "Today" button disabled
   - Show most recent active tournament

5. **User has no teams**
   - Show empty state: "Join a team to start submitting"
   - Link to tournaments page

## Future Enhancements

- Year view (12-month overview)
- Week view for mobile
- Export calendar as image/PDF
- Streak celebrations (animations, badges)
- Compare with other teams (overlay view)
- Heatmap intensity (darker green = more submissions)
- Drag-to-select multiple dates
- Bulk operations (delete, approve multiple)
- Recurring submissions (templates)

## Dependencies

- `date-fns` (already installed) - Date manipulation
- `lucide-react` (already installed) - Icons (ChevronLeft, ChevronRight)
- Shadcn/ui components - Button, Tooltip, Select
- React hooks - useState, useEffect, useMemo
- Convex queries - submissions.getMonthSubmissions, teams.list

## Migration Plan

1. **Uncomment Existing Code**

   - Uncomment lines 76-153 in `/submissions/page.tsx`
   - Fix TypeScript errors
   - Update to use proper queries

2. **Create Calendar Components**

   - Build SubmissionCalendar component
   - Build CalendarDateCell component
   - Build CalendarHeader component
   - Test in isolation (Storybook optional)

3. **Integrate with Page**

   - Add team selector
   - Add view mode toggle (calendar/list)
   - Wire up date click handlers
   - Test navigation

4. **Add Statistics**

   - Implement CalendarStatistics component
   - Add streak calculation
   - Display below calendar

5. **Polish & Test**
   - Responsive testing
   - Accessibility audit
   - Performance testing
   - User feedback

## Success Metrics

- 80%+ of users prefer calendar view over list view
- Average time to create submission decreases by 30%
- Completion rates increase by 15% (visual progress encourages participation)
- <100ms calendar render time (p95)
- Zero accessibility violations (WCAG AA)
- 90%+ of users understand color coding without legend
