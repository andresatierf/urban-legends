import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { DetailsPageLayout } from "@/components/details-page-layout";

import { Button } from "../../ui/button";
import { ContributionsTable } from "./contributions-table";
import { DescriptionCard } from "./description-card";
import { EvidenceGrid } from "./evidence-grid";
import { Sidebar } from "./sidebar";
import type { SubmissionDetailsData } from "./types";

type Props = {
  data: SubmissionDetailsData;
  backTo?: string;
};

export function SubmissionDetailsLayout({
  data,
  backTo = "/submissions",
}: Props) {
  const isTeamSubmission = data.submission.submissionType === "team";

  return (
    <DetailsPageLayout
      title="Submission Details"
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
      <DescriptionCard submission={data.submission} />

      {isTeamSubmission && (
        <ContributionsTable
          submitter={data.submitter}
          teammates={data.teammates}
        />
      )}

      <EvidenceGrid evidence={data.evidence} />
    </DetailsPageLayout>
  );
}
