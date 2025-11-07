import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { ComboboxField } from "../form/combobox-field";
import { TextField } from "../form/text-field";
import { Button } from "../ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const formSchema = z.object({
  tournamentId: z.custom<Id<"tournaments">>(
    (val) => typeof val === "string" && val.length >= 1,
  ),
  name: z.string().min(1, "Team name is required"),
  visibility: z.enum(["public", "private"]),
});

type Props = {
  tournamentId?: Id<"tournaments">;
  team?: Doc<"teams">;
};

export function UpsertTeamForm({ tournamentId, team }: Props) {
  const upsertUserTeam = useMutation(api.teams.upsertUserTeam);
  const router = useRouter();

  const tournaments =
    useQuery(api.tournaments.list, !tournamentId ? {} : "skip") || [];
  const tournamentOptions = tournaments.map((t) => ({
    value: t._id,
    label: t.name,
  }));

  const form = useForm({
    defaultValues: {
      tournamentId: tournamentId || "",
      name: team?.name || "",
      visibility: team?.visibility || "public",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await upsertUserTeam({ _id: team?._id, ...value });
        toast.success(`Team ${team ? "updated" : "created"} successfully!`);
        router.push(`/tournaments/${tournamentId}`);
        form.reset();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : `Failed to ${team ? "update" : "create"} team`,
        );
      }
    },
  });

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: ignore
    <form
      id="upsert-team-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        {!tournamentId && (
          <form.Field name="tournamentId">
            {(field) => (
              <ComboboxField
                field={field}
                label="Tournament"
                options={tournamentOptions}
                placeholder="Select a tournament"
              />
            )}
          </form.Field>
        )}
        <form.Field name="name">
          {(field) => (
            <TextField
              field={field}
              label="Team Name"
              placeholder="Enter a unique team name"
            />
          )}
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
        <form.Subscribe
          selector={(state) => state.isFormValid && state.canSubmit}
        >
          {(canSubmit) => (
            <Button type="submit" form="upsert-team-form" disabled={!canSubmit}>
              Create Team
            </Button>
          )}
        </form.Subscribe>
      </Field>
    </form>
  );
}
