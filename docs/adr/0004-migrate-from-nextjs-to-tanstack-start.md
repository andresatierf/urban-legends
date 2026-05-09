# Migrate from Next.js App Router to TanStack Start

The frontend migrates from Next.js 15 (App Router) to TanStack Start. The follow-up migration plan is tracked separately; this ADR records the decision and the reasoning, not the cutover steps.

The decision is driven by what the codebase already is, not by Start's headline features. Of 32 page/layout files under `src/app/`, 27 carry `"use client"`. There are zero `"use server"` actions. The only Next-server-flavoured code outside the framework's own shell is `src/i18n/request.ts` (one cookie read) and a one-line Clerk middleware. The app is a client-rendered SPA wearing Next.js as a router + auth-middleware shell. The "we'd lose RSCs and streaming" cost that ordinarily weighs against leaving Next.js does not apply — those primitives aren't being used.

What the migration buys, concretely:

- **Type-safe routing.** TanStack Router types params, search params, and loader return shapes end-to-end. Today every dynamic segment (`[teamId]`, `[tournamentId]`, `[submissionId]`, `[userId]`) is a string at the call site with no compiler help.
- **Stack cohesion.** TanStack Form and TanStack Table are already in production use. Start unifies the rest (Router, Query) on the same project.
- **Cleaner Convex SSR.** Convex's official Start integration prefetches via loader with a single timestamp shared across all queries on a page, then hands off to live websocket subscriptions on hydration. This is a tighter fit for Convex's reactive model than RSCs, which were never designed around long-lived subscriptions.
- **Less framework magic.** Vite dev server, explicit server/client boundaries via `createServerFn`, no hidden compilation conventions to learn or fight.

What the migration costs are bounded:

- **Clerk integration is Tier 1.** `@clerk/tanstack-react-start` is officially documented. Route protection inverts from "deny by matcher" to "allow by default, opt-in via `beforeLoad`", but the existing `(protected)` route group already implies a single layout-level gate — it ports 1:1 to a `_protected` layout route with one `beforeLoad` covering everything underneath.
- **Convex integration is Tier 1.** `ConvexProviderWithClerk` exists for Start; the Convex docs ship a joint Convex+Clerk+Start guide.
- **i18n surface is shallow.** Exactly one component (`app-sidebar.tsx`) calls `useTranslations`, against a single locale file (`en.json`). Replace `next-intl` with any Vite-compatible i18n (or drop it until a second locale is needed).
- **Routing parity is mechanical.** No parallel routes (`@*`), no intercepting routes (`(.)`). Just route groups + dynamic segments, both of which TanStack Router models directly.
- **shadcn/ui, Tailwind, TanStack Form and Table** are framework-agnostic; they move without changes.

Why now rather than later: the surface is 17 page routes, ~half a dozen layouts, and one cookie-based i18n entry. Every month on Next.js compounds the migration cost without changing the verdict, because none of the framework features that *would* change the verdict (RSCs, server actions, parallel routes) are in use today and there is no roadmap item that adds them.

## Considered options

- **Stay on Next.js indefinitely.** Rejected: the type-safety and cohesion wins are real and persistent, and the costs that ordinarily justify "stay" (loss of RSCs, server actions, Vercel ergonomics) are largely inapplicable to this codebase. Vercel still works as a deploy target for TanStack Start via its Vite preset, so the deployment-ergonomics objection does not survive scrutiny.
- **Defer until a migration trigger emerges (perf regression, major Next upgrade, etc.).** Rejected: there is no plausible trigger that *strengthens* the case in six months — only triggers that weaken it (more routes, deeper Next coupling). "Later" is strictly worse than "now" given the present surface area.
- **Run the spike as originally scoped in #93 (full ADR with PoC).** Rejected: the eight investigation questions in #93 were answered in roughly 30 minutes of doc-reading and code-grepping. Building a PoC to reconfirm what the official Clerk and Convex integration guides already document would burn time without changing the outcome.
- **Big-bang vs. route-by-route migration.** Big-bang chosen for the follow-up plan: TanStack Router and Next App Router cannot coexist in one app, and operating two apps behind a reverse proxy with shared Clerk session would cost more than rewriting 17 routes on a branch.
