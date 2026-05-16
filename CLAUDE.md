# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Urban Legends is a web-based tournament tracking platform built with TanStack Start (Vite), Convex (backend), and Clerk (authentication). The application allows administrators to create and manage tournaments while users can form teams, join tournaments, and submit entries for tournament activities.

## Development Commands

### Running the Application

```bash
bun run dev              # Start TanStack Start dev server (Vite)
bunx convex dev          # Start Convex backend in dev mode (run in separate terminal)
```

Both commands must be running simultaneously for the application to work properly.

### Build & Production

```bash
bun run build           # Build for production (Vite)
bun run start           # Start production server (node .output/server/index.mjs)
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

### Code Health

```bash
bun run fallow          # Run Fallow analysis (unused code, duplication, complexity)
bun run fallow:ci       # Run with SARIF output and quiet mode (CI)
```

**Fallow** provides a periodic code-health signal — it is **not a blocking gate**. Findings surface as warnings to inform cleanup triage. In CI, Fallow runs on PRs and posts inline annotations and a summary comment. The Fallow MCP server (`fallow-mcp`) is configured in `.claude/settings.json` for agent use. See `docs/adr/0007-adopt-fallow-code-health.md` for rationale.

### Git Commits

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

- **Framework**: TanStack Start (Vite + Nitro), React 19, TypeScript
- **Routing**: TanStack Router (file-based routes in `src/routes/`)
- **Backend**: Convex (serverless backend with real-time data)
- **Authentication**: Clerk (`@clerk/tanstack-react-start`) integrated with Convex
- **UI**: Tailwind CSS v4 (`@tailwindcss/vite`), Radix UI components, shadcn/ui patterns
- **Forms**: TanStack Form (`@tanstack/react-form`)
- **Tables**: TanStack Table (`@tanstack/react-table`)

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
  start.ts              # TanStack Start instance + Clerk request middleware
  /routes/              # TanStack Router file-based routes
    __root.tsx          # Root route with Clerk + Convex providers
    _auth.tsx           # Pathless layout for sign-in / sign-up
    _public.tsx         # Pathless layout for public pages
    _protected.tsx      # Pathless layout requiring authentication
    _protected/         # Authenticated routes (admin, captain, reviewer, etc.)

  /components/          # React components
    /ui/               # Reusable UI components (shadcn/ui style)
    /tournaments/      # Tournament-specific components
    /teams/           # Team-specific components
    /submissions/     # Submission-specific components

  /hooks/              # Custom React hooks
  /lib/               # Utilities (e.g., cn() for class merging)
  /styles/globals.css  # Tailwind v4 entrypoint + theme tokens
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

1. Clerk handles OAuth authentication; request-side wiring lives in `src/start.ts` via `clerkMiddleware` on the TanStack Start instance
2. Clerk webhooks sync user data to Convex (via `convex/http.ts`)
3. Convex functions use `getCurrentUserOrThrow()` for auth checks
4. Admin routes check `user.roles.includes("admin")`
5. Protected routes live under the `_protected` pathless layout in `src/routes/`; public/auth routes under `_public` / `_auth`

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
NEXT_PUBLIC_CONVEX_URL=   # Convex backend URL (Convex CLI writes this name — kept as-is)

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
CLERK_WEBHOOK_SECRET=
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

`vite.config.ts` accepts both `VITE_` and `NEXT_PUBLIC_` prefixes via `envPrefix`; the `NEXT_PUBLIC_` allowance exists solely so the Convex CLI's auto-written `NEXT_PUBLIC_CONVEX_URL` stays consumable client-side.

## Known Issues & Technical Debt

- Admin role assignment (`setUserRole`) is partially implemented/commented out
- User-side team creation is admin-only currently
- Submission approval workflow is incomplete
- Tournament leaderboard UI not yet implemented

## Development Notes

- Always run both `bun run dev` AND `bunx convex dev` during development
- Routes live in `src/routes/`; pathless layouts (`_auth`, `_public`, `_protected`) group routes without affecting URLs
- The generated route tree is produced by `bun run routes:generate` (also runs automatically before `typecheck`)
- Convex functions auto-generate TypeScript types in `convex/_generated/` (excluded from linting)
- Use `@/` path alias for imports from `src/` directory
- The `cn()` utility (in `src/lib/utils.ts`) combines `clsx` + `tailwind-merge` for optimal class merging
- Component styling follows Tailwind v4 + CVA (class-variance-authority) patterns
- UI components are built with Radix UI primitives following shadcn/ui conventions

## Agent skills

### Issue tracker

Issues live in GitHub Issues at `andresatierf/urban-legends` (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles using the default label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
