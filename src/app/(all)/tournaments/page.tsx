"use client";

import { useQuery } from "convex/react";
import { Calendar, ChevronRight, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { SectionHeader } from "@/components/section-header";
import { TournamentsDataTable } from "@/components/tournaments/tournaments-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function TournamentsPage() {
  const { user, isAdmin } = useUser();

  const userTournaments =
    useQuery(api.tournaments.list, { userId: user?._id }) || [];
  const allTournaments = useQuery(api.tournaments.list, {}) || [];

  const teams = useQuery(api.teams.list, {}) || [];
  const teamCount = useMemo(() => {
    return teams.reduce<Map<Id<"tournaments">, number>>((acc, team) => {
      if (!acc.has(team.tournamentId)) acc.set(team.tournamentId, 0);
      acc.set(team.tournamentId, (acc.get(team.tournamentId) ?? 0) + 1);
      return acc;
    }, new Map());
  }, [teams]);

  if (!userTournaments) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Tournaments">
        {isAdmin && (
          <Button asChild>
            <Link href="/tournaments/new">
              <Plus />
              Add New Tournament
            </Link>
          </Button>
        )}
      </SectionHeader>

      <TournamentsDataTable
        title="Your tournaments"
        tournaments={userTournaments}
      />

      <SectionHeader title="All Tournaments" />

      <div className="grid min-w-max grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {allTournaments && allTournaments.length !== 0 ? (
          allTournaments.map((tournament) => {
            const now = new Date();
            const isActive =
              new Date(tournament.startDate) <= now &&
              now <= new Date(tournament.endDate);
            const isEnded = new Date(tournament.endDate) <= now;
            const isUpcoming = new Date(tournament.startDate) > now;

            return (
              <Card key={tournament._id}>
                <CardContent>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>
                          <Button
                            variant="link"
                            className="h-min cursor-pointer p-0 font-semibold text-md leading-none tracking-tight"
                            asChild
                          >
                            <div>{tournament.name}</div>
                          </Button>
                        </CardTitle>
                        <Badge
                          variant={
                            isActive
                              ? "approved"
                              : isUpcoming
                                ? "pending"
                                : "rejected"
                          }
                        >
                          {isActive
                            ? "Active"
                            : isUpcoming
                              ? "Upcoming"
                              : isEnded
                                ? "Ended"
                                : "Unknown"}
                        </Badge>
                      </div>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {`${teamCount.get(tournament._id) ?? 0} teams`}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {tournament.startDate} to {tournament.endDate}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {user && (
                        <Button asChild>
                          <Link href={`/tournaments/${tournament._id}`}>
                            View
                            <ChevronRight />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12">
              <Empty>
                <EmptyHeader>No teams yet</EmptyHeader>
                <EmptyDescription>
                  Be the first to create a team for this tournament!
                </EmptyDescription>
                <EmptyContent></EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
