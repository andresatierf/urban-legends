import { SectionHeader } from "@/components/section-header";
import { JoinTeamButton } from "@/components/teams/card/join-team-button";
import { JoinTeamCard } from "@/components/teams/join-team-card";
import { Button } from "@/components/ui/button";

import {
  JOIN_BUTTON_FIXTURES,
  JOIN_BUTTON_STATE_DESCRIPTIONS,
  JOIN_BUTTON_STATE_LABELS,
  JOIN_BUTTON_STATES,
  JOIN_TEAM_CARD_VARIANTS,
} from "./fixtures";

const noop = async () => {};

export function JoinTeamCardSection() {
  return (
    <section className="space-y-12">
      <SectionHeader
        as="h1"
        title="JoinTeamCard"
        description="The empty-state team-creation card plus the join-team action button across its meaningful viewer states."
      />

      <div className="space-y-6">
        <h2 className="text-label-caps text-muted-foreground">
          Empty-state card
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {JOIN_TEAM_CARD_VARIANTS.map((variant) => (
            <Specimen
              key={variant.id}
              label={variant.label}
              description={variant.description}
            >
              <JoinTeamCard
                {...variant.props}
                action={<Button disabled>Create team</Button>}
              />
            </Specimen>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-label-caps text-muted-foreground">
          Join action states
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {JOIN_BUTTON_STATES.map((state) => {
            const fixture = JOIN_BUTTON_FIXTURES[state];
            return (
              <Specimen
                key={state}
                label={JOIN_BUTTON_STATE_LABELS[state]}
                description={JOIN_BUTTON_STATE_DESCRIPTIONS[state]}
              >
                <div className="flex min-h-9 items-center gap-2">
                  <JoinTeamButton
                    data={fixture.data}
                    joinRequest={fixture.joinRequest}
                    onRequestJoin={noop}
                    onCancelRequest={() => {}}
                  />
                  {state === "member" && (
                    <span className="text-muted-foreground text-xs italic">
                      (no action rendered)
                    </span>
                  )}
                </div>
              </Specimen>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Specimen({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-label-caps text-muted-foreground">{label}</h3>
      <p className="text-muted-foreground text-xs">{description}</p>
      <div className="bg-paper rounded-lg p-6">{children}</div>
    </div>
  );
}
