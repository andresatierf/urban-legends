"use client";

import { Calendar, Trophy, User, Users } from "lucide-react";

import type { Doc } from "@/../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useFormattedDate } from "@/hooks/useFormattedDate";

import { stateBadgeVariant } from "../../review/submission-review-card-shared";

interface SubmissionCardDetailsProps {
  submission: Doc<"submissions">;
  team: Doc<"teams">;
  user: Doc<"users">;
}

export function SubmissionCardDetails({
  submission,
  team,
  user,
}: SubmissionCardDetailsProps) {
  const { format } = useFormattedDate();

  const tierBadgeVariant = submission.tier === "advanced" ? "social" : "info";

  return (
    <div className="flex-1 space-y-3">
      <Eyebrow as="div">Status</Eyebrow>
      <div className="flex flex-wrap gap-2">
        <Badge variant={stateBadgeVariant(submission.state)}>
          {submission.state.charAt(0).toUpperCase() + submission.state.slice(1)}
        </Badge>
        {submission.tier && (
          <Badge variant={tierBadgeVariant}>
            {submission.tier === "base" ? "Base Tier" : "Advanced Tier"}
          </Badge>
        )}
        {submission.submissionType === "team" && (
          <Badge variant="social">
            <Users className="mr-1 h-3 w-3" />
            Team Exercise
          </Badge>
        )}
        {submission.pointsEarned > 0 && (
          <Badge variant="warning">
            <Trophy className="mr-1 h-3 w-3" />
            {submission.pointsEarned} points
          </Badge>
        )}
      </div>

      <div className="grid gap-2 text-sm">
        <Eyebrow as="div">Activity</Eyebrow>
        <div className="text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            {submission.date ? format(submission.date, "long") : "No Date"}
          </span>
        </div>
        <Eyebrow as="div">Team</Eyebrow>
        <div className="text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{team.name}</span>
        </div>
        <Eyebrow as="div">Submitted by</Eyebrow>
        <div className="text-muted-foreground flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{user.name}</span>
        </div>
      </div>

      {submission.description && (
        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-muted-foreground line-clamp-3 text-sm">
            {submission.description}
          </p>
        </div>
      )}
    </div>
  );
}
