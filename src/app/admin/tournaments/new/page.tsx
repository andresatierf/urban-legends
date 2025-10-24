"use client";

import Link from "next/link";
import { CreateTournamentForm } from "@/components/tournaments/create-tournament-form";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/section-header";

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
