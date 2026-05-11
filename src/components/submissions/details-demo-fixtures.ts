import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../convex/users";
import type { SubmissionDetailsData } from "./details/types";

export type { SubmissionDetailsData };

function makeUser(idx: number, name: string, email: string): UserWithRoles {
  return {
    _id: `user-${idx}` as Id<"users">,
    _creationTime: Date.now(),
    name,
    email,
    externalId: `ext-${idx}`,
    imageUrl: `https://picsum.photos/seed/avatar-${idx}/96/96`,
    roles: [],
    roleNames: [],
  };
}

function makeAdminUser(
  idx: number,
  name: string,
  email: string,
): UserWithRoles {
  return {
    ...makeUser(idx, name, email),
    roleNames: ["admin"],
  };
}

function makeEvidence(
  seed: string,
  count: number,
): Array<{ _id: string; url: string; filename?: string }> {
  return Array.from({ length: count }, (_, i) => ({
    _id: `${seed}-ev-${i}`,
    url: `https://picsum.photos/seed/${seed}-${i}/800/600`,
    filename: `evidence-${i + 1}.jpg`,
  }));
}

const SUBMITTER = makeUser(1, "Joana Machado", "joana.machado@example.com");
const REVIEWER = makeAdminUser(
  10,
  "Carlos Galvão",
  "carlos.galvao@example.com",
);

const TEAMMATES = [
  makeUser(2, "Laura Costa", "laura.costa@example.com"),
  makeUser(3, "Tiago Campos", "tiago.campos@example.com"),
  makeUser(4, "Mariana Guerreiro", "mariana.guerreiro@example.com"),
  makeUser(5, "Daniela Almeida", "daniela.almeida@example.com"),
];

const TEAM: Doc<"teams"> = {
  _id: "team-1" as Id<"teams">,
  _creationTime: Date.now(),
  name: "Urban Divas ✨",
  tournamentId: "tour-1" as Id<"tournaments">,
  createdBy: "user-1" as Id<"users">,
  joinPolicy: "open",
  points: 420,
};

const TOURNAMENT: Doc<"tournaments"> = {
  _id: "tour-1" as Id<"tournaments">,
  _creationTime: Date.now(),
  name: "Urban Legends Tournament 2026",
  description: "The main Urban Legends tournament for 2026.",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  createdBy: "user-10" as Id<"users">,
  scoringConfig: {
    individualPoints: { base: 10, advanced: 30 },
    teamExercisePoints: { base: 20, advanced: 50 },
    teamExerciseThreshold: 0.5,
  },
};

function makeSubmission(
  overrides: Partial<Doc<"submissions">> & {
    state: Doc<"submissions">["state"];
    submissionType: Doc<"submissions">["submissionType"];
  },
): Doc<"submissions"> {
  const {
    state,
    submissionType,
    tier = "base",
    pointsEarned = 0,
    ...rest
  } = overrides;
  return {
    _id: `sub-${state}-${submissionType}` as Id<"submissions">,
    _creationTime: Date.now(),
    userId: "user-1" as Id<"users">,
    teamId: "team-1" as Id<"teams">,
    tournamentId: "tour-1" as Id<"tournaments">,
    date: "2026-05-08",
    description:
      "Morning run through the park — 5km loop around the botanical gardens with sprint intervals. Felt great pushing through the last two laps!",
    createdBy: "user-1" as Id<"users">,
    submissionType,
    state,
    tier,
    pointsEarned,
    ...rest,
  };
}

// ── Scenario 1: Pending individual submission (owner view) ──
export const PENDING_INDIVIDUAL: SubmissionDetailsData = {
  submission: makeSubmission({
    state: "pending",
    submissionType: "individual",
    tier: "base",
    pointsEarned: 0,
  }),
  team: TEAM,
  tournament: TOURNAMENT,
  submitter: SUBMITTER,
  teammates: [],
  managedByUser: null,
  isTeamExercise: false,
  evidence: makeEvidence("pend-ind", 3),
  canEdit: true,
  canApprove: false,
  canReject: false,
  canDelete: true,
};

// ── Scenario 2: Approved team submission (reviewer view) ──
export const APPROVED_TEAM: SubmissionDetailsData = {
  submission: makeSubmission({
    _id: "sub-approved-team" as Id<"submissions">,
    state: "approved",
    submissionType: "team",
    tier: "advanced",
    pointsEarned: 50,
    managedBy: "user-10" as Id<"users">,
    submissionGroupId: "group-1" as Id<"submissionGroups">,
    description:
      "Team workout session — everyone showed up for the HIIT circuit at the outdoor gym. 4 rounds of burpees, box jumps, and battle ropes.",
  }),
  team: TEAM,
  tournament: TOURNAMENT,
  submitter: SUBMITTER,
  teammates: TEAMMATES,
  managedByUser: REVIEWER,
  isTeamExercise: true,
  evidence: makeEvidence("appr-team", 5),
  canEdit: false,
  canApprove: false,
  canReject: false,
  canDelete: true,
};

// ── Scenario 3: Rejected individual submission (owner can resubmit) ──
export const REJECTED_INDIVIDUAL: SubmissionDetailsData = {
  submission: makeSubmission({
    _id: "sub-rejected-ind" as Id<"submissions">,
    state: "rejected",
    submissionType: "individual",
    tier: "base",
    pointsEarned: 0,
    managedBy: "user-10" as Id<"users">,
    description: "Quick yoga session at home — 20 min flow.",
  }),
  team: TEAM,
  tournament: TOURNAMENT,
  submitter: SUBMITTER,
  teammates: [],
  managedByUser: REVIEWER,
  isTeamExercise: false,
  evidence: makeEvidence("rej-ind", 1),
  canEdit: true,
  canApprove: false,
  canReject: false,
  canDelete: true,
};

// ── Scenario 4: Pending team submission (reviewer view — can approve/reject) ──
export const PENDING_TEAM_REVIEWER: SubmissionDetailsData = {
  submission: makeSubmission({
    _id: "sub-pending-team-rev" as Id<"submissions">,
    state: "pending",
    submissionType: "team",
    tier: "advanced",
    pointsEarned: 0,
    submissionGroupId: "group-2" as Id<"submissionGroups">,
    description:
      "Group cycling along the riverfront — 15km round trip with the full team. Stopped for stretches at the halfway point.",
  }),
  team: TEAM,
  tournament: TOURNAMENT,
  submitter: SUBMITTER,
  teammates: TEAMMATES.slice(0, 3),
  managedByUser: null,
  isTeamExercise: true,
  evidence: makeEvidence("pend-team-rev", 4),
  canEdit: false,
  canApprove: true,
  canReject: true,
  canDelete: true,
};

// ── Scenario 5: Deleted submission ──
export const DELETED_INDIVIDUAL: SubmissionDetailsData = {
  submission: makeSubmission({
    _id: "sub-deleted-ind" as Id<"submissions">,
    state: "deleted",
    submissionType: "individual",
    tier: "base",
    pointsEarned: 0,
    managedBy: "user-10" as Id<"users">,
    description: "Deleted submission for testing.",
  }),
  team: TEAM,
  tournament: TOURNAMENT,
  submitter: SUBMITTER,
  teammates: [],
  managedByUser: REVIEWER,
  isTeamExercise: false,
  evidence: [],
  canEdit: false,
  canApprove: false,
  canReject: false,
  canDelete: false,
};

export const ALL_SCENARIOS: Array<{
  label: string;
  data: SubmissionDetailsData;
}> = [
  { label: "Pending Individual (Owner)", data: PENDING_INDIVIDUAL },
  { label: "Approved Team (Reviewer)", data: APPROVED_TEAM },
  { label: "Rejected Individual (Resubmit)", data: REJECTED_INDIVIDUAL },
  { label: "Pending Team (Reviewer)", data: PENDING_TEAM_REVIEWER },
  { label: "Deleted Individual", data: DELETED_INDIVIDUAL },
];
