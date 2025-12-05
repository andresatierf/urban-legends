import { Check, X } from "lucide-react";
import type { UserWithRoles } from "@/../convex/users";
import { cn } from "@/lib/utils";

interface GroupParticipantsListProps {
  submitters: UserWithRoles[];
  participantCount: number;
  totalMembers: number;
  isTeamExercise: boolean;
  participationRate: number;
}

/**
 * Display participants in a team activity group with visual indicators
 * Shows participation count, team exercise qualification status, and participant names
 */
export function GroupParticipantsList({
  submitters,
  participantCount,
  totalMembers,
  isTeamExercise,
  participationRate,
}: GroupParticipantsListProps) {
  return (
    <div className="space-y-2 text-sm">
      <p>
        <span className="font-medium">
          Participants ({participantCount}/{totalMembers}):
        </span>{" "}
        {submitters.map((s) => s.name).join(", ")}
      </p>

      <p
        className={cn("flex items-center gap-1", {
          "text-green-600": isTeamExercise,
          "text-red-600": !isTeamExercise,
        })}
      >
        {isTeamExercise ? (
          <Check className="h-3 w-3" />
        ) : (
          <X className="h-3 w-3" />
        )}
        {isTeamExercise ? "Qualifies" : "Does not qualify"} as team exercise (
        {Math.round(participationRate * 100)}% participation)
      </p>
    </div>
  );
}
