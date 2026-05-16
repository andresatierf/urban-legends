import { Crown, Star, Trophy, Users } from "lucide-react";

import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { StatsGrid } from "@/components/common/card/stats-grid";
import { StatusBand } from "@/components/common/card/status-band";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { TournamentStatus } from "../tournaments/utils";

const STATUSES: TournamentStatus[] = ["active", "upcoming", "ended"];

export function CardToolkitSpecimens() {
  return (
    <div className="space-y-16">
      <ComposedCardSection />
      <EdgeOverlaySection />
      <StatsGridSection />
      <StatusBandSection />
    </div>
  );
}

function ComposedCardSection() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="ComposedCard"
        description="Header (eyebrow + title + badges) plus body content. Title-only, eyebrow-only, badge variants, and bare body."
      />

      <div className="bg-paper grid gap-6 rounded-lg p-6 sm:grid-cols-2">
        <ComposedCard title="Title only">
          <p className="text-body-sm text-muted-foreground">
            Header with just a heading.
          </p>
        </ComposedCard>

        <ComposedCard
          eyebrow="Urban Legends 2026 · Active"
          title="With eyebrow"
        >
          <p className="text-body-sm text-muted-foreground">
            Eyebrow context above the title.
          </p>
        </ComposedCard>

        <ComposedCard
          title="Single badge"
          badge={{ variant: "success", children: "Active" }}
        >
          <p className="text-body-sm text-muted-foreground">
            Status badge in header right.
          </p>
        </ComposedCard>

        <ComposedCard
          title="Multi badge"
          badge={[
            { variant: "info", children: "Open" },
            { variant: "warning", children: "Captain" },
          ]}
        >
          <p className="text-body-sm text-muted-foreground">
            Badges array stacks horizontally.
          </p>
        </ComposedCard>

        <ComposedCard
          title="Large title"
          titleSize="lg"
          eyebrow="Display variant"
        >
          <p className="text-body-sm text-muted-foreground">
            Used for hero cards.
          </p>
        </ComposedCard>

        <ComposedCard>
          <p className="text-body-sm text-muted-foreground">
            Headerless body — wrapped Card with the standard padding.
          </p>
        </ComposedCard>
      </div>
    </section>
  );
}

function EdgeOverlaySection() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="EdgeOverlay"
        description="Positions children in fixed slots around a card edge. Useful for ribbons, action chips, and corner badges."
      />

      <div className="bg-paper rounded-lg p-12">
        <EdgeOverlay
          topLeft={<Badge variant="warning">topLeft</Badge>}
          topCenter={<Badge variant="info">topCenter</Badge>}
          topRight={<Badge variant="success">topRight</Badge>}
          bottomLeft={<Badge variant="neutral">bottomLeft</Badge>}
          bottomCenter={<Badge variant="social">bottomCenter</Badge>}
          bottomRight={<Badge variant="error">bottomRight</Badge>}
        >
          <ComposedCard title="All six slots populated">
            <p className="text-body-sm text-muted-foreground">
              Slots float outside the card border via negative offsets.
            </p>
          </ComposedCard>
        </EdgeOverlay>
      </div>
    </section>
  );
}

function StatsGridSection() {
  const items = [
    { icon: Trophy, value: "#3", label: "Rank" },
    { icon: Star, value: "540", label: "Points" },
    { icon: Users, value: "7/8", label: "Members" },
  ];

  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="StatsGrid"
        description="Three-column stats display. Two variants: 'divided' (in-card rule) and 'tiles' (separate chunky cards)."
      />

      <div className="bg-paper grid gap-6 rounded-lg p-6 sm:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-label-caps text-muted-foreground">divided</h3>
          <StatsGrid items={items} variant="divided" />
        </div>
        <div className="space-y-2">
          <h3 className="text-label-caps text-muted-foreground">tiles</h3>
          <StatsGrid items={items} variant="tiles" />
        </div>
      </div>
    </section>
  );
}

function StatusBandSection() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="StatusBand"
        description="Tournament-status colored strip. Vivid and semantic palettes across active/upcoming/ended."
      />

      <div className="bg-paper grid gap-6 rounded-lg p-6 sm:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-label-caps text-muted-foreground">vivid</h3>
          <div className="overflow-hidden rounded-md">
            {STATUSES.map((s) => (
              <StatusBand key={s} status={s} palette="vivid">
                <span className="font-medium capitalize">{s}</span>
                <Crown className="size-4 opacity-70" />
              </StatusBand>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-label-caps text-muted-foreground">semantic</h3>
          <div className="overflow-hidden rounded-md">
            {STATUSES.map((s) => (
              <StatusBand key={s} status={s} palette="semantic">
                <span className="font-medium capitalize">{s}</span>
                <Button size="sm" variant="ghost">
                  Action
                </Button>
              </StatusBand>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
