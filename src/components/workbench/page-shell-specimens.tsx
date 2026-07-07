import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Settings } from "lucide-react";

import { DataTableSection } from "@/components/data-table-section";
import { DetailsPageLayout } from "@/components/details-page-layout";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DemoRow = {
  _id: string;
  name: string;
  status: "active" | "ended";
  points: number;
};

const DEMO_ROWS: DemoRow[] = [
  { _id: "row-1", name: "Urban Divas", status: "active", points: 540 },
  { _id: "row-2", name: "Booldozers", status: "active", points: 320 },
  { _id: "row-3", name: "404 Shape Not Found", status: "ended", points: 210 },
  { _id: "row-4", name: "Legends on Tap", status: "ended", points: 85 },
];

const DEMO_COLUMNS: ColumnDef<DemoRow, unknown>[] = [
  { accessorKey: "name", header: "Team" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "active" ? "success" : "neutral"}>
        {row.original.status}
      </Badge>
    ),
  },
  { accessorKey: "points", header: "Points" },
];

export function PageShellSpecimens() {
  return (
    <div className="space-y-16">
      <DataTableSectionSpecimen />
      <DetailsPageLayoutSpecimen />
      <SiteHeaderSpecimen />
    </div>
  );
}

function DataTableSectionSpecimen() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="DataTableSection"
        description="SectionHeader + DataTable composition. Wires title/description/actions onto a typed TanStack table."
      />
      <div className="bg-paper rounded-lg p-6">
        <DataTableSection
          as="h2"
          title="Teams"
          description="All teams across active and ended tournaments."
          actions={
            <Button size="sm">
              <Plus data-icon="inline-start" className="size-4" />
              New team
            </Button>
          }
          columns={DEMO_COLUMNS}
          data={DEMO_ROWS}
          enableSearch
        />
      </div>
    </section>
  );
}

function DetailsPageLayoutSpecimen() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h2"
        title="DetailsPageLayout"
        description="Two-column shell used by tournament / team / user details pages: header row + sidebar + main column."
      />
      <div className="bg-paper rounded-lg p-6">
        <DetailsPageLayout
          title="Urban Legends 2026"
          eyebrow="Tournament · Active"
          headerActions={
            <Button size="sm" variant="outline">
              <Settings data-icon="inline-start" className="size-4" />
              Manage
            </Button>
          }
          sidebar={
            <Card>
              <CardHeader>
                <CardTitle>By the numbers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-body-sm">12 teams</p>
                <p className="text-body-sm">540 pts top score</p>
                <p className="text-body-sm">30 days remaining</p>
              </CardContent>
            </Card>
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Main content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body-sm text-muted-foreground">
                The main column grows to fill remaining space; the sidebar is
                fixed at 280px on lg+ and stacks above on smaller widths.
              </p>
            </CardContent>
          </Card>
        </DetailsPageLayout>
      </div>
    </section>
  );
}

function SiteHeaderSpecimen() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h2"
        title="SiteHeader"
        description="Sticky inset header at the top of the content area with the sidebar trigger, a player-only quick action, and the theme/notification controls. Renders into the protected layout’s sidebar context; the live instance is the header at the top of this page."
      />
      <p className="text-body-sm text-muted-foreground">
        Re-mounting it inline would duplicate the sidebar trigger and header
        controls. The live instance is rendered by the protected layout; look at
        the header at the top of this page.
      </p>
    </section>
  );
}
