# Viewer & Public Dashboard

**Priority:** LOW-MEDIUM
**Status:** Not Implemented
**Estimated Effort:** 2-3 days

## Problem Statement

The `viewer` role exists for read-only access to tournament statistics and leaderboards, but there's no dedicated interface for this role. Additionally, there's no public-facing view for external stakeholders, spectators, or potential participants to:

- View tournament leaderboards without logging in
- Explore tournament statistics and rankings
- See team profiles and achievements
- Discover active tournaments
- Watch tournament progress in real-time
- Share tournament results on social media

This limits the platform's visibility, reduces engagement from non-participants, and misses opportunities for recruitment and community building.

## Current State

### What Exists

- `viewer` role defined in roles system (hierarchy: 5)
- Role description: "Read-only access to statistics and leaderboards"
- Leaderboard pages exist but require authentication
- Tournament listing page (`/tournaments`)
- Team statistics pages

### What's Missing

- No `/viewer` dashboard
- No public (unauthenticated) access to leaderboards
- No spectator-focused interface
- No public tournament profiles
- No social sharing features
- No embedded leaderboard widgets
- No public API for external integrations

### Evidence

- `convex/roles.ts` defines viewer role (line 23-27)
- All routes require authentication via Clerk middleware
- No public routes for viewing tournaments
- No viewer-specific navigation

## Requirements

### Functional Requirements

1. **Public Tournament Discovery**
   - List all public tournaments (without authentication)
   - Filter by status (active/upcoming/ended)
   - Search by tournament name
   - View tournament details (name, dates, description, team count)
   - No sensitive information exposed (user emails, admin details)

2. **Public Leaderboards**
   - View tournament leaderboards without login
   - Real-time leaderboard updates
   - Show top 10 teams prominently
   - Full leaderboard available on demand
   - Filter by date range (for historical view)
   - Shareable links for specific tournaments

3. **Public Team Profiles**
   - View team names and member counts (not individual names without permission)
   - Team statistics (points, rank, submissions count)
   - Team achievements and badges
   - Team activity timeline (anonymized if needed)
   - No sensitive data (emails, contact info)

4. **Viewer Dashboard** (for authenticated viewer role)
   - Browse all tournaments and leaderboards
   - Save favorite tournaments for quick access
   - Comparison view for multiple tournaments
   - Historical data and trend analysis
   - Export data (CSV, PDF) for reporting
   - No write permissions (cannot create/edit/delete)

5. **Live Tournament Feed**
   - Real-time updates on active tournaments
   - Recent submissions approved (anonymized or public based on settings)
   - Rank changes and leader updates
   - Point milestones (team reaches 100 points, etc.)
   - Tournament completion announcements

6. **Social Sharing**
   - Share tournament leaderboard (embeddable widget)
   - Share team achievements (social cards with Open Graph)
   - Generate shareable images for social media
   - QR codes for tournament pages
   - Embed codes for websites

7. **Public Tournament Pages**
   - SEO-optimized tournament pages
   - Meta tags for social sharing
   - Responsive design for mobile viewers
   - Accessibility compliance
   - Print-friendly layouts

### Non-Functional Requirements

- Public pages load in <2 seconds
- Real-time updates via WebSockets or polling
- Support 10,000+ concurrent viewers
- SEO-optimized for search engines
- GDPR compliant (no PII exposed without consent)
- Rate limiting to prevent abuse
- Caching for performance

## Database Schema Changes

### Modified Tables

```typescript
// Add visibility settings to tournaments
tournaments: defineTable({
  // ... existing fields
  visibility: v.optional(v.union(
    v.literal("public"),     // Anyone can view leaderboard
    v.literal("unlisted"),   // Only with direct link
    v.literal("private")     // Only authenticated users
  )), // Default: "public"
  allowPublicTeamProfiles: v.optional(v.boolean()), // Default: true
  allowPublicMemberNames: v.optional(v.boolean()),  // Default: false
})

// Add favorite tournaments for viewers
viewerFavorites: defineTable({
  userId: v.id("users"),
  tournamentId: v.id("tournaments"),
  addedAt: v.string(),
})
  .index("by_user", ["userId"])
  .index("by_tournament", ["tournamentId"])
  .index("by_user_and_tournament", ["userId", "tournamentId"]),
```

### New Tables

```typescript
// Track public page views for analytics
publicPageViews: defineTable({
  tournamentId: v.optional(v.id("tournaments")),
  teamId: v.optional(v.id("teams")),
  pageType: v.union(
    v.literal("tournament_leaderboard"),
    v.literal("tournament_details"),
    v.literal("team_profile")
  ),
  timestamp: v.string(),
  // No user tracking for privacy
})
  .index("by_tournament", ["tournamentId"])
  .index("by_team", ["teamId"])
  .index("by_timestamp", ["timestamp"]),
```

## Backend Implementation

### New Queries (Public Access)

#### `public.listTournaments`

```typescript
export const listTournaments = query({
  args: {
    status: v.optional(
      v.union(v.literal("active"), v.literal("upcoming"), v.literal("ended")),
    ),
  },
  handler: async (ctx, args) => {
    // Public query - no auth required
    const allTournaments = await ctx.db.query("tournaments").collect();

    const now = new Date().toISOString().split("T")[0];

    // Filter by visibility (only public)
    const publicTournaments = allTournaments.filter(
      (t) => !t.visibility || t.visibility === "public",
    );

    // Filter by status if specified
    let filteredTournaments = publicTournaments;
    if (args.status) {
      filteredTournaments = publicTournaments.filter((t) => {
        if (args.status === "active") {
          return t.startDate <= now && t.endDate >= now;
        } else if (args.status === "upcoming") {
          return t.startDate > now;
        } else if (args.status === "ended") {
          return t.endDate < now;
        }
        return true;
      });
    }

    // Get team counts
    const enriched = await Promise.all(
      filteredTournaments.map(async (tournament) => {
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_tournament", (q) =>
            q.eq("tournamentId", tournament._id),
          )
          .collect();

        return {
          id: tournament._id,
          name: tournament.name,
          description: tournament.description,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          teamCount: teams.length,
          status:
            tournament.endDate < now
              ? "ended"
              : tournament.startDate > now
                ? "upcoming"
                : "active",
        };
      }),
    );

    return enriched;
  },
});
```

#### `public.getTournamentLeaderboard`

```typescript
export const getTournamentLeaderboard = query({
  args: {
    tournamentId: v.id("tournaments"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check visibility
    if (tournament.visibility === "private") {
      throw new Error("This tournament is private");
    }

    const limit = args.limit || 100;

    // Get teams
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", args.tournamentId),
      )
      .collect();

    // Sort by points, then lastActivityAt
    const sortedTeams = teams.sort((a, b) => {
      if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
      if (a.lastActivityAt && b.lastActivityAt) {
        return (
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
        );
      }
      return 0;
    });

    // Take top N teams
    const topTeams = sortedTeams.slice(0, limit);

    // Get member counts (but not member names unless allowed)
    const enriched = await Promise.all(
      topTeams.map(async (team, index) => {
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

        return {
          rank: index + 1,
          teamId: team._id,
          teamName: team.name,
          points: team.points || 0,
          memberCount: members.length,
          lastActivityAt: team.lastActivityAt,
        };
      }),
    );

    return {
      tournament: {
        id: tournament._id,
        name: tournament.name,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
      },
      leaderboard: enriched,
    };
  },
});
```

#### `public.getTeamProfile`

```typescript
export const getTeamProfile = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const tournament = await ctx.db.get(team.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check visibility
    if (tournament.visibility === "private") {
      throw new Error("This team is in a private tournament");
    }

    if (!tournament.allowPublicTeamProfiles) {
      throw new Error("Team profiles are not public for this tournament");
    }

    // Get members
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get member names only if allowed
    let memberNames: string[] | null = null;
    if (tournament.allowPublicMemberNames) {
      memberNames = await Promise.all(
        members.map(async (member) => {
          const user = await ctx.db.get(member.userId);
          return user?.name || "Unknown";
        }),
      );
    }

    // Get submissions count
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const approvedSubmissions = submissions.filter(
      (s) => s.state === "approved",
    );

    // Get rank
    const allTeams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) =>
        q.eq("tournamentId", team.tournamentId),
      )
      .collect();

    const sortedTeams = allTeams.sort((a, b) => {
      if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
      if (a.lastActivityAt && b.lastActivityAt) {
        return (
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
        );
      }
      return 0;
    });

    const rank = sortedTeams.findIndex((t) => t._id === team._id) + 1;

    return {
      team: {
        id: team._id,
        name: team.name,
        points: team.points || 0,
        rank,
        memberCount: members.length,
        memberNames, // null if not allowed
      },
      tournament: {
        id: tournament._id,
        name: tournament.name,
      },
      statistics: {
        totalSubmissions: submissions.length,
        approvedSubmissions: approvedSubmissions.length,
        approvalRate:
          submissions.length > 0
            ? approvedSubmissions.length / submissions.length
            : 0,
      },
    };
  },
});
```

### Viewer-Specific Queries

#### `viewer.getFavoriteTournaments`

```typescript
export const getFavoriteTournaments = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Any authenticated user can favorite tournaments
    const favorites = await ctx.db
      .query("viewerFavorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const tournaments = await Promise.all(
      favorites.map(async (fav) => {
        const tournament = await ctx.db.get(fav.tournamentId);
        return tournament;
      }),
    );

    return tournaments.filter((t) => t !== null);
  },
});
```

### Viewer Mutations

#### `viewer.addFavorite`

```typescript
export const addFavorite = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if already favorited
    const existing = await ctx.db
      .query("viewerFavorites")
      .withIndex("by_user_and_tournament", (q) =>
        q.eq("userId", user._id).eq("tournamentId", args.tournamentId),
      )
      .first();

    if (existing) {
      throw new Error("Tournament already favorited");
    }

    await ctx.db.insert("viewerFavorites", {
      userId: user._id,
      tournamentId: args.tournamentId,
      addedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
```

#### `viewer.removeFavorite`

```typescript
export const removeFavorite = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const favorite = await ctx.db
      .query("viewerFavorites")
      .withIndex("by_user_and_tournament", (q) =>
        q.eq("userId", user._id).eq("tournamentId", args.tournamentId),
      )
      .first();

    if (!favorite) {
      throw new Error("Tournament not in favorites");
    }

    await ctx.db.delete(favorite._id);
    return { success: true };
  },
});
```

## Frontend Implementation

### New Components

#### `PublicTournamentCard`

**Location:** `src/components/public/public-tournament-card.tsx`

```typescript
interface PublicTournamentCardProps {
  tournament: {
    id: Id<"tournaments">;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    teamCount: number;
    status: "active" | "upcoming" | "ended";
  };
}

// Features:
// - Card with tournament info
// - Status badge (active/upcoming/ended)
// - Team count
// - "View Leaderboard" button
// - Favorite button (if authenticated)
// - Share button
```

#### `PublicLeaderboardTable`

**Location:** `src/components/public/public-leaderboard-table.tsx`

```typescript
interface PublicLeaderboardTableProps {
  leaderboard: Array<{
    rank: number;
    teamId: Id<"teams">;
    teamName: string;
    points: number;
    memberCount: number;
    lastActivityAt?: string;
  }>;
  tournamentName: string;
}

// Features:
// - Responsive table with rank, team name, points, members
// - Top 3 highlighted with gold/silver/bronze
// - Click team name to view profile (if allowed)
// - Real-time updates
// - Share button for specific ranks
// - No edit/delete actions
```

#### `PublicTeamProfileCard`

**Location:** `src/components/public/public-team-profile-card.tsx`

```typescript
interface PublicTeamProfileCardProps {
  team: {
    id: Id<"teams">;
    name: string;
    points: number;
    rank: number;
    memberCount: number;
    memberNames?: string[] | null;
  };
  tournament: {
    id: Id<"tournaments">;
    name: string;
  };
  statistics: {
    totalSubmissions: number;
    approvedSubmissions: number;
    approvalRate: number;
  };
}

// Features:
// - Team name and rank badge
// - Points prominently displayed
// - Member names (if public) or just count
// - Statistics (submissions, approval rate)
// - Back to leaderboard button
// - Share button
```

#### `ViewerDashboard`

**Location:** `src/components/viewer/viewer-dashboard.tsx`

```typescript
// Features:
// - Browse all public tournaments
// - Favorites section at top
// - Recent tournament winners
// - Active tournaments with live updates
// - Search tournaments
// - Filter by status
// - No create/edit capabilities
```

#### `ShareTournamentDialog`

**Location:** `src/components/public/share-tournament-dialog.tsx`

```typescript
interface ShareTournamentDialogProps {
  tournamentId: Id<"tournaments">;
  tournamentName: string;
}

// Features:
// - Copy link button
// - Social media share buttons (Twitter, Facebook, LinkedIn)
// - Embed code for websites
// - QR code generator
// - Download leaderboard as image
```

#### `LiveTournamentFeed`

**Location:** `src/components/public/live-tournament-feed.tsx`

```typescript
interface LiveTournamentFeedProps {
  tournamentId: Id<"tournaments">;
}

// Features:
// - Real-time feed of tournament activity
// - Recent submissions approved
// - Rank changes
// - Milestones reached
// - Auto-scroll to latest
// - Pause/play button
```

### New Pages

#### `/public/tournaments/page.tsx`

**Location:** `src/app/public/tournaments/page.tsx`

```typescript
// Public route - no authentication required
export default function PublicTournamentsPage() {
  const [statusFilter, setStatusFilter] = useState<"active" | "upcoming" | "ended" | undefined>();
  const tournaments = useQuery(api.public.listTournaments, {
    status: statusFilter,
  });

  return (
    <div className="space-y-6 container mx-auto py-12">
      <div>
        <h1 className="text-4xl font-bold">Tournament Leaderboards</h1>
        <p className="text-muted-foreground text-lg">
          Follow tournaments and teams in real-time
        </p>
      </div>

      {/* Status Filter */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value={undefined}>All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ended">Ended</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments?.map((tournament) => (
          <PublicTournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>

      {/* CTA for unauthenticated users */}
      <Card className="bg-primary/5">
        <CardContent className="py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Want to participate?
          </h2>
          <p className="text-muted-foreground mb-6">
            Sign up now to create your team and compete in tournaments!
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### `/public/tournaments/[id]/leaderboard/page.tsx`

**Location:** `src/app/public/tournaments/[id]/leaderboard/page.tsx`

```typescript
export default function PublicLeaderboardPage({
  params,
}: {
  params: { id: Id<"tournaments"> };
}) {
  const data = useQuery(api.public.getTournamentLeaderboard, {
    tournamentId: params.id,
  });

  if (!data) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 container mx-auto py-12">
      {/* Tournament Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">{data.tournament.name}</h1>
          <p className="text-muted-foreground">
            {data.tournament.startDate} - {data.tournament.endDate}
          </p>
        </div>

        <ShareTournamentDialog
          tournamentId={params.id}
          tournamentName={data.tournament.name}
        />
      </div>

      {/* Podium (Top 3) */}
      {data.leaderboard.length >= 3 && (
        <LeaderboardPodium topThree={data.leaderboard.slice(0, 3)} />
      )}

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <PublicLeaderboardTable
            leaderboard={data.leaderboard}
            tournamentName={data.tournament.name}
          />
        </CardContent>
      </Card>

      {/* Live Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <LiveTournamentFeed tournamentId={params.id} />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### `/public/teams/[id]/page.tsx`

**Location:** `src/app/public/teams/[id]/page.tsx`

```typescript
export default function PublicTeamProfilePage({
  params,
}: {
  params: { id: Id<"teams"> };
}) {
  const data = useQuery(api.public.getTeamProfile, {
    teamId: params.id,
  });

  if (!data) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 container mx-auto py-12">
      <PublicTeamProfileCard {...data} />
    </div>
  );
}
```

#### `/viewer/page.tsx`

**Location:** `src/app/(all)/viewer/page.tsx`

```typescript
export default function ViewerDashboard() {
  const { user } = useUser();
  const favorites = useQuery(api.viewer.getFavoriteTournaments);
  const allTournaments = useQuery(api.public.listTournaments);

  // Viewer role or any authenticated user can access
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tournament Viewer</h1>
        <p className="text-muted-foreground">
          Watch tournaments and track leaderboards
        </p>
      </div>

      {/* Favorites */}
      {favorites && favorites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Favorite Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map((tournament) => (
                <TournamentCard key={tournament._id} tournament={tournament} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Tournaments */}
      <ViewerDashboard />
    </div>
  );
}
```

### Modified Files

#### `middleware.ts`

```typescript
// Update Clerk middleware to allow public routes
export default clerkMiddleware((auth, req) => {
  // Public routes
  const publicRoutes = [
    "/public/tournaments",
    "/public/tournaments/:id/leaderboard",
    "/public/teams/:id",
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some((route) => {
    const regex = new RegExp(`^${route.replace(":id", "[^/]+")}$`);
    return regex.test(req.nextUrl.pathname);
  });

  if (isPublicRoute) {
    return; // Allow without auth
  }

  // Protect all other routes
  auth().protect();
});
```

#### `Sidebar`

```typescript
// Add "Viewer" section (show for viewer role or any user):
// - Browse Tournaments (/viewer or /public/tournaments)
// - My Favorites (/viewer/favorites)
```

## UI/UX Considerations

### Public Page Design

- Clean, professional layout
- Large, readable fonts
- High contrast for accessibility
- Mobile-first responsive design
- Fast loading (optimize images, lazy load)
- SEO meta tags for social sharing

### Branding

- Show "Urban Legends" branding
- "Powered by Urban Legends" footer
- Link to sign up for participants
- Contact/support links

### Real-Time Updates

- Live badge on active tournaments
- Auto-refresh leaderboard every 30 seconds
- Toast notifications for major rank changes
- Animation for live updates

### Social Sharing

- Open Graph meta tags for rich previews
- Twitter Card support
- Generated images with tournament logo and top 3 teams
- Shareable URLs with UTM parameters for tracking

## Testing Checklist

### Unit Tests

- [ ] Public queries don't require auth
- [ ] Private tournaments not exposed
- [ ] Viewer can't edit data
- [ ] Favorites work correctly

### Integration Tests

- [ ] Public leaderboard loads
- [ ] Real-time updates work
- [ ] Share links work
- [ ] Viewer dashboard loads

### UI Tests

- [ ] Public pages render
- [ ] Mobile responsive
- [ ] Loading states
- [ ] Error states
- [ ] SEO tags present

## Security Considerations

1. **No PII Exposure**
   - Don't show user emails publicly
   - Member names only if allowed
   - No contact information

2. **Rate Limiting**
   - Limit public API calls per IP
   - Prevent scraping
   - Block abusive traffic

3. **Privacy Settings**
   - Respect tournament visibility
   - Honor team profile settings
   - GDPR compliance

4. **CORS**
   - Allow embeds from whitelisted domains
   - Prevent unauthorized API access

## Performance Optimization

- CDN for public pages
- Aggressive caching (5-10 minutes)
- Image optimization
- Lazy loading
- Virtual scrolling for long leaderboards

## Migration & Deployment

### Migration Steps

1. **Update Schema**
   - Add visibility fields to tournaments
   - Create viewerFavorites table
   - Deploy schema

2. **Set Default Visibility**
   - Run migration to set existing tournaments to "public"
   - Allow admins to change per tournament

3. **Update Backend**
   - Add public queries
   - Add viewer queries
   - Deploy backend

4. **Update Middleware**
   - Allow public routes
   - Test authentication bypass

5. **Build Frontend**
   - Create public components
   - Create viewer dashboard
   - Deploy frontend

6. **SEO & Social**
   - Add meta tags
   - Generate sitemaps
   - Submit to search engines
   - Test social sharing

## Success Metrics

- 1000+ monthly public page views
- 20% conversion from viewer to participant
- 50+ social shares per major tournament
- <3 second page load time
- 90%+ mobile usability score
- Top 10 ranking for "[tournament name] leaderboard" searches

## Future Enhancements

- Tournament archives (historical data)
- Advanced analytics and charts
- Comparison between tournaments
- Spectator predictions/voting
- Live commentary/chat
- Video highlights integration
- Mobile app for viewers
- Push notifications for favorite tournaments
- Email digests for viewers
- API for third-party integrations

## Dependencies

- Existing Convex backend
- Shadcn/ui components
- Lucide icons
- Next.js App Router
- next-seo for meta tags
- qrcode library for QR generation
- html-to-image for social cards

## Open Questions

1. **Should all tournaments be public by default?**
   - Yes - with option to make private

2. **Allow anonymous commenting on public pages?**
   - No - requires authentication to prevent spam

3. **Show individual player statistics publicly?**
   - No - privacy concerns

4. **Allow embedding leaderboards on external sites?**
   - Yes - with iframe embed codes

5. **Public API for external apps?**
   - Post-MVP - requires API key system
