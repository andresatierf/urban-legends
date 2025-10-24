import { DetailsCard } from "../details-card";
import type { ButtonProps } from "../ui/button";

type Props = {
  team: any;
  tournament: any;
  enableActions?: boolean;
  className?: string;
};

export function TeamDetailsCard({
  team,
  tournament,
  enableActions,
  className,
}: Props) {
  if (!team) return null; // TODO: Add skeleton

  const details = [
    { key: "tournament", value: tournament.name },
    { key: "score", value: `${team.score || 0} pts` },
  ];
  const actions: ButtonProps[] = [
    { children: "Edit" },
    { children: "Delete", variant: "destructive" },
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
