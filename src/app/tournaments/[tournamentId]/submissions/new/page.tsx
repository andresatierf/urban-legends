import { CreateSubmissionForm } from "@/components/submissions/create-submission-form";

export default function NewSubmissionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-medium text-2xl">Submit Activity</h1>
        <p className="text-muted-foreground">
          Fill out the form to submit your activity for this tournament.
        </p>
      </div>
      <CreateSubmissionForm />
    </div>
  );
}
