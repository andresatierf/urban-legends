import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { DetailsPageLayout } from "@/components/details-page-layout";

import { Button } from "../../ui/button";
import { DescriptionCard } from "./description-card";
import { EvidenceGrid } from "./evidence-grid";
import { ParticipationRoster, SubmitEvidenceCard } from "./roster";
import { Sidebar } from "./sidebar";
import type { ActivityDetailsData } from "./types";

type Props = {
  data: ActivityDetailsData;
  backTo?: string;
};

export function ActivityDetailsLayout({ data, backTo = "/activities" }: Props) {
  return (
    <DetailsPageLayout
      title="Activity Details"
      eyebrow="Review"
      headerActions={
        <Button variant="outline" asChild>
          <Link to={backTo}>
            <ArrowLeft />
            Back
          </Link>
        </Button>
      }
      sidebar={<Sidebar data={data} />}
    >
      <DescriptionCard activity={data.activity} />
      {data.activity.type === "group" ? (
        <ParticipationRoster data={data} />
      ) : (
        <>
          <SubmitEvidenceCard data={data} />
          <EvidenceGrid evidence={data.evidence} />
        </>
      )}
    </DetailsPageLayout>
  );
}
