import type { Doc, Id } from "../../../convex/_generated/dataModel";

// ---------------------------------------------------------------------------
// Types shared across dashboard variants
// ---------------------------------------------------------------------------

export type DemoTeam = {
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  memberCount: number;
  userRole: "captain" | "member" | "rival";
};

export type DemoActivity = {
  type: string;
  description: string;
  timestamp: number;
  icon: string;
  link?: string;
};

export type DemoDeadline = {
  tournament: Doc<"tournaments">;
  daysUntilEnd: number;
};

export type DemoInvitation = {
  id: string;
  teamName: string;
  tournamentName: string;
  invitedBy: string;
  timestamp: number;
};

export type DemoSubmission = {
  id: string;
  teamName: string;
  tournamentName: string;
  date: string;
  state: "pending" | "approved" | "rejected";
};

export type DemoAdminStats = {
  users: { total: number; newThisWeek: number };
  tournaments: {
    total: number;
    active: number;
    upcoming: number;
    ended: number;
  };
  teams: { total: number };
  submissions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
};

export type DemoJoinRequest = {
  id: string;
  userName: string;
  teamName: string;
  timestamp: number;
};

export type DashboardFixtureData = {
  userName: string;
  isAdmin: boolean;
  teams: DemoTeam[];
  competingTeams: DemoTeam[];
  activeTournamentsCount: number;
  pendingSubmissionsCount: number;
  invitationsCount: number;
  activities: DemoActivity[];
  deadlines: DemoDeadline[];
  invitations: DemoInvitation[];
  pendingSubmissions: DemoSubmission[];
  joinRequests: DemoJoinRequest[];
  adminStats: DemoAdminStats | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date();
const dayMs = 86_400_000;

function dateStr(offset: number): string {
  return new Date(now.getTime() + offset * dayMs).toISOString().slice(0, 10);
}

function ts(hoursAgo: number): number {
  return now.getTime() - hoursAgo * 3_600_000;
}

function makeTournament(
  idx: number,
  name: string,
  startOffset: number,
  endOffset: number,
): Doc<"tournaments"> {
  return {
    _id: `demo-tour-${idx}` as Id<"tournaments">,
    _creationTime: 0,
    name,
    description: DESCRIPTIONS[idx % DESCRIPTIONS.length],
    startDate: dateStr(startOffset),
    endDate: dateStr(endOffset),
    createdBy: "user-0" as Id<"users">,
    scoringConfig: {
      individualPoints: { base: 10, advanced: 30 },
      teamExercisePoints: { base: 20, advanced: 50 },
      teamExerciseThreshold: 0.5,
    },
  };
}

function makeTeam(
  idx: number,
  name: string,
  tournamentId: Id<"tournaments">,
  points: number,
): Doc<"teams"> {
  return {
    _id: `demo-team-${idx}` as Id<"teams">,
    _creationTime: 0,
    name,
    createdBy: "user-0" as Id<"users">,
    tournamentId,
    joinPolicy: "open" as const,
    points,
  };
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const DESCRIPTIONS = [
  "Push your limits with daily urban challenges.",
  "The ultimate team competition across the city.",
  "A friendly tournament to kickstart healthy habits.",
  "Compete with friends in seasonal fitness challenges.",
];

const TOURNAMENTS = [
  { name: "Urban Legends 2026", start: -30, end: 30 },
  { name: "Captains Cup Spring", start: -15, end: 45 },
  { name: "Summer City Challenge", start: 10, end: 70 },
  { name: "Autumn League", start: -90, end: -10 },
];

const TEAM_NAMES = [
  "Urban Divas ✨",
  "Booldozers",
  "Sedentários em Revolução",
  "Legends on Tap",
  "404 Shape Not Found",
];

// ---------------------------------------------------------------------------
// Build fixture data
// ---------------------------------------------------------------------------

const tournaments = TOURNAMENTS.map((t, i) =>
  makeTournament(i, t.name, t.start, t.end),
);

const teams: DemoTeam[] = [
  {
    team: makeTeam(0, TEAM_NAMES[0], tournaments[0]._id, 320),
    tournament: tournaments[0],
    memberCount: 5,
    userRole: "captain",
  },
  {
    team: makeTeam(1, TEAM_NAMES[1], tournaments[1]._id, 180),
    tournament: tournaments[1],
    memberCount: 4,
    userRole: "member",
  },
  {
    team: makeTeam(2, TEAM_NAMES[2], tournaments[2]._id, 0),
    tournament: tournaments[2],
    memberCount: 3,
    userRole: "member",
  },
  {
    team: makeTeam(3, TEAM_NAMES[3], tournaments[3]._id, 540),
    tournament: tournaments[3],
    memberCount: 6,
    userRole: "captain",
  },
];

// Competitor teams per tournament (rivals — user is not on these)
const COMPETITORS: Array<{
  tourIdx: number;
  name: string;
  points: number;
  count: number;
  memberCount: number;
}> = [
  { tourIdx: 0, name: "Beach Bears", points: 280, count: 14, memberCount: 5 },
  { tourIdx: 0, name: "Track Stars", points: 195, count: 11, memberCount: 4 },
  { tourIdx: 0, name: "Cardio Cartel", points: 120, count: 7, memberCount: 3 },
  {
    tourIdx: 0,
    name: "404 Shape Not Found",
    points: 65,
    count: 4,
    memberCount: 5,
  },
  { tourIdx: 1, name: "Iron Hearts", points: 215, count: 12, memberCount: 5 },
  { tourIdx: 1, name: "The Plankers", points: 140, count: 8, memberCount: 4 },
  { tourIdx: 1, name: "Night Runners", points: 95, count: 6, memberCount: 3 },
  { tourIdx: 3, name: "Foggy Bottoms", points: 470, count: 23, memberCount: 6 },
  { tourIdx: 3, name: "Park Pacers", points: 405, count: 20, memberCount: 5 },
  {
    tourIdx: 3,
    name: "Cobblestone Crew",
    points: 310,
    count: 16,
    memberCount: 4,
  },
];

const competingTeams: DemoTeam[] = COMPETITORS.map((c, i) => ({
  team: makeTeam(100 + i, c.name, tournaments[c.tourIdx]._id, c.points),
  tournament: tournaments[c.tourIdx],
  memberCount: c.memberCount,
  userRole: "rival",
}));

// Seeded pseudo-random for deterministic jitter across renders
let _seed = 1337;
function rand(): number {
  _seed = (_seed * 9301 + 49297) % 233_280;
  return _seed / 233_280;
}

function genApprovedActivities(
  teamName: string,
  count: number,
  startOffsetDays: number,
  endOffsetDays: number,
): DemoActivity[] {
  if (count <= 0) return [];
  const span = endOffsetDays - startOffsetDays;
  const acts: DemoActivity[] = [];
  for (let i = 0; i < count; i++) {
    const base = startOffsetDays + (span * (i + 0.5)) / count;
    const jitter = (rand() - 0.5) * (span / count) * 0.7;
    const offsetDays = base + jitter;
    acts.push({
      type: "submission_approved",
      description: `${teamName} logged an approved activity`,
      timestamp: now.getTime() + offsetDays * dayMs,
      icon: "check-circle",
    });
  }
  return acts;
}

// User-team submissions distributed across each tournament's span (so chart line is rich)
const USER_TEAM_DISTRIBUTIONS: Array<{
  teamName: string;
  count: number;
  startOffset: number;
  endOffset: number;
}> = [
  { teamName: TEAM_NAMES[0], count: 17, startOffset: -28, endOffset: -1 }, // Urban Divas (active)
  { teamName: TEAM_NAMES[1], count: 10, startOffset: -14, endOffset: -1 }, // Booldozers (active)
  { teamName: TEAM_NAMES[3], count: 28, startOffset: -88, endOffset: -11 }, // Legends on Tap (ended)
];

const generatedActivities: DemoActivity[] = [
  ...USER_TEAM_DISTRIBUTIONS.flatMap((d) =>
    genApprovedActivities(d.teamName, d.count, d.startOffset, d.endOffset),
  ),
  ...COMPETITORS.flatMap((c) => {
    const t = tournaments[c.tourIdx];
    const startOffset =
      (new Date(t.startDate).getTime() - now.getTime()) / dayMs;
    const endOffsetRaw =
      (new Date(t.endDate).getTime() - now.getTime()) / dayMs;
    // Don't generate activities past today for active tournaments
    const endOffset = Math.min(endOffsetRaw, -1);
    if (endOffset <= startOffset) return [];
    return genApprovedActivities(c.name, c.count, startOffset, endOffset);
  }),
];

const activities: DemoActivity[] = [
  {
    type: "submission_approved",
    description: "Your submission for Urban Divas ✨ was approved",
    timestamp: ts(1),
    icon: "check-circle",
    link: "/submissions/s1",
  },
  {
    type: "submission_rejected",
    description: "Your submission for Booldozers was rejected",
    timestamp: ts(3),
    icon: "x-circle",
    link: "/submissions/s2",
  },
  {
    type: "team_member_joined",
    description: "Sofia joined Urban Divas ✨",
    timestamp: ts(5),
    icon: "user-plus",
    link: "/teams/demo-team-0",
  },
  {
    type: "join_request_approved",
    description: "Miguel's join request for Urban Divas ✨ was approved",
    timestamp: ts(8),
    icon: "users",
    link: "/teams/demo-team-0",
  },
  {
    type: "submission_approved",
    description: "Your submission for Legends on Tap was approved",
    timestamp: ts(12),
    icon: "check-circle",
    link: "/submissions/s3",
  },
  {
    type: "team_member_joined",
    description: "André joined Booldozers",
    timestamp: ts(24),
    icon: "user-plus",
    link: "/teams/demo-team-1",
  },
  {
    type: "submission_approved",
    description: "Your submission for Urban Divas ✨ was approved",
    timestamp: ts(36),
    icon: "check-circle",
    link: "/submissions/s4",
  },
  {
    type: "join_request_rejected",
    description: "Carlos's join request for Urban Divas ✨ was rejected",
    timestamp: ts(48),
    icon: "users",
    link: "/teams/demo-team-0",
  },
  ...generatedActivities,
];

const deadlines: DemoDeadline[] = [
  { tournament: tournaments[0], daysUntilEnd: 2 },
  { tournament: tournaments[1], daysUntilEnd: 5 },
];

const invitations: DemoInvitation[] = [
  {
    id: "inv-1",
    teamName: "404 Shape Not Found",
    tournamentName: "Urban Legends 2026",
    invitedBy: "Mariana",
    timestamp: ts(2),
  },
  {
    id: "inv-2",
    teamName: "Night Runners",
    tournamentName: "Captains Cup Spring",
    invitedBy: "João",
    timestamp: ts(6),
  },
];

const pendingSubmissions: DemoSubmission[] = [
  {
    id: "sub-1",
    teamName: "Urban Divas ✨",
    tournamentName: "Urban Legends 2026",
    date: dateStr(-1),
    state: "pending",
  },
  {
    id: "sub-2",
    teamName: "Booldozers",
    tournamentName: "Captains Cup Spring",
    date: dateStr(-2),
    state: "pending",
  },
  {
    id: "sub-3",
    teamName: "Urban Divas ✨",
    tournamentName: "Urban Legends 2026",
    date: dateStr(-3),
    state: "pending",
  },
];

const joinRequests: DemoJoinRequest[] = [
  {
    id: "jr-1",
    userName: "Carlos",
    teamName: "Urban Divas ✨",
    timestamp: ts(1),
  },
  {
    id: "jr-2",
    userName: "Ana",
    teamName: "Legends on Tap",
    timestamp: ts(4),
  },
];

const adminStats: DemoAdminStats = {
  users: { total: 247, newThisWeek: 18 },
  tournaments: { total: 12, active: 2, upcoming: 3, ended: 7 },
  teams: { total: 45 },
  submissions: { total: 1842, pending: 23, approved: 1650, rejected: 169 },
};

// ---------------------------------------------------------------------------
// Exported fixture sets
// ---------------------------------------------------------------------------

export const DASHBOARD_USER_FIXTURE: DashboardFixtureData = {
  userName: "André",
  isAdmin: false,
  teams,
  competingTeams,
  activeTournamentsCount: 2,
  pendingSubmissionsCount: pendingSubmissions.length,
  invitationsCount: invitations.length,
  activities,
  deadlines,
  invitations,
  pendingSubmissions,
  joinRequests: [],
  adminStats: null,
};

export const DASHBOARD_ADMIN_FIXTURE: DashboardFixtureData = {
  userName: "André",
  isAdmin: true,
  teams,
  competingTeams,
  activeTournamentsCount: 2,
  pendingSubmissionsCount: pendingSubmissions.length,
  invitationsCount: invitations.length,
  activities,
  deadlines,
  invitations,
  pendingSubmissions,
  joinRequests,
  adminStats,
};
