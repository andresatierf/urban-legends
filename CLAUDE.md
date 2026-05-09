# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Urban Legends is a web-based tournament tracking platform built with Next.js 15, Convex (backend), and Clerk (authentication). The application allows administrators to create and manage tournaments while users can form teams, join tournaments, and submit entries for tournament activities.

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
bun run lint            # Run oxlint linter
bun run lint:fix        # Auto-fix linting issues
bun run format          # Check code formatting (oxfmt)
bun run format:fix      # Auto-format code (oxfmt)
```

**Important**: This project uses **oxlint** for linting and **oxfmt** for formatting (the Oxc toolchain). Always use the bun scripts above. The tools are configured to:

- Enforce sorted Tailwind classes in both `className` attributes and `cn()`/`cva()` function calls (via oxfmt `sortTailwindcss`)
- Auto-organize imports on format (via oxfmt `sortImports`)
- Exclude `convex/_generated/**` from linting and formatting
- Use double quotes for JavaScript/TypeScript strings

### Git Commits

**CRITICAL**: When asked to commit changes, you MUST use the Skill tool with the "commit" skill:

```
Use the Skill tool: skill="commit"
```

Do NOT manually create commit messages or use `git commit` directly. The commit skill will:

- Analyze staged changes automatically
- Generate properly formatted conventional commit messages
- Match the repository's existing commit style
- Use heredoc format correctly

The repository follows this commit format:

```
<type>(<scope>): <brief description>

<detailed description>
- Key changes listed
- Explanation of why changes were made
```

**Common scopes**: `notifications`, `teams`, `tournaments`, `submissions`, `auth`, `ui`, `backend`, `schema`

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
  submissions.ts        # Submission tracking
  users.ts              # User management & auth helpers
  roles.ts              # Role-based access control
  admin.ts              # Admin-specific operations
  http.ts               # Webhook handlers (Clerk integration)
  auth.config.ts        # Convex auth configuration

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

- **tournaments**: Tournament definitions with start/end dates and team size constraints
- **teams**: Teams associated with tournaments
- **teamMembers**: Junction table linking users to teams with roles (captain/member)
- **submissions**: Daily activity submissions by teams (with approval states: pending/approved/rejected/deleted)
- **users**: User profiles synced from Clerk
- **roles** + **userRoles**: Role-based access control (admin/user)

All tables use auto-generated IDs via Convex. Relationships use typed IDs like `v.id("tournaments")`.

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

## Development Notes

- Always run both `bun run dev` AND `bunx convex dev` during development
- Route groups `(auth)` and `(all)` don't affect URLs but organize code
- Convex functions auto-generate TypeScript types in `convex/_generated/` (excluded from linting)
- Use `@/` path alias for imports from `src/` directory
- The `cn()` utility (in `src/lib/utils.ts`) combines `clsx` + `tailwind-merge` for optimal class merging
- Component styling follows Tailwind + CVA (class-variance-authority) patterns
- UI components are built with Radix UI primitives following shadcn/ui conventions

## Active Technologies

- TypeScript 5.x with Next.js 15 (React 19), Convex backend + Next.js 15, React 19, Convex (serverless backend), Clerk (authentication), Tailwind CSS, Radix UI, TanStack Form, shadcn/ui patterns (001-notification-system)
- Convex database with real-time subscriptions (001-notification-system)

## Recent Changes

- 001-notification-system: Added TypeScript 5.x with Next.js 15 (React 19), Convex backend + Next.js 15, React 19, Convex (serverless backend), Clerk (authentication), Tailwind CSS, Radix UI, TanStack Form, shadcn/ui patterns

## Agent skills

### Issue tracker

Issues live in GitHub Issues at `andresatierf/urban-legends` (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles using the default label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
