# Product

## Register

product

## Users

Urban Legends is used by three overlapping audiences inside a single workplace-tournament context:

- **Players** — employees competing on **Teams**, logging daily **Submissions** with photo **Evidence** between meetings or on mobile after a workout. They want the act of submitting to feel quick and rewarding, and the act of checking standings to feel like reading a sports page.
- **Captains** — Players with roster authority over one Team. They manage **JoinRequests** (both directions), juggle invites, and coordinate teammates. Their work is asynchronous and bursty.
- **Tournament managers, reviewers, organizers, and admins** — operators running the tournament. They approve or reject Submissions, manage rosters, and configure tournaments. They spend more sustained time in tables, forms, and detail screens.

The common context: a competition that is fun but not trivial. People care about the standings. The interface is checked in passing on phones and worked in deliberately on desktops.

## Product Purpose

Urban Legends tracks workplace **Tournaments**: Teams of human players compete by submitting daily activity entries that are reviewed, scored, and rolled up into standings. The platform exists to make running and participating in a tournament feel ceremonial — winners, losers, ribbons, podiums — without the operational layer (review queues, roster management, authorization) feeling toy-like.

Success looks like: managers find review fast and unambiguous; players check in once or twice a day and feel proud of their streak; the leaderboard reveal at the end feels like an actual award.

## Brand Personality

**Earnest, celebratory, editorial.** Tournaments are inherently expressive — there are real winners and real losers — and the product leans into that without becoming cartoonish. Editorial gravity comes from the type system and the ink-on-paper palette; energy comes from the five accents used categorically (sunset for action, grass for approval, sky for info, plum for social, gold for celebration).

Voice is warm but not chatty. Copy is direct. Confetti is rare and earned. The product looks like a contemporary sports broadsheet laid on a desk, not a SaaS dashboard.

## Anti-references

- **Generic shadcn / Linear-flat-grey** — no neutral-grey product surfaces. Field Day applies to every screen, including admin and auth.
- **Material / iOS** — not platform-neutral design languages.
- **Corporate SaaS templates** — no "hero metric over four identical icon cards" dashboards, no gradient-text headlines, no glassmorphic panels, no side-stripe alerts.
- **A "fun skin" over a corporate base** — Field Day is the base, not a theme applied on top.
- **Toy / gamified consumer-fitness apps** — confetti everywhere, neon gradients, bouncing micro-interactions. Urban Legends is celebratory but editorial; it does not pander.

## Design Principles

1. **Ceremony where it's earned, calm everywhere else.** Ribbons, gold, confetti, and podiums belong to win moments — tournament headers, final reveals, podium tiles. Routine surfaces (admin tables, forms, dashboards) stay warm-paper calm so the celebratory moments retain weight.
2. **Color is semantic, never decorative.** The five accents each carry a fixed meaning (sunset = action, grass = approval, sky = info, plum = social, gold = celebration). A blue button is an info button. A green badge is an approved badge. Never introduce a sixth accent — widen an existing one or fall back to `mute`.
3. **Editorial gravity, not corporate polish.** Funnel Display titles, Lexend body, DM Mono for indexed/scanned text (labels, columns, metrics). Hard-offset ink shadows over soft blurs. Warm paper over cool neutral.
4. **One language across the whole product.** Field Day applies to dashboards, admin tables, sign-in screens, and marketing surfaces equally. There is no "neutral shadcn" fallback zone — if a primitive reaches its default tokens, the rebinding is broken; fix the binding, never override at the call site.
5. **Trust the reader.** Copy is short and direct. No restated headings, no em dashes, no AI-tell pleasantries. Status is encoded by tinted badges with `label-caps` text, not paragraphs of explanation.

## Accessibility & Inclusion

- Target **WCAG 2.1 AA** for all interactive surfaces. Field Day badge tints pair tinted fills with deeper-shade text specifically to hold AA contrast against warm paper.
- Sunset focus rings on every interactive primitive — focus is always visible, always the same color, never suppressed.
- Field Day's categorical accents are color-coded but never color-only: state badges carry `label-caps` text labels alongside the tint. Approval/rejection and info/social are distinguishable to users with red-green or blue-yellow color vision deficiencies because they pair with distinct text and iconography.
- Photo **Evidence** has alt-text considerations: descriptions should reach screen readers via Submission context, not be left as decorative.
- Respect `prefers-reduced-motion`: confetti, ribbon reveals, and any podium animation must degrade to a static state. Motion is celebratory; it is never load-bearing.
- Mobile-first responsive: players submit on phones in gyms and break rooms; the submit flow must work at 360px width with thumb-reachable primary actions.
