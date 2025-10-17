import { DetailsCard, type DetailsCardAction } from "../details-card";

type Props = {
  tournament: any;
  className?: string;
};

export function TournamentDetailsCard({ tournament, className }: Props) {
  if (!tournament) return null; // TODO: Add skeleton

  const details = [
    { key: "startDate", value: tournament.startDate },
    { key: "endDate", value: tournament.endDate },
    {
      key: "participants",
      value: tournament?.users?.length
        ? tournament?.users?.join(", ")
        : "No users assigned",
    },
  ];
  const actions: DetailsCardAction[] = [
    {
      text: "Edit Tournament",
      buttonProps: {
        onClick: () => {},
      },
    },
    {
      text: "Manage Teams",
      buttonProps: {
        variant: "secondary",
        onClick: () => {},
      },
    },
  ];

  return (
    <DetailsCard
      title={tournament.name}
      description={tournament.description}
      details={details}
      actions={actions}
      className={className}
    />
  );
}
