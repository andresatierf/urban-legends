import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
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
import { CardGrid } from "@/components/ui/card-grid";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/tournaments/$tournamentId/")({
  component: TournamentDetailsPage,
});

function TournamentDetailsPage() {
  const { tournamentId } = Route.useParams();

  const data = useQuery(
    api.tournaments.getDetails,
    tournamentId ? { tournamentId: tournamentId as Id<"tournaments"> } : "skip",
  );

  return (
    <>
      <SectionHeader as="h1" title="Tournament Details">
        {!data?.userTeam && (
          <UpsertTeamFormDialog
            tournamentId={tournamentId as Id<"tournaments">}
          />
        )}
        <Button variant="outline" asChild>
          <Link to="/tournaments">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>

      <TournamentDetailsCard data={data} />

      <SectionHeader title="Teams" />

      {data &&
        data.teams.length !== 0 &&
        (data.userTeam ? (
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
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
                <Link
                  to="/teams/$teamId"
                  params={{ teamId: data.userTeam._id }}
                >
                  View Team
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <JoinTeamCard />
        ))}

      {data && (
        <CardGrid
          data={data.teams}
          empty={
            <JoinTeamCard tournamentId={tournamentId as Id<"tournaments">} />
          }
        >
          {(team) => (
            <TeamCard
              key={team._id}
              team={team}
              memberCount={team.memberCount}
              isUserMember={data.userTeam?._id === team._id}
              isUserInTeam={!!data.userTeam}
              members={team.members}
            />
          )}
        </CardGrid>
      )}
    </>
  );
}
