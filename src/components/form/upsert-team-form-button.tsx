import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { useAppForm } from "@/hooks/form";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
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
  tournamentId: z.custom<Id<"tournaments">>(
    (val) => typeof val === "string" && val.length >= 1,
  ),
  name: z.string().min(1, "Team name is required"),
  visibility: z.enum(["public", "private"]),
});

type Props = {
  tournamentId: Id<"tournaments">;
  team?: Doc<"teams">;
};

export function UpsertTeamFormButton({ tournamentId, team }: Props) {
  const formId = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const upsertUserTeam = useMutation(api.teams.upsertUserTeam);
  const tournament = useQuery(
    api.tournaments.get,
    tournamentId ? { tournamentId } : "skip",
  );
  const tournaments =
    useQuery(api.tournaments.list, !tournamentId ? {} : "skip") || [];

  const tournamentOptions = useMemo(
    () =>
      tournaments.map((t) => ({
        value: t._id,
        label: t.name,
      })),
    [tournaments],
  );

  const form = useAppForm({
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
        setOpen(false);
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
        <DialogTrigger asChild>
          <Button>{team ? "Update Team" : "Create Team"}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {team ? "Update Team" : "Create Team"}
              {tournament && ` in ${tournament.name}`}
            </DialogTitle>
            <DialogDescription>
              {team ? "Update the team" : "Create a team"}
              {tournament && " for this tournament"}.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            {!tournamentId && (
              <form.AppField name="tournamentId">
                {(field) => (
                  <field.ComboboxField
                    label="Tournament"
                    options={tournamentOptions}
                    placeholder="Select a tournament"
                  />
                )}
              </form.AppField>
            )}
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label="Team Name"
                  placeholder="Enter a unique team name"
                />
              )}
            </form.AppField>
            <form.AppField name="visibility">
              {(field) => (
                <field.SelectField
                  label="Visibility"
                  placeholder="Select visibility"
                  options={[
                    {
                      value: "public",
                      label: "Public - Anyone can request to join",
                    },
                    { value: "private", label: "Private - Invitation only" },
                  ]}
                />
              )}
            </form.AppField>
          </FieldGroup>

          <form.Subscribe
            selector={(state) => [
              state.isPristine,
              state.canSubmit,
              state.isSubmitting,
            ]}
          >
            {([isPristine, canSubmit, isSubmitting]) => (
              <DialogFooter>
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
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  Create Team
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
