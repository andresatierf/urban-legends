"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ComboboxField } from "../form/combobox-field";
import { Button } from "../ui/button";
import {
  Dialog,
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

export function InviteMemberDialog({ teamId, tournamentId }: Props) {
  const [open, setOpen] = useState(false);

  const availableUsers = useQuery(
    api.teams.getAvailableUsersForTournament,
    tournamentId ? { tournamentId } : "skip",
  );
  const userOptions =
    availableUsers?.map((user) => ({
      value: user.email,
      label: `${user.name} (${user.email})`,
    })) ?? [];

  const inviteMember = useMutation(api.teams.inviteMember);

  const form = useForm({
    defaultValues: {
      email: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value: { email } }) => {
      try {
        await inviteMember({ teamId, email: email.trim() });
        setOpen(false);
        toast.success("Invitation sent successfully!");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to send invitation",
        );
      }
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    !newOpen && form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Invite Member
        </Button>
      </DialogTrigger>

      {/** biome-ignore lint/correctness/useUniqueElementIds: explanation */}
      <form
        id="invite-member-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
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
            <form.Field name="email">
              {(field) => (
                <ComboboxField
                  field={field}
                  label="User"
                  options={userOptions}
                />
              )}
            </form.Field>
          </FieldGroup>

          <DialogFooter>
            <form.Subscribe
              selector={(state) => [
                state.isPristine,
                state.canSubmit,
                state.isSubmitting,
              ]}
            >
              {([isPristine, canSubmit, isSubmitting]) => (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="invite-member-form"
                    disabled={isSubmitting || isPristine || !canSubmit}
                  >
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    Send Invitation
                  </Button>
                </>
              )}
            </form.Subscribe>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
