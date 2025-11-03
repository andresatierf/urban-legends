"use client";

import { useQuery } from "convex/react";
import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { UpsertSubmissionForm } from "@/components/submissions/upsert-submission-form";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ submissionId: Id<"submissions"> }>;
};

export default function EditSubmissionPage({ params }: Props) {
  const { submissionId } = use(params);

  const submission = useQuery(
    api.submissions.get,
    submissionId ? { submissionId } : "skip",
  );

  if (!submission) return null; // TODO: add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Edit Activity">
        <Button href="/submissions" variant="outline">
          ← Back
        </Button>
      </SectionHeader>
      <UpsertSubmissionForm submission={submission} />
    </>
  );
}
