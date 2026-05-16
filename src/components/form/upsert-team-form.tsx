"use client";

import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import z from "zod";

import { useAppForm } from "@/hooks/form";
import { useUser } from "@/hooks/useUser";
import { toastFormValues } from "@/lib/form";
import { tryMutate } from "@/lib/utils";

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
  joinPolicy: z.enum(["open", "closed"]),
});

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  tournamentId?: Id<"tournaments">;
  team?: Doc<"teams">;
  children?: React.ReactNode;
};

export function UpsertTeamFormDialog({
  open: controlledOpen,
  onOpenChange,
  tournamentId,
  team,
  children,
}: Props) {
  const { isDev } = useUser();
  const formId = useId();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

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
      tournamentId: tournamentId || team?.tournamentId || "",
      name: team?.name || "",
      joinPolicy: team?.joinPolicy || "open",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      await tryMutate({
        fn: () => upsertUserTeam({ _id: team?._id, ...value }),
        onSuccess: (upsertedTeamId) => {
          navigate({ to: `/teams/${upsertedTeamId}` });
          setOpen(false);
        },
        successToast: `Team ${team ? "updated" : "created"} successfully!`,
        defaultFailureToast: `Failed to ${team ? "update" : "create"} team`,
      });
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
      {children ? (
        <DialogTrigger render={children as React.ReactElement} />
      ) : (
        controlledOpen === undefined &&
        onOpenChange === undefined && (
          <DialogTrigger render={<Button />}>
            {team ? "Update Team" : "Create Team"}
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
              {team ? "Update Team" : "Create Team"}
              {tournament && ` in ${tournament.name}`}
            </DialogTitle>
            <DialogDescription>
              {team ? "Update the team" : "Create a team"}
              {tournament && " for this tournament"}.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="max-w-[640px]">
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
            <form.AppField name="joinPolicy">
              {(field) => (
                <field.SelectField
                  label="Join Policy"
                  placeholder="Select join policy"
                  options={[
                    {
                      value: "open",
                      label: "Open - Anyone can request to join",
                    },
                    { value: "closed", label: "Closed - Invitation only" },
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
                  disabled={isSubmitting || isPristine || !canSubmit}
                >
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  {team ? "Update Team" : "Create Team"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
