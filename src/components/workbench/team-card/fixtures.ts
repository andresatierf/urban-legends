import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export type ViewerContext = "outsider" | "member" | "captain";
export type TeamState = "open" | "closed" | "full";

export const TEAM_STATES: readonly TeamState[] = [
  "open",
  "closed",
  "full",
] as const;

export const VIEWER_CONTEXTS: readonly ViewerContext[] = [
  "outsider",
  "member",
  "captain",
] as const;

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
  state: TeamState;
  isUserMember: boolean;
  userRole: "captain" | "member" | null;
  rank: number;
  totalTeams: number;
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

function buildRecentActivity(
  activity: DayPattern[],
): NonNullable<Doc<"teams">["recentActivity"]> {
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const days = activity.map((day, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (activity.length - 1 - i));
    return { ...day, date: d.toISOString().slice(0, 10) };
  });
  return { updatedAt: now.toISOString(), days };
}

function makeTeam(
  idx: number,
  joinPolicy: "open" | "closed",
  maxMembers: number | undefined,
  points: number,
  tournamentId: string,
  activity: DayPattern[],
): Doc<"teams"> {
  const recentActivity = buildRecentActivity(activity);
  const lastActiveDay = [...recentActivity.days]
    .reverse()
    .find((d) => d.approved + d.pending > 0);
  return {
    _id: `demo-team-${idx}` as Id<"teams">,
    _creationTime: 0,
    name: TEAM_NAMES[idx % TEAM_NAMES.length],
    tournamentId: tournamentId as Id<"tournaments">,
    createdBy: "user-0" as Id<"users">,
    joinPolicy,
    maxMembers,
    points,
    lastActivityAt: lastActiveDay?.date,
    recentActivity,
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

type DayPattern = {
  approved: number;
  pending: number;
  rejected: number;
  points?: number;
};

type MatrixEntry = {
  state: TeamState;
  joinPolicy: "open" | "closed";
  maxMembers: number | undefined;
  memberCount: number;
  points: number;
  viewerContext: ViewerContext;
  tournamentIdx: number;
  rank: number;
  totalTeams: number;
  /** 7 entries, oldest → newest (today is last). */
  activity: DayPattern[];
};

// Activity profiles convey distinct momentum stories at a glance.
const PROFILES = {
  // 5-day active streak ending today, steady accrual.
  hotStreak: [
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 2, pending: 0, rejected: 0, points: 40 },
    { approved: 3, pending: 0, rejected: 0, points: 60 },
    { approved: 2, pending: 1, rejected: 0, points: 40 },
    { approved: 4, pending: 0, rejected: 0, points: 80 },
    { approved: 3, pending: 2, rejected: 0, points: 60 },
  ],
  // Last submitted 2 days ago, small backlog.
  cooling: [
    { approved: 1, pending: 0, rejected: 0, points: 20 },
    { approved: 2, pending: 0, rejected: 1, points: 40 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 3, pending: 0, rejected: 0, points: 60 },
    { approved: 2, pending: 0, rejected: 0, points: 40 },
    { approved: 0, pending: 1, rejected: 0 },
    { approved: 0, pending: 2, rejected: 0 },
  ],
  // Submitted today, no streak before.
  freshStart: [
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 1, pending: 1, rejected: 0, points: 20 },
  ],
  // Long idle, week-stale.
  idle: [
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 0, pending: 0, rejected: 0 },
  ],
  // Heavy activity day, lots pending review.
  pendingHeavy: [
    { approved: 1, pending: 0, rejected: 0, points: 20 },
    { approved: 2, pending: 0, rejected: 0, points: 40 },
    { approved: 1, pending: 1, rejected: 0, points: 20 },
    { approved: 0, pending: 2, rejected: 0 },
    { approved: 2, pending: 1, rejected: 0, points: 40 },
    { approved: 1, pending: 3, rejected: 0, points: 20 },
    { approved: 2, pending: 5, rejected: 1, points: 40 },
  ],
  // Strong week, dominant; fits the leaders.
  dominant: [
    { approved: 5, pending: 0, rejected: 0, points: 100 },
    { approved: 4, pending: 0, rejected: 0, points: 80 },
    { approved: 6, pending: 1, rejected: 0, points: 120 },
    { approved: 5, pending: 0, rejected: 0, points: 100 },
    { approved: 4, pending: 2, rejected: 1, points: 80 },
    { approved: 6, pending: 0, rejected: 0, points: 120 },
    { approved: 5, pending: 1, rejected: 0, points: 100 },
  ],
  // Mid pack, intermittent.
  spotty: [
    { approved: 1, pending: 0, rejected: 0, points: 20 },
    { approved: 0, pending: 0, rejected: 1 },
    { approved: 2, pending: 1, rejected: 0, points: 40 },
    { approved: 0, pending: 0, rejected: 0 },
    { approved: 1, pending: 1, rejected: 0, points: 20 },
    { approved: 0, pending: 0, rejected: 1 },
    { approved: 2, pending: 0, rejected: 0, points: 40 },
  ],
} satisfies Record<string, DayPattern[]>;

const MATRIX: MatrixEntry[] = [
  {
    state: "open",
    joinPolicy: "open",
    maxMembers: 8,
    memberCount: 5,
    points: 320,
    viewerContext: "outsider",
    tournamentIdx: 0,
    rank: 4,
    totalTeams: 12,
    activity: PROFILES.spotty,
  },
  {
    state: "open",
    joinPolicy: "open",
    maxMembers: 6,
    memberCount: 4,
    points: 185,
    viewerContext: "member",
    tournamentIdx: 0,
    rank: 7,
    totalTeams: 12,
    activity: PROFILES.freshStart,
  },
  {
    state: "open",
    joinPolicy: "open",
    maxMembers: 8,
    memberCount: 7,
    points: 540,
    viewerContext: "captain",
    tournamentIdx: 0,
    rank: 2,
    totalTeams: 12,
    activity: PROFILES.pendingHeavy,
  },
  {
    state: "closed",
    joinPolicy: "closed",
    maxMembers: 6,
    memberCount: 3,
    points: 95,
    viewerContext: "outsider",
    tournamentIdx: 1,
    rank: 9,
    totalTeams: 10,
    activity: PROFILES.idle,
  },
  {
    state: "closed",
    joinPolicy: "closed",
    maxMembers: 10,
    memberCount: 6,
    points: 410,
    viewerContext: "member",
    tournamentIdx: 1,
    rank: 3,
    totalTeams: 10,
    activity: PROFILES.cooling,
  },
  {
    state: "closed",
    joinPolicy: "closed",
    maxMembers: 8,
    memberCount: 4,
    points: 275,
    viewerContext: "captain",
    tournamentIdx: 1,
    rank: 5,
    totalTeams: 10,
    activity: PROFILES.hotStreak,
  },
  {
    state: "full",
    joinPolicy: "open",
    maxMembers: 4,
    memberCount: 4,
    points: 620,
    viewerContext: "outsider",
    tournamentIdx: 2,
    rank: 2,
    totalTeams: 14,
    activity: PROFILES.dominant,
  },
  {
    state: "full",
    joinPolicy: "open",
    maxMembers: 6,
    memberCount: 6,
    points: 390,
    viewerContext: "member",
    tournamentIdx: 2,
    rank: 6,
    totalTeams: 14,
    activity: PROFILES.spotty,
  },
  {
    state: "full",
    joinPolicy: "closed",
    maxMembers: 8,
    memberCount: 8,
    points: 780,
    viewerContext: "captain",
    tournamentIdx: 2,
    rank: 1,
    totalTeams: 14,
    activity: PROFILES.dominant,
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
    entry.activity,
  );
  const members = makeMembers(idx, entry.memberCount, 0);

  const isUserMember = entry.viewerContext !== "outsider";
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
    state: entry.state,
    isUserMember,
    userRole,
    rank: entry.rank,
    totalTeams: entry.totalTeams,
    label,
  };
});

const TEAM_LOOKUP = new Map<string, TeamDemoItem>(
  DEMO_TEAM_ITEMS.map((item) => [`${item.state}:${item.viewerContext}`, item]),
);

export function getTeamDemoItem(
  state: TeamState,
  viewerContext: ViewerContext,
): TeamDemoItem | undefined {
  return TEAM_LOOKUP.get(`${state}:${viewerContext}`);
}

export const VIEWER_CONTEXT_LABELS = VIEWER_LABELS;
