export type DemoMember = {
  _id: string;
  name: string;
  email: string;
  memberRole: "captain" | "member";
  imageUrl?: string;
};

export type DemoTeam = {
  _id: string;
  name: string;
  tournamentId: string;
  joinPolicy: "open" | "closed";
  maxMembers?: number;
  points: number;
  members: DemoMember[];
  isUserTeam: boolean;
};

export type DemoTournament = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
};

const TOURNAMENTS: DemoTournament[] = [
  {
    _id: "t1",
    name: "Summer Fitness Challenge 2026",
    startDate: "2026-05-01",
    endDate: "2026-06-30",
  },
  {
    _id: "t2",
    name: "Urban Legends Marathon",
    startDate: "2026-06-15",
    endDate: "2026-08-15",
  },
  {
    _id: "t3",
    name: "Weekend Warriors League",
    startDate: "2026-04-01",
    endDate: "2026-05-31",
  },
];

function member(
  id: string,
  name: string,
  role: "captain" | "member" = "member",
): DemoMember {
  const email = `${name.toLowerCase().replace(/\s/g, ".")}@example.com`;
  return { _id: id, name, email, memberRole: role };
}

const TEAMS: DemoTeam[] = [
  {
    _id: "team-1",
    name: "Thunderbolts",
    tournamentId: "t1",
    joinPolicy: "open",
    maxMembers: 6,
    points: 2450,
    isUserTeam: true,
    members: [
      member("u1", "Ana Silva", "captain"),
      member("u2", "Carlos Mendes"),
      member("u3", "Sofia Costa"),
      member("u4", "Rui Ferreira"),
    ],
  },
  {
    _id: "team-2",
    name: "Night Owls",
    tournamentId: "t1",
    joinPolicy: "closed",
    maxMembers: 5,
    points: 1980,
    isUserTeam: false,
    members: [
      member("u5", "João Pereira", "captain"),
      member("u6", "Maria Santos"),
      member("u7", "Pedro Alves"),
      member("u8", "Inês Rodrigues"),
      member("u9", "Tiago Martins"),
    ],
  },
  {
    _id: "team-3",
    name: "Trail Blazers",
    tournamentId: "t2",
    joinPolicy: "open",
    points: 3100,
    isUserTeam: true,
    members: [
      member("u10", "Beatriz Lopes", "captain"),
      member("u11", "André Freitas"),
      member("u12", "Catarina Nunes"),
    ],
  },
  {
    _id: "team-4",
    name: "The Underdogs",
    tournamentId: "t2",
    joinPolicy: "open",
    maxMembers: 8,
    points: 870,
    isUserTeam: false,
    members: [
      member("u13", "Miguel Oliveira", "captain"),
      member("u14", "Diana Sousa"),
    ],
  },
  {
    _id: "team-5",
    name: "Apex Predators",
    tournamentId: "t1",
    joinPolicy: "open",
    maxMembers: 4,
    points: 4200,
    isUserTeam: false,
    members: [
      member("u15", "Hugo Ribeiro", "captain"),
      member("u16", "Laura Marques"),
      member("u17", "Diogo Carvalho"),
      member("u18", "Marta Gonçalves"),
    ],
  },
  {
    _id: "team-6",
    name: "Weekend Warriors",
    tournamentId: "t3",
    joinPolicy: "closed",
    maxMembers: 6,
    points: 1500,
    isUserTeam: true,
    members: [
      member("u19", "Ricardo Teixeira", "captain"),
      member("u20", "Filipa Pinto"),
      member("u21", "Bruno Correia"),
      member("u22", "Sara Moreira"),
      member("u23", "Nuno Baptista"),
      member("u24", "Leonor Fonseca"),
    ],
  },
  {
    _id: "team-7",
    name: "Couch Potatoes",
    tournamentId: "t3",
    joinPolicy: "open",
    points: 320,
    isUserTeam: false,
    members: [member("u25", "Tomás Vieira", "captain")],
  },
  {
    _id: "team-8",
    name: "Rapid Response",
    tournamentId: "t2",
    joinPolicy: "closed",
    maxMembers: 5,
    points: 2780,
    isUserTeam: false,
    members: [
      member("u26", "Clara Domingues", "captain"),
      member("u27", "Gustavo Monteiro"),
      member("u28", "Eva Cardoso"),
      member("u29", "Vasco Barbosa"),
      member("u30", "Luísa Amorim"),
    ],
  },
  {
    _id: "team-9",
    name: "Iron Will",
    tournamentId: "t1",
    joinPolicy: "open",
    maxMembers: 6,
    points: 1120,
    isUserTeam: false,
    members: [
      member("u31", "Alexandre Cunha", "captain"),
      member("u32", "Joana Figueiredo"),
      member("u33", "Rafael Azevedo"),
      member("u34", "Helena Matos"),
      member("u35", "Fernando Campos"),
      member("u36", "Mariana Reis"),
    ],
  },
  {
    _id: "team-10",
    name: "Velocity",
    tournamentId: "t3",
    joinPolicy: "open",
    maxMembers: 4,
    points: 2100,
    isUserTeam: false,
    members: [
      member("u37", "Simão Nogueira", "captain"),
      member("u38", "Teresa Guerreiro"),
      member("u39", "Bernardo Pires"),
    ],
  },
];

export const DEMO_TOURNAMENTS = TOURNAMENTS;
export const DEMO_TEAMS = TEAMS;
export const DEMO_USER_TEAMS = TEAMS.filter((t) => t.isUserTeam);
export const DEMO_OTHER_TEAMS = TEAMS.filter((t) => !t.isUserTeam);

export function getTournament(id: string): DemoTournament | undefined {
  return TOURNAMENTS.find((t) => t._id === id);
}

export function isFull(team: DemoTeam): boolean {
  return team.maxMembers != null && team.members.length >= team.maxMembers;
}

export function getTournamentStatus(
  tournament: DemoTournament,
): "active" | "upcoming" | "ended" {
  const now = new Date().toISOString().slice(0, 10);
  if (now < tournament.startDate) return "upcoming";
  if (now > tournament.endDate) return "ended";
  return "active";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getCaptain(team: DemoTeam): DemoMember | undefined {
  return team.members.find((m) => m.memberRole === "captain");
}

export function sortMembersCapFirst(members: DemoMember[]): DemoMember[] {
  return [...members].sort((a, b) =>
    a.memberRole === "captain" ? -1 : b.memberRole === "captain" ? 1 : 0,
  );
}

export function filterTeams(teams: DemoTeam[], query: string): DemoTeam[] {
  if (!query) return teams;
  const q = query.toLowerCase();
  return teams.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      getTournament(t.tournamentId)?.name.toLowerCase().includes(q),
  );
}
