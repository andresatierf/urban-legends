import type { Doc } from "../../../convex/_generated/dataModel";
import { DetailsCard } from "../details-card";
import { UpsertTeamFormButton } from "../form/upsert-team-form-button";

type Props = {
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  score: number;
  enableActions?: boolean;
  className?: string;
};

export function TeamDetailsCard({
  team,
  tournament,
  score,
  enableActions,
  className,
}: Props) {
  if (!team) return null; // TODO: Add skeleton

  const details = [
    { key: "tournament", value: tournament.name },
    { key: "score", value: `${score || 0} pts` },
  ];

  return (
    <DetailsCard title={team.name} details={details} className={className}>
      {enableActions && (
        <UpsertTeamFormButton tournamentId={tournament._id} team={team} />
      )}
    </DetailsCard>
  );
}
