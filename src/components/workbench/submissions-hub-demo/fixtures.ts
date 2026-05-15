import {
  DEMO_GROUP_ITEMS,
  DEMO_INDIVIDUAL_ITEMS,
} from "@/components/workbench/card-demo/submission-fixtures";

import type { Id } from "../../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../../convex/users";

export const DEMO_REVIEW_ITEMS = [
  ...DEMO_INDIVIDUAL_ITEMS,
  ...DEMO_GROUP_ITEMS,
];

export type CalendarDayState =
  | "approved"
  | "pending"
  | "rejected"
  | "missed"
  | "empty"
  | "today";

export type CalendarDay = {
  date: string;
  day: number;
  state: CalendarDayState;
  pointsEarned?: number;
  inMonth: boolean;
};

const DAY_PATTERN: CalendarDayState[] = [
  "approved",
  "approved",
  "pending",
  "approved",
  "rejected",
  "missed",
  "approved",
  "approved",
  "pending",
  "approved",
  "approved",
  "approved",
  "missed",
  "approved",
  "rejected",
  "approved",
  "pending",
  "approved",
  "approved",
  "missed",
  "approved",
];

export function buildDemoCalendar(year = 2026, month = 4): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const todayDate = 15;

  const days: CalendarDay[] = [];
  // leading padding
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    days.push({
      date: `${year}-${String(month).padStart(2, "0")}-${String(prevLast - i).padStart(2, "0")}`,
      day: prevLast - i,
      state: "empty",
      inMonth: false,
    });
  }

  for (let d = 1; d <= lastDate; d++) {
    let state: CalendarDayState;
    if (d === todayDate) state = "today";
    else if (d > todayDate) state = "empty";
    else state = DAY_PATTERN[(d - 1) % DAY_PATTERN.length];

    const pointsEarned =
      state === "approved" ? (d % 3 === 0 ? 30 : 10) : undefined;

    days.push({
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
      state,
      pointsEarned,
      inMonth: true,
    });
  }

  // trailing padding
  while (days.length % 7 !== 0) {
    const nextDay = days.length - lastDate - startWeekday + 1;
    days.push({
      date: `${year}-${String(month + 2).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`,
      day: nextDay,
      state: "empty",
      inMonth: false,
    });
  }

  return days;
}

export type DemoMyTeam = {
  _id: Id<"teams">;
  name: string;
  tournamentName: string;
  rank: number;
  totalTeams: number;
  points: number;
};

export const DEMO_MY_TEAMS: DemoMyTeam[] = [
  {
    _id: "team-demo-1" as Id<"teams">,
    name: "Booldozers",
    tournamentName: "Urban Legends Tournament 2026",
    rank: 3,
    totalTeams: 18,
    points: 420,
  },
  {
    _id: "team-demo-2" as Id<"teams">,
    name: "Sedentários em Revolução",
    tournamentName: "Urban Legends Captains Cup 2026",
    rank: 7,
    totalTeams: 12,
    points: 230,
  },
];

export type DemoMySubmission = {
  _id: string;
  date: string;
  teamName: string;
  tournamentName: string;
  state: "approved" | "pending" | "rejected";
  tier: "base" | "advanced";
  pointsEarned: number;
  thumbUrl: string;
  description: string;
  rejectionReason?: string;
};

export const DEMO_MY_SUBMISSIONS: DemoMySubmission[] = [
  {
    _id: "my-1",
    date: "2026-05-14",
    teamName: "Booldozers",
    tournamentName: "Urban Legends Tournament 2026",
    state: "approved",
    tier: "advanced",
    pointsEarned: 30,
    thumbUrl: "https://picsum.photos/seed/my-1/200/200",
    description: "Bike to office + 5km run after work.",
  },
  {
    _id: "my-2",
    date: "2026-05-13",
    teamName: "Booldozers",
    tournamentName: "Urban Legends Tournament 2026",
    state: "pending",
    tier: "base",
    pointsEarned: 0,
    thumbUrl: "https://picsum.photos/seed/my-2/200/200",
    description: "Stair climb session — 30 floors.",
  },
  {
    _id: "my-3",
    date: "2026-05-12",
    teamName: "Sedentários em Revolução",
    tournamentName: "Urban Legends Captains Cup 2026",
    state: "rejected",
    tier: "base",
    pointsEarned: 0,
    thumbUrl: "https://picsum.photos/seed/my-3/200/200",
    description: "Indoor cycling — 20 minutes.",
    rejectionReason: "Activity too short for base tier (min 30 min).",
  },
  {
    _id: "my-4",
    date: "2026-05-11",
    teamName: "Booldozers",
    tournamentName: "Urban Legends Tournament 2026",
    state: "approved",
    tier: "base",
    pointsEarned: 10,
    thumbUrl: "https://picsum.photos/seed/my-4/200/200",
    description: "Morning yoga session.",
  },
  {
    _id: "my-5",
    date: "2026-05-09",
    teamName: "Booldozers",
    tournamentName: "Urban Legends Tournament 2026",
    state: "approved",
    tier: "advanced",
    pointsEarned: 30,
    thumbUrl: "https://picsum.photos/seed/my-5/200/200",
    description: "Long run — 12km along the river.",
  },
];

export function makeDemoUser(): UserWithRoles {
  return {
    _id: "user-demo-current" as Id<"users">,
    _creationTime: 0,
    name: "Demo Player",
    email: "demo@example.com",
    externalId: "ext-demo",
    imageUrl: "https://picsum.photos/seed/avatar-demo/96/96",
    roles: [],
    roleNames: [],
  };
}

export const DEMO_CALENDAR_STATS = {
  approved: 11,
  pending: 3,
  rejected: 2,
  missed: 4,
  pointsEarned: 220,
  streak: 4,
};
