export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export type FixtureMember = {
  _id: string;
  name: string;
  email: string;
  imageUrl?: string;
  memberRole: "captain" | "member";
};

export type FixtureTeam = {
  _id: string;
  name: string;
  joinPolicy: "open" | "closed";
  maxMembers: number | null;
  points: number;
  tournamentId: string;
};

export type FixtureTournament = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "ended";
};

export type FixtureStats = {
  points: number;
  memberCount: number;
  submissionCount: number;
  approvalRate: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
  currentStreak: number;
  averagePointsPerDay: number;
  completionRate: number;
  daysSoFar: number;
};

export type FixtureJoinRequest = {
  _id: string;
  userName: string;
  userEmail: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type FixtureInvitation = {
  _id: string;
  userName: string;
  userEmail: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  invitedBy: string;
  createdAt: string;
};

export type FixturePermissions = {
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canLeave: boolean;
  canTransferCaptaincy: boolean;
  canManageMembers: boolean;
};

export type TeamDetailsFixture = {
  team: FixtureTeam;
  tournament: FixtureTournament;
  captain: FixtureMember;
  members: FixtureMember[];
  stats: FixtureStats;
  permissions: FixturePermissions;
  userMembership: { role: "captain" | "member" } | null;
  joinRequests: FixtureJoinRequest[];
  invitations: FixtureInvitation[];
};

const CAPTAIN: FixtureMember = {
  _id: "u_captain",
  name: "Alice Nakamura",
  email: "alice@example.com",
  imageUrl: undefined,
  memberRole: "captain",
};

const MEMBERS: FixtureMember[] = [
  {
    _id: "u_member1",
    name: "Bob Chen",
    email: "bob@example.com",
    imageUrl: undefined,
    memberRole: "member",
  },
  {
    _id: "u_member2",
    name: "Clara Torres",
    email: "clara@example.com",
    imageUrl: undefined,
    memberRole: "member",
  },
  {
    _id: "u_member3",
    name: "Dan Okafor",
    email: "dan.okafor@example.com",
    imageUrl: undefined,
    memberRole: "member",
  },
  {
    _id: "u_member4",
    name: "Elena Rossi",
    email: "elena.rossi@example.com",
    imageUrl: undefined,
    memberRole: "member",
  },
];

const TOURNAMENT: FixtureTournament = {
  _id: "t_summer",
  name: "Summer Legends Championship 2026",
  startDate: "2026-04-01",
  endDate: "2026-06-30",
  status: "active",
};

const TEAM: FixtureTeam = {
  _id: "tm_alpha",
  name: "Team Alpha Wolves",
  joinPolicy: "open",
  maxMembers: 6,
  points: 1_340,
  tournamentId: "t_summer",
};

const STATS: FixtureStats = {
  points: 1_340,
  memberCount: 5,
  submissionCount: 87,
  approvalRate: 0.874,
  approvedSubmissions: 76,
  pendingSubmissions: 4,
  rejectedSubmissions: 7,
  currentStreak: 12,
  averagePointsPerDay: 34.36,
  completionRate: 0.821,
  daysSoFar: 39,
};

const JOIN_REQUESTS: FixtureJoinRequest[] = [
  {
    _id: "jr_1",
    userName: "Frank Müller",
    userEmail: "frank.m@example.com",
    message: "I'd love to join your team! I'm active daily.",
    status: "pending",
    createdAt: "2026-05-07T14:30:00Z",
  },
  {
    _id: "jr_2",
    userName: "Grace Liu",
    userEmail: "grace.liu@example.com",
    status: "pending",
    createdAt: "2026-05-08T09:15:00Z",
  },
];

const INVITATIONS: FixtureInvitation[] = [
  {
    _id: "inv_1",
    userName: "Hiro Tanaka",
    userEmail: "hiro@example.com",
    status: "pending",
    invitedBy: "Alice Nakamura",
    createdAt: "2026-05-06T11:00:00Z",
  },
  {
    _id: "inv_2",
    userName: "Ines Pereira",
    userEmail: "ines.p@example.com",
    status: "accepted",
    invitedBy: "Alice Nakamura",
    createdAt: "2026-05-01T08:00:00Z",
  },
];

export const CAPTAIN_FIXTURE: TeamDetailsFixture = {
  team: TEAM,
  tournament: TOURNAMENT,
  captain: CAPTAIN,
  members: [CAPTAIN, ...MEMBERS],
  stats: STATS,
  permissions: {
    canEdit: true,
    canDelete: true,
    canInvite: true,
    canLeave: false,
    canTransferCaptaincy: true,
    canManageMembers: true,
  },
  userMembership: { role: "captain" },
  joinRequests: JOIN_REQUESTS,
  invitations: INVITATIONS,
};

export const MEMBER_FIXTURE: TeamDetailsFixture = {
  team: TEAM,
  tournament: TOURNAMENT,
  captain: CAPTAIN,
  members: [CAPTAIN, ...MEMBERS],
  stats: STATS,
  permissions: {
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canLeave: true,
    canTransferCaptaincy: false,
    canManageMembers: false,
  },
  userMembership: { role: "member" },
  joinRequests: [],
  invitations: [],
};

const CLOSED_TEAM: FixtureTeam = {
  _id: "tm_beta",
  name: "Closed Beta Squad",
  joinPolicy: "closed",
  maxMembers: 4,
  points: 620,
  tournamentId: "t_summer",
};

export const OUTSIDER_FIXTURE: TeamDetailsFixture = {
  team: CLOSED_TEAM,
  tournament: TOURNAMENT,
  captain: CAPTAIN,
  members: [CAPTAIN, MEMBERS[0], MEMBERS[1]],
  stats: {
    ...STATS,
    points: 620,
    memberCount: 3,
    submissionCount: 42,
    approvalRate: 0.786,
    approvedSubmissions: 33,
    pendingSubmissions: 2,
    rejectedSubmissions: 7,
    currentStreak: 5,
    averagePointsPerDay: 15.9,
    completionRate: 0.641,
    daysSoFar: 39,
  },
  permissions: {
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canLeave: false,
    canTransferCaptaincy: false,
    canManageMembers: false,
  },
  userMembership: null,
  joinRequests: [],
  invitations: [],
};

export const ALL_FIXTURES: { label: string; fixture: TeamDetailsFixture }[] = [
  {
    label: "Captain view (open team, 5 members, full controls)",
    fixture: CAPTAIN_FIXTURE,
  },
  {
    label: "Member view (limited controls, can leave)",
    fixture: MEMBER_FIXTURE,
  },
  {
    label: "Outsider view (closed team, no membership)",
    fixture: OUTSIDER_FIXTURE,
  },
];
