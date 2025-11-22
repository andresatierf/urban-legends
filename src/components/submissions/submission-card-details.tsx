"use client";

import { format } from "date-fns";
import { Calendar, Trophy, User, Users } from "lucide-react";
import type { Doc } from "@/../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

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
  const tierColors = {
    base: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    advanced:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  // Safely get tier color with fallback
  const tierColor =
    submission.tier && submission.tier in tierColors
      ? tierColors[submission.tier as keyof typeof tierColors]
      : tierColors.base;

  return (
    <div className="flex-1 space-y-3">
      {/* Header: Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={submission.state}>
          {submission.state.charAt(0).toUpperCase() + submission.state.slice(1)}
        </Badge>
        {submission.tier && (
          <Badge className={tierColor}>
            {submission.tier === "base" ? "Base Tier" : "Advanced Tier"}
          </Badge>
        )}
        {submission.submissionType === "team" && (
          <Badge variant="outline">
            <Users className="mr-1 h-3 w-3" />
            Team Exercise
          </Badge>
        )}
        {submission.pointsEarned > 0 && (
          <Badge variant="outline">
            <Trophy className="mr-1 h-3 w-3" />
            {submission.pointsEarned} points
          </Badge>
        )}
      </div>

      {/* Metadata Grid */}
      <div className="grid gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {submission.date
              ? format(new Date(submission.date), "MMM d, yyyy")
              : "No Date"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{team.name}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{user.name}</span>
        </div>
      </div>

      {/* Description */}
      {submission.description && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="line-clamp-3 text-muted-foreground text-sm">
            {submission.description}
          </p>
        </div>
      )}
    </div>
  );
}
