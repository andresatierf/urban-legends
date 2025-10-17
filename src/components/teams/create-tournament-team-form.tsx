import { toastFormValues } from "@/lib/form";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { redirect } from "next/navigation";
import z from "zod";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

const addTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
  members: z.array(z.string()).optional(),
});

type Props = {
  tournamentId: Id<"tournaments">;
};

export function CreateTournamentTeamForm({ tournamentId }: Props) {
  const createTeam = useMutation(api.teams.create);

  const form = useForm({
    defaultValues: {
      name: "",
      members: [],
    } as z.input<typeof addTeamSchema>,
    validators: {
      onChange: addTeamSchema,
    },
    onSubmit: async ({ value }) => {
      toastFormValues({ tournamentId, ...value });

      // TODO: replace with Convex mutation call, e.g.
      await createTeam({ tournamentId, ...value });
      redirect(`/admin/tournaments/${tournamentId}`);
    },
  });

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: ignore
    <form
      id="create-tournament-team-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field
          name="name"
          // biome-ignore lint/correctness/noChildrenProp: documentation
          children={(field) => {
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
                  placeholder="The name of the team"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>
      <Field orientation="horizontal" className="mt-8 flex justify-end">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="submit" form="create-tournament-team-form">
          Create Team
        </Button>
      </Field>
    </form>
  );
}
