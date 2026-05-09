export type DemoSubmissionState =
  | "pending"
  | "approved"
  | "rejected"
  | "deleted";

export type DemoSubmissionTier = "base" | "advanced";

export type DemoEvidence = {
  id: string;
  url: string;
  filename: string;
};

export type DemoSubmitter = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type DemoTeam = { id: string; name: string };
export type DemoTournament = { id: string; name: string };

export type DemoIndividualSubmission = {
  id: string;
  type: "individual";
  state: DemoSubmissionState;
  tier: DemoSubmissionTier;
  pointsEarned: number;
  date: string;
  team: DemoTeam;
  tournament: DemoTournament;
  submitter: DemoSubmitter;
  evidence: DemoEvidence[];
};

export type DemoSubmitterEvidence = {
  submitter: DemoSubmitter;
  evidence: DemoEvidence[];
};

export type DemoGroupSubmission = {
  id: string;
  type: "group";
  state: DemoSubmissionState;
  tier: DemoSubmissionTier;
  pointsEarned: number;
  date: string;
  team: DemoTeam;
  tournament: DemoTournament;
  participantCount: number;
  totalTeamMembers: number;
  submitterEvidence: DemoSubmitterEvidence[];
};

export type DemoCardItem = DemoIndividualSubmission | DemoGroupSubmission;

const TEAMS: DemoTeam[] = [
  { id: "team-1", name: "404 shape not found" },
  { id: "team-2", name: "Urban Divas ✨" },
  { id: "team-3", name: "Sedentários em Revolução" },
  { id: "team-4", name: "Booldozers" },
  { id: "team-5", name: "Legends on Tap" },
];

const TOURNAMENTS: DemoTournament[] = [
  { id: "tour-1", name: "Urban Legends Tournament 2026" },
  { id: "tour-2", name: "Urban Legends Captains Cup 2026" },
];

const SUBMITTER_NAMES = [
  "Joana Machado",
  "Carlos Galvão",
  "Laura Costa",
  "Carol Reis",
  "Catarina Maltez",
  "Tiago Campos",
  "Mariana Guerreiro",
  "Daniela Almeida",
  "João Barata",
  "Rodrigo Ferreira",
  "Francisca Pires",
  "Alexandre Lima",
  "Pedro Correia",
  "Luís Machado",
  "Diogo Baptista",
];

function evidenceImage(seed: string, idx: number): DemoEvidence {
  return {
    id: `${seed}-ev-${idx}`,
    url: `https://picsum.photos/seed/${seed}-${idx}/800/600`,
    filename: `evidence-${idx + 1}.jpg`,
  };
}

function submitter(idx: number): DemoSubmitter {
  const name = SUBMITTER_NAMES[idx % SUBMITTER_NAMES.length];
  return {
    id: `sub-${idx}`,
    name,
    avatarUrl: `https://picsum.photos/seed/avatar-${idx}/96/96`,
  };
}

function pointsFor(state: DemoSubmissionState, tier: DemoSubmissionTier) {
  if (state === "approved") return tier === "advanced" ? 30 : 10;
  return 0;
}

type EvidenceCount = 1 | 2 | 3 | 4 | 5;
type SubmitterCount = 1 | 2 | 3 | 4 | 5;

let individualCounter = 0;
function makeIndividual(
  state: DemoSubmissionState,
  evidenceCount: EvidenceCount,
): DemoIndividualSubmission {
  const tier: DemoSubmissionTier = evidenceCount >= 4 ? "advanced" : "base";
  const idx = individualCounter++;
  const team = TEAMS[idx % TEAMS.length];
  const tournament = TOURNAMENTS[idx % TOURNAMENTS.length];
  const sub = submitter(idx);
  const seed = `ind-${idx}`;
  const evidence = Array.from({ length: evidenceCount }, (_, i) =>
    evidenceImage(seed, i),
  );
  const date = new Date(2026, 3, 8 + idx).toISOString();
  return {
    id: `individual-${state}-${evidenceCount}`,
    type: "individual",
    state,
    tier,
    pointsEarned: pointsFor(state, tier),
    date,
    team,
    tournament,
    submitter: sub,
    evidence,
  };
}

let groupCounter = 0;
function makeGroup(
  state: DemoSubmissionState,
  submitterCount: SubmitterCount,
): DemoGroupSubmission {
  const tier: DemoSubmissionTier = submitterCount >= 4 ? "advanced" : "base";
  const idx = groupCounter++;
  const team = TEAMS[idx % TEAMS.length];
  const tournament = TOURNAMENTS[idx % TOURNAMENTS.length];
  const seed = `grp-${idx}`;
  const submitterEvidence: DemoSubmitterEvidence[] = Array.from(
    { length: submitterCount },
    (_, i) => {
      const perSubmitter = ((idx + i) % 3) + 2;
      return {
        submitter: submitter(idx * 3 + i + 20),
        evidence: Array.from({ length: perSubmitter }, (_, j) =>
          evidenceImage(`${seed}-s${i}`, j),
        ),
      };
    },
  );
  const totalTeamMembers = Math.max(submitterCount + 1, 6);
  const date = new Date(2026, 3, 12 + idx).toISOString();
  return {
    id: `group-${state}-${submitterCount}`,
    type: "group",
    state,
    tier,
    pointsEarned: pointsFor(state, tier),
    date,
    team,
    tournament,
    participantCount: submitterCount,
    totalTeamMembers,
    submitterEvidence,
  };
}

const STATES: DemoSubmissionState[] = [
  "pending",
  "approved",
  "rejected",
  "deleted",
];

const EVIDENCE_COUNTS: EvidenceCount[] = [1, 2, 3, 4, 5];
const SUBMITTER_COUNTS: SubmitterCount[] = [1, 2, 3, 4, 5];

export const DEMO_INDIVIDUAL_SUBMISSIONS: DemoIndividualSubmission[] =
  STATES.flatMap((state) =>
    EVIDENCE_COUNTS.map((count) => makeIndividual(state, count)),
  );

export const DEMO_GROUP_SUBMISSIONS: DemoGroupSubmission[] = STATES.flatMap(
  (state) => SUBMITTER_COUNTS.map((count) => makeGroup(state, count)),
);

export const DEMO_CARD_ITEMS: DemoCardItem[] = [
  ...DEMO_INDIVIDUAL_SUBMISSIONS,
  ...DEMO_GROUP_SUBMISSIONS,
];
