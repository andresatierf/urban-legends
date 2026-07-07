import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ExternalLink, Target } from "lucide-react";
import { useState } from "react";

import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { StatsGrid } from "@/components/common/card/stats-grid";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { UpsertChallengeFormDialog } from "./form";

type ChallengeWithRoster = FunctionReturnType<
  typeof api.views.challenges.listByTournament
>[number];

type Props = {
  tournamentId: Id<"tournaments">;
};

export function ChallengesSection({ tournamentId }: Props) {
  const challenges = useQuery(api.views.challenges.listByTournament, {
    tournamentId,
  });
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <SectionHeader as="h2" title="Challenges" Icon={Target}>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Create Challenge
        </Button>
      </SectionHeader>

      <UpsertChallengeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        tournamentId={tournamentId}
      />

      <ChallengeListBody challenges={challenges} />
    </>
  );
}

function ChallengeListBody({
  challenges,
}: {
  challenges: ChallengeWithRoster[] | undefined;
}) {
  if (challenges === undefined) {
    return <p className="text-body-md text-muted-foreground">Loading…</p>;
  }
  if (challenges.length === 0) {
    return (
      <p className="text-body-md text-muted-foreground">
        No challenges yet. Create one to award tournament-wide points.
      </p>
    );
  }
  return (
    <div className="grid gap-x-3 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
      {challenges.map((challenge) => (
        <ChallengeCard key={challenge._id} challenge={challenge} />
      ))}
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: ChallengeWithRoster }) {
  const isPending = challenge.state === "pending";
  return (
    <EdgeOverlay
      bottomRight={
        <Button size="sm" asChild className="shadow-sm">
          <Link
            to="/challenges/$challengeId"
            params={{ challengeId: challenge._id }}
          >
            <ExternalLink className="size-3.5" />
            Details
          </Link>
        </Button>
      }
    >
      <ComposedCard
        className="pb-2"
        title={challenge.description}
        badge={{
          variant: isPending ? "info" : "success",
          children: challenge.state,
        }}
      >
        <StatsGrid
          className="grid-cols-4"
          variant="strip"
          items={[
            { label: "Individual", value: challenge.individualAmount },
            { label: "Team", value: challenge.teamAmount },
            {
              label: "Threshold",
              value: `${Math.round(challenge.threshold * 100)}%`,
            },
            { label: "Roster", value: challenge.roster.length },
          ]}
        />
      </ComposedCard>
    </EdgeOverlay>
  );
}
