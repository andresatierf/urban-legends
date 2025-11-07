import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { redirect } from "next/navigation";
import * as z from "zod";
import { toastFormValues } from "@/lib/form";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { DateField } from "../form/date-field";
import { NumberField } from "../form/number-field";
import { TextField } from "../form/text-field";
import { TextareaField } from "../form/textarea-field";
import { Button } from "../ui/button";
import { Field, FieldGroup } from "../ui/field";

const formSchema = z.object({
  name: z.string().min(1, "Name can't be empty"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Please select a start date"),
  endDate: z.string().min(1, "Please select an end date"),
  teamMinSize: z.number().min(1, "Team minimum size must be at least 1"),
  teamMaxSize: z.number().min(1, "Team maximum size must be at least 1"),
});

type UpsertTournamentFormProps = {
  tournament?: Doc<"tournaments">;
};

export function UpsertTournamentForm({
  tournament,
}: UpsertTournamentFormProps) {
  const upsertTournament = useMutation(api.tournaments.upsert);

  const form = useForm({
    defaultValues: {
      _id: tournament?._id,
      name: tournament?.name ?? "",
      description: tournament?.description ?? "",
      startDate: tournament?.startDate ?? "",
      endDate: tournament?.endDate ?? "",
      teamMinSize: tournament?.teamMinSize ?? 1,
      teamMaxSize: tournament?.teamMaxSize ?? 5,
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
      // onBlur: formSchema,
      // onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toastFormValues(value);
      await upsertTournament(value);
      redirect("/tournaments");
    },
  });

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: ignore
    <form
      id="upsert-tournament-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="name">
          {(field) => (
            <TextField
              field={field}
              label="Name"
              placeholder="The name of the tournament"
            />
          )}
        </form.Field>
        <form.Field name="description">
          {(field) => (
            <TextareaField
              field={field}
              label="Description"
              placeholder="Add a description of the event"
            />
          )}
        </form.Field>
      </FieldGroup>
      <FieldGroup className="mt-5 flex-row">
        <form.Field
          name="teamMinSize"
          validators={{
            onChangeListenTo: ["teamMaxSize"],
            onChange: ({ value, fieldApi }) => {
              if (value > fieldApi.form.getFieldValue("teamMaxSize")) {
                return {
                  message:
                    "Team minimum size must be lesser than team maximum size",
                };
              }
            },
          }}
        >
          {(field) => <NumberField field={field} label="Minimum Team Size" />}
        </form.Field>
        <form.Field
          name="teamMaxSize"
          validators={{
            onChangeListenTo: ["teamMinSize"],
            onChange: ({ value, fieldApi }) => {
              if (value < fieldApi.form.getFieldValue("teamMinSize")) {
                return {
                  message:
                    "Team maximum size must be greater than team minimum size",
                };
              }
            },
          }}
        >
          {(field) => <NumberField field={field} label="Maximum Team Size" />}
        </form.Field>
      </FieldGroup>
      <FieldGroup className="mt-5 flex-row">
        <form.Field name="startDate">
          {(field) => <DateField field={field} label="Start Date" />}
        </form.Field>
        <form.Field name="endDate">
          {(field) => <DateField field={field} label="End Date" />}
        </form.Field>
      </FieldGroup>
      <Field orientation="horizontal" className="mt-8 flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => toastFormValues(form.state.values)}
        >
          Check values
        </Button>
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="submit" form="create-tournament-form">
          Submit
        </Button>
      </Field>
    </form>
  );
}
