import { DetailsCard, type DetailsCardAction } from "../details-card";

type Props = {
  team: any;
  enableActions?: boolean;
  className?: string;
};

export function TeamDetailsCard({ team, enableActions, className }: Props) {
  if (!team) return null; // TODO: Add skeleton

  const details = [
    { key: "tournament", value: team.tournament.name },
    { key: "score", value: `${team.score || 0} pts` },
  ];
  const actions: DetailsCardAction[] = [
    { text: "Edit" },
    { text: "Delete", buttonProps: { variant: "destructive" } },
  ];

  return (
    <DetailsCard
      title={team.name}
      details={details}
      actions={enableActions ? actions : []}
      className={className}
    />
  );
}
