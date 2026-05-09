import type { Id } from "../../../convex/_generated/dataModel";
import type { TournamentWithAuthority } from "../../../convex/tournaments";

function fakeId(table: string, n: number) {
  return `${table}-${n}` as Id<"tournaments"> & Id<"teams"> & Id<"users">;
}

const SCORING_CONFIG = {
  individualPoints: { base: 10, advanced: 20 },
  teamExercisePoints: { base: 15, advanced: 30 },
  teamExerciseThreshold: 0.7,
};

const now = new Date();
function daysFromNow(d: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() + d);
  return date.toISOString();
}

export const DEMO_TOURNAMENTS: TournamentWithAuthority[] = [
  {
    _id: fakeId("tournaments", 1),
    _creationTime: Date.now(),
    name: "Urban Legends Spring 2026",
    description:
      "The flagship spring tournament — teams compete across fitness, creative, and social challenges over six weeks.",
    startDate: daysFromNow(-14),
    endDate: daysFromNow(28),
    teamMinSize: 3,
    teamMaxSize: 8,
    createdBy: fakeId("users", 99),
    scoringConfig: SCORING_CONFIG,
    maxSubmissionsPerDay: 3,
    teamCount: 12,
    authority: {
      canManage: false,
      canReview: false,
      pendingReviewCount: 0,
      team: {
        _id: fakeId("teams", 1),
        name: "Booldozers",
        points: 485,
        isCaptain: true,
        approvedSubmissions: 18,
        totalSubmissions: 22,
      },
    },
  },
  {
    _id: fakeId("tournaments", 2),
    _creationTime: Date.now(),
    name: "Captains Cup 2026",
    description:
      "An invite-only tournament for team captains to compete head-to-head in advanced challenges.",
    startDate: daysFromNow(-7),
    endDate: daysFromNow(21),
    teamMinSize: 2,
    teamMaxSize: 4,
    createdBy: fakeId("users", 99),
    scoringConfig: SCORING_CONFIG,
    maxSubmissionsPerDay: 2,
    teamCount: 6,
    authority: {
      canManage: true,
      canReview: true,
      pendingReviewCount: 5,
      team: {
        _id: fakeId("teams", 2),
        name: "Urban Divas ✨",
        points: 310,
        isCaptain: false,
        approvedSubmissions: 12,
        totalSubmissions: 15,
      },
    },
  },
  {
    _id: fakeId("tournaments", 3),
    _creationTime: Date.now(),
    name: "Summer Showdown 2026",
    description:
      "A high-energy summer tournament with outdoor challenges, beach activities, and team-building events.",
    startDate: daysFromNow(10),
    endDate: daysFromNow(52),
    createdBy: fakeId("users", 99),
    scoringConfig: SCORING_CONFIG,
    teamCount: 4,
    authority: {
      canManage: false,
      canReview: false,
      pendingReviewCount: 0,
    },
  },
  {
    _id: fakeId("tournaments", 4),
    _creationTime: Date.now(),
    name: "Lisbon City Challenge",
    description:
      "Explore Lisbon through urban fitness challenges — run the hills, swim the coast, and conquer the city.",
    startDate: daysFromNow(30),
    endDate: daysFromNow(58),
    teamMinSize: 4,
    teamMaxSize: 6,
    createdBy: fakeId("users", 99),
    scoringConfig: SCORING_CONFIG,
    teamCount: 0,
    authority: {
      canManage: false,
      canReview: false,
      pendingReviewCount: 0,
    },
  },
  {
    _id: fakeId("tournaments", 5),
    _creationTime: Date.now(),
    name: "New Year Kickoff 2026",
    description: "Start the year strong with a month of fitness challenges.",
    startDate: daysFromNow(-90),
    endDate: daysFromNow(-60),
    createdBy: fakeId("users", 99),
    scoringConfig: SCORING_CONFIG,
    maxSubmissionsPerDay: 2,
    teamCount: 8,
    authority: {
      canManage: false,
      canReview: false,
      pendingReviewCount: 0,
      team: {
        _id: fakeId("teams", 5),
        name: "Sedentários em Revolução",
        points: 720,
        isCaptain: false,
        approvedSubmissions: 34,
        totalSubmissions: 38,
      },
    },
  },
  {
    _id: fakeId("tournaments", 6),
    _creationTime: Date.now(),
    name: "Winter Warriors 2025",
    description:
      "Brave the cold with indoor and outdoor challenges designed to test your winter resolve.",
    startDate: daysFromNow(-180),
    endDate: daysFromNow(-150),
    createdBy: fakeId("users", 99),
    scoringConfig: SCORING_CONFIG,
    teamCount: 10,
    authority: {
      canManage: true,
      canReview: true,
      pendingReviewCount: 0,
    },
  },
  {
    _id: fakeId("tournaments", 7),
    _creationTime: Date.now(),
    name: "Porto Weekend Blitz",
    description:
      "A fast-paced weekend tournament in Porto — complete as many challenges as you can in 48 hours.",
    startDate: daysFromNow(-3),
    endDate: daysFromNow(4),
    teamMinSize: 2,
    teamMaxSize: 5,
    createdBy: fakeId("users", 99),
    scoringConfig: SCORING_CONFIG,
    maxSubmissionsPerDay: 5,
    teamCount: 15,
    authority: {
      canManage: false,
      canReview: true,
      pendingReviewCount: 12,
      team: {
        _id: fakeId("teams", 7),
        name: "Legends on Tap",
        points: 195,
        isCaptain: true,
        approvedSubmissions: 9,
        totalSubmissions: 11,
      },
    },
  },
  {
    _id: fakeId("tournaments", 8),
    _creationTime: Date.now(),
    name: "Algarve Beach Games",
    description:
      "Sun, sand, and competition. Team beach sports meet fitness tracking.",
    startDate: daysFromNow(45),
    endDate: daysFromNow(75),
    createdBy: fakeId("users", 99),
    scoringConfig: SCORING_CONFIG,
    teamCount: 2,
    authority: {
      canManage: true,
      canReview: false,
      pendingReviewCount: 0,
    },
  },
];

export function partitionTournaments(tournaments: TournamentWithAuthority[]) {
  const now = new Date().toISOString();
  const active: TournamentWithAuthority[] = [];
  const upcoming: TournamentWithAuthority[] = [];
  const ended: TournamentWithAuthority[] = [];
  const yours: TournamentWithAuthority[] = [];
  const discover: TournamentWithAuthority[] = [];

  for (const t of tournaments) {
    if (t.startDate <= now && t.endDate >= now) active.push(t);
    else if (t.startDate > now) upcoming.push(t);
    else ended.push(t);

    if (t.authority.team || t.authority.canManage || t.authority.canReview) {
      yours.push(t);
    } else {
      discover.push(t);
    }
  }

  return { active, upcoming, ended, yours, discover, all: tournaments };
}

export function getTournamentStatus(t: { startDate: string; endDate: string }) {
  const now = new Date().toISOString();
  if (t.startDate <= now && t.endDate >= now) return "active" as const;
  if (t.startDate > now) return "upcoming" as const;
  return "ended" as const;
}

export function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function tournamentProgress(t: { startDate: string; endDate: string }) {
  const start = new Date(t.startDate).getTime();
  const end = new Date(t.endDate).getTime();
  const now = Date.now();
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}
