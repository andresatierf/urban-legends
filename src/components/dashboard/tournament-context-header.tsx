import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Hourglass, Trophy } from "lucide-react";

import { TournamentSwitcher } from "@/components/common/tournament-switcher";
import { Eyebrow } from "@/components/ui/eyebrow";

import type {
  DashboardLifecycle,
  DashboardSwitchableTournament,
} from "./types";

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
