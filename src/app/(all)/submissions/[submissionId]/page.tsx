import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { UpsertSubmissionForm } from "@/components/submissions/upsert-submission-form";
import { Button } from "@/components/ui/button";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ submissionId: Id<"submissions"> }>;
};

export default function SubmissionDetailsPage({ params }: Props) {
  const { submissionId } = use(params);
  return (
    <>
      <SectionHeader as="h1" title="Edit Activity">
        <Button href="/submissions" variant="outline">
          ← Back
        </Button>
      </SectionHeader>
      <UpsertSubmissionForm submissionId={submissionId} />
    </>
  );
}
