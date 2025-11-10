"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, UserPlus } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { useAppForm } from "@/hooks/form";
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
  email: z.email("Please select a valid user"),
});

type Props = {
  teamId: Id<"teams">;
  tournamentId: Id<"tournaments">;
};

export function InviteMemberFormButton({ teamId, tournamentId }: Props) {
  const formId = useId();
  const [open, setOpen] = useState(false);

  const inviteMember = useMutation(api.invitations.inviteMember);
  const availableUsers = useQuery(
    api.tournaments.getAvailableUsersForTournament,
    tournamentId ? { tournamentId } : "skip",
  );
  const userOptions = useMemo(
    () =>
      availableUsers?.map((user) => ({
        value: user.email,
        label: `${user.name} (${user.email})`,
      })) ?? [],
    [availableUsers],
  );

  const form = useAppForm({
    defaultValues: {
      email: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value: { email } }) => {
      try {
        await inviteMember({ teamId, email: email.trim() });
        toast.success("Invitation sent successfully!");
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to send invitation",
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
          <Button>
            <UserPlus />
            Invite Member
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Select a user from the list below who is not yet part of any team
              in this tournament. They will receive an invitation that expires
              in 7 days.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
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
