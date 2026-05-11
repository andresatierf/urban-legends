import { SubmissionSection } from "./submission-section";
import { TeamSection } from "./team-section";
import { TournamentSection } from "./tournament-section";

export function CardDemo() {
  return (
    <div className="space-y-16">
      <TournamentSection />
      <TeamSection />
      <SubmissionSection />
    </div>
  );
}
