import type { Doc, Id } from "../../convex/_generated/dataModel";

type ViewerContext = "outsider" | "member" | "captain";

type MemberPreview = {
  _id: string;
  name: string;
  memberRole: "captain" | "member";
};

export type TeamDemoItem = {
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  members: MemberPreview[];
  memberCount: number;
  viewerContext: ViewerContext;
  isUserMember: boolean;
  isUserInTeam: boolean;
  userRole: "captain" | "member" | null;
  label: string;
};

const now = new Date();
const dayMs = 86_400_000;

function dateStr(offset: number): string {
  return new Date(now.getTime() + offset * dayMs).toISOString().slice(0, 10);
}

const MEMBER_NAMES = [
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
];

const TEAM_NAMES = [
  "Urban Divas ✨",
  "Booldozers",
  "Sedentários em Revolução",
  "404 Shape Not Found",
  "Legends on Tap",
  "Step Monsters",
  "Walk of Shame",
  "Cardio Criminals",
  "Pavement Pounders",
];

const TOURNAMENT_NAMES = [
  "Urban Legends 2026",
  "Captains Cup Spring",
  "Summer City Challenge",
];

function makeMembers(
  teamIdx: number,
  count: number,
  captainIdx: number,
): MemberPreview[] {
  return Array.from({ length: count }, (_, i) => {
    const nameIdx = (teamIdx * 3 + i) % MEMBER_NAMES.length;
    return {
      _id: `member-${teamIdx}-${i}`,
      name: MEMBER_NAMES[nameIdx],
      memberRole: i === captainIdx ? ("captain" as const) : ("member" as const),
    };
  });
}

function makeTeam(
  idx: number,
  joinPolicy: "open" | "closed",
  maxMembers: number | undefined,
  points: number,
  tournamentId: string,
): Doc<"teams"> {
  return {
    _id: `demo-team-${idx}` as Id<"teams">,
    _creationTime: 0,
    name: TEAM_NAMES[idx % TEAM_NAMES.length],
    tournamentId: tournamentId as Id<"tournaments">,
    createdBy: "user-0" as Id<"users">,
    joinPolicy,
    maxMembers,
    points,
  };
}

function makeTournament(idx: number): Doc<"tournaments"> {
  const offsets = [
    { start: -30, end: 30 },
    { start: 14, end: 75 },
    { start: -90, end: -10 },
  ];
  const o = offsets[idx % offsets.length];
  return {
    _id: `demo-tour-${idx}` as Id<"tournaments">,
    _creationTime: 0,
    name: TOURNAMENT_NAMES[idx % TOURNAMENT_NAMES.length],
    description: "A challenging urban fitness tournament.",
    startDate: dateStr(o.start),
    endDate: dateStr(o.end),
    createdBy: "user-0" as Id<"users">,
    scoringConfig: {
      individualPoints: { base: 10, advanced: 30 },
      teamExercisePoints: { base: 20, advanced: 50 },
      teamExerciseThreshold: 0.5,
    },
  };
}

const VIEWER_LABELS: Record<ViewerContext, string> = {
  outsider: "Outsider",
  member: "Member",
  captain: "Captain",
};

type MatrixEntry = {
  joinPolicy: "open" | "closed";
  maxMembers: number | undefined;
  memberCount: number;
  points: number;
  viewerContext: ViewerContext;
  tournamentIdx: number;
};

const MATRIX: MatrixEntry[] = [
  {
    joinPolicy: "open",
    maxMembers: 8,
    memberCount: 5,
    points: 320,
    viewerContext: "outsider",
    tournamentIdx: 0,
  },
  {
    joinPolicy: "open",
    maxMembers: 6,
    memberCount: 4,
    points: 185,
    viewerContext: "member",
    tournamentIdx: 0,
  },
  {
    joinPolicy: "open",
    maxMembers: 8,
    memberCount: 7,
    points: 540,
    viewerContext: "captain",
    tournamentIdx: 0,
  },
  {
    joinPolicy: "closed",
    maxMembers: 6,
    memberCount: 3,
    points: 95,
    viewerContext: "outsider",
    tournamentIdx: 1,
  },
  {
    joinPolicy: "closed",
    maxMembers: 10,
    memberCount: 6,
    points: 410,
    viewerContext: "member",
    tournamentIdx: 1,
  },
  {
    joinPolicy: "closed",
    maxMembers: 5,
    memberCount: 5,
    points: 275,
    viewerContext: "captain",
    tournamentIdx: 1,
  },
  {
    joinPolicy: "open",
    maxMembers: 4,
    memberCount: 4,
    points: 620,
    viewerContext: "outsider",
    tournamentIdx: 2,
  },
  {
    joinPolicy: "open",
    maxMembers: 6,
    memberCount: 6,
    points: 390,
    viewerContext: "member",
    tournamentIdx: 2,
  },
  {
    joinPolicy: "closed",
    maxMembers: 8,
    memberCount: 8,
    points: 780,
    viewerContext: "captain",
    tournamentIdx: 2,
  },
];

function capacityLabel(
  maxMembers: number | undefined,
  memberCount: number,
): string {
  if (!maxMembers) return "No cap";
  if (memberCount >= maxMembers) return "Full";
  return `${memberCount}/${maxMembers}`;
}

function policyLabel(joinPolicy: "open" | "closed"): string {
  return joinPolicy === "open" ? "Open" : "Closed";
}

export const DEMO_TEAM_ITEMS: TeamDemoItem[] = MATRIX.map((entry, idx) => {
  const tournament = makeTournament(entry.tournamentIdx);
  const team = makeTeam(
    idx,
    entry.joinPolicy,
    entry.maxMembers,
    entry.points,
    tournament._id,
  );
  const members = makeMembers(idx, entry.memberCount, 0);

  const isUserMember = entry.viewerContext !== "outsider";
  const isUserInTeam = isUserMember;
  const userRole =
    entry.viewerContext === "captain"
      ? ("captain" as const)
      : entry.viewerContext === "member"
        ? ("member" as const)
        : null;

  const label = `${policyLabel(entry.joinPolicy)} · ${capacityLabel(entry.maxMembers, entry.memberCount)} · ${VIEWER_LABELS[entry.viewerContext]}`;

  return {
    team,
    tournament,
    members,
    memberCount: entry.memberCount,
    viewerContext: entry.viewerContext,
    isUserMember,
    isUserInTeam,
    userRole,
    label,
  };
});
