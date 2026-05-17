import { Star, Trophy, Users } from "lucide-react";

import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { StatsGrid } from "@/components/common/card/stats-grid";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";

export function CardToolkitSpecimens() {
  return (
    <div className="space-y-16">
      <ComposedCardSection />
      <EdgeOverlaySection />
      <StatsGridSection />
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
            Headerless body. Wrapped Card with the standard padding.
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
        description="Three-column stats display. Variants: 'divided' (in-card rule), 'tiles' (separate chunky cards), 'strip' (dashed-bordered compact strip, label-above-value)."
      />

      <div className="bg-paper grid gap-6 rounded-lg p-6 sm:grid-cols-3">
        <div className="space-y-2">
          <h3 className="text-label-caps text-muted-foreground">divided</h3>
          <StatsGrid items={items} variant="divided" />
        </div>
        <div className="space-y-2">
          <h3 className="text-label-caps text-muted-foreground">tiles</h3>
          <StatsGrid items={items} variant="tiles" />
        </div>
        <div className="space-y-2">
          <h3 className="text-label-caps text-muted-foreground">strip</h3>
          <StatsGrid
            variant="strip"
            items={[
              { label: "Rank", value: "#3" },
              { label: "Total", value: "540" },
              { label: "Pending", value: "2" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
