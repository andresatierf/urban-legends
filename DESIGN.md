---
version: alpha
name: Field Day
description: >
  Urban Legends' visual identity — warm paper, hard-offset shadows, ink
  borders, vivid five-accent palette, editorial typography. Field Day is
  the canonical design language across the entire application.
colors:
  # ── Palette (named, hue-anchored) ───────────────────────────────
  paper: "#FFFAF0"
  paper-deep: "#FBF3DF"
  card: "#FFFFFF"
  ink: "#2A1F1A"
  mute: "#7A6A5C"
  sunset: "#FF7A45"
  grass: "#5DC77A"
  sky: "#5DB9F5"
  plum: "#A166D4"
  gold: "#FFC847"
  silver: "#C5CDD6"
  bronze: "#CD9352"
  crimson: "#C13A2A"

  # ── Semantic (binds palette to component-visible roles) ─────────
  # Border/ring/state colors are documented in prose; the spec's
  # component vocabulary only exposes background/text/typography/etc.
  background: "{colors.paper}"
  foreground: "{colors.ink}"
  surface: "{colors.card}"
  surface-deep: "{colors.paper-deep}"
  muted: "{colors.paper-deep}"
  muted-foreground: "{colors.mute}"
  primary: "{colors.sunset}"
  primary-foreground: "{colors.ink}"
  destructive: "{colors.crimson}"
  destructive-foreground: "{colors.paper}"

typography:
  display:
    fontFamily: Funnel Display
    fontSize: 3rem
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: -0.02em
  h1:
    fontFamily: Funnel Display
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.015em
  h2:
    fontFamily: Funnel Display
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.2
  h3:
    fontFamily: Lexend
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: Lexend
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Lexend
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.45
  label-caps:
    fontFamily: DM Mono
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.12em
  metric:
    fontFamily: DM Mono
    fontSize: 1.5rem
    fontWeight: 500
    lineHeight: 1.1

rounded:
  sm: 6px      # chips, small badges
  md: 10px     # inputs, small buttons
  lg: 12px     # buttons, default Card radius
  xl: 14px     # standard Card / Tile
  2xl: 20px    # hero panels, modal surfaces

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px

components:
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: 20px
  card-deep:
    backgroundColor: "{colors.surface-deep}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: 20px

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "#FF6A2E"
    textColor: "{colors.primary-foreground}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 12px
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.lg}"
    padding: 12px
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 8px

  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 10px
  input-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
  input-invalid:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.destructive}"

  badge-success:
    backgroundColor: "#5DC77A29"
    textColor: "#1F5A33"
    rounded: "{rounded.sm}"
  badge-warning:
    backgroundColor: "#FFC8472E"
    textColor: "#6B4A07"
    rounded: "{rounded.sm}"
  badge-error:
    backgroundColor: "#C13A2A29"
    textColor: "{colors.destructive}"
    rounded: "{rounded.sm}"
  badge-info:
    backgroundColor: "#5DB9F529"
    textColor: "#1B5179"
    rounded: "{rounded.sm}"
  badge-social:
    backgroundColor: "#A166D429"
    textColor: "#5C2C8E"
    rounded: "{rounded.sm}"

  sidebar:
    backgroundColor: "{colors.surface-deep}"
    textColor: "{colors.foreground}"
  sidebar-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: 10px

  table-header-cell:
    typography: "{typography.label-caps}"
    textColor: "{colors.muted-foreground}"
    backgroundColor: "{colors.surface-deep}"
  table-row-hover:
    backgroundColor: "#FF7A4514"
    textColor: "{colors.foreground}"

  # ── Field Day expressive surfaces ───────────────────────────────
  progress-bar:
    backgroundColor: "{colors.grass}"
    rounded: "{rounded.sm}"
  dot-info:
    backgroundColor: "{colors.sky}"
    rounded: "{rounded.sm}"
  dot-social:
    backgroundColor: "{colors.plum}"
    rounded: "{rounded.sm}"
  ribbon-celebration:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.foreground}"
    typography: "{typography.label-caps}"

  # ── Podium (leaderboard rank tiles) ─────────────────────────────
  podium-1:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 16px
  podium-2:
    backgroundColor: "{colors.silver}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 16px
  podium-3:
    backgroundColor: "{colors.bronze}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 16px

  # ── Chart series (categorical) ──────────────────────────────────
  chart-series-1:
    backgroundColor: "{colors.sunset}"
  chart-series-2:
    backgroundColor: "{colors.grass}"
  chart-series-3:
    backgroundColor: "{colors.sky}"
  chart-series-4:
    backgroundColor: "{colors.plum}"
  chart-series-5:
    backgroundColor: "{colors.gold}"
---

## Overview

**Field Day** is the visual identity of Urban Legends. It is a tournament
platform for teams of human players, and its design should feel like a
contemporary sports broadsheet — warm paper stock, restrained editorial
typography, vivid spot colors used semantically, and tactile surfaces
with hard-offset shadows that recall printed paper laid on a desk.

The character is **earnest and celebratory, not corporate**. Tournaments
are inherently expressive — there are winners, losers, ribbons, podiums,
ceremonies — and the design language leans into that without becoming
toy-like. Editorial gravity comes from the type and the ink-on-paper
palette; energy comes from the five accents (sunset, grass, sky, plum,
gold) used as a categorical, not decorative, system.

Field Day applies **across the entire application**: dashboards, admin
tables, forms, modals, sign-in screens, marketing surfaces. Every
shadcn primitive (Card, Button, Input, Badge, Sidebar, DataTable,
Dialog) is rebound to Field Day tokens. There is no fallback "neutral
shadcn" zone.

### What Field Day is not

- Not Material, not iOS, not Linear-flat-grey.
- Not a "fun skin" applied over a corporate base — it *is* the base.
- Not infinitely customizable — the five accents are fixed and semantic;
  new colors are added only by widening *semantic* meaning, not by
  picking a new hex.

## Colors

The palette has three layers. **Components reference semantic tokens.
Semantic tokens reference palette names. Palette names are the only
place hex values live.** Do not let a component reference `sunset`
directly — reference `primary`, which resolves to sunset.

### Palette

| Token | Light | Dark (warm-shifted) | Role |
|:------|:------|:--------------------|:-----|
| `paper`      | `#FFFAF0` | `#1C1612` | Page background |
| `paper-deep` | `#FBF3DF` | `#241D17` | Inset surfaces, sidebar, table headers |
| `card`       | `#FFFFFF` | `#2B231C` | Card / modal fill |
| `ink`        | `#2A1F1A` | `#F4ECE2` | Headlines, borders, body text |
| `mute`       | `#7A6A5C` | `#A89A8B` | Captions, secondary text, disabled |
| `sunset`     | `#FF7A45` | `#FF7A45` | Primary CTA, focus ring, headline accent |
| `grass`      | `#5DC77A` | `#5DC77A` | Success state, approved, progress |
| `sky`        | `#5DB9F5` | `#5DB9F5` | Info, "joined", neutral notification |
| `plum`       | `#A166D4` | `#A166D4` | Social, "requested", invitations |
| `gold`       | `#FFC847` | `#FFC847` | Celebration, banners, pending/warning, podium-1 |
| `silver`     | `#C5CDD6` | `#C5CDD6` | Podium-2 |
| `bronze`     | `#CD9352` | `#CD9352` | Podium-3 |
| `crimson`    | `#C13A2A` | `#D04A38` | Destructive, rejected, error |

The five accents (sunset, grass, sky, plum, gold) **survive both light
and dark modes unchanged** — they're saturated enough to read on warm
paper or warm espresso. Only the structural tokens (paper, paper-deep,
card, ink, mute) shift between modes.

### Semantic mapping

Tokens encoded in YAML (referenced by components):

| Semantic | → Palette |
|:---------|:----------|
| `background` | `paper` |
| `foreground` | `ink` |
| `surface` | `card` |
| `surface-deep` | `paper-deep` |
| `muted` | `paper-deep` |
| `muted-foreground` | `mute` |
| `primary` | `sunset` |
| `primary-foreground` | `ink` |
| `destructive` | `crimson` |
| `destructive-foreground` | `paper` |

Semantic concepts that live in prose (the spec's component vocabulary
exposes `backgroundColor`/`textColor`/`typography`/`rounded`/`padding`
/`size`/`height`/`width` but no `borderColor`/`ringColor`/state slots,
so these resolve at the implementation layer in CSS, not in the token
graph):

| Concept | → Palette | Used for |
|:--------|:----------|:---------|
| `border` | `ink` at full strength | 2px Card / Button borders |
| `border-soft` | `ink` at ~12% alpha | Input borders, table dividers |
| `ring` | `sunset` | Focus rings on every interactive primitive |
| `success` | `grass` | Approved badge, progress bar, calendar-approved |
| `warning` | `gold` | Pending badge, calendar-pending |
| `info` | `sky` | Info badge, "joined" indicator |
| `social` | `plum` | Invitation, request, join-request indicators |

### Why sunset is primary, not plum

Sunset (#FF7A45) is the loudest hue in the palette and is already the
"do the thing" color on the existing dashboard (Log Activity FAB).
Promoting it to `--primary` aligns the most-used action color with the
most-action-feeling accent. Plum carries social/invitation semantics
and would over-load if doubled as primary. Crimson (deeper than
sunset, hue ~20) handles destruction so that "approve" buttons and
"delete" buttons don't read as the same color family.

## Typography

Three families, six roles. Every text node in the app belongs to one
of these six tokens.

| Token | Family | Use |
|:------|:-------|:----|
| `display` | Funnel Display 800 | Page hero numerals, landing |
| `h1` | Funnel Display 700 | Page titles |
| `h2` | Funnel Display 700 | Section titles |
| `h3` | Lexend 600 | Card / panel titles |
| `body-md` | Lexend 400 | Default body, paragraph copy |
| `body-sm` | Lexend 400 | Helper text, table cells |
| `label-caps` | DM Mono 500, uppercase, `+12%` tracking | Eyebrows, column headers, status chips |
| `metric` | DM Mono 500 | Numeric metrics on tiles, leaderboard scores |

**`--font-sans` resolves to Lexend.** **`--font-mono` resolves to DM
Mono.** **`--font-heading` resolves to Funnel Display.** Instrument
Sans, Geist, and Geist Mono are removed.

DM Mono is reserved for two roles only: (1) all-caps eyebrows and
column headers (`label-caps`), and (2) numeric metrics (`metric`).
**Do not set DM Mono on body prose.** Tournament rules, submission
descriptions, and admin tables contain too much running text for a
mono face.

## Layout

The application is anchored on an **8px spacing scale**: 4, 8, 16,
24, 32, 48. Page gutters use 24px on mobile, 32px on tablet, 48px on
desktop. Card-to-card vertical rhythm is 16px (`spacing.md`); within a
card, the section rhythm is 12–16px.

The global body has a **dot-grid background** (1px ink dots at 12%
alpha, on an 18px grid, masked with a vertical gradient fade). It is
always on. It is the most cheaply-acquired identity cue in the system —
do not disable it on a page to "calm things down." If a surface needs
calming, use `paper-deep` for the surface fill instead.

Page templates that exist app-wide:

1. **Sidebar shell** — left rail (paper-deep, 240px), main column
   (paper, fluid). Active sidebar item filled in sunset, ink text.
2. **Details page** — `h1` title, eyebrow `label-caps` above, optional
   ribbon header, body content in cards.
3. **Listing page** — filter chips row, then cards or a Field Day
   `DataTable`.
4. **Form page** — single column, max-width ~640px, labels above
   inputs, 16px rhythm between fields, primary action at the foot.

## Elevation & Depth

Field Day expresses depth with **hard-offset ink shadows**, not soft
blurs. The shadow is always 2-4px right, 2-4px down, 0px blur, in ink
at 12% alpha:

```
box-shadow: 4px 4px 0 rgba(42, 31, 26, 0.12);
```

This is the most identity-bearing surface treatment in the system. It
recalls a printed object on a desk under raked light, not a UI floating
in 3D space. **Use it on Cards, Tiles, and primary/secondary/destructive
Buttons.** Do not use it on inputs, ghost buttons, icon buttons, or
inline chips — those are flat surfaces.

There is **no soft-blur elevation** in Field Day. If you find yourself
reaching for `box-shadow: 0 4px 12px rgba(0,0,0,0.1)`, you are
reaching for a different design system.

## Shapes

The radius scale is generous compared to default shadcn. Surfaces feel
*rounded paper*, not *sharp UI*.

| Token | Size | Use |
|:------|:-----|:----|
| `sm` | 6px | Chips, small badges |
| `md` | 10px | Inputs |
| `lg` | 12px | Buttons, default Card |
| `xl` | 14px | Standard Card / Tile |
| `2xl` | 20px | Hero panels, modal surfaces |

Borders on Field Day surfaces are **2px ink at full strength** for
Cards and primary/secondary/destructive Buttons. Inputs use **1.5px
ink** for slightly softer rhythm in dense forms. Dividers and table
row separators use **1px ink at ~12% alpha** (`border-soft`).

## Components

### Card

`paper`-deep or `card` fill, 2px ink border, 14px radius, 4px hard
ink-offset shadow. Padding 20px. Internal section rhythm 16px. Cards
are **the** surface primitive — modals, panels, tiles, dialogs, and
sheets are all Card-shaped.

### Button

| Variant | Treatment |
|:--------|:----------|
| `primary` | Sunset fill, ink text, 2px ink border, 3px hard offset shadow, 12px radius |
| `secondary` | Card fill, ink text, 2px ink border, 3px hard offset shadow, 12px radius |
| `destructive` | Crimson fill, paper text, 2px ink border, 3px hard offset shadow, 12px radius |
| `outline` | Transparent fill, ink text, 2px ink border, no shadow, 12px radius |
| `ghost` | Transparent, ink text, no border, no shadow — flat |
| `link` | Underlined sunset text, no chrome |
| `icon` | Square 36px, no border, no shadow — flat |

Primary/secondary/destructive carry the Field Day chrome. Ghost/link/icon
are intentionally flat so toolbar/inline actions don't shout.

### Input

1.5px ink border, paper fill, 10px radius, no shadow. Focus state =
sunset ring (`ring: 0 0 0 3px {colors.sunset}33`). Invalid state =
crimson border + crimson helper text. Disabled state = `mute` text on
`paper-deep` fill. Same treatment for Select, Combobox, Textarea,
Checkbox, Radio, Switch.

### Badge

Tinted-fill chip, 6px radius (`sm`), `label-caps` typography. The fill
is the semantic accent at ~16% alpha; the text is a deeper shade of
the same hue for AA contrast. Badge color is **the** way to encode
state — never use border-only badges.

### Sidebar

`paper-deep` background, no separator line. Active item is a sunset-filled
pill at 12px radius with ink text. Inactive items are ink text on
transparent. Section labels use `label-caps` in `mute`. The
`--sidebar-*` token family is **rebound to palette tokens**, not kept
as a parallel system.

### DataTable

Paper background, no container border (the surrounding Card supplies
it). **Column headers in `label-caps` (DM Mono uppercase, +12%
tracking) on `paper-deep` background.** 1px `border-soft` row dividers.
Default row height 44px. Row hover = sunset at ~8% alpha. Active sort
indicator uses sunset. Pagination controls use the `outline` button
variant.

### Ribbon banner / Footer ribbon

**Reserved for celebratory contexts** — winner announcements,
tournament headers, podium reveal. Gold-filled ribbon with notched SVG
ends, ink text in `label-caps`. Do not use ribbons as section headers
in everyday surfaces (admin pages, forms).

### Confetti

**Reserved for win/podium reveal moments.** Do not fire confetti on
form submission success or routine state changes.

## Do's and Don'ts

### Do

- **Use semantic tokens, not palette names, in components.** Reference
  `primary`, not `sunset`. The palette layer exists so the semantic
  meaning of a color can be retuned without touching every component.
- **Use accents categorically, not decoratively.** Grass means
  approved/success. Sky means info/joined. Plum means social/invitation.
  Sunset means action. Gold means celebration. A blue button is not
  "just a blue button" — it carries info semantics.
- **Use DM Mono for eyebrows, column headers, and numeric metrics.**
  Anywhere a user is scanning short, indexed text — labels above
  inputs, table columns, metric values, status pills — DM Mono signals
  "this is a tag, not a sentence."
- **Use hard ink-offset shadows for elevation.** 2-4px right, 2-4px
  down, 0 blur, ink at ~12% alpha.
- **Use Funnel Display for page titles and Lexend for body.** Lexend
  carries dense content; Funnel Display gives editorial weight to the
  top of every page.
- **Use sunset focus rings on every interactive primitive.** Inputs,
  buttons, sidebar items — focus is always sunset.

### Don't

- **Don't introduce a sixth accent.** If a new semantic category
  emerges (e.g., "scheduled"), widen the role of an existing accent or
  use `mute`. Adding a new hex shifts the system off-balance.
- **Don't use soft-blur drop shadows.** `box-shadow: 0 4px 12px
  rgba(0,0,0,0.1)` is the wrong system. Field Day uses hard ink offsets.
- **Don't use DM Mono for prose.** Tournament rules, submission
  descriptions, admin tables of names and emails — these are Lexend.
- **Don't use ribbons or confetti as everyday chrome.** They are
  celebratory; overuse drains them. Reserve for winner moments and
  tournament hero headers.
- **Don't let shadcn primitives reach their default tokens.** Every
  shadcn primitive in the app should read from Field Day semantic
  tokens. If a `<Card>` looks like a default-shadcn card, the
  rebinding in `globals.css` is broken — fix the binding, do not
  override at the call site.
- **Don't disable the dot grid to "calm a surface down."** The dot
  grid is the cheapest, most consistent identity cue in the system.
  Use `paper-deep` for visual calm; keep the grid.
- **Don't add a new font family.** Three is enough.
- **Don't make sunset and crimson share a button surface.** Approve
  buttons are sunset; delete buttons are crimson. They must read as
  distinct hue families.
