import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const formSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  visibility: z.enum(["public", "private"]),
});

type Props = {
  tournamentId: Id<"tournaments">;
};

export function CreateTournamentTeamForm({ tournamentId }: Props) {
  const createUserTeam = useMutation(api.teams.createUserTeam);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: "",
      visibility: "public",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createUserTeam({ tournamentId, ...value });
        toast.success("Team created successfully!");
        router.push(`/tournaments/${tournamentId}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create team",
        );
      }
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
        <form.Field name="name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Team Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Enter a unique team name"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="visibility">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel html-for={field.name}>Visibility</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as "public" | "private")
                  }
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      Public - Anyone can request to join
                    </SelectItem>
                    <SelectItem value={"private" as const}>
                      Private - Invitation only
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
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
