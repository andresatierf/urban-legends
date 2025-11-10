"use client";

import { useQuery } from "convex/react";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { JoinTeamFormButton } from "@/components/form/join-team-form-button";
import { UpsertTeamFormButton } from "@/components/form/upsert-team-form-button";
import { SectionHeader } from "@/components/section-header";
import { JoinTeamCard } from "@/components/teams/join-team-card";
import { TeamCard } from "@/components/teams/team-card";
import { TournamentDetailsCard } from "@/components/tournaments/tournament-details-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ tournamentId: Id<"tournaments"> }>;
};

export default function TournamentDetailsPage({ params }: Props) {
  const user = useQuery(api.users.current);
  const roles = useQuery(
    api.roles.getByUserId,
    user ? { userId: user?._id } : "skip",
  );

  const isAdmin = roles?.includes("admin");

  const { tournamentId } = use(params);

  const tournament = useQuery(
    api.tournaments.get,
    tournamentId ? { tournamentId } : "skip",
  );
  const teams = useQuery(
    api.teams.list,
    tournamentId ? { tournamentId } : "skip",
  );

  const userTeam = useQuery(
    api.teams.get,
    user && tournamentId ? { userId: user._id, tournamentId } : "skip",
  );

  const teamMembers = useQuery(
    api.teams.listMembers,
    teams ? { teamIds: teams.map((t) => t._id) } : "skip",
  );

  const teamMemberCounts = teamMembers
    ? teams?.reduce(
        (acc, team) => {
          const members = teamMembers.filter((m) => m.teamId === team._id);
          acc[team._id] = members;
          return acc;
        },
        {} as Record<Id<"teams">, typeof teamMembers>,
      )
    : {};

  if (!tournament) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Tournament Details">
        <UpsertTeamFormButton tournamentId={tournamentId} />
        <Button variant="outline" asChild>
          <Link href="/tournaments">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>

      <TournamentDetailsCard
        tournament={tournament}
        enableActions={isAdmin}
        teams={teams ?? []}
      />

      <SectionHeader title="Teams" />

      {teams &&
        teams.length !== 0 &&
        (userTeam ? (
          <Card variant="info">
            <CardHeader>
              <CardTitle>Your Team</CardTitle>
              <CardDescription>
                You are already part of a team in this tournament
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-medium">{userTeam.name}</p>
                <Badge variant="secondary">
                  {teamMemberCounts?.[userTeam._id]?.length || 0} members
                </Badge>
              </div>
              <Button
                asChild
                variant="outline"
                className="flex gap-2 xs:self-auto self-end"
              >
                <Link href={`/teams/${userTeam._id}`}>View Team</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <JoinTeamCard />
        ))}

      <div className="grid min-w-max grid-cols-1 gap-2 xl:grid-cols-2">
        {teams && teams.length !== 0 ? (
          teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              memberCount={teamMemberCounts?.[team._id]?.length || 0}
              isUserMember={userTeam?._id === team._id}
              isUserInTeam={!!userTeam}
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-6">
              <Empty className="gap-3 py-2!">
                <EmptyHeader>No teams yet</EmptyHeader>
                <EmptyDescription>
                  Be the first to create a team for this tournament!
                </EmptyDescription>
                <EmptyContent>
                  <UpsertTeamFormButton tournamentId={tournamentId} />
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
