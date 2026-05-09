# Sidebar Navigation Enhancements for Role-Based Dashboards

**Priority:** HIGH
**Status:** Design Phase
**Estimated Effort:** 1-2 days
**Dependencies:** Specs 07, 11, 12, 13, 14

## Executive Summary

The current sidebar navigation (`src/components/app-sidebar.tsx`) has a simple structure with all items in a single "User" group. To support the new role-based dashboards (Admin, Tournament Manager, Reviewer, Team Captain, Viewer), the sidebar needs to be restructured to:

1. Organize navigation items by role/context
2. Add new navigation items for role-specific dashboards
3. Implement role-based visibility (show/hide items based on user roles)
4. Add visual indicators for pending actions (badges)
5. Support nested navigation for complex admin/manager workflows
6. Maintain mobile responsiveness and accessibility

This spec defines the complete sidebar structure needed to support all pending dashboard features.

---

## Problem Statement

### Current State

The sidebar currently has:

- Single "User" group with 6 items:
  - Dashboard (`/dashboard`)
  - Tournaments (`/tournaments`)
  - Teams (`/teams`)
  - Submissions (`/submissions`)
  - New Submission (dialog trigger)
  - Users (`/users`) - no role restriction currently

**Issues:**

1. No role-based grouping (Admin, Manager, Captain sections)
2. Missing navigation items for new role-based dashboards
3. No visual indicators for pending actions (join requests, approvals)
4. No way to highlight active role-specific context
5. Users item should be admin-only but isn't restricted
6. No Tournament Manager, Reviewer, or Captain sections

### What's Missing

**For Admin Dashboard (Spec 07):**

- `/admin` dashboard link
- Proper admin section grouping

**For Tournament Manager Dashboard (Spec 11):**

- `/tournament-manager` dashboard link
- Quick access to assigned tournaments
- Submission approval queue link
- Badge for pending approvals count

**For Reviewer Dashboard (Spec 12):**

- `/reviewer` dashboard link
- Review queue link with pending count badge
- Review statistics link

**For Team Captain Dashboard (Spec 13):**

- `/captain` or `/my-teams` dashboard link
- Badge for pending join requests across all teams
- Badge for pending invitations sent
- Quick team management links

**For Viewer Dashboard (Spec 14):**

- `/viewer` dashboard link (for authenticated viewers)
- Public leaderboards link (no auth required)
- Favorite tournaments link

---

## Requirements

### Functional Requirements

#### 1. Role-Based Sidebar Groups

Organize sidebar items into logical groups based on user roles:

**User Section** (always visible)

- Dashboard
- Tournaments
- Teams (browse all teams)
- Submissions (user's own submissions)
- New Submission (quick action)

**Captain Section** (visible if user captains any team)

- My Teams Dashboard
- Pending Actions (with badge count)
- Team Comparison
- Invite Member (quick action)

**Reviewer Section** (visible if user has `reviewer` role)

- Review Queue (with badge count for pending)
- Review Statistics
- Flagged Submissions

**Tournament Manager Section** (visible if user has `tournament_manager` role)

- Manager Dashboard
- My Tournaments
- Pending Approvals (with badge count)
- Tournament Analytics
- Create Tournament (quick action)

**Admin Section** (visible if user has `admin` role)

- Admin Dashboard
- Manage Tournaments
- Manage Users
- All Submissions (with pending count)
- System Settings (future)

**Viewer Section** (visible if user has `viewer` role OR unauthenticated on public pages)

- Public Leaderboards
- Favorite Tournaments
- Tournament Discovery

#### 2. Dynamic Badge Indicators

Show notification badges for pending actions:

**Captain Badges:**

- Join requests across all captain's teams
- Sent invitations awaiting response
- Total: `joinRequests + pendingInvitations`

**Reviewer Badges:**

- Pending submissions across all tournaments
- Flagged submissions needing attention
- Total: `pendingSubmissions + flaggedSubmissions`

**Tournament Manager Badges:**

- Pending submissions for assigned tournaments only
- Teams needing review (undersized, inactive)
- Total: `pendingSubmissionsForMyTournaments + flaggedTeams`

**Admin Badges:**

- All pending submissions system-wide
- User accounts pending approval (if feature exists)
- Total: `allPendingSubmissions + systemAlerts`

#### 3. Conditional Item Visibility

Each sidebar item should specify:

- **Required roles:** Array of role names (e.g., `["admin"]`, `["reviewer", "admin"]`)
- **Required conditions:** Additional logic (e.g., user must captain at least one team)
- **Public access:** Some items visible even without authentication (e.g., Public Leaderboards)

**Examples:**

```typescript
{
  title: "Admin Dashboard",
  href: "/admin",
  icon: Shield,
  roles: ["admin"], // Only admins see this
}

{
  title: "My Teams",
  href: "/captain",
  icon: Users,
  requiredCondition: (user) => user.captainedTeamsCount > 0, // Only if user captains teams
}

{
  title: "Public Leaderboards",
  href: "/public/leaderboards",
  icon: Trophy,
  publicAccess: true, // Visible even without auth
}
```

#### 4. Active Route Highlighting

Highlight current active route/section:

- Active item should have distinct background color
- Active section should expand by default (if collapsible)
- Use Next.js `usePathname()` to detect current route

#### 5. Mobile Optimization

- Sidebar collapsible on mobile (current behavior maintained)
- Badge counts visible even in collapsed state (small dots)
- Touch-friendly tap targets (minimum 44x44px)
- Swipe gesture to open/close sidebar

#### 6. Accessibility

- Keyboard navigation (Tab, Arrow keys)
- Screen reader announcements for badge counts
- ARIA labels for all interactive elements
- Focus visible indicators
- High contrast mode support

---

## Technical Design

### Updated Sidebar Structure

```typescript
// src/components/app-sidebar.tsx

type SidebarItem = {
  title: string;
  roles?: string[]; // User must have at least one of these roles
  requiredCondition?: (user: User) => boolean; // Custom condition function
  publicAccess?: boolean; // Visible without authentication
  badge?: {
    query: string; // Convex query to fetch badge count
    color?: "default" | "destructive" | "warning"; // Badge color variant
  };
} & (
  | { items: SidebarItem[] } // Group with sub-items
  | ({ icon: LucideIcon } & ({ href: string } | { onClick: () => void }))
);
```

### Complete Sidebar Configuration

```typescript
const sidebarItems: SidebarItem[] = [
  // ===== USER SECTION (Always Visible) =====
  {
    title: "User",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Tournaments",
        href: "/tournaments",
        icon: Trophy,
      },
      {
        title: "Teams",
        href: "/teams",
        icon: Users,
      },
      {
        title: "Submissions",
        href: "/submissions",
        icon: ClipboardList,
      },
      {
        title: "New Submission",
        onClick: () => setSubmissionFormOpen(true),
        icon: PlusCircle,
      },
    ],
  },

  // ===== CAPTAIN SECTION (Conditional: User Captains Teams) =====
  {
    title: "Team Captain",
    requiredCondition: (user) => (user.captainedTeamsCount ?? 0) > 0,
    items: [
      {
        title: "My Teams",
        href: "/captain",
        icon: Shield,
        badge: {
          query: "captain.getPendingActionsCount", // Returns { joinRequests, invitations }
          color: "default",
        },
      },
      {
        title: "Team Comparison",
        href: "/captain/comparison",
        icon: BarChart3,
      },
      {
        title: "Invite Member",
        onClick: () => setInviteMemberDialogOpen(true),
        icon: UserPlus,
      },
    ],
  },

  // ===== REVIEWER SECTION (Conditional: Has 'reviewer' role) =====
  {
    title: "Review",
    roles: ["reviewer", "admin"], // Admins also have review access
    items: [
      {
        title: "Review Queue",
        href: "/reviewer",
        icon: FileCheck,
        badge: {
          query: "reviewer.getPendingCount", // Returns pending submission count
          color: "warning",
        },
      },
      {
        title: "Review Stats",
        href: "/reviewer/statistics",
        icon: TrendingUp,
      },
      {
        title: "Flagged Submissions",
        href: "/reviewer/flagged",
        icon: Flag,
        badge: {
          query: "reviewer.getFlaggedCount",
          color: "destructive",
        },
      },
    ],
  },

  // ===== TOURNAMENT MANAGER SECTION (Conditional: Has 'tournament_manager' role) =====
  {
    title: "Tournament Manager",
    roles: ["tournament_manager", "admin"], // Admins also have manager access
    items: [
      {
        title: "Manager Dashboard",
        href: "/tournament-manager",
        icon: Briefcase,
        badge: {
          query: "tournamentManager.getPendingCount", // Pending approvals for assigned tournaments
          color: "warning",
        },
      },
      {
        title: "My Tournaments",
        href: "/tournament-manager/tournaments",
        icon: Calendar,
      },
      {
        title: "Pending Approvals",
        href: "/tournament-manager/approvals",
        icon: CheckSquare,
        badge: {
          query: "tournamentManager.getPendingCount",
          color: "warning",
        },
      },
      {
        title: "Analytics",
        href: "/tournament-manager/analytics",
        icon: LineChart,
      },
      {
        title: "Create Tournament",
        onClick: () => setCreateTournamentDialogOpen(true),
        icon: PlusCircle,
      },
    ],
  },

  // ===== ADMIN SECTION (Conditional: Has 'admin' role) =====
  {
    title: "Admin",
    roles: ["admin"],
    items: [
      {
        title: "Admin Dashboard",
        href: "/admin",
        icon: Shield,
      },
      {
        title: "Tournaments",
        href: "/admin/tournaments",
        icon: Trophy,
      },
      {
        title: "Users",
        href: "/users", // Current route, keep for backwards compat
        icon: UserCog,
      },
      {
        title: "All Submissions",
        href: "/admin/submissions",
        icon: FileText,
        badge: {
          query: "admin.getAllPendingCount", // All pending submissions
          color: "warning",
        },
      },
      {
        title: "Submission Groups",
        href: "/admin/submission-groups",
        icon: Layers,
        badge: {
          query: "submissionGroups.getPendingCount",
          color: "warning",
        },
      },
      {
        title: "System Health",
        href: "/admin/system",
        icon: Activity,
      },
    ],
  },

  // ===== VIEWER SECTION (Conditional: Has 'viewer' role OR public access) =====
  {
    title: "Discover",
    publicAccess: true, // Visible even without login
    items: [
      {
        title: "Public Leaderboards",
        href: "/public/leaderboards",
        icon: Trophy,
        publicAccess: true,
      },
      {
        title: "Live Tournaments",
        href: "/public/live",
        icon: Tv,
        publicAccess: true,
      },
      // Authenticated viewer-only items
      {
        title: "Viewer Dashboard",
        href: "/viewer",
        icon: Eye,
        roles: ["viewer"],
      },
      {
        title: "Favorites",
        href: "/viewer/favorites",
        icon: Star,
        roles: ["viewer"],
      },
    ],
  },
];
```

### New Icons Needed

Import additional Lucide icons:

```typescript
import {
  Activity,
  BarChart3,
  Briefcase,
  Calendar,
  CheckSquare,
  ClipboardList,
  Eye,
  FileCheck,
  FileText,
  Flag,
  LayoutDashboard,
  Layers,
  LineChart,
  PlusCircle,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  Tv,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
```

### Badge Component Integration

Create a new `SidebarBadge` component:

```typescript
// src/components/ui/sidebar-badge.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "./badge";

interface SidebarBadgeProps {
  query: string; // e.g., "captain.getPendingActionsCount"
  color?: "default" | "destructive" | "warning";
}

export function SidebarBadge({ query, color = "default" }: SidebarBadgeProps) {
  // Parse query string to Convex API call
  const [namespace, method] = query.split(".");
  const count = useQuery(api[namespace][method]);

  if (!count || count === 0) return null;

  return (
    <Badge
      variant={color}
      className="ml-auto flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
```

Usage in sidebar:

```typescript
<SidebarMenuButton asChild>
  <Link href={item.href}>
    <item.icon />
    <span>{item.title}</span>
    {item.badge && (
      <SidebarBadge query={item.badge.query} color={item.badge.color} />
    )}
  </Link>
</SidebarMenuButton>
```

### Updated Sidebar Rendering Logic

```typescript
function renderItem(item: SidebarItem, user: User | null, userRoles: string[]) {
  // Check role-based visibility
  if (item.roles && !userRoles.some((role) => item.roles?.includes(role))) {
    return null;
  }

  // Check custom condition (e.g., user must captain teams)
  if (item.requiredCondition && (!user || !item.requiredCondition(user))) {
    return null;
  }

  // Check public access (visible even without auth)
  if (!item.publicAccess && !user) {
    return null;
  }

  // Render group
  if ("items" in item) {
    const visibleItems = item.items
      .map((subItem) => renderItem(subItem, user, userRoles))
      .filter(Boolean);

    // Don't render empty groups
    if (visibleItems.length === 0) return null;

    return (
      <SidebarGroup key={item.title}>
        <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>{visibleItems}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Render button item (onClick)
  if ("onClick" in item) {
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton onClick={item.onClick}>
          <item.icon />
          {item.title}
          {item.badge && (
            <SidebarBadge query={item.badge.query} color={item.badge.color} />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Render link item
  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <Link href={item.href}>
          <item.icon />
          <span>{item.title}</span>
          {item.badge && (
            <SidebarBadge query={item.badge.query} color={item.badge.color} />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
```

---

## Backend Query Requirements

### New Queries Needed for Badge Counts

#### 1. Captain Badge Queries

```typescript
// convex/captain.ts (new file)

export const getPendingActionsCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get all teams user captains
    const captainedTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainedTeams.map((tm) => tm.teamId);

    // Count pending join requests
    const joinRequests = await ctx.db
      .query("joinRequests")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          // Check if teamId is in teamIds array
          // Note: May need to iterate and sum
        ),
      )
      .collect();

    // Count pending invitations sent by user
    const invitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_inviter", (q) => q.eq("invitedBy", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return joinRequests.length + invitations.length;
  },
});
```

#### 2. Reviewer Badge Queries

```typescript
// convex/reviewer.ts (new file)

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate user has reviewer or admin role
    if (
      !user.roleNames.includes("reviewer") &&
      !user.roleNames.includes("admin")
    ) {
      return 0;
    }

    // Count all pending submissions (individual)
    const pendingIndividual = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"))
      .collect();

    // Count all pending submission groups (team activities)
    const pendingGroups = await ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pendingIndividual.length + pendingGroups.length;
  },
});

export const getFlaggedCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (
      !user.roleNames.includes("reviewer") &&
      !user.roleNames.includes("admin")
    ) {
      return 0;
    }

    // Count flagged submissions (future feature)
    // For now, return 0
    return 0;
  },
});
```

#### 3. Tournament Manager Badge Queries

```typescript
// convex/tournamentManager.ts (new file)

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate user has tournament_manager or admin role
    if (
      !user.roleNames.includes("tournament_manager") &&
      !user.roleNames.includes("admin")
    ) {
      return 0;
    }

    // Get tournaments assigned to this manager
    // Note: This requires tournament assignment system from spec 11
    // For now, if user is tournament_manager, show all pending
    // Once assignment system is built, filter by assigned tournaments

    // Count pending individual submissions
    const pendingIndividual = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"))
      .collect();

    // Count pending submission groups
    const pendingGroups = await ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pendingIndividual.length + pendingGroups.length;
  },
});
```

#### 4. Admin Badge Queries

```typescript
// convex/admin.ts (existing file, add query)

export const getAllPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateIsAdmin(user, "Admin access required");

    // Count all pending individual submissions
    const pendingIndividual = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .filter((q) => q.eq(q.field("submissionType"), "individual"))
      .collect();

    // Count all pending submission groups
    const pendingGroups = await ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pendingIndividual.length + pendingGroups.length;
  },
});
```

#### 5. Submission Groups Badge Query

```typescript
// convex/submissionGroups.ts (existing file, add query)

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Only admins, reviewers, and tournament managers can see this
    const hasAccess =
      user.roleNames.includes("admin") ||
      user.roleNames.includes("reviewer") ||
      user.roleNames.includes("tournament_manager");

    if (!hasAccess) return 0;

    const pending = await ctx.db
      .query("submissionGroups")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    return pending.length;
  },
});
```

---

## User Data Extension

### Add Captain Teams Count to User

Extend user object to include `captainedTeamsCount` for efficient conditional rendering:

```typescript
// convex/users.ts

// Add to getUserDetails or similar query
const captainedTeams = await ctx.db
  .query("teamMembers")
  .withIndex("by_user", (q) => q.eq("userId", user._id))
  .filter((q) => q.eq(q.field("role"), "captain"))
  .collect();

return {
  ...user,
  captainedTeamsCount: captainedTeams.length,
};
```

Or create a dedicated query:

```typescript
export const getCaptainedTeamsCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const captainedTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    return captainedTeams.length;
  },
});
```

---

## Routes to Create

### New Route Placeholders

Create placeholder pages for new routes (actual implementation in respective specs):

#### Captain Routes

- `/captain` - Captain dashboard (spec 13)
- `/captain/comparison` - Team comparison view (spec 13)

#### Reviewer Routes

- `/reviewer` - Review queue dashboard (spec 12)
- `/reviewer/statistics` - Review stats (spec 12)
- `/reviewer/flagged` - Flagged submissions (spec 12)

#### Tournament Manager Routes

- `/tournament-manager` - Manager dashboard (spec 11)
- `/tournament-manager/tournaments` - Assigned tournaments (spec 11)
- `/tournament-manager/approvals` - Pending approvals (spec 11)
- `/tournament-manager/analytics` - Tournament analytics (spec 11)

#### Admin Routes

- `/admin` - Admin dashboard (spec 07)
- `/admin/tournaments` - Manage tournaments (existing as `/tournaments`)
- `/admin/submissions` - All submissions view (spec 07)
- `/admin/submission-groups` - Grouped submissions (existing as `/admin/submission-groups`)
- `/admin/system` - System health (future)

#### Viewer Routes

- `/viewer` - Viewer dashboard (spec 14)
- `/viewer/favorites` - Favorite tournaments (spec 14)
- `/public/leaderboards` - Public leaderboards (spec 14)
- `/public/live` - Live tournament feed (spec 14)

---

## Internationalization (i18n)

### Translation Keys Structure

Update `messages/en.json` with new sidebar labels:

```json
{
  "sidebar": {
    "items": {
      "user": {
        "group": "User",
        "dashboard": "Dashboard",
        "tournaments": "Tournaments",
        "teams": "Teams",
        "submissions": "Submissions",
        "newSubmission": "New Submission"
      },
      "captain": {
        "group": "Team Captain",
        "myTeams": "My Teams",
        "comparison": "Team Comparison",
        "inviteMember": "Invite Member"
      },
      "reviewer": {
        "group": "Review",
        "queue": "Review Queue",
        "statistics": "Review Stats",
        "flagged": "Flagged Submissions"
      },
      "tournamentManager": {
        "group": "Tournament Manager",
        "dashboard": "Manager Dashboard",
        "tournaments": "My Tournaments",
        "approvals": "Pending Approvals",
        "analytics": "Analytics",
        "createTournament": "Create Tournament"
      },
      "admin": {
        "group": "Admin",
        "dashboard": "Admin Dashboard",
        "tournaments": "Tournaments",
        "users": "Users",
        "submissions": "All Submissions",
        "submissionGroups": "Submission Groups",
        "system": "System Health"
      },
      "viewer": {
        "group": "Discover",
        "dashboard": "Viewer Dashboard",
        "publicLeaderboards": "Public Leaderboards",
        "live": "Live Tournaments",
        "favorites": "Favorites"
      }
    }
  }
}
```

---

## Migration Strategy

### Phase 1: Add New Icons and Types (Day 1, Morning)

1. Import new Lucide icons
2. Update `SidebarItem` type to support new properties:
   - `requiredCondition`
   - `publicAccess`
   - `badge`
3. Create `SidebarBadge` component
4. No breaking changes yet

### Phase 2: Add New Backend Queries (Day 1, Afternoon)

1. Create `convex/captain.ts` with badge queries
2. Create `convex/reviewer.ts` with badge queries
3. Create `convex/tournamentManager.ts` with badge queries
4. Add queries to existing `convex/admin.ts` and `convex/submissionGroups.ts`
5. Add `captainedTeamsCount` to user query
6. Test all queries return correct counts

### Phase 3: Add New Sidebar Sections (Day 2, Morning)

1. Update `useSidebarItems` to include new sections:
   - Captain section
   - Reviewer section
   - Tournament Manager section
   - Admin section (restructured)
   - Viewer section
2. Update `renderItem` logic to handle:
   - `requiredCondition`
   - `publicAccess`
   - Badge rendering
3. Test visibility logic for each role

### Phase 4: Create Placeholder Routes (Day 2, Afternoon)

1. Create placeholder pages for all new routes
2. Add simple "Coming Soon" or "Dashboard Loading..." content
3. Ensure routing works correctly
4. Add proper auth checks on routes

### Phase 5: Update Translations (Day 2, Evening)

1. Add all new sidebar labels to `messages/en.json`
2. Update component to use translation keys
3. Test internationalization

---

## Testing Checklist

### Visibility Tests

- [ ] User with no special roles sees only User section
- [ ] User who captains teams sees Captain section
- [ ] User with `reviewer` role sees Review section
- [ ] User with `tournament_manager` role sees Tournament Manager section
- [ ] User with `admin` role sees Admin section
- [ ] User with `viewer` role sees Viewer section
- [ ] Unauthenticated user sees only public items in Discover section
- [ ] Users with multiple roles see all applicable sections

### Badge Count Tests

- [ ] Captain badge shows correct count of pending join requests + invitations
- [ ] Reviewer badge shows correct count of pending submissions
- [ ] Tournament Manager badge shows correct count for assigned tournaments
- [ ] Admin badge shows correct count of all pending submissions
- [ ] Submission Groups badge shows correct count
- [ ] Badge updates in real-time when actions are taken
- [ ] Badge doesn't show when count is 0
- [ ] Badge shows "99+" when count exceeds 99

### Navigation Tests

- [ ] Clicking each sidebar item navigates to correct route
- [ ] Active route is highlighted correctly
- [ ] Back button works correctly
- [ ] Deep links to routes work correctly
- [ ] Protected routes redirect to login if not authenticated

### Responsive Tests

- [ ] Sidebar collapsible on mobile works
- [ ] Badge counts visible in collapsed state
- [ ] Touch targets are minimum 44x44px
- [ ] Swipe gesture opens/closes sidebar (if implemented)

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Arrow keys)
- [ ] Screen reader announces badge counts
- [ ] ARIA labels present on all interactive elements
- [ ] Focus visible indicators work
- [ ] High contrast mode displays correctly

---

## Performance Considerations

### Badge Query Optimization

**Challenge:** Badge queries run on every sidebar render (frequent)

**Solutions:**

1. **Caching:** Convex handles caching automatically, but ensure queries are stable
2. **Debouncing:** Only update badge counts every 5-10 seconds (not on every DB change)
3. **Conditional Queries:** Only run badge queries for visible sections
4. **Efficient Indexes:** Ensure all badge queries use proper indexes

**Implementation:**

```typescript
// Use conditional queries based on visible sections
const captainBadgeCount = useQuery(
  user?.captainedTeamsCount > 0
    ? api.captain.getPendingActionsCount
    : undefined,
);

const reviewerBadgeCount = useQuery(
  user?.roleNames.includes("reviewer")
    ? api.reviewer.getPendingCount
    : undefined,
);
```

### Lazy Loading Sections

For users with many roles, consider lazy loading section items:

```typescript
// Only load section data when section is expanded
const [expandedSections, setExpandedSections] = useState<string[]>([]);

// Load badge only when section is expanded or always visible
const shouldLoadBadge =
  expandedSections.includes("captain") || sidebarCollapsed;
```

---

## Future Enhancements (Out of Scope)

### 1. Collapsible Sections

- Allow users to collapse/expand sidebar sections
- Persist state to localStorage
- Smooth animations

### 2. Sidebar Customization

- Allow users to reorder sections
- Pin/unpin favorite items
- Custom shortcuts

### 3. Quick Search

- Search bar at top of sidebar
- Fuzzy search across all menu items
- Keyboard shortcuts (Cmd+K)

### 4. Recent Items

- Show recently visited pages
- Quick access to recent teams/tournaments
- Clear history option

### 5. Dark Mode Support

- Sidebar theme variants
- Auto-detect system theme
- Toggle in sidebar footer

---

## Success Metrics

### Technical Metrics

- Sidebar renders in <50ms
- Badge queries execute in <100ms (p95)
- Zero accessibility violations (axe-core)
- 100% keyboard navigable

### User Metrics

- Users can find new role-specific dashboards without help
- Click-through rate on badge notifications >80%
- Navigation errors <1% of total navigation events
- Positive user feedback on organization

---

## Dependencies

This spec depends on the following features being implemented:

1. **Spec 07:** Admin Dashboard - Provides `/admin` route
2. **Spec 11:** Tournament Manager Dashboard - Provides `/tournament-manager` routes
3. **Spec 12:** Reviewer Dashboard - Provides `/reviewer` routes
4. **Spec 13:** Team Captain Dashboard - Provides `/captain` routes
5. **Spec 14:** Viewer & Public Dashboard - Provides `/viewer` and `/public` routes

However, this spec can be implemented **before** those features by:

- Creating placeholder routes
- Adding "Coming Soon" pages
- Ensuring navigation structure is in place

This allows parallel development:

- Frontend team implements sidebar first
- Backend/feature teams implement dashboards
- Integrate when dashboards are ready

---

## Implementation Order

**Recommended approach:**

1. ✅ **This Spec First (1-2 days)**
   - Create sidebar structure
   - Add badge queries
   - Create placeholder routes
   - Test navigation and visibility

2. 🔄 **Dashboard Specs in Parallel**
   - Spec 07: Admin Dashboard (2 days)
   - Spec 11: Tournament Manager Dashboard (3-4 days)
   - Spec 12: Reviewer Dashboard (2-3 days)
   - Spec 13: Team Captain Dashboard (2 days)
   - Spec 14: Viewer & Public Dashboard (2-3 days)

3. 🔗 **Integration (0.5 days)**
   - Replace placeholder routes with actual dashboards
   - Test end-to-end navigation
   - Polish transitions and loading states

**Total Timeline:** 12-17 days for complete role-based navigation system

---

## Conclusion

This sidebar navigation enhancement provides the foundation for all role-based dashboards in the platform. By implementing this spec first, we create:

✅ Clear navigation structure for all user roles
✅ Visual indicators for pending actions (badges)
✅ Scalable architecture for future role additions
✅ Consistent user experience across all dashboards
✅ Parallel development capability for dashboard features

The new sidebar structure supports:

- 6 distinct role contexts (User, Captain, Reviewer, Manager, Admin, Viewer)
- 30+ navigation items across all roles
- Real-time badge notifications for 5+ action types
- Public/private access control
- Mobile-responsive design
- Full accessibility compliance

This is a **critical dependency** for specs 07, 11, 12, 13, and 14, but can be implemented independently with placeholder routes to enable parallel development.
