"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { Loader2, UserPlus } from "lucide-react";
import { useId, useMemo, useState } from "react";
import z from "zod";

import { useAppForm } from "@/hooks/form";
import { useUser } from "@/hooks/useUser";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
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
  teamId: z.custom<Id<"teams">>(
    (val) => typeof val === "string" && val.length >= 1,
    "Please select a team",
  ),
  email: z.email(),
});

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  teamId?: Id<"teams">;
  children?: React.ReactNode;
};

export function InviteMemberFormDialog({
  open: controlledOpen,
  onOpenChange,
  teamId,
  children,
}: Props) {
  const formId = useId();
  const { user } = useUser();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const inviteMember = useMutation(api.teamInvitations.inviteMember);

  const form = useAppForm({
    defaultValues: {
      teamId: teamId ?? "",
      email: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      await tryMutate({
        fn: () =>
          inviteMember({
            ...value,
            email: value.email.trim(),
          }),
        onSuccess: () => {
          setOpen(false);
        },
        successToast: "Invitation sent successfully!",
        defaultFailureToast: "Failed to send invitation",
      });
    },
  });

  const teams = useQuery(
    api.teams.list,
    !teamId && user ? { userId: user._id } : "skip",
  );
  const teamOptions = useMemo(
    () => teams?.map((t) => ({ value: t._id, label: t.name })) ?? [],
    [teams],
  );

  const formTeamId = useStore(form.store, (state) => state.values.teamId);

  const availableUsers = useQuery(
    api.tournaments.getAvailableUsersForTeam,
    teamId || formTeamId ? { teamId: teamId ?? formTeamId } : "skip",
  );
  const userOptions = useMemo(
    () =>
      availableUsers?.map((user) => ({
        value: user.email,
        label: `${user.name} (${user.email})`,
      })) ?? [],
    [availableUsers],
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
                <UserPlus />
                Invite Member
              </Button>
            </DialogTrigger>
          )
        )}
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Select a user from the list below who is not yet part of any team
              in this tournament. They will receive an invitation that expires
              in 7 days.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            {!teamId && (
              <form.AppField name="teamId">
                {(field) => (
                  <field.SelectField label="Team" options={teamOptions} />
                )}
              </form.AppField>
            )}
            <form.AppField name="email">
              {(field) => (
                <field.ComboboxField label="User" options={userOptions} />
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
                  Send Invitation
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
