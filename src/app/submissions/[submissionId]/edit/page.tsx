import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { EditSubmissionForm } from "@/components/submissions/edit-submission-form";
import { Button } from "@/components/ui/button";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ submissionId: Id<"submissions"> }>;
};

export default function EditSubmissionPage({ params }: Props) {
  const { submissionId } = use(params);
  return (
    <>
      <SectionHeader as="h1" title="Edit Activity">
        <Button href="/submissions" variant="outline">
          ← Back
        </Button>
      </SectionHeader>
      <EditSubmissionForm submissionId={submissionId} />
    </>
  );
}
