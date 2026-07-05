"use client";

import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useId, useMemo, useState } from "react";
import { z } from "zod";

import { EvidenceUploader } from "@/components/submissions/evidence-uploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/hooks/form";
import { useUser } from "@/hooks/useUser";
import { toastFormValues } from "@/lib/form";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import type { ActivityDetailsData } from "../details/types";

const formSchema = z.object({
  teamId: z.custom<Id<"teams">>(
    (val) => typeof val === "string" && val.length >= 1,
    "Please select a team",
  ),
  description: z.string().optional(),
  date: z.string().min(1, "You must select a date."),
  tier: z.union([z.literal("base"), z.literal("advanced")]),
});

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  teamId?: Id<"teams">;
  activity?: Doc<"activities">;
  initialEvidence?: ActivityDetailsData["evidence"];
  date?: string;
  children?: React.ReactNode;
};

export function UpsertActivityFormDialog({
  open: controlledOpen,
  onOpenChange,
  teamId,
  activity,
  initialEvidence,
  date,
  children,
}: Props) {
  const { user, isDev } = useUser();
  const formId = useId();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const createActivity = useMutation(api.activities.create);
  const editActivity = useMutation(api.activities.edit);

  // For edit mode: if initialEvidence isn't passed, fetch it.
  const details = useQuery(
    api.activities.getDetails,
    activity && !initialEvidence ? { activityId: activity._id } : "skip",
  );
  const evidenceSeed = initialEvidence ?? details?.evidence;

  const [evidenceStorageIds, setEvidenceStorageIds] = useState<
    Id<"_storage">[]
  >(() => evidenceSeed?.map((e) => e._id) ?? []);

  const initialEvidenceItems = useMemo<
    { storageId: Id<"_storage">; previewUrl: string }[]
  >(
    () =>
      evidenceSeed?.map((e) => ({
        storageId: e._id,
        previewUrl: e.url,
      })) ?? [],
    [evidenceSeed],
  );

  const teams = useQuery(api.teams.list, user ? { userId: user._id } : "skip");
  const teamOptions = useMemo(
    () => teams?.map((t) => ({ value: t._id, label: t.name })) ?? [],
    [teams],
  );

  const form = useAppForm({
    defaultValues: {
      date: activity?.date ?? date ?? "",
      description: activity?.description ?? "",
      teamId: activity?.teamId ?? teamId ?? "",
      tier: activity?.tier ?? "base",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      await tryMutate({
        fn: () =>
          activity
            ? editActivity({
                activityId: activity._id,
                date: value.date,
                description: value.description,
                tier: value.tier,
                evidenceStorageIds,
              })
            : createActivity({
                teamId: value.teamId,
                date: value.date,
                description: value.description,
                tier: value.tier,
                evidenceStorageIds,
              }),
        onSuccess: () => {
          navigate({ to: "/activities" });
          setOpen(false);
          form.reset();
          setEvidenceStorageIds([]);
        },
        successToast: `Activity ${activity ? "updated" : "created"} successfully!`,
        defaultFailureToast: `Failed to ${activity ? "update" : "create"} activity`,
      });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        form.reset();
        setEvidenceStorageIds(evidenceSeed?.map((e) => e._id) ?? []);
        setUploaderKey((k) => k + 1);
      }}
    >
      {children ? (
        <DialogTrigger render={children as React.ReactElement} />
      ) : (
        controlledOpen === undefined &&
        onOpenChange === undefined && (
          <DialogTrigger render={<Button type="button" />}>
            {activity ? "Edit Activity" : "Create Activity"}
          </DialogTrigger>
        )
      )}
      <DialogContent className="sm:max-w-lg">
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {activity ? "Edit Activity" : "Create Activity"}
            </DialogTitle>
            <DialogDescription>
              {activity ? "Edit the activity details" : "Create a new activity"}
              {date && ` for ${date}`}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="max-w-[640px]">
            {!teamId && !activity && (
              <form.AppField name="teamId">
                {(field) => (
                  <field.ComboboxField label="Team" options={teamOptions} />
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
              initialItems={activity ? initialEvidenceItems : undefined}
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
              const initialIds = new Set(evidenceSeed?.map((e) => e._id) ?? []);
              const evidenceChanged =
                evidenceStorageIds.length !== initialIds.size ||
                evidenceStorageIds.some((id) => !initialIds.has(id));
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
                  <DialogClose
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                      />
                    }
                  >
                    Cancel
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
