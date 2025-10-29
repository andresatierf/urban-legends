"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { CircleX } from "lucide-react";
import { redirect } from "next/navigation";
import { useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { toastFormValues } from "@/lib/form";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Combobox } from "../combobox";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

const formSchema = z.object({
  date: z.string().min(1, "You must select a date."),
  description: z.string().optional(),
  teamId: z.custom<Id<"teams">>(),
  teammateIds: z.array(z.custom<Id<"users">>()),
});

type Props = {
  submissionId?: Id<"submissions">;
};

export function UpsertSubmissionForm({ submissionId }: Props) {
  const { user } = useUser();
  const submission = useQuery(
    api.submissions.getById,
    submissionId ? { id: submissionId } : "skip",
  );
  const editSubmission = useMutation(api.submissions.editSubmission);

  const teams =
    useQuery(api.teams.list, user ? { userId: user._id } : "skip") || [];
  const teamOptions = useMemo(
    () => teams.map((t) => ({ value: t._id, label: t.name })),
    [teams],
  );

  const form = useForm({
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
      toastFormValues(value);
      await editSubmission({ ...value, id: submissionId! });
      redirect("/submissions");
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

  if (submission === undefined) return null; // TODO: Add skeleton

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: ignore
    <form
      id="create-submission-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="teamId">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Team</FieldLabel>
                <Combobox
                  value={field.state.value}
                  setValue={(value) => {
                    field.handleChange(value);
                    form.clearFieldValues("teammateIds");
                  }}
                  options={teamOptions}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="description">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Description</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="An optional description of the activity"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="date">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Date</FieldLabel>
                <Input
                  type="date"
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
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
                              <FieldLabel>Email:</FieldLabel>
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
                                  variant="destructive"
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

      <Field orientation="horizontal" className="mt-8 flex justify-end">
        <form.Subscribe selector={(state) => state.isDirty}>
          {(isDirty) => (
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={!isDirty}
            >
              Reset
            </Button>
          )}
        </form.Subscribe>
        <form.Subscribe selector={(state) => state.canSubmit}>
          {(canSubmit) => (
            <Button
              type="submit"
              form="create-submission-form"
              disabled={!teamId || !canSubmit}
            >
              Submit
            </Button>
          )}
        </form.Subscribe>
      </Field>
    </form>
  );
}
