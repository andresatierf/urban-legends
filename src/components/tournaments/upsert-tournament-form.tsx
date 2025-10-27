import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { redirect } from "next/navigation";
import * as z from "zod";
import { toastFormValues } from "@/lib/form";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

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
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="The name of the tournament"
                  autoComplete="off"
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
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Add a description of the event"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
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
                    "Team minimum size must be greater than team maximum size",
                };
              }
            },
          }}
        >
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Minimum Team Size</FieldLabel>
                <Input
                  type="number"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  aria-invalid={isInvalid}
                  placeholder="Minimum size for teams in this tournament"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
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
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Maximum Team Size</FieldLabel>
                <Input
                  type="number"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  aria-invalid={isInvalid}
                  placeholder="Maximum size for teams in this tournament"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>
      <FieldGroup className="mt-5 flex-row">
        <form.Field name="startDate">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Start Date</FieldLabel>
                <Input
                  type="date"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Start date of the event"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="endDate">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>End Date</FieldLabel>
                <Input
                  type="date"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="End date of the event"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
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
