"use client";

import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useId, useMemo, useState } from "react";
import { z } from "zod";

import { EvidenceUploader } from "@/components/submissions/evidence-uploader";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/hooks/form";
import { useUser } from "@/hooks/useUser";
import { toastFormValues } from "@/lib/form";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { FieldGroup } from "../ui/field";

const formSchema = z.object({
  teamId: z.custom<Id<"teams">>(
    (val) => typeof val === "string" && val.length >= 1,
    "Please select a team",
  ),
  description: z.string().optional(),
  date: z.string().min(1, "You must select a date."),
  submissionType: z.union([z.literal("individual"), z.literal("team")]),
  tier: z.union([z.literal("base"), z.literal("advanced")]),
});

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  teamId?: Id<"teams">;
  submission?: Doc<"submissions">;
  date?: string;
  children?: React.ReactNode;
};

export function UpsertSubmissionFormDialog({
  open: controlledOpen,
  onOpenChange,
  teamId,
  submission,
  date,
  children,
}: Props) {
  const { user, isDev } = useUser();
  const formId = useId();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [evidenceStorageIds, setEvidenceStorageIds] = useState<
    Id<"_storage">[]
  >(() => submission?.evidenceStorageIds ?? []);
  const [uploaderKey, setUploaderKey] = useState(0);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const upsertSubmission = useMutation(api.submissions.upsert);

  const submissionDetails = useQuery(
    api.submissions.getDetails,
    submission ? { submissionId: submission._id } : "skip",
  );

  const initialEvidenceItems = useMemo<
    { storageId: Id<"_storage">; previewUrl: string }[]
  >(
    () =>
      submissionDetails?.evidence.map((e) => ({
        storageId: e._id as unknown as Id<"_storage">,
        previewUrl: e.url,
      })) ?? [],
    [submissionDetails],
  );

  const teams = useQuery(api.teams.list, user ? { userId: user._id } : "skip");
  const teamOptions = useMemo(
    () => teams?.map((t) => ({ value: t._id, label: t.name })) ?? [],
    [teams],
  );

  const form = useAppForm({
    defaultValues: {
      date: submission?.date ?? date ?? "",
      description: submission?.description ?? "",
      teamId: submission?.teamId ?? teamId ?? "",
      submissionType: submission?.submissionType ?? "individual",
      tier: submission?.tier ?? "base",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
      // onBlur: formSchema,
      // onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await tryMutate({
        fn: () =>
          upsertSubmission({
            ...value,
            _id: submission?._id,
            evidenceStorageIds,
          }),
        onSuccess: () => {
          navigate({ to: "/submissions" });
          setOpen(false);
          form.reset();
          setEvidenceStorageIds([]);
        },
        successToast: `Submission ${submission ? "updated" : "created"} successfully!`,
        defaultFailureToast: `Failed to ${submission ? "update" : "create"} submission`,
      });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        form.reset();
        setEvidenceStorageIds(submission?.evidenceStorageIds ?? []);
        setUploaderKey((k) => k + 1);
      }}
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {children ? (
          <DialogTrigger asChild>{children}</DialogTrigger>
        ) : (
          controlledOpen === undefined &&
          onOpenChange === undefined && (
            <DialogTrigger asChild>
              <Button type="button">
                {submission ? "Edit Submission" : "Create Submission"}
              </Button>
            </DialogTrigger>
          )
        )}
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {submission ? "Edit Submission" : "Create Submission"}
            </DialogTitle>
            <DialogDescription>
              {submission
                ? "Edit the submission details"
                : "Create a new submission"}
              {date && ` for ${date}`}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="max-w-[640px]">
            {!teamId && (
              <form.AppField name="teamId">
                {(field) => (
                  <field.SelectField label="Team" options={teamOptions} />
                )}
              </form.AppField>
            )}
            <form.AppField name="description">
              {(field) => (
                <field.TextField
                  label="Description"
                  placeholder="An optional description of the activity"
                />
              )}
            </form.AppField>
            {!date && (
              <form.AppField name="date">
                {(field) => <field.DateField label="Date" />}
              </form.AppField>
            )}
            <form.AppField name="submissionType">
              {(field) => (
                <field.SelectField
                  label="Submission Type"
                  options={[
                    {
                      value: "individual",
                      label:
                        "Individual Activity (you completed this on your own)",
                    },
                    {
                      value: "team",
                      label: "Team Activity (multiple members worked together)",
                    },
                  ]}
                />
              )}
            </form.AppField>
            <form.AppField name="tier">
              {(field) => (
                <field.SelectField
                  label="Tier"
                  options={[
                    { value: "base", label: "Base" },
                    { value: "advanced", label: "Advanced" },
                  ]}
                />
              )}
            </form.AppField>
            <EvidenceUploader
              key={uploaderKey}
              storageIds={evidenceStorageIds}
              onStorageIdsChange={setEvidenceStorageIds}
              initialItems={submission ? initialEvidenceItems : undefined}
            />
          </FieldGroup>

          <form.Subscribe
            selector={(state) => [
              state.isPristine,
              state.canSubmit,
              state.isSubmitting,
            ]}
          >
            {([isPristine, canSubmit, isSubmitting]) => {
              const missingEvidence = evidenceStorageIds.length === 0;
              const initialIds = submission?.evidenceStorageIds ?? [];
              const evidenceChanged =
                JSON.stringify([...evidenceStorageIds].sort()) !==
                JSON.stringify([...initialIds].sort());
              return (
                <DialogFooter>
                  {isDev && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => toastFormValues(form.state.values)}
                    >
                      Check values
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={isPristine || isSubmitting}
                    className="mr-auto"
                  >
                    Reset
                  </Button>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    form={formId}
                    disabled={
                      isSubmitting ||
                      (!evidenceChanged && isPristine) ||
                      !canSubmit ||
                      missingEvidence
                    }
                  >
                    Submit
                  </Button>
                </DialogFooter>
              );
            }}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
