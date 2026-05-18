# Scope `/dashboard` to single-tournament team standing and comparison

The dashboard previously rendered, on a single route, four competing surfaces: personal Player stats (day streak, weekly approved, today's logged), team status across every tournament the viewer participates in, an editorial league-wide overlay (Squad of the Day, cross-team activity feed, Tale of the Tape rivalry framing), and an operator clipboard gated on `isAdmin` (member totals, active-tournament counts, review-queue size, approval rate). Several facts were encoded two or three times — streak in both the hero chips and Field Stats, squad rank in both — and the page had no single declared job.

The dashboard is rescoped to answer exactly one question: *"How is my team doing in this tournament, and how do we compare to other teams?"* The page becomes single-tournament-at-a-time (switcher in the header), role-adaptive (one route, sections appear based on what the viewer is), and team-focused. Personal stats move off this screen entirely. Operator content moves to `/admin/*` entirely. Editorial overlays (Squad of the Day, cross-team activity feed, Tale of the Tape) are cut. The standings card (race chart + leaderboard, viewer's team highlighted) is the page's main act; a "My team" header above it answers the headline question in two numbers (rank and gap to next); a conditional Inbox below it surfaces actionable **JoinRequests**; a conditional submit-today banner near the top nudges the viewer to log if their non-deleted, non-rejected submission count for today is below the tournament's `maxSubmissionsPerDay`.

The composed read-model is named **DashboardView** following the established **View** pattern in `convex/views/` — see CONTEXT.md.

## Considered options

- **Role-adaptive single page (chosen).** One `/dashboard` route, sections appear based on viewer state (has Teams, captains any Team, has invitations). Common case is one hat at a time so route-splitting is overhead for no payoff; the single workplace-tournament context keeps the user-set small enough that the route doesn't fragment.
- **Role-specific dashboards (rejected).** `/dashboard`, `/dashboard/captain`, `/dashboard/manage`, with a switcher in the chrome. Cleaner per-role pages, but a tournament with two captains and one organizer is not a population that needs route-level segmentation. Multi-hat users get jerked between routes; single-hat users get a switcher they never touch.
- **Player-only dashboard (rejected).** `/dashboard` is only the Player home; Captain duties live on the Team page, Operator duties in admin. Cleanest separation, but it leaves invitations (a Player-side action) and join-requests-to-my-team (a Captain-side action) on different surfaces — both are home-page-feeling obligations that the user wants to triage in one place.

## Cuts and their rationale

- **Personal stats (day streak, weekly approved, today's approved, sparklines, Field Stats grid).** These answer a different question — "am I pulling my weight" — and belong on the submission flow or a personal profile area, where the viewer can *act* on them. Their presence here created the duplication problem.
- **Editorial overlays (Squad of the Day, Highlights from the Field, Tale of the Tape).** `PRODUCT.md`'s "sports page feeling" is brand voice (typography, palette, ceremony where earned), not a directive to surface league-wide flair on the daily home. The user explicitly rejected "sports page feeling" as the dashboard's job.
- **Operator clipboard (`adminStats`).** Vanity counts that don't drive action. The single useful item (review-queue size) belongs in a nav-level affordance visible across operator screens, not the dashboard body. Admin home is one click away.
- **`LogActivityFab` (always-on submit FAB).** Replaced by the conditional banner that appears only when the viewer has unmet daily-submission capacity. A persistent FAB dulls the actual nudge by being there even when satisfied.
- **`competingTeams` field on `getDashboardData`.** The empty state for a viewer with no team is a directed prompt to find a tournament, not a spectator view of standings the viewer isn't in. With no other consumer, the field can come out of the response.

## Consequences

- `convex/dashboard.ts` becomes the **DashboardView** query under `convex/views/`, returning a smaller, single-tournament-scoped payload. The cross-tournament aggregation logic in `src/components/dashboard/utils.ts` largely disappears.
- The submit-today banner depends on the rule that `rejected` submissions do not consume daily-cap slots — currently the server counts them. This is filed as a follow-up (issue #289) and must land before the banner ships, or the banner will lie to users in the limit-=-1 case.
- A 7-day grace window keeps just-ended tournaments selectable in the switcher so the result can be savored on the daily home; after that they drop off and live on the tournament-detail page only. This window is reversible and intentionally not load-bearing.
- Operators wearing the player hat lose nothing — they still see their team's standing. Operators wearing the operator hat lose the dashboard surface for queue counts and member totals; the admin home should grow whatever they actually need, which the previous dashboard placement obscured.
