# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Urban Legends is a web-based tournament tracking platform built with Next.js 15, Convex (backend), and Clerk (authentication). The application allows administrators to create and manage tournaments while users can form teams, join tournaments, and submit entries for tournament activities.

The platform supports multiple competition types through a flexible, pluggable architecture. Tournaments can use built-in competition types (daily activity tracker, photo contest, fitness challenge) or custom types with their own submission schemas, scoring methods, and validation rules.

## Development Commands

### Running the Application

```bash
bun run dev              # Start Next.js dev server with Turbopack
bunx convex dev          # Start Convex backend in dev mode (run in separate terminal)
```

Both commands must be running simultaneously for the application to work properly.

### Build & Production

```bash
bun run build           # Build for production with Turbopack
bun run start           # Start production server
```

### Code Quality

```bash
bun run lint            # Run Biome linter
bun run lint:fix        # Auto-fix linting issues
bun run format          # Check code formatting
bun run format:fix      # Auto-format code
```

**Important**: This project uses **Biome** (not ESLint/Prettier) for linting and formatting. Always use the bun scripts above, not direct biome CLI commands. Biome is configured to:

- Enforce sorted Tailwind classes (via `useSortedClasses` rule) in both `className` attributes and `cn()` function calls
- Exclude `convex/_generated/**` from linting and formatting
- Use double quotes for JavaScript/TypeScript strings
- Auto-organize imports when using assist mode

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Convex (serverless backend with real-time data)
- **Authentication**: Clerk (OAuth-based auth) integrated with Convex
- **UI**: Tailwind CSS, Radix UI components, shadcn/ui patterns
- **Forms**: TanStack Form (@tanstack/react-form)
- **Tables**: TanStack Table (@tanstack/react-table)
- **Internationalization**: next-intl

### Directory Structure

```
/convex/                  # Convex backend functions
  schema.ts              # Database schema definitions
  tournaments.ts         # Tournament queries & mutations
  teams.ts              # Team management logic
  submissions.ts        # Submission tracking (with scoring engine integration)
  users.ts              # User management & auth helpers
  roles.ts              # Role-based access control
  admin.ts              # Admin-specific operations
  http.ts               # Webhook handlers (Clerk integration)
  auth.config.ts        # Convex auth configuration
  competitionTypes.ts   # Competition type queries (list, get, getBySlug)

  /competitionTypes/    # Competition type definitions
    builtins.ts         # Built-in competition types (daily activity, photo contest, fitness)
    init.ts            # Initialization function for built-in types

  /scoring/             # Pluggable scoring engine
    engine.ts           # Core scoring interfaces (ScoringMethod, ScoringContext, ScoringResult)
    registry.ts         # Scoring method registration and lookup
    /methods/           # Scoring method implementations
      fixed.ts          # Fixed points per submission (legacy daily activity)
      formula.ts        # Expression-based scoring (e.g., "distance * 10 + duration * 0.5")
      ranked.ts         # Position-based scoring (1st=100pts, 2nd=80pts, etc.)
      cumulative.ts     # Weighted metric summation

/src/
  /app/                  # Next.js App Router
    /(auth)/            # Public auth routes (sign-in, sign-up)
    /(all)/             # Protected routes (requires authentication)
      /admin/           # Admin-only pages (tournaments, users, teams)
      /dashboard/       # User dashboard
      /tournaments/     # Tournament browsing & management
      /teams/           # Team pages
      /submissions/     # Submission forms & views
    ConvexClientProvider.tsx  # Convex React client setup
    layout.tsx         # Root layout with Clerk & Convex providers

  /components/          # React components
    /ui/               # Reusable UI components (shadcn/ui style)
    /tournaments/      # Tournament-specific components
    /teams/           # Team-specific components
    /submissions/     # Submission-specific components

  /hooks/              # Custom React hooks
  /lib/               # Utilities (e.g., cn() for class merging)
  /i18n/              # Internationalization setup
  middleware.ts       # Clerk authentication middleware
```

### Database Schema

Key tables in Convex:

- **competitionTypes**: Defines competition types with submission schemas, scoring methods, and validation rules
  - Built-in types: `daily-activity-tracker`, `photo-contest`, `fitness-challenge`
  - Supports versioning (slug + version uniqueness)
  - Fields: slug, name, description, version, status, submissionSchema, scoringConfig, validationRules, features, uiComponents
- **tournaments**: Tournament definitions with start/end dates and team size constraints
  - Optional `competitionTypeId` links to a competition type (null for legacy tournaments)
  - Legacy tournaments continue using hardcoded daily activity logic
- **teams**: Teams associated with tournaments
- **teamMembers**: Junction table linking users to teams with roles (captain/member)
- **submissions**: Flexible submissions supporting multiple competition types
  - Optional `data` field stores structured submission data per competition type schema
  - Optional `submissionType` (individual/team) and `tier` (base/advanced) for flexible workflows
  - Optional `scoringMetadata` tracks scoring method, calculation time, and raw metrics
  - Approval states: pending/approved/rejected/deleted
- **users**: User profiles synced from Clerk
- **roles** + **userRoles**: Role-based access control (admin/user)

All tables use auto-generated IDs via Convex. Relationships use typed IDs like `v.id("tournaments")`.

**Backward Compatibility**: Existing tournaments without a `competitionTypeId` continue using the original hardcoded daily activity scoring logic. New tournaments can optionally specify a competition type for flexible scoring.

### Authentication Flow

1. Clerk handles OAuth authentication (configured in middleware.ts)
2. Clerk webhooks sync user data to Convex (via http.ts)
3. Convex functions use `getCurrentUserOrThrow()` for auth checks
4. Admin routes check `user.roles.includes("admin")`
5. Protected routes are in `(all)` route group, public routes in `(auth)`

### Data Fetching Patterns

**Convex Queries** (read data):

```typescript
const tournaments = useQuery(api.tournaments.list, { userId });
```

**Convex Mutations** (write data):

```typescript
const upsertTournament = useMutation(api.tournaments.upsert);
await upsertTournament({ name, description, startDate, endDate, ... });
```

All Convex functions are strongly typed. Import from `convex/_generated/api`.

### Common Patterns

**Role-Based Access Control**:

```typescript
const user = await getCurrentUserOrThrow(ctx);
if (!user.roles.includes("admin")) {
  throw new Error("Admin access required");
}
```

**Tournament Status Logic**:
Tournaments are sorted by status (active > upcoming > ended) in `tournaments.list`. Use date comparison with ISO strings.

**Competition Types**:

```typescript
// Fetch all active competition types
const competitionTypes = useQuery(api.competitionTypes.list, { status: "active" });

// Get specific competition type by slug (returns latest version)
const dailyActivity = useQuery(api.competitionTypes.getBySlug, { slug: "daily-activity-tracker" });

// Get specific version
const photoContestV1 = useQuery(api.competitionTypes.getBySlug, { slug: "photo-contest", version: 1 });
```

**Scoring Engine**:
The scoring engine uses a pluggable architecture with four built-in methods:

- **fixed**: Fixed points per submission (e.g., legacy daily activity with 10pts individual, 25pts team exercise)
- **formula**: Expression-based scoring (e.g., `"(distance * 10) + (duration * 0.5)"`)
- **ranked**: Position-based scoring (1st=100pts, 2nd=80pts, 3rd=60pts, etc.)
- **cumulative**: Weighted sum of multiple metrics (e.g., `distance * 1.0 + calories * 0.1`)

When a submission is created or updated, `recalculateSubmissionPoints` automatically uses the tournament's competition type scoring method. Legacy tournaments without a `competitionTypeId` continue using the original hardcoded logic.

**Form Validation**:
Forms use TanStack Form with Zod schemas. See existing tournament/team forms for patterns.

**Data Tables**:
Use TanStack Table with custom `DataTable` component. See `tournaments-data-table.tsx` for reference implementation with global filtering.

## Environment Variables

Required variables in `.env.local`:

```bash
# Convex
CONVEX_DEPLOYMENT=        # Set by convex dev
NEXT_PUBLIC_CONVEX_URL=   # Convex backend URL

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

## Known Issues & Technical Debt

- Admin role assignment (`setUserRole`) is partially implemented/commented out
- User-side team creation is admin-only currently
- Submission approval workflow is incomplete
- Tournament leaderboard UI not yet implemented
- Frontend UI for creating tournaments with competition types not yet implemented (backend ready)
- Dynamic form generation based on competition type submission schemas not yet implemented
- Built-in competition types need to be initialized via `competitionTypes.init.initializeBuiltInTypes` internal mutation

## Development Notes

- Always run both `bun run dev` AND `bunx convex dev` during development
- Route groups `(auth)` and `(all)` don't affect URLs but organize code
- Convex functions auto-generate TypeScript types in `convex/_generated/` (excluded from linting)
- Use `@/` path alias for imports from `src/` directory
- The `cn()` utility (in `src/lib/utils.ts`) combines `clsx` + `tailwind-merge` for optimal class merging
- Component styling follows Tailwind + CVA (class-variance-authority) patterns
- UI components are built with Radix UI primitives following shadcn/ui conventions

### Multi-Competition Type Architecture

The platform supports multiple competition types through a pluggable architecture:

**Adding New Scoring Methods**:
1. Create a new file in `convex/scoring/methods/` implementing the `ScoringMethod` interface
2. Register it in `convex/submissions.ts` by importing and calling `registerScoringMethod(yourMethod)`
3. The method will automatically be available for use in competition type configurations

**Creating Built-in Competition Types**:
1. Define the type in `convex/competitionTypes/builtins.ts` following existing patterns
2. Add it to the `BUILTIN_COMPETITION_TYPES` array
3. Run the `initializeBuiltInTypes` internal mutation to create it in the database

**Backward Compatibility**:
- Legacy tournaments without `competitionTypeId` continue using hardcoded daily activity scoring
- The `recalculateSubmissionPoints` function in `convex/submissions.ts` handles both paths
- All scoring methods are registered at module initialization in `submissions.ts`
