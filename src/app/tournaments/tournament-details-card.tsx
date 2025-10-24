import { DetailsCard } from "@/components/details-card";
import type { ButtonProps } from "@/components/ui/button";

type Props = {
  tournament: any;
  enableActions?: boolean;
  className?: string;
};

export function TournamentDetailsCard({
  tournament,
  enableActions,
  className,
}: Props) {
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
  const actions: ButtonProps[] = [
    {
      children: "Edit Tournament",
      onClick: () => {},
    },
    {
      children: "Manage Teams",
      variant: "secondary",
      onClick: () => {},
    },
  ];

  return (
    <DetailsCard
      title={tournament.name}
      description={tournament.description}
      details={details}
      actions={enableActions ? actions : []}
      className={className}
    />
  );
}
