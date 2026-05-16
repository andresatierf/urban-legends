import { Podium } from "@/components/dashboard/podium";
import { SectionHeader } from "@/components/section-header";

type Team = { team: { name: string; points: number }; userRole: string };

const TEAMS_FULL: Team[] = [
  { team: { name: "Urban Divas ✨", points: 780 }, userRole: "captain" },
  { team: { name: "Booldozers", points: 620 }, userRole: "member" },
  { team: { name: "404 Shape Not Found", points: 540 }, userRole: "member" },
];

export function PodiumSpecimens() {
  return (
    <section className="space-y-12">
      <SectionHeader
        as="h1"
        title="Podium"
        description="Dashboard podium across fill states. The component renders whatever teams are present; missing places collapse."
      />

      <Specimen label="3 teams (full podium)" teams={TEAMS_FULL} />
      <Specimen label="2 teams" teams={TEAMS_FULL.slice(0, 2)} />
      <Specimen label="1 team" teams={TEAMS_FULL.slice(0, 1)} />
      <Specimen label="0 teams (empty)" teams={[]} />
    </section>
  );
}

function Specimen({ label, teams }: { label: string; teams: Team[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground text-label-caps">{label}</h3>
      <div className="bg-paper rounded-lg p-6">
        <Podium teams={teams} />
      </div>
    </div>
  );
}
