import { SectionHeader } from "@/components/section-header";
import { JoinTeamCard } from "@/components/teams/join-team-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";

export function JoinTeamCardSpecimens() {
  return (
    <section className="space-y-10">
      <SectionHeader
        as="h1"
        title="JoinTeamCard"
        description="Empty-state card prompting team creation. Copy varies by whether a tournament is scoped and whether it would be the user's first team."
      />

      <Specimen
        label="Tournament-scoped (no teams yet) — static preview"
        description="Rendered inside a tournament detail page before any teams exist. Shown as a static preview because the live form queries Convex with a real tournament ID."
      >
        <Card>
          <CardContent>
            <Empty className="gap-3 py-2!">
              <EmptyHeader>No teams yet</EmptyHeader>
              <EmptyDescription>
                Be the first to create a team for this tournament!
              </EmptyDescription>
              <EmptyContent>
                <Button disabled>Create team</Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </Specimen>

      <Specimen
        label="Global · first team"
        description="Rendered on the teams hub when the user has no teams at all."
      >
        <JoinTeamCard first />
      </Specimen>

      <Specimen
        label="Global · alongside list"
        description="Rendered on the teams hub when other teams already exist."
      >
        <JoinTeamCard />
      </Specimen>
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
