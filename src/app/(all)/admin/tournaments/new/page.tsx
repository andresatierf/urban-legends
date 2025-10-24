"use client";

import { SectionHeader } from "@/components/section-header";
import { CreateTournamentForm } from "@/components/tournaments/create-tournament-form";
import { Button } from "@/components/ui/button";

export default function NewTournamentPage() {
  return (
    <>
      <SectionHeader as="h1" title="Create Tournament">
        <Button href="/admin/tournaments" variant="outline">
          ← Back
        </Button>
      </SectionHeader>
      <CreateTournamentForm />
    </>
  );
}
