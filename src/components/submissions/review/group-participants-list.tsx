"use client";

import { Check, X } from "lucide-react";

import type { UserWithRoles } from "@/../convex/users";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

import type { SubmitterEvidence } from "./types";

interface GroupParticipantsListProps {
  submitters: UserWithRoles[];
  participantCount: number;
  totalMembers: number;
  isTeamExercise: boolean;
  participationRate: number;
  submitterEvidence?: SubmitterEvidence[];
}

/**
 * Display participants in a team activity group with visual indicators
 * Shows participation count, team exercise qualification status, and per-submitter Evidence thumbnails
 */
export function GroupParticipantsList({
  submitters,
  participantCount,
  totalMembers,
  isTeamExercise,
  participationRate,
  submitterEvidence,
}: GroupParticipantsListProps) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium">
        Participants ({participantCount}/{totalMembers}):
      </p>

      <div className="space-y-1.5">
        {submitters.map((s) => {
          const se = submitterEvidence?.find((e) => e.userId === s._id);
          return (
            <div key={s._id} className="flex items-center gap-2">
              <span>{s.name}</span>
              {se && se.evidence.length > 0 && (
                <>
                  <span className="text-muted-foreground text-xs">
                    ({se.evidence.length}{" "}
                    {se.evidence.length === 1 ? "photo" : "photos"})
                  </span>
                  <div className="flex gap-1">
                    {se.evidence.slice(0, 3).map((img, idx) => (
                      <div
                        key={img._id}
                        className="relative h-8 w-8 overflow-hidden rounded"
                      >
                        <Image
                          src={img.url}
                          alt={img.filename ?? `Evidence ${idx + 1}`}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                    {se.evidence.length > 3 && (
                      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded text-xs font-medium">
                        +{se.evidence.length - 3}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

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
