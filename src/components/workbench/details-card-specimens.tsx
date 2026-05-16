import { Calendar, Pencil, Settings, Trash2 } from "lucide-react";

import { DetailsCard } from "@/components/details-card";
import { SectionHeader } from "@/components/section-header";

export function DetailsCardSpecimens() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="DetailsCard"
        description="Generic detail callout — title, description, key/value pairs, plus actions split between external buttons and a dropdown menu."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <DetailsCard
          title="Bare"
          description="Just a header and description."
        />

        <DetailsCard
          title="With details"
          details={[
            { key: "tournament", value: "Urban Legends 2026" },
            { key: "createdAt", value: "Apr 12, 2026" },
            { key: "memberCount", value: "7 / 8" },
          ]}
        />

        <DetailsCard
          title="External action"
          description="An action whose condition + external are both true renders as a button beside the dropdown."
          details={[{ key: "rank", value: "#3" }]}
          actions={[
            {
              label: "View",
              icon: Calendar,
              condition: true,
              external: true,
              href: "/dashboard",
            },
            {
              label: "Edit",
              icon: Pencil,
              condition: true,
              onClick: () => {},
            },
          ]}
        />

        <DetailsCard
          title="Dropdown menu"
          description="Multiple conditional actions collapse into a kebab menu with optional separators."
          details={[
            { key: "captain", value: "Joana Machado" },
            { key: "points", value: "540" },
          ]}
          actions={[
            {
              label: "Settings",
              icon: Settings,
              condition: true,
              onClick: () => {},
              separator: "after",
            },
            {
              label: "Edit",
              icon: Pencil,
              condition: true,
              onClick: () => {},
            },
            {
              label: "Delete",
              icon: Trash2,
              condition: true,
              onClick: () => {},
              separator: "before",
            },
          ]}
        />
      </div>
    </section>
  );
}
