import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { TournamentWithAuthority } from "../../convex/tournaments";

type TournamentStatus = "active" | "upcoming" | "ended";
type PlayerContext = "none" | "member" | "captain";

export type TournamentDemoItem = {
  tournament: TournamentWithAuthority;
  status: TournamentStatus;
  playerContext: PlayerContext;
  label: string;
};

const now = new Date();
const dayMs = 86_400_000;

function dateStr(offset: number): string {
  return new Date(now.getTime() + offset * dayMs).toISOString().slice(0, 10);
}

function makeTournament(
  idx: number,
  name: string,
  status: TournamentStatus,
): Doc<"tournaments"> {
  const startDate =
    status === "active"
      ? dateStr(-30)
      : status === "upcoming"
        ? dateStr(14)
        : dateStr(-90);
  const endDate =
    status === "active"
      ? dateStr(30)
      : status === "upcoming"
        ? dateStr(75)
        : dateStr(-10);

  return {
    _id: `demo-tour-${idx}` as Id<"tournaments">,
    _creationTime: 0,
    name,
    description: DESCRIPTIONS[idx % DESCRIPTIONS.length],
    startDate,
    endDate,
    createdBy: `user-0` as Id<"users">,
    scoringConfig: {
      individualPoints: { base: 10, advanced: 30 },
      teamExercisePoints: { base: 20, advanced: 50 },
      teamExerciseThreshold: 0.5,
    },
  };
}

function makeItem(
  idx: number,
  name: string,
  status: TournamentStatus,
  playerContext: PlayerContext,
  teamCount: number,
  pendingReviewCount: number,
): TournamentDemoItem {
  const base = makeTournament(idx, name, status);

  const team =
    playerContext !== "none"
      ? {
          _id: `demo-team-${idx}` as Id<"teams">,
          name: TEAM_NAMES[idx % TEAM_NAMES.length],
          points: POINTS[idx % POINTS.length],
          isCaptain: playerContext === "captain",
          approvedSubmissions: APPROVED[idx % APPROVED.length],
          totalSubmissions: TOTAL_SUBS[idx % TOTAL_SUBS.length],
        }
      : undefined;

  const canManage = playerContext === "captain" && pendingReviewCount > 0;

  const tournament: TournamentWithAuthority = {
    ...base,
    teamCount,
    authority: {
      canManage,
      canReview: pendingReviewCount > 0,
      pendingReviewCount,
      team,
    },
  };

  const label = `${STATUS_LABELS[status]} · ${CONTEXT_LABELS[playerContext]}`;

  return { tournament, status, playerContext, label };
}

const DESCRIPTIONS = [
  "Push your limits with daily urban challenges. Walk, run, or explore your city.",
  "The ultimate team competition — earn points through individual and group exercises across the city.",
  "A friendly tournament to kickstart healthy habits. All fitness levels welcome!",
];

const TEAM_NAMES = [
  "Urban Divas ✨",
  "Booldozers",
  "Sedentários em Revolução",
  "Legends on Tap",
  "404 Shape Not Found",
];

const POINTS = [320, 85, 540, 0, 210];
const APPROVED = [18, 4, 32, 0, 12];
const TOTAL_SUBS = [24, 6, 35, 0, 15];

const STATUS_LABELS: Record<TournamentStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  ended: "Ended",
};

const CONTEXT_LABELS: Record<PlayerContext, string> = {
  none: "No team",
  member: "Member",
  captain: "Captain + reviewer",
};

const TOURNAMENT_NAMES = [
  "Urban Legends 2026",
  "Captains Cup Spring",
  "Summer City Challenge",
];

let counter = 0;

const MATRIX: Array<{
  status: TournamentStatus;
  ctx: PlayerContext;
  teams: number;
  pending: number;
}> = [
  { status: "active", ctx: "captain", teams: 8, pending: 5 },
  { status: "active", ctx: "member", teams: 12, pending: 0 },
  { status: "active", ctx: "none", teams: 6, pending: 0 },
  { status: "upcoming", ctx: "captain", teams: 3, pending: 0 },
  { status: "upcoming", ctx: "member", teams: 5, pending: 0 },
  { status: "upcoming", ctx: "none", teams: 0, pending: 0 },
  { status: "ended", ctx: "captain", teams: 10, pending: 0 },
  { status: "ended", ctx: "member", teams: 8, pending: 0 },
  { status: "ended", ctx: "none", teams: 14, pending: 0 },
];

export const DEMO_TOURNAMENT_ITEMS: TournamentDemoItem[] = MATRIX.map(
  ({ status, ctx, teams, pending }) => {
    const idx = counter++;
    const name = TOURNAMENT_NAMES[idx % TOURNAMENT_NAMES.length];
    return makeItem(idx, name, status, ctx, teams, pending);
  },
);
