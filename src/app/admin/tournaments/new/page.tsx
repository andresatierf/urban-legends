"use client";

import Link from "next/link";
import { CreateTournamentForm } from "@/components/tournaments/create-tournament-form";
import { Button } from "@/components/ui/button";

export default function NewTournamentPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-semibold text-2xl text-gray-800">
          Create Tournament
        </h1>
        <Link href="/admin/tournaments">
          <Button variant="outline">← Back</Button>
        </Link>
      </div>

      <CreateTournamentForm />
    </>
  );
}
