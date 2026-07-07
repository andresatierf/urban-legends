import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { DetailsPageLayout } from "@/components/details-page-layout";
import { Button } from "@/components/ui/button";

import { AwardsCard } from "./awards-card";
import { DescriptionCard } from "./description-card";
import { RosterByTeam } from "./roster-by-team";
import { Sidebar } from "./sidebar";
import type { ChallengeDetailsData } from "./types";

export function ChallengeDetailsLayout({
  data,
}: {
  data: ChallengeDetailsData;
}) {
  return (
    <DetailsPageLayout
      title="Challenge Details"
      eyebrow="Challenge"
      headerActions={
        <Button variant="outline" asChild>
          <Link
            to="/tournaments/$tournamentId"
            params={{ tournamentId: data.challenge.tournamentId }}
          >
            <ArrowLeft />
            Back
          </Link>
        </Button>
      }
      sidebar={<Sidebar data={data} />}
    >
      <DescriptionCard data={data} />
      <RosterByTeam data={data} />
      <AwardsCard data={data} />
    </DetailsPageLayout>
  );
}
