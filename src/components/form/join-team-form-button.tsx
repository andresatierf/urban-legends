"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, UserPlus } from "lucide-react";
import { useId, useState } from "react";
import z from "zod";
import { useAppForm } from "@/hooks/form";
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
  message: z.string().optional(),
});

type Props = {
  teamId: Id<"teams">;
  team: Doc<"teams">;
  currentMemberCount: number;
  isUserInTeam: boolean;
  isUserMember: boolean;
};

export function JoinTeamFormButton({
  teamId,
  team,
  currentMemberCount,
  isUserInTeam,
  isUserMember,
}: Props) {
  const formId = useId();
  const [open, setOpen] = useState(false);

  const joinRequest = useQuery(api.joinRequests.getUserJoinRequest, { teamId });
  const requestToJoin = useMutation(api.joinRequests.requestToJoin);
  const cancelRequest = useMutation(api.joinRequests.cancelJoinRequest);

  const isFull = team.maxMembers && currentMemberCount >= team.maxMembers;
  const isPrivate = team.visibility === "private";
  const hasPendingRequest = joinRequest?.status === "pending";

  const form = useAppForm({
    defaultValues: {
      message: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value: { message } }) => {
      await tryMutate({
        fn: () =>
          requestToJoin({ teamId, message: message?.trim() || undefined }),
        onSuccess: () => {
          setOpen(false);
        },
        successToast: "Join request sent successfully!",
        defaultFailureToast: "Failed to send join request",
      });
    },
  });

  const handleCancelRequest = async () => {
    if (!joinRequest) return;

    await tryMutate({
      fn: () => cancelRequest({ requestId: joinRequest._id }),
      successToast: "Join request cancelled",
      defaultFailureToast: "Failed to cancel join request",
    });
  };

  // Pending request - show cancel option
  if (hasPendingRequest) {
    return (
      <Button variant="outline" onClick={handleCancelRequest}>
        Cancel Request
      </Button>
    );
  }

  // Don't show button if user is already a member
  if (isUserMember) {
    return (
      <Button variant="outline" disabled>
        Already Joined
      </Button>
    );
  }

  // User already in a team
  if (isUserInTeam) {
    return (
      <Button variant="outline" disabled>
        Already in a Team
      </Button>
    );
  }

  // Private teams can't be joined via request
  if (isPrivate) {
    return (
      <Button variant="outline" disabled>
        Private Team
      </Button>
    );
  }

  // Team is full
  if (isFull) {
    return (
      <Button variant="outline" disabled>
        Team Full
      </Button>
    );
  }

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
            Request to Join
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request to Join {team.name}</DialogTitle>
            <DialogDescription>
              Send a request to join this team. The team captain will review
              your request.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <form.AppField name="message">
              {(field) => (
                <field.TextareaField
                  label="Message (optional)"
                  placeholder="Introduce yourself or explain why you want to join..."
                  rows={4}
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
                  disabled={isSubmitting || !canSubmit}
                >
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  Send Request
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
