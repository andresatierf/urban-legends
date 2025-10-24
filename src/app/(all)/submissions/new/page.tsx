import { SectionHeader } from "@/components/section-header";
import { CreateSubmissionForm } from "@/components/submissions/create-submission-form";

export default function NewSubmissionPage() {
  return (
    <>
      <SectionHeader
        as="h1"
        title="Submit Activity"
        description="Fill out the form to submit your activity for this tournament."
      />
      <CreateSubmissionForm />
    </>
  );
}
