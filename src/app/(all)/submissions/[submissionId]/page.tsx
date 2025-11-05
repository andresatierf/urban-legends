import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
        <Button variant="outline" asChild>
          <Link href="/submissions">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>
      <UpsertSubmissionForm submissionId={submissionId} />
    </>
  );
}
