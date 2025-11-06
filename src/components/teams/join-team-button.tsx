"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
} from "../ui/dialog";
import { Field, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";

type Props = {
  teamId: Id<"teams">;
  team: {
    name: string;
    visibility: "public" | "private";
    maxMembers?: number;
  };
  currentMemberCount: number;
  isUserMember: boolean;
};

export function JoinTeamButton({
  teamId,
  team,
  currentMemberCount,
  isUserMember,
}: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const joinRequest = useQuery(api.teams.getUserJoinRequest, { teamId });
  const requestToJoin = useMutation(api.teams.requestToJoin);
  const cancelRequest = useMutation(api.teams.cancelJoinRequest);

  // Determine button state
  const isFull = team.maxMembers && currentMemberCount >= team.maxMembers;
  const isPrivate = team.visibility === "private";
  const hasPendingRequest = joinRequest?.status === "pending";

  const handleJoinRequest = async () => {
    setIsSubmitting(true);
    try {
      await requestToJoin({
        teamId,
        message: message.trim() || undefined,
      });
      toast.success("Join request sent successfully!");
      setOpen(false);
      setMessage("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send join request",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus />
        Request to Join
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join {team.name}</DialogTitle>
            <DialogDescription>
              Send a request to join this team. The team captain will review
              your request.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel html-for="message">
              Message (optional)
            </FieldLabel>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself or explain why you want to join..."
              rows={4}
            />
          </Field>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleJoinRequest} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
