import type {
  EvidenceImage,
  ReviewItem,
  SubmitterEvidence,
} from "@/components/submissions/review/types";

import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../../convex/users";

type State = "pending" | "approved" | "rejected" | "deleted";
type Tier = "base" | "advanced";

type IndividualReviewItem = Extract<ReviewItem, { type: "individual" }>;
type GroupReviewItem = Extract<ReviewItem, { type: "group" }>;

const TEAM_NAMES = [
  "404 shape not found",
  "Urban Divas ✨",
  "Sedentários em Revolução",
  "Booldozers",
  "Legends on Tap",
];

const TOURNAMENT_NAMES = [
  "Urban Legends Tournament 2026",
  "Urban Legends Captains Cup 2026",
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

function evidenceImage(seed: string, idx: number): EvidenceImage {
  return {
    _id: `${seed}-ev-${idx}`,
    url: `https://picsum.photos/seed/${seed}-${idx}/800/600`,
    filename: `evidence-${idx + 1}.jpg`,
  };
}

function makeUser(idx: number): UserWithRoles {
  const name = SUBMITTER_NAMES[idx % SUBMITTER_NAMES.length];
  return {
    _id: `user-${idx}` as Id<"users">,
    _creationTime: 0,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    externalId: `ext-${idx}`,
    imageUrl: `https://picsum.photos/seed/avatar-${idx}/96/96`,
    roles: [],
    roleNames: [],
  };
}

function makeTeam(idx: number): Doc<"teams"> {
  return {
    _id: `team-${idx}` as Id<"teams">,
    _creationTime: 0,
    name: TEAM_NAMES[idx % TEAM_NAMES.length],
    tournamentId: `tour-${idx % TOURNAMENT_NAMES.length}` as Id<"tournaments">,
    createdBy: `user-${idx}` as Id<"users">,
    joinPolicy: "open",
    points: 0,
  };
}

function makeTournament(idx: number): Doc<"tournaments"> {
  return {
    _id: `tour-${idx}` as Id<"tournaments">,
    _creationTime: 0,
    name: TOURNAMENT_NAMES[idx % TOURNAMENT_NAMES.length],
    description: "",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    createdBy: `user-${idx}` as Id<"users">,
    scoringConfig: {
      individualPoints: { base: 10, advanced: 30 },
      teamExercisePoints: { base: 20, advanced: 50 },
      teamExerciseThreshold: 0.5,
    },
  };
}

function pointsFor(state: State, tier: Tier) {
  if (state === "approved") return tier === "advanced" ? 30 : 10;
  return 0;
}

let individualCounter = 0;
function makeIndividual(
  state: State,
  evidenceCount: number,
): IndividualReviewItem {
  const tier: Tier = evidenceCount >= 4 ? "advanced" : "base";
  const idx = individualCounter++;
  const seed = `ind-${idx}`;
  const evidence = Array.from({ length: evidenceCount }, (_, i) =>
    evidenceImage(seed, i),
  );
  const date = new Date(2026, 3, 8 + idx).toISOString();
  const submission: Doc<"submissions"> = {
    _id: `sub-${idx}` as Id<"submissions">,
    _creationTime: 0,
    userId: `user-${idx}` as Id<"users">,
    teamId: `team-${idx}` as Id<"teams">,
    tournamentId: `tour-${idx}` as Id<"tournaments">,
    date,
    submissionType: "individual",
    state,
    createdBy: `user-${idx}` as Id<"users">,
    tier,
    pointsEarned: pointsFor(state, tier),
  };
  return {
    type: "individual",
    data: {
      submission,
      state,
      team: makeTeam(idx),
      tournament: makeTournament(idx),
      submitter: makeUser(idx),
      evidence,
    },
  };
}

let groupCounter = 0;
function makeGroup(state: State, submitterCount: number): GroupReviewItem {
  const tier: Tier = submitterCount >= 4 ? "advanced" : "base";
  const idx = groupCounter++;
  const seed = `grp-${idx}`;
  const submitters = Array.from({ length: submitterCount }, (_, i) =>
    makeUser(idx * 5 + i + 20),
  );
  const submitterEvidence: SubmitterEvidence[] = submitters.map((user, i) => {
    const perSubmitter = ((idx + i) % 3) + 2;
    return {
      userId: user._id,
      submitterName: user.name,
      submitterImageUrl: user.imageUrl,
      evidence: Array.from({ length: perSubmitter }, (_, j) =>
        evidenceImage(`${seed}-s${i}`, j),
      ),
    };
  });
  const totalTeamMembers = Math.max(submitterCount + 1, 6);
  const participationRate = submitterCount / totalTeamMembers;
  const date = new Date(2026, 3, 12 + idx).toISOString();
  const group: Doc<"submissionGroups"> = {
    _id: `group-${idx}` as Id<"submissionGroups">,
    _creationTime: 0,
    teamId: `team-${idx}` as Id<"teams">,
    tournamentId: `tour-${idx}` as Id<"tournaments">,
    date,
    state,
    tier,
    participantCount: submitterCount,
    totalTeamMembers,
    participationRate,
    isTeamExercise: participationRate >= 0.5,
    pointsEarned: pointsFor(state, tier),
    createdAt: date,
    updatedAt: date,
  };
  return {
    type: "group",
    data: {
      group,
      state,
      team: makeTeam(idx),
      tournament: makeTournament(idx),
      submissions: [],
      submitters,
      submitterEvidence,
    },
  };
}

const STATES: State[] = ["pending", "approved", "rejected", "deleted"];
const COUNTS = [1, 2, 3, 4, 5];

export const DEMO_INDIVIDUAL_ITEMS: IndividualReviewItem[] = STATES.flatMap(
  (state) => COUNTS.map((count) => makeIndividual(state, count)),
);

export const DEMO_GROUP_ITEMS: GroupReviewItem[] = STATES.flatMap((state) =>
  COUNTS.map((count) => makeGroup(state, count)),
);
