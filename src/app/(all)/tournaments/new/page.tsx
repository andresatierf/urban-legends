"use client";

import { SectionHeader } from "@/components/section-header";
import { UpsertTournamentForm } from "@/components/tournaments/upsert-tournament-form";
import { Button } from "@/components/ui/button";

export default function NewTournamentPage() {
  return (
    <>
      <SectionHeader as="h1" title="Create Tournament">
        <Button href="/tournaments" variant="outline">
          ← Back
        </Button>
      </SectionHeader>
      <UpsertTournamentForm />
    </>
  );
}
