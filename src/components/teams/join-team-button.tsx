"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
  message: z.string().optional(),
});

type Props = {
  teamId: Id<"teams">;
  team: {
    name: string;
    visibility: "public" | "private";
    maxMembers?: number;
  };
  currentMemberCount: number;
  isUserInTeam: boolean;
  isUserMember: boolean;
};

export function JoinTeamButton({
  teamId,
  team,
  currentMemberCount,
  isUserInTeam,
  isUserMember,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const joinRequest = useQuery(api.teams.getUserJoinRequest, { teamId });
  const requestToJoin = useMutation(api.teams.requestToJoin);
  const cancelRequest = useMutation(api.teams.cancelJoinRequest);

  const isFull = team.maxMembers && currentMemberCount >= team.maxMembers;
  const isPrivate = team.visibility === "private";
  const hasPendingRequest = joinRequest?.status === "pending";

  const form = useForm({
    defaultValues: {
      message: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value: { message } }) => {
      setIsSubmitting(true);
      try {
        await requestToJoin({
          teamId,
          message: message?.trim() || undefined,
        });
        toast.success("Join request sent successfully!");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to send join request",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleCancelRequest = async () => {
    if (!joinRequest) return;

    setIsSubmitting(true);
    try {
      await cancelRequest({ requestId: joinRequest._id });
      toast.success("Join request cancelled");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel request",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Pending request - show cancel option
  if (hasPendingRequest) {
    return (
      <Button
        variant="outline"
        onClick={handleCancelRequest}
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        Cancel Request
      </Button>
    );
  }

  // Can request to join
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Request to Join
        </Button>
      </DialogTrigger>

      {/** biome-ignore lint/correctness/useUniqueElementIds: explanation */}
      <form
        id="join-team-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join {team.name}</DialogTitle>
            <DialogDescription>
              Send a request to join this team. The team captain will review
              your request.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <form.Field name="message">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel html-for={field.name}>
                      Message (optional)
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Introduce yourself or explain why you want to join..."
                      autoComplete="off"
                      rows={4}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                form.reset();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="join-team-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
