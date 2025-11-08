"use client";

import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { UpsertSubmissionFormButton } from "@/components/form/upsert-submission-form-button";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ submissionId: Id<"submissions"> }>;
};

export default function SubmissionDetailsPage({ params }: Props) {
  const { submissionId } = use(params);
  const submission = useQuery(
    api.submissions.get,
    submissionId ? { submissionId } : "skip",
  );

  if (!submission) return null; // TODO: add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Edit Activity">
        <Button variant="outline" asChild>
          <Link href="/submissions">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>
      <UpsertSubmissionFormButton submission={submission} />
    </>
  );
}
