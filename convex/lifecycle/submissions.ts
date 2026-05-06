export type ScoringConfig = {
  individualPoints: { base: number; advanced: number };
  teamExercisePoints: { base: number; advanced: number };
  teamExerciseThreshold: number;
};

export function score(
  scoringConfig: ScoringConfig,
  tier: "base" | "advanced",
  isTeamExercise: boolean,
): number {
  return isTeamExercise
    ? scoringConfig.teamExercisePoints[tier]
    : scoringConfig.individualPoints[tier];
}

export function previewIsTeamExercise({
  participantCount,
  totalTeamMembers,
  threshold,
}: {
  participantCount: number;
  totalTeamMembers: number;
  threshold: number;
}): boolean {
  if (totalTeamMembers === 0) return false;
  return participantCount / totalTeamMembers >= threshold;
}
