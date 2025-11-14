"use client";

import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { SubmissionDetailsCard } from "@/components/submissions/submission-details-card";
import { SubmitterInfo } from "@/components/submissions/submitter-info";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ submissionId: Id<"submissions"> }>;
};

export default function SubmissionDetailsPage({ params }: Props) {
  const { submissionId } = use(params);
  const data = useQuery(
    api.submissions.getDetails,
    submissionId ? { submissionId } : "skip",
  );

  if (!data) {
    return <SubmissionDetailsPageSkeleton />;
  }

  return (
    <>
      <SectionHeader as="h1" title="Submission Details">
        <Button variant="outline" asChild>
          <Link href="/submissions">
            <ArrowLeft />
            Back to Submissions
          </Link>
        </Button>
      </SectionHeader>

      <SubmissionDetailsCard data={data} />

      <SectionHeader title="Participants" />
      <SubmitterInfo submitter={data.submitter} teammates={data.teammates} />
    </>
  );
}

function SubmissionDetailsPageSkeleton() {
  return (
    <>
      <SectionHeader as="h1" title="Submission Details">
        <Button variant="outline" asChild>
          <Link href="/submissions">
            <ArrowLeft />
            Back to Submissions
          </Link>
        </Button>
      </SectionHeader>
      <Skeleton className="h-96 w-full" />

      <SectionHeader title="Participants" />
      <Skeleton className="h-64 w-full" />
    </>
  );
}
