import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Hourglass,
  PencilLine,
  Trophy,
  UserPlus,
  X,
} from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import { RaceChart } from "./race-chart";
import { TournamentSwitcher } from "./tournament-switcher";

// ─── shared types ───────────────────────────────────────────────────────────

export type DashboardLifecycle = "active" | "urgent" | "ended";

export type DashboardSwitchableTournament = {
  _id: string;
  name: string;
};

export type DashboardTeamRow = {
  team: {
    _id: string;
    name: string;
    points: number;
  };
  memberCount: number;
  userRole: "captain" | "member" | "rival";
};

export type DashboardChartSeries = {
  teamId: string;
  teamName: string;
  points: number[];
  total: number;
};

export type DashboardMyTeam = {
  teamId: string;
  teamName: string;
  isCaptain: boolean;
  memberCount: number;
  rank: number;
  totalTeams: number;
  points: number;
  gap: number;
  comparison: "ahead" | "tied" | "behind";
  comparedToTeamName: string | null;
};

export type DashboardInboxItem =
  | {
      kind: "invitation";
      id: string;
      teamName: string;
      tournamentName: string;
      invitedBy: string;
      timestamp: number;
    }
  | {
      kind: "joinRequest";
      id: string;
      userName: string;
      teamName: string;
      timestamp: number;
    };

// ─── header ─────────────────────────────────────────────────────────────────

export type TournamentContextHeaderProps = {
  viewerFirstName: string;
  tournaments: DashboardSwitchableTournament[];
  selectedTournamentId: string;
  onSelect: (id: string) => void;
  state: DashboardLifecycle;
  dayNumber: number;
  totalDays: number;
  daysRemaining: number;
  endDateLabel: string;
};

export function TournamentContextHeader({
  viewerFirstName,
  tournaments,
  selectedTournamentId,
  onSelect,
  state,
  dayNumber,
  totalDays,
  daysRemaining,
  endDateLabel,
}: TournamentContextHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-1">
        <Eyebrow>Your dashboard</Eyebrow>
        <h1 className="text-h1 text-ink">
          {greeting()}, {viewerFirstName}.
        </h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {tournaments.length > 1 ? (
            <TournamentSwitcher
              tournaments={tournaments}
              selectedTournamentId={selectedTournamentId}
              onSelect={onSelect}
              label="Tournament"
            />
          ) : (
            <Link
              to="/tournaments/$tournamentId"
              params={{ tournamentId: selectedTournamentId }}
              className="font-heading text-h3 text-ink hover:text-sunset focus-visible:ring-ring/60 group inline-flex items-center gap-1.5 rounded-md outline-none focus-visible:ring-[3px]"
            >
              {tournaments[0]?.name}
              <ArrowUpRight
                aria-hidden
                className="text-mute group-hover:text-sunset size-4 transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
              />
            </Link>
          )}
          {tournaments.length > 1 && (
            <Link
              to="/tournaments/$tournamentId"
              params={{ tournamentId: selectedTournamentId }}
              className="text-mute hover:text-sunset focus-visible:ring-ring/60 text-body-sm group inline-flex items-center gap-1 rounded-md font-medium outline-none focus-visible:ring-[3px]"
            >
              View tournament
              <ArrowUpRight
                aria-hidden
                className="size-3.5 transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
              />
            </Link>
          )}
        </div>

        {state === "active" && (
          <p className="text-mute text-body-sm flex items-center gap-2 font-mono">
            <Hourglass aria-hidden className="text-mute size-4" />
            <span>
              Day <span className="text-ink tabular-nums">{dayNumber}</span> of{" "}
              <span className="text-ink tabular-nums">{totalDays}</span>
              <span className="mx-1.5 opacity-50">·</span>
              Ends {endDateLabel}
            </span>
          </p>
        )}

        {state === "ended" && (
          <p className="text-mute text-body-sm flex items-center gap-2 font-mono">
            <Trophy aria-hidden className="size-4" />
            <span>
              Final whistle blown{" "}
              <span className="text-ink">{endDateLabel}</span>
            </span>
          </p>
        )}
      </div>

      {state === "urgent" && (
        <div className="border-crimson bg-crimson/10 shadow-fd flex items-center gap-3 rounded-xl border-2 px-4 py-3">
          <Clock aria-hidden className="text-crimson size-5 shrink-0" />
          <div className="flex flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-heading text-h3 text-crimson">
              Final whistle in {daysRemaining}{" "}
              {daysRemaining === 1 ? "day" : "days"}
            </span>
            <span className="text-mute text-body-sm font-mono">
              Ends {endDateLabel} · Day {dayNumber} of {totalDays}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ─── submit-today banner ────────────────────────────────────────────────────

export type SubmitTodayBannerProps = {
  todaySubmissions: number;
  limit: number | undefined;
  teamName: string;
};

export function SubmitTodayBanner({
  todaySubmissions,
  limit,
  teamName,
}: SubmitTodayBannerProps) {
  const atLimit = limit !== undefined && todaySubmissions >= limit;
  if (atLimit) return null;

  const hasLogged = todaySubmissions > 0;
  if (hasLogged && limit === undefined) return null;

  const eyebrowText = hasLogged ? "Going strong" : "Today";
  const title = hasLogged
    ? limit === undefined
      ? `${todaySubmissions} logged today`
      : `${todaySubmissions} of ${limit} logged today`
    : "You haven't logged today";
  const subtitle = hasLogged
    ? `One more counts toward ${teamName}.`
    : `Snap your evidence, give ${teamName} the points.`;
  const cta = hasLogged ? "Log another" : "Log activity";

  return (
    <section
      aria-label="Daily submission prompt"
      className="border-ink bg-card shadow-fd grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border-2 px-5 py-4 sm:gap-6 sm:px-6"
    >
      <span
        aria-hidden
        className={cn(
          "border-ink flex size-12 shrink-0 items-center justify-center rounded-full border-2",
          hasLogged ? "bg-grass/30 text-ink" : "bg-sunset text-white",
        )}
      >
        {hasLogged ? (
          <Check className="size-5" />
        ) : (
          <PencilLine className="size-5" />
        )}
      </span>
      <div className="min-w-0">
        <Eyebrow>{eyebrowText}</Eyebrow>
        <p className="font-heading text-h3 text-ink mt-0.5 leading-tight">
          {title}
        </p>
        <p className="text-mute text-body-sm mt-0.5 leading-snug">{subtitle}</p>
      </div>
      <Button
        asChild
        variant={hasLogged ? "secondary" : "default"}
        className="self-center"
      >
        <Link to="/submissions">
          {cta}
          <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}

// ─── my-team header ─────────────────────────────────────────────────────────

export function MyTeamHeader({
  teamId,
  teamName,
  isCaptain,
  memberCount,
  rank,
  totalTeams,
  points,
  gap,
  comparison,
  comparedToTeamName,
}: DashboardMyTeam) {
  const rankSuffix = ordinal(rank);
  const sublabelTail = comparedToTeamName
    ? comparison === "tied"
      ? `tied with ${comparedToTeamName}`
      : comparison === "ahead"
        ? `ahead of ${comparedToTeamName}`
        : `behind ${comparedToTeamName}`
    : "no rival yet";

  return (
    <section
      aria-label="Your team standing"
      className="border-ink bg-card shadow-fd-lg flex flex-col gap-5 rounded-2xl border-2 p-6 sm:flex-row sm:items-stretch sm:gap-8 sm:p-7"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Eyebrow>Your team</Eyebrow>
        <h2 className="font-heading text-h1 text-ink flex flex-wrap items-baseline gap-x-3 gap-y-1 leading-none">
          <Link
            to="/teams/$teamId"
            params={{ teamId }}
            className="hover:text-sunset focus-visible:ring-ring/60 group inline-flex items-baseline gap-2 rounded-md outline-none focus-visible:ring-[3px]"
          >
            <span>{teamName}</span>
            <ArrowUpRight
              aria-hidden
              className="text-mute group-hover:text-sunset size-5 self-center transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
            />
          </Link>
          {isCaptain && (
            <span className="border-gold bg-gold/30 text-ink text-label-caps inline-flex items-center gap-1 rounded-full border-[1.5px] px-2 py-0.5">
              Captain
            </span>
          )}
        </h2>
        <p className="text-mute text-body-sm font-mono">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </p>
      </div>

      <div className="bg-ink/10 hidden w-px sm:block" aria-hidden />

      <dl className="grid grid-cols-3 gap-5 sm:gap-8 sm:pr-2">
        <Stat
          label="Rank"
          value={
            <>
              <span className="tabular-nums">{rank}</span>
              <span className="text-mute text-h3 ml-0.5">{rankSuffix}</span>
            </>
          }
          sublabel={`of ${totalTeams}`}
        />
        <Stat
          label="Points"
          value={<span className="tabular-nums">{points}</span>}
          sublabel="total"
        />
        <Stat
          label={
            comparison === "ahead"
              ? "Lead"
              : comparison === "behind"
                ? "Gap"
                : "Margin"
          }
          value={
            <span
              className={cn(
                "tabular-nums",
                comparison === "ahead" && "text-grass",
                comparison === "behind" && "text-sunset",
              )}
            >
              {comparison === "tied" ? "0" : gap}
            </span>
          }
          sublabel={sublabelTail}
        />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: React.ReactNode;
  sublabel: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-mute text-label-caps">{label}</dt>
      <dd className="font-heading text-ink text-[2rem] leading-[1.05] font-extrabold tracking-[-0.02em] sm:text-[2.5rem]">
        {value}
      </dd>
      <span className="text-mute text-body-sm">{sublabel}</span>
    </div>
  );
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

// ─── standings (chart + leaderboard) ────────────────────────────────────────

export type StandingsCardProps = {
  teams: DashboardTeamRow[];
  userTeamId: string;
  chartDays: number[];
  chartSeries: DashboardChartSeries[];
  isEnded: boolean;
};

export function StandingsCard({
  teams,
  userTeamId,
  chartDays,
  chartSeries,
  isEnded,
}: StandingsCardProps) {
  return (
    <section
      aria-label="Standings"
      className="border-ink bg-card shadow-fd-lg overflow-hidden rounded-2xl border-2"
    >
      <header className="border-ink/15 flex flex-wrap items-baseline justify-between gap-2 border-b-[1.5px] px-5 py-3 sm:px-6">
        <div className="flex flex-col">
          <Eyebrow>{isEnded ? "Final standings" : "The race"}</Eyebrow>
          <h2 className="font-heading text-h3 text-ink">Points over time</h2>
        </div>
        <p className="text-mute text-body-sm font-mono">{teams.length} teams</p>
      </header>

      <div className="grid grid-cols-1 min-[960px]:grid-cols-[1.55fr_1fr] min-[960px]:[grid-template-rows:auto]">
        <div className="border-ink/15 flex min-h-0 min-w-0 flex-col px-4 pt-4 pb-3 min-[960px]:border-r-[1.5px] min-[960px]:border-dashed sm:px-6 sm:pt-5">
          {chartSeries.length > 0 && (
            <RaceChart
              days={chartDays}
              series={chartSeries}
              userTeamId={userTeamId}
              className="rounded-none! border-0! bg-transparent! p-0! shadow-none!"
            />
          )}
        </div>

        <ol className="flex min-h-0 flex-col gap-1 px-3 py-3 sm:px-4 sm:py-4">
          {teams.map((t, i) => {
            const rank = i + 1;
            const isYou = t.team._id === userTeamId;
            return (
              <li key={t.team._id}>
                <Link
                  to="/teams/$teamId"
                  params={{ teamId: t.team._id }}
                  aria-label={`View team ${t.team.name}`}
                  className={cn(
                    "focus-visible:ring-ring/60 grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 rounded-md px-2.5 py-2 transition-colors outline-none focus-visible:ring-[3px]",
                    isYou && "bg-sky/10 ring-sky ring-[1.5px] ring-inset",
                    !isYou && "hover:bg-paper-deep",
                  )}
                >
                  <span
                    className={cn(
                      "text-center font-mono tabular-nums",
                      rank <= 3
                        ? "text-ink text-h3 font-extrabold"
                        : "text-mute text-body-md",
                    )}
                  >
                    {rank}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-heading text-ink truncate text-base leading-tight font-bold">
                      {t.team.name}
                    </span>
                    <span className="text-mute text-body-sm font-mono">
                      {t.memberCount}{" "}
                      {t.memberCount === 1 ? "member" : "members"}
                      {t.userRole === "captain" && " · captain"}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-heading text-ink text-h3 leading-none tabular-nums">
                      {t.team.points}
                    </span>
                    <span className="text-mute text-label-caps">pts</span>
                  </span>
                  {isYou && <span className="sr-only">Your team</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ─── inbox ──────────────────────────────────────────────────────────────────

export type InboxProps = {
  items: DashboardInboxItem[];
  onRespondInvitation?: (id: string, accept: boolean) => void;
  onRespondJoinRequest?: (id: string, approve: boolean) => void;
  pendingId?: string | null;
};

export function Inbox({
  items,
  onRespondInvitation,
  onRespondJoinRequest,
  pendingId,
}: InboxProps) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Inbox" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <Eyebrow>Needs your attention</Eyebrow>
        <span className="text-mute text-body-sm font-mono">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item) =>
          item.kind === "invitation" ? (
            <InvitationCard
              key={item.id}
              item={item}
              onRespond={onRespondInvitation}
              isPending={pendingId === item.id}
            />
          ) : (
            <JoinRequestCard
              key={item.id}
              item={item}
              onRespond={onRespondJoinRequest}
              isPending={pendingId === item.id}
            />
          ),
        )}
      </ul>
    </section>
  );
}

function InvitationCard({
  item,
  onRespond,
  isPending,
}: {
  item: Extract<DashboardInboxItem, { kind: "invitation" }>;
  onRespond?: (id: string, accept: boolean) => void;
  isPending: boolean;
}) {
  return (
    <li className="border-ink bg-card shadow-fd flex flex-col gap-3 rounded-xl border-2 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex items-center gap-3 sm:flex-1">
        <span
          aria-hidden
          className="border-ink bg-plum/20 text-ink flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px]"
        >
          <UserPlus className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-ink text-body-sm">
            <span className="font-heading font-bold">{item.invitedBy}</span>{" "}
            invited you to{" "}
            <span className="font-heading font-bold">{item.teamName}</span>
          </p>
          <p className="text-mute text-body-sm font-mono">
            {item.tournamentName} · {formatRelative(item.timestamp)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        <Button
          variant="default"
          size="sm"
          disabled={isPending || !onRespond}
          onClick={() => onRespond?.(item.id, true)}
        >
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending || !onRespond}
          onClick={() => onRespond?.(item.id, false)}
        >
          Decline
        </Button>
      </div>
    </li>
  );
}

function JoinRequestCard({
  item,
  onRespond,
  isPending,
}: {
  item: Extract<DashboardInboxItem, { kind: "joinRequest" }>;
  onRespond?: (id: string, approve: boolean) => void;
  isPending: boolean;
}) {
  return (
    <li className="border-ink bg-card shadow-fd flex flex-col gap-3 rounded-xl border-2 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex items-center gap-3 sm:flex-1">
        <span
          aria-hidden
          className="border-ink bg-sky/20 text-ink flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px]"
        >
          <UserPlus className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-ink text-body-sm">
            <span className="font-heading font-bold">{item.userName}</span>{" "}
            wants to join{" "}
            <span className="font-heading font-bold">{item.teamName}</span>
          </p>
          <p className="text-mute text-body-sm font-mono">
            Captain decision · {formatRelative(item.timestamp)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        <Button
          variant="grass"
          size="sm"
          disabled={isPending || !onRespond}
          onClick={() => onRespond?.(item.id, true)}
        >
          <Check />
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending || !onRespond}
          onClick={() => onRespond?.(item.id, false)}
        >
          <X />
          Decline
        </Button>
      </div>
    </li>
  );
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── empty state ────────────────────────────────────────────────────────────

export function EmptyState({ viewerFirstName }: { viewerFirstName: string }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <Eyebrow>Your dashboard</Eyebrow>
        <h1 className="text-h1 text-ink">
          {greeting()}, {viewerFirstName}.
        </h1>
      </header>

      <section className="border-ink bg-card shadow-fd-lg flex flex-col items-start gap-5 rounded-2xl border-2 p-8 sm:flex-row sm:items-center sm:gap-8 sm:p-10">
        <span
          aria-hidden
          className="border-ink bg-paper-deep flex size-16 shrink-0 items-center justify-center rounded-2xl border-2"
        >
          <Trophy className="text-sunset size-8" />
        </span>
        <div className="flex-1">
          <h2 className="font-heading text-h2 text-ink">
            You're not on a team yet.
          </h2>
          <p className="text-mute text-body-md mt-1 max-w-prose">
            Pick a tournament to join. Open teams accept requests directly,
            closed teams need a captain's invite. Your inbox will surface
            invitations the moment they arrive.
          </p>
          <div className="mt-5">
            <Button asChild>
              <Link to="/tournaments">
                Browse tournaments
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── layout shell ───────────────────────────────────────────────────────────

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-7 px-5 py-8 sm:gap-8 sm:px-8 sm:py-10">
      {children}
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

export function formatEndDate(endDate: string): string {
  return new Date(endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
