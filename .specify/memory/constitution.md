<!--
SYNC IMPACT REPORT
===================
Version Change: N/A → 1.0.0
Action: Initial constitution creation

Principles Defined:
  I. Type-Safe Architecture (NEW)
  II. Real-Time Data Integrity (NEW)
  III. Code Quality Enforcement (NEW)
  IV. Role-Based Access Control (NEW)
  V. Modern UI Patterns (NEW)
  VI. Component-Driven Development (NEW)

Templates Reviewed:
  ✅ plan-template.md - Updated constitution check section
  ✅ spec-template.md - Aligned with type-safety and RBAC requirements
  ✅ tasks-template.md - Aligned with testing and validation requirements

Follow-up TODOs: None
-->

# Urban Legends Constitution

## Core Principles

### I. Type-Safe Architecture

**Non-Negotiable Rules**:

- All data flows MUST be strongly typed end-to-end (TypeScript on frontend, Convex schema on backend)
- Database schema changes MUST be defined in `convex/schema.ts` using Convex validators
- API functions MUST use typed IDs (e.g., `v.id("tournaments")`, `v.id("teams")`)
- Component props MUST have explicit TypeScript interfaces
- NO `any` types unless explicitly justified and documented
- Form validation MUST use Zod schemas integrated with TanStack Form

**Rationale**: Type safety prevents runtime errors, enables IDE autocomplete, catches bugs at compile-time, and serves as live documentation. In a tournament platform handling user data and team coordination, type errors can lead to data corruption or broken user experiences.

### II. Real-Time Data Integrity

**Non-Negotiable Rules**:

- All data mutations MUST use Convex mutations (no direct state updates)
- All data reads MUST use Convex queries via `useQuery` hook
- Authentication state MUST be synchronized between Clerk and Convex
- User actions MUST trigger immediate UI feedback via optimistic updates where appropriate
- Data consistency MUST be maintained across concurrent user sessions
- Webhooks (e.g., Clerk sync) MUST be idempotent and handle retries

**Rationale**: Real-time sync ensures all users see consistent tournament state. In a collaborative environment where teams submit entries and admins approve them, stale data leads to conflicts and user confusion. Convex's reactive queries eliminate polling and manual cache invalidation.

### III. Code Quality Enforcement (NON-NEGOTIABLE)

**Non-Negotiable Rules**:

- ALL code MUST pass Biome linting amd formatting (`bun run check:fix`) before commit
- Tailwind classes MUST be sorted using Biome's `useSortedClasses` rule
- NO ESLint or Prettier configurations (Biome only)
- `convex/_generated/**` MUST be excluded from linting/formatting
- Git hooks MUST be respected (no `--no-verify`)
- Double quotes for JavaScript/TypeScript strings (Biome convention)

**Rationale**: Consistent formatting reduces cognitive load, prevents bikeshedding in code reviews, and catches common bugs. Biome's performance enables instant feedback. In a rapidly evolving codebase, automated enforcement prevents technical debt accumulation.

### IV. Role-Based Access Control

**Non-Negotiable Rules**:

- User roles MUST be stored in `convex/schema.ts` (`roles` and `userRoles` tables)
- Authentication MUST be verified using `getCurrentUserOrThrow(ctx)` in all protected functions
- Admin-only routes MUST check `user.roles.includes("admin")` before execution
- Admin routes MUST be under `/admin/` path with middleware protection
- Protected routes MUST be in `(all)` route group with Clerk middleware
- Public routes MUST be in `(auth)` route group
- User permissions MUST be checked server-side (Convex) not just client-side

**Rationale**: Tournament platforms handle sensitive operations (creating tournaments, approving submissions, managing teams). Client-side checks are insufficient against malicious actors. Centralized RBAC in Convex ensures authorization logic is consistent, auditable, and secure.

### V. Modern UI Patterns

**Non-Negotiable Rules**:

- UI components MUST use Radix UI primitives following shadcn/ui conventions
- Styling MUST use Tailwind CSS (no inline styles or CSS-in-JS except for dynamic values)
- Component variants MUST use CVA (class-variance-authority)
- Class merging MUST use `cn()` utility (from `src/lib/utils.ts`)
- Forms MUST use TanStack Form with Zod validation
- Tables MUST use TanStack Table with `DataTable` component pattern
- Loading states MUST be handled with Suspense boundaries where applicable
- Internationalization MUST use next-intl for user-facing text

**Rationale**: Modern UI patterns provide accessibility, performance, and maintainability out of the box. Radix UI handles keyboard navigation, screen readers, and focus management. Tailwind enables rapid iteration without context switching. TanStack libraries provide battle-tested solutions for forms and tables, avoiding reinventing complex UI logic.

### VI. Component-Driven Development

**Non-Negotiable Rules**:

- Components MUST be organized by feature (e.g., `/components/tournaments/`, `/components/teams/`)
- Reusable UI primitives MUST be in `/components/ui/`
- Custom hooks MUST be in `/hooks/` directory
- Components MUST follow single responsibility principle
- Prop drilling beyond 2 levels MUST use React Context or Convex state
- Server components MUST be used by default (only add "use client" when necessary)
- Client components MUST be minimized and clearly labeled
- Component file names MUST use kebab-case (e.g., `tournament-card.tsx`)

**Rationale**: Component organization by feature makes navigation intuitive. Separating UI primitives from domain components enables reuse. Minimizing client components optimizes bundle size and leverages Next.js 15 server-side rendering for better performance and SEO.

## Technology Constraints

**Stack Requirements**:

- **Frontend Framework**: Next.js 15 with App Router (no Pages Router)
- **Runtime**: Bun preferred (Node.js 18+ fallback)
- **Backend**: Convex for all data operations (no REST API layer)
- **Authentication**: Clerk with OAuth (no custom auth)
- **Linting/Formatting**: Biome only (no ESLint/Prettier)
- **UI Libraries**: Radix UI, Tailwind CSS, shadcn/ui patterns
- **State Management**: Convex queries (no Redux, Zustand, etc.)

**Forbidden Patterns**:

- Direct database access bypassing Convex functions
- Client-side authentication checks without server-side verification
- Mixing ESLint/Prettier with Biome
- Using `any` types without documented justification
- CSS Modules or styled-components (use Tailwind)
- Polling for real-time data (use Convex subscriptions)

## Development Workflow

**Pre-Commit Requirements**:

1. Code MUST pass `bun run lint` (Biome linting)
2. Code MUST pass `bun run format` (Biome formatting check)
3. Both `bun run dev` AND `bunx convex dev` MUST be running during development
4. Git hooks MUST NOT be bypassed with `--no-verify`

**Pull Request Requirements**:

1. All conversations/comments MUST be resolved before merge
2. Convex schema changes MUST be deployed to dev environment first
3. Route changes MUST update middleware configuration if needed
4. New components MUST follow shadcn/ui patterns
5. Database migrations MUST be backwards compatible when possible

**Code Review Focus Areas**:

- Type safety: No `any` types, proper Convex schema usage
- Security: RBAC checks, input validation, SQL injection prevention
- Performance: Proper use of server vs client components
- Accessibility: Semantic HTML, ARIA labels, keyboard navigation
- Code quality: Biome compliance, component organization

## Governance

**Amendment Process**:

1. Proposed changes MUST be documented in a constitution amendment proposal
2. Amendments MUST include rationale and migration plan if breaking
3. Breaking amendments require team discussion and approval
4. Constitution version MUST be incremented per semantic versioning rules

**Versioning Policy**:

- **MAJOR**: Backward incompatible changes (e.g., removing a principle, changing stack requirement)
- **MINOR**: New principles added or material expansions to existing principles
- **PATCH**: Clarifications, wording improvements, typo fixes

**Compliance Verification**:

- All PRs MUST verify alignment with constitution principles
- New features MUST reference constitution principles in design docs
- Deviations from constitution MUST be explicitly justified and documented
- Constitution compliance is checked in plan phase (`/speckit.plan` command)

**Complexity Justification**:

- Violations of simplicity principles MUST be justified in plan.md "Complexity Tracking" section
- Simpler alternatives MUST be documented and reasons for rejection stated
- Technical debt resulting from complexity MUST be tracked in issues

**Runtime Guidance**:

- Developers MUST consult `CLAUDE.md` for day-to-day development patterns and commands
- Constitution provides principles; `CLAUDE.md` provides practical implementation details

**Version**: 1.0.0 | **Ratified**: 2026-01-29 | **Last Amended**: 2026-01-29
