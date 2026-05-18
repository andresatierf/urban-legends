import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type * as React from "react";

import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import type { DashboardMyTeam } from "./types";

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
