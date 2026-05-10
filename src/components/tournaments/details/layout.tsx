import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { DetailsPageLayout } from "@/components/details-page-layout";

import type { Id } from "../../../../convex/_generated/dataModel";
import { UpsertTeamFormDialog } from "../../form/upsert-team-form";
import { Button } from "../../ui/button";
import { Sidebar } from "./sidebar";
import { Standings } from "./standings";
import { TeamRosters } from "./team-rosters";
import type { TournamentDetails } from "./types";

type Props = {
  data: TournamentDetails;
  tournamentId: Id<"tournaments">;
};

export function TournamentDetailsLayout({ data, tournamentId }: Props) {
  const sortedTeams = [...data.teams].sort((a, b) => b.points - a.points);
  const maxPoints = sortedTeams[0]?.points ?? 0;

  return (
    <DetailsPageLayout
      title="Tournament Details"
      headerActions={
        <Button variant="outline" asChild>
          <Link to="/tournaments">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      }
      sidebar={<Sidebar data={data} tournamentId={tournamentId} />}
    >
      <Standings
        data={data}
        sortedTeams={sortedTeams}
        maxPoints={maxPoints}
        headerAction={
          !data.userTeam &&
          data.status !== "ended" && (
            <UpsertTeamFormDialog tournamentId={tournamentId}>
              <Button size="sm">Create Team</Button>
            </UpsertTeamFormDialog>
          )
        }
      />
      <TeamRosters data={data} sortedTeams={sortedTeams} />
    </DetailsPageLayout>
  );
}
