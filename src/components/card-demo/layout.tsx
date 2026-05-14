import { CardVariantsSection } from "./card-variants-section";
import { SubmissionSection } from "./submission-section";
import { SurfacesSection } from "./surfaces-section";
import { TeamSection } from "./team-section";
import { TournamentSection } from "./tournament-section";

export function CardDemo() {
  return (
    <div className="space-y-16">
      <CardVariantsSection />
      <SurfacesSection />
      <TournamentSection />
      <TeamSection />
      <SubmissionSection />
    </div>
  );
}
