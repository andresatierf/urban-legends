"use client";

import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { UpsertTeamFormDialog } from "@/components/form/upsert-team-form";
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
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ tournamentId: Id<"tournaments"> }>;
};

export default function TournamentDetailsPage({ params }: Props) {
  const { tournamentId } = use(params);

  const data = useQuery(
    api.tournaments.getDetails,
    tournamentId ? { tournamentId } : "skip",
  );

  if (!data) {
    return <PageSkeleton headerTitle="Tournament Details" sections={2} />;
  }

  return (
    <>
      <SectionHeader as="h1" title="Tournament Details">
        {!data.userTeam && <UpsertTeamFormDialog tournamentId={tournamentId} />}
        <Button variant="outline" asChild>
          <Link href="/tournaments">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>

      <TournamentDetailsCard data={data} />

      <SectionHeader title="Teams" />

      {data.teams.length !== 0 &&
        (data.userTeam ? (
          <Card variant="info">
            <CardHeader>
              <CardTitle>Your Team</CardTitle>
              <CardDescription>
                You are already part of a team in this tournament
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-medium">{data.userTeam.name}</p>
                <Badge variant="secondary">
                  {data.userTeam.memberCount} members
                </Badge>
              </div>
              <Button
                asChild
                variant="outline"
                className="flex gap-2 xs:self-auto self-end"
              >
                <Link href={`/teams/${data.userTeam._id}`}>View Team</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <JoinTeamCard />
        ))}

      <div className="grid min-w-max grid-cols-1 gap-2 xl:grid-cols-2">
        {data.teams.length !== 0 ? (
          data.teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              memberCount={team.memberCount}
              isUserMember={data.userTeam?._id === team._id}
              isUserInTeam={!!data.userTeam}
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
                  <UpsertTeamFormDialog tournamentId={tournamentId} />
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
