"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/tournaments/stat-card";
import { TournamentsDataTable } from "@/components/tournaments/tournaments-data-table";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../convex/_generated/api";

export default function TournamentsPage() {
  const { user, isAdmin } = useUser();

  const userTournaments =
    useQuery(api.tournaments.list, { userId: user?._id }) || [];
  const allTournaments =
    useQuery(api.tournaments.list, isAdmin ? {} : "skip") || [];

  const now = new Date();

  const active = useMemo(
    () =>
      (isAdmin ? allTournaments : userTournaments).filter(
        (t) => new Date(t.startDate) <= now && new Date(t.endDate) >= now,
      ).length,
    [now, userTournaments, allTournaments, isAdmin],
  );

  const upcoming = useMemo(
    () =>
      (isAdmin ? allTournaments : userTournaments).filter(
        (t) => new Date(t.startDate) > now,
      ).length,
    [now, userTournaments, allTournaments, isAdmin],
  );

  const total = (isAdmin ? allTournaments : userTournaments).length;

  if (!userTournaments) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Tournaments">
        {isAdmin && <Button href="/tournaments/new">Add New Tournament</Button>}
      </SectionHeader>

      <div className="mb-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          title="Active Tournaments"
          value={active}
          color="text-green-600"
        />
        <StatCard
          title="Upcoming Tournaments"
          value={upcoming}
          color="text-yellow-500"
        />
        <StatCard
          title="Total Tournaments"
          value={total}
          color="text-blue-500"
        />
      </div>

      <TournamentsDataTable
        title="Your tournaments"
        tournaments={userTournaments}
      />

      {isAdmin && (
        <TournamentsDataTable
          title="All Tournaments"
          tournaments={allTournaments}
          showActions
          enableSearch
        />
      )}
    </>
  );
}
