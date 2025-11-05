"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { UpsertTournamentForm } from "@/components/tournaments/upsert-tournament-form";
import { Button } from "@/components/ui/button";

export default function NewTournamentPage() {
  return (
    <>
      <SectionHeader as="h1" title="Create Tournament">
        <Button variant="outline" asChild>
          <Link href="/tournaments">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>
      <UpsertTournamentForm />
    </>
  );
}
