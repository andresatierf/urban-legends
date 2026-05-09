import type { Id, TableNames } from "../../convex/_generated/dataModel";

type FakeId<T extends TableNames> = Id<T>;

function fakeId<T extends TableNames>(table: T, n: number): FakeId<T> {
  return `fake_${table}_${n}` as unknown as FakeId<T>;
}

export type DemoMember = {
  _id: FakeId<"users">;
  _creationTime: number;
  name: string;
  email: string;
  externalId: string;
  imageUrl?: string;
  memberRole: "captain" | "member";
};

export type DemoTeam = {
  _id: FakeId<"teams">;
  _creationTime: number;
  name: string;
  tournamentId: FakeId<"tournaments">;
  createdBy: FakeId<"users">;
  joinPolicy: "open" | "closed";
  maxMembers?: number;
  points: number;
  lastActivityAt?: string;
  memberCount: number;
  members: DemoMember[];
};

export type DemoTournament = {
  _id: FakeId<"tournaments">;
  _creationTime: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  teamMinSize?: number;
  teamMaxSize?: number;
  createdBy: FakeId<"users">;
  winnerId?: FakeId<"teams">;
  completedAt?: string;
  scoringConfig: {
    individualPoints: { base: number; advanced: number };
    teamExercisePoints: { base: number; advanced: number };
    teamExerciseThreshold: number;
  };
  maxSubmissionsPerDay?: number;
};

export type DemoTournamentDetails = {
  tournament: DemoTournament;
  teams: DemoTeam[];
  userTeam: DemoTeam | null;
  status: "active" | "upcoming" | "ended";
  canEdit: boolean;
  canDelete: boolean;
  canViewLeaderboard: boolean;
  statistics: {
    totalTeams: number;
    totalParticipants: number;
    averageTeamSize: number;
  };
};

const TOURNAMENT_ID = fakeId("tournaments", 1);
const USER_ID = fakeId("users", 1);

const MEMBERS: Record<string, DemoMember[]> = {
  ironWolves: [
    {
      _id: USER_ID,
      _creationTime: Date.now(),
      name: "André Freitas",
      email: "andre@example.com",
      externalId: "ext_1",
      memberRole: "captain",
    },
    {
      _id: fakeId("users", 2),
      _creationTime: Date.now(),
      name: "Sofia Mendes",
      email: "sofia@example.com",
      externalId: "ext_2",
      memberRole: "member",
    },
    {
      _id: fakeId("users", 3),
      _creationTime: Date.now(),
      name: "Ricardo Lopes",
      email: "ricardo@example.com",
      externalId: "ext_3",
      memberRole: "member",
    },
    {
      _id: fakeId("users", 4),
      _creationTime: Date.now(),
      name: "Maria Costa",
      email: "maria@example.com",
      externalId: "ext_4",
      memberRole: "member",
    },
  ],
  stormBreakers: [
    {
      _id: fakeId("users", 5),
      _creationTime: Date.now(),
      name: "João Silva",
      email: "joao@example.com",
      externalId: "ext_5",
      memberRole: "captain",
    },
    {
      _id: fakeId("users", 6),
      _creationTime: Date.now(),
      name: "Ana Rodrigues",
      email: "ana@example.com",
      externalId: "ext_6",
      memberRole: "member",
    },
    {
      _id: fakeId("users", 7),
      _creationTime: Date.now(),
      name: "Miguel Ferreira",
      email: "miguel@example.com",
      externalId: "ext_7",
      memberRole: "member",
    },
  ],
  phoenixSquad: [
    {
      _id: fakeId("users", 8),
      _creationTime: Date.now(),
      name: "Inês Oliveira",
      email: "ines@example.com",
      externalId: "ext_8",
      memberRole: "captain",
    },
    {
      _id: fakeId("users", 9),
      _creationTime: Date.now(),
      name: "Tiago Santos",
      email: "tiago@example.com",
      externalId: "ext_9",
      memberRole: "member",
    },
    {
      _id: fakeId("users", 10),
      _creationTime: Date.now(),
      name: "Beatriz Almeida",
      email: "beatriz@example.com",
      externalId: "ext_10",
      memberRole: "member",
    },
    {
      _id: fakeId("users", 11),
      _creationTime: Date.now(),
      name: "Pedro Nunes",
      email: "pedro@example.com",
      externalId: "ext_11",
      memberRole: "member",
    },
    {
      _id: fakeId("users", 12),
      _creationTime: Date.now(),
      name: "Carolina Pereira",
      email: "carolina@example.com",
      externalId: "ext_12",
      memberRole: "member",
    },
  ],
  nightOwls: [
    {
      _id: fakeId("users", 13),
      _creationTime: Date.now(),
      name: "Diogo Martins",
      email: "diogo@example.com",
      externalId: "ext_13",
      memberRole: "captain",
    },
    {
      _id: fakeId("users", 14),
      _creationTime: Date.now(),
      name: "Leonor Sousa",
      email: "leonor@example.com",
      externalId: "ext_14",
      memberRole: "member",
    },
  ],
  titanForce: [
    {
      _id: fakeId("users", 15),
      _creationTime: Date.now(),
      name: "Rui Carvalho",
      email: "rui@example.com",
      externalId: "ext_15",
      memberRole: "captain",
    },
    {
      _id: fakeId("users", 16),
      _creationTime: Date.now(),
      name: "Marta Fernandes",
      email: "marta@example.com",
      externalId: "ext_16",
      memberRole: "member",
    },
    {
      _id: fakeId("users", 17),
      _creationTime: Date.now(),
      name: "Hugo Gomes",
      email: "hugo@example.com",
      externalId: "ext_17",
      memberRole: "member",
    },
    {
      _id: fakeId("users", 18),
      _creationTime: Date.now(),
      name: "Sara Dias",
      email: "sara@example.com",
      externalId: "ext_18",
      memberRole: "member",
    },
  ],
};

function makeTeam(
  n: number,
  name: string,
  members: DemoMember[],
  points: number,
  joinPolicy: "open" | "closed" = "open",
  maxMembers?: number,
): DemoTeam {
  return {
    _id: fakeId("teams", n),
    _creationTime: Date.now(),
    name,
    tournamentId: TOURNAMENT_ID,
    createdBy: members[0]._id,
    joinPolicy,
    maxMembers,
    points,
    lastActivityAt: "2026-05-08T14:30:00Z",
    memberCount: members.length,
    members,
  };
}

const TEAMS: DemoTeam[] = [
  makeTeam(1, "Iron Wolves", MEMBERS.ironWolves, 1420, "closed", 5),
  makeTeam(2, "Storm Breakers", MEMBERS.stormBreakers, 1680),
  makeTeam(3, "Phoenix Squad", MEMBERS.phoenixSquad, 2150, "closed", 6),
  makeTeam(4, "Night Owls", MEMBERS.nightOwls, 890, "open", 4),
  makeTeam(5, "Titan Force", MEMBERS.titanForce, 1950, "open"),
];

const USER_TEAM = TEAMS[0];

const TOURNAMENT: DemoTournament = {
  _id: TOURNAMENT_ID,
  _creationTime: Date.now(),
  name: "Spring Fitness Challenge 2026",
  description:
    "A month-long fitness challenge encouraging teams to stay active through daily exercises, team workouts, and creative fitness activities. Points are awarded for individual submissions and team exercises that meet the participation threshold.",
  startDate: "2026-04-28T00:00:00Z",
  endDate: "2026-05-28T23:59:59Z",
  teamMinSize: 2,
  teamMaxSize: 6,
  createdBy: fakeId("users", 99),
  scoringConfig: {
    individualPoints: { base: 10, advanced: 25 },
    teamExercisePoints: { base: 50, advanced: 100 },
    teamExerciseThreshold: 0.75,
  },
  maxSubmissionsPerDay: 3,
};

const totalParticipants = TEAMS.reduce((s, t) => s + t.memberCount, 0);

export const DEMO_ACTIVE: DemoTournamentDetails = {
  tournament: TOURNAMENT,
  teams: TEAMS,
  userTeam: USER_TEAM,
  status: "active",
  canEdit: true,
  canDelete: false,
  canViewLeaderboard: true,
  statistics: {
    totalTeams: TEAMS.length,
    totalParticipants: totalParticipants,
    averageTeamSize: totalParticipants / TEAMS.length,
  },
};

export const DEMO_UPCOMING: DemoTournamentDetails = {
  tournament: {
    ...TOURNAMENT,
    _id: fakeId("tournaments", 2),
    name: "Summer Hiking Series",
    description:
      "Explore nature with your team! Log hikes, trail runs, and outdoor adventures to earn points.",
    startDate: "2026-06-15T00:00:00Z",
    endDate: "2026-07-15T23:59:59Z",
  },
  teams: TEAMS.slice(0, 2),
  userTeam: null,
  status: "upcoming",
  canEdit: false,
  canDelete: false,
  canViewLeaderboard: true,
  statistics: {
    totalTeams: 2,
    totalParticipants: 7,
    averageTeamSize: 3.5,
  },
};

export const DEMO_ENDED: DemoTournamentDetails = {
  tournament: {
    ...TOURNAMENT,
    _id: fakeId("tournaments", 3),
    name: "Winter Warrior Challenge",
    description:
      "The cold never stopped us. Indoor and outdoor fitness challenges to keep you moving through winter.",
    startDate: "2026-01-10T00:00:00Z",
    endDate: "2026-02-10T23:59:59Z",
    winnerId: fakeId("teams", 3),
    completedAt: "2026-02-10T23:59:59Z",
  },
  teams: TEAMS,
  userTeam: USER_TEAM,
  status: "ended",
  canEdit: false,
  canDelete: false,
  canViewLeaderboard: true,
  statistics: {
    totalTeams: TEAMS.length,
    totalParticipants: totalParticipants,
    averageTeamSize: totalParticipants / TEAMS.length,
  },
};

export const ALL_SCENARIOS = [
  { label: "Active (member, captain)", data: DEMO_ACTIVE },
  { label: "Upcoming (no team)", data: DEMO_UPCOMING },
  { label: "Ended (with winner)", data: DEMO_ENDED },
] as const;
