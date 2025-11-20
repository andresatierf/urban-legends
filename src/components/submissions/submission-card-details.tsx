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
  const stateColors = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    deleted: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const tierColors = {
    base: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    advanced:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className="flex-1 space-y-3">
      {/* Header: Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge
          className={stateColors[submission.state as keyof typeof stateColors]}
        >
          {submission.state.charAt(0).toUpperCase() + submission.state.slice(1)}
        </Badge>
        {submission.tier && (
          <Badge
            className={tierColors[submission.tier as keyof typeof tierColors]}
          >
            {submission.tier === "base" ? "Base Tier" : "Advanced Tier"}
          </Badge>
        )}
        {submission.submissionType === "team" && (
          <Badge variant="outline">
            <Users className="mr-1 h-3 w-3" />
            Team Exercise
          </Badge>
        )}
        {submission.pointsEarned && submission.pointsEarned > 0 && (
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
          <span>{format(new Date(submission.date), "MMM d, yyyy")}</span>
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
