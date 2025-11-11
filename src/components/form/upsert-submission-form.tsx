"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { CircleX, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/hooks/form";
import { useUser } from "@/hooks/useUser";
import { toastFormValues } from "@/lib/form";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Combobox } from "../ui/combobox";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";

const formSchema = z.object({
  teamId: z.custom<Id<"teams">>(
    (val) => typeof val === "string" && val.length >= 1,
  ),
  description: z.string().optional(),
  date: z.string().min(1, "You must select a date."),
  teammateIds: z.array(
    z.custom<Id<"users">>((val) => typeof val === "string" && val.length >= 1),
  ),
});

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  submission?: Doc<"submissions">;
  children?: React.ReactNode;
};

export function UpsertSubmissionFormDialog({
  open: controlledOpen,
  onOpenChange,
  submission,
  children,
}: Props) {
  const { user, isAdmin } = useUser();
  const formId = useId();
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const upsertSubmission = useMutation(api.submissions.upsert);

  const teams =
    useQuery(api.teams.list, user ? { userId: user._id } : "skip") || [];
  const teamOptions = useMemo(
    () => teams.map((t) => ({ value: t._id, label: t.name })),
    [teams],
  );

  const form = useAppForm({
    defaultValues: {
      date: submission?.date ?? "",
      description: submission?.description ?? "",
      teamId: submission?.teamId ?? "",
      teammateIds: submission?.teammates ?? [],
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
      // onBlur: formSchema,
      // onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await upsertSubmission({ ...value, _id: submission?._id });
        toast.success(
          `Submission ${submission ? "updated" : "created"} successfully!`,
        );
        router.push("/submissions");
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : `Failed to ${submission ? "update" : "create"} submission`,
        );
      }
    },
  });

  const teamId = useStore(
    form.store,
    (state) => state.values.teamId as Id<"teams">,
  );

  const team = teams.find((t) => t._id === teamId);

  const tournament = useQuery(
    api.tournaments.get,
    team ? { tournamentId: team.tournamentId } : "skip",
  );

  const teammates =
    useQuery(
      api.teams.listTeamMembers,
      teamId ? { teamId, excludeSelf: true } : "skip",
    ) || [];

  const teammateOptions = useMemo(
    () => teammates?.map((t) => ({ value: t._id, label: t.email! })) ?? [],
    [teammates],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        form.reset();
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {submission ? "Edit Submission" : "Create Submission"}
            </DialogTitle>
            <DialogDescription>
              {submission
                ? "Edit the submission details"
                : "Create a new submission"}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <form.AppField name="teamId">
              {(field) => (
                <field.ComboboxField
                  label="Team"
                  options={teamOptions}
                  onChange={() => {
                    form.clearFieldValues("teammateIds");
                  }}
                />
              )}
            </form.AppField>
            <form.AppField name="description">
              {(field) => (
                <field.TextField
                  label="Description"
                  placeholder="An optional description of the activity"
                />
              )}
            </form.AppField>
            <form.AppField name="date">
              {(field) => <field.DateField label="Date" />}
            </form.AppField>
          </FieldGroup>
          {teammates.length > 0 && (
            <FieldGroup className="mt-6">
              <form.Field name="teammateIds" mode="array">
                {(field) => {
                  return (
                    <Field>
                      <div className="flex justify-between">
                        <FieldLabel>Teammates</FieldLabel>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            teamId !== "" &&
                            field.state.value.length <
                              Math.min(
                                tournament?.teamMaxSize || 9999,
                                teammates.length,
                              )
                              ? field.pushValue("" as Id<"users">)
                              : undefined
                          }
                          disabled={
                            teamId === "" ||
                            field.state.value.length >=
                              Math.min(
                                tournament?.teamMaxSize || 9999,
                                teammates.length,
                              )
                          }
                          type="button"
                        >
                          <Plus />
                          Add teammate
                        </Button>
                      </div>
                      {field.state.value.map((_, i) => {
                        return (
                          // biome-ignore lint/suspicious/noArrayIndexKey: no other key
                          <form.Field key={i} name={`teammateIds[${i}]`}>
                            {(subField) => {
                              const isInvalid =
                                subField.state.meta.isTouched &&
                                !subField.state.meta.isValid;

                              return (
                                <Field>
                                  <FieldLabel>Email</FieldLabel>
                                  <div className="flex gap-2">
                                    <Combobox
                                      value={subField.state.value}
                                      options={teammateOptions}
                                      setValue={(value) => {
                                        subField.handleChange(value);
                                      }}
                                      noSelectionText="Select a teammate..."
                                      placeholder="Search teammate..."
                                      disabled={teamId === ""}
                                    />
                                    <Button
                                      type="button"
                                      variant="solid"
                                      color="destructive"
                                      size="icon"
                                      onClick={() => field.removeValue(i)}
                                    >
                                      <CircleX />
                                    </Button>
                                  </div>
                                  {isInvalid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          </form.Field>
                        );
                      })}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>
          )}

          <form.Subscribe
            selector={(state) => [
              state.isPristine,
              state.canSubmit,
              state.isSubmitting,
            ]}
          >
            {([isPristine, canSubmit, isSubmitting]) => (
              <DialogFooter>
                {isAdmin && (
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
                  disabled={isSubmitting || isPristine || !canSubmit}
                >
                  Submit
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
