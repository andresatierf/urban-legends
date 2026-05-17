import { Plus, Settings } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";

import { VariantMatrix } from "./shells/variant-matrix";

const HEADINGS = ["h1", "h2"] as const;
type Heading = (typeof HEADINGS)[number];

const SLOTS = [
  "title-only",
  "with-description",
  "with-action",
  "description-and-action",
] as const;
type Slot = (typeof SLOTS)[number];

const SLOT_LABELS: Record<Slot, string> = {
  "title-only": "Title only",
  "with-description": "+ Description",
  "with-action": "+ Action",
  "description-and-action": "Description + Action",
};

const DESCRIPTION =
  "Short subtitle that explains what this section covers and what readers should expect to find.";

function renderHeader(slot: Slot, heading: Heading) {
  const description =
    slot === "with-description" || slot === "description-and-action"
      ? DESCRIPTION
      : undefined;
  const actions =
    slot === "with-action" || slot === "description-and-action" ? (
      <Button size="sm">
        <Plus data-icon="inline-start" className="size-4" />
        New entry
      </Button>
    ) : null;

  return (
    <SectionHeader
      as={heading}
      title="Section title"
      description={description}
      Icon={Settings}
    >
      {actions}
    </SectionHeader>
  );
}

export function SectionHeaderSpecimens() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 text-foreground">Section Header</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Headings vary by <code>as</code> and slot combinations. Action slot
          uses the children prop.
        </p>
      </div>

      <VariantMatrix
        variants={SLOTS}
        columns={HEADINGS}
        variantLabel={(s) => SLOT_LABELS[s]}
        columnLabel={(h) => `as="${h}"`}
        renderCell={renderHeader}
      />
    </div>
  );
}
