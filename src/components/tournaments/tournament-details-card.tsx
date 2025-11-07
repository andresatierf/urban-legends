import Link from "next/link";
import { DetailsCard } from "@/components/details-card";
import { Button } from "@/components/ui/button";
import type { Doc } from "../../../convex/_generated/dataModel";

type Props = {
  tournament: Doc<"tournaments">;
  teams: Doc<"teams">[];
  enableActions?: boolean;
  className?: string;
};

export function TournamentDetailsCard({
  tournament,
  teams,
  enableActions,
  className,
}: Props) {
  if (!tournament) return null; // TODO: Add skeleton

  const details = [
    { key: "startDate", value: tournament.startDate },
    { key: "endDate", value: tournament.endDate },
    { key: "Teams", value: `${teams?.length ?? "0"}` },
  ];

  return (
    <DetailsCard
      title={tournament.name}
      description={tournament.description}
      details={details}
      className={className}
    >
      {enableActions && (
        <Button variant="outline" asChild>
          <Link href={`/tournaments/${tournament._id}/edit`}>
            Edit Tournament
          </Link>
        </Button>
      )}
    </DetailsCard>
  );
}
