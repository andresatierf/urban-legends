import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  Crown,
  Flag,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { TournamentOverviewCard } from "@/components/tournaments/card/layout";
import {
  STATUS_LABEL,
  daysUntil,
  getTournamentStatus,
  partitionTournaments,
  tournamentProgress,
  type TournamentStatus,
} from "@/components/tournaments/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import type { TournamentWithAuthority } from "../../../../convex/tournaments";

export type ListingProps = {
  yours: TournamentWithAuthority[];
  discover: TournamentWithAuthority[];
};

const STATUS_EYEBROW_COLOR: Record<TournamentStatus, "grass" | "sky" | "mute"> =
  {
    active: "grass",
    upcoming: "sky",
    ended: "mute",
  };

const STATUS_LANE_TITLE: Record<TournamentStatus, string> = {
  active: "Now playing",
  upcoming: "Coming soon",
  ended: "Past tournaments",
};

// ─── Variant A · Anchor lane ────────────────────────────────────────────────
// "Your tournaments" pinned in a paper-deep band; "Discover" filtered below.

type StatusFilter = TournamentStatus | "all";

export function VariantAnchorLane({ yours, discover }: ListingProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [includeEnded, setIncludeEnded] = useState(false);

  const filteredDiscover = useMemo(() => {
    return discover.filter((t) => {
      const s = getTournamentStatus(t);
      if (!includeEnded && s === "ended") return false;
      if (filter !== "all" && s !== filter) return false;
      return true;
    });
  }, [discover, filter, includeEnded]);

  const counts = useMemo(() => {
    const out: Record<StatusFilter, number> = {
      all: 0,
      active: 0,
      upcoming: 0,
      ended: 0,
    };
    for (const t of discover) {
      const s = getTournamentStatus(t);
      out[s] += 1;
      if (s !== "ended" || includeEnded) out.all += 1;
    }
    return out;
  }, [discover, includeEnded]);

  return (
    <div className="space-y-8">
      <SectionHeader as="h1" title="Tournaments" Icon={Trophy}>
        <Button asChild size="sm" variant="outline">
          <Link to="/teams">
            <Users />
            Teams
          </Link>
        </Button>
      </SectionHeader>

      {yours.length > 0 && (
        <section className="border-ink bg-paper-deep relative rounded-2xl border-2 p-5 shadow sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <Eyebrow color="sunset">Your bracket</Eyebrow>
              <h2 className="text-h2 text-foreground mt-1">
                {yours.length === 1 ? "Your tournament" : `Your tournaments`}
              </h2>
            </div>
            <Badge variant="success" className="gap-1">
              <Crown className="size-3" />
              {yours.length} on the card
            </Badge>
          </div>
          <div
            className={cn(
              "grid grid-cols-1 items-start gap-3 gap-y-6",
              yours.length > 1 && "md:grid-cols-2",
            )}
          >
            {yours.map((t) => (
              <TournamentOverviewCard key={t._id} data={t} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Discover</Eyebrow>
            <h2 className="text-h2 text-foreground mt-1">
              {yours.length === 0 ? "Open tournaments" : "More tournaments"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterChips
              filter={filter}
              setFilter={setFilter}
              counts={counts}
              includeEnded={includeEnded}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncludeEnded((v) => !v)}
            >
              {includeEnded ? "Hide past" : "Show past"}
            </Button>
          </div>
        </div>

        {filteredDiscover.length === 0 ? (
          <EmptyNote>
            {yours.length === 0 && discover.length === 0
              ? "No tournaments yet. Check back soon, or ask an organizer to spin one up."
              : "No tournaments match this filter."}
          </EmptyNote>
        ) : (
          <div className="grid grid-cols-1 items-start gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredDiscover.map((t) => (
              <TournamentOverviewCard key={t._id} data={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChips({
  filter,
  setFilter,
  counts,
  includeEnded,
}: {
  filter: StatusFilter;
  setFilter: (f: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
  includeEnded: boolean;
}) {
  const items: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "upcoming", label: "Upcoming" },
  ];
  if (includeEnded) items.push({ key: "ended", label: "Ended" });

  return (
    <div className="border-ink bg-card flex rounded-lg border-2 p-0.5">
      {items.map(({ key, label }) => {
        const active = filter === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "text-label-caps flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-paper-deep",
            )}
          >
            {label}
            <span
              className={cn(
                "text-body-sm rounded-sm px-1 font-mono",
                active
                  ? "bg-primary-foreground/10 text-primary-foreground"
                  : "text-muted-foreground bg-paper-deep",
              )}
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Variant B · Status bands (broadsheet) ──────────────────────────────────
// Bold status sections. Your tournaments are sorted first within each band
// and marked with a "Yours" badge.

export function VariantStatusBands({ yours, discover }: ListingProps) {
  const [includeEnded, setIncludeEnded] = useState(false);
  const yourIds = useMemo(() => new Set(yours.map((t) => t._id)), [yours]);

  const allParts = useMemo(() => {
    const merged = [...yours, ...discover];
    return partitionTournaments(merged);
  }, [yours, discover]);

  const sortMineFirst = (
    a: TournamentWithAuthority,
    b: TournamentWithAuthority,
  ) => {
    const am = yourIds.has(a._id) ? 0 : 1;
    const bm = yourIds.has(b._id) ? 0 : 1;
    if (am !== bm) return am - bm;
    return a.startDate.localeCompare(b.startDate);
  };

  const bands: Array<{
    status: TournamentStatus;
    list: TournamentWithAuthority[];
  }> = [
    { status: "active", list: [...allParts.active].sort(sortMineFirst) },
    { status: "upcoming", list: [...allParts.upcoming].sort(sortMineFirst) },
  ];
  if (includeEnded) {
    bands.push({
      status: "ended",
      list: [...allParts.ended].sort(sortMineFirst),
    });
  }

  const totalShown = bands.reduce((acc, b) => acc + b.list.length, 0);

  return (
    <div className="space-y-10">
      <SectionHeader as="h1" title="Tournaments" Icon={Trophy}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIncludeEnded((v) => !v)}
        >
          {includeEnded ? "Hide past" : "Show past"}
        </Button>
      </SectionHeader>

      {totalShown === 0 ? (
        <EmptyNote>No tournaments to show.</EmptyNote>
      ) : (
        bands.map(({ status, list }) => {
          if (list.length === 0) return null;
          const mine = list.filter((t) => yourIds.has(t._id)).length;
          return (
            <section key={status} className="space-y-4">
              <BandHeader status={status} count={list.length} mine={mine} />
              <div className="grid grid-cols-1 items-start gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
                {list.map((t) => (
                  <div key={t._id} className="relative">
                    {yourIds.has(t._id) && (
                      <div className="absolute -top-2 left-3 z-10">
                        <Badge variant="success" className="gap-1">
                          <Crown className="size-3" />
                          Yours
                        </Badge>
                      </div>
                    )}
                    <TournamentOverviewCard data={t} />
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function BandHeader({
  status,
  count,
  mine,
}: {
  status: TournamentStatus;
  count: number;
  mine: number;
}) {
  const Icon =
    status === "active" ? Flag : status === "upcoming" ? CalendarClock : Trophy;
  return (
    <div className="border-ink-soft flex flex-wrap items-end justify-between gap-3 border-b pb-3">
      <div className="flex items-center gap-3">
        <Icon
          className={cn("size-5 shrink-0", {
            "text-success": status === "active",
            "text-info": status === "upcoming",
            "text-muted-foreground": status === "ended",
          })}
        />
        <div>
          <Eyebrow color={STATUS_EYEBROW_COLOR[status]}>
            {STATUS_LABEL[status]} · {count}{" "}
            {count === 1 ? "tournament" : "tournaments"}
            {mine > 0 && ` · ${mine} yours`}
          </Eyebrow>
          <h2 className="text-h2 text-foreground mt-1">
            {STATUS_LANE_TITLE[status]}
          </h2>
        </div>
      </div>
    </div>
  );
}

// ─── Variant C · Hero spotlight ────────────────────────────────────────────
// Active tournaments you're in are elevated to a hero tile (large metrics,
// pending-review CTA, days-left). Everything else is a compact card index.

export function VariantHeroSpotlight({ yours, discover }: ListingProps) {
  const [includeEnded, setIncludeEnded] = useState(false);

  const hero = useMemo(
    () => yours.filter((t) => getTournamentStatus(t) === "active"),
    [yours],
  );
  const yourUpcoming = useMemo(
    () => yours.filter((t) => getTournamentStatus(t) === "upcoming"),
    [yours],
  );
  const yourEnded = useMemo(
    () => yours.filter((t) => getTournamentStatus(t) === "ended"),
    [yours],
  );

  const indexList = useMemo(() => {
    const base = [...yourUpcoming, ...discover];
    if (!includeEnded)
      return base.filter((t) => getTournamentStatus(t) !== "ended");
    return [...base, ...yourEnded];
  }, [yourUpcoming, yourEnded, discover, includeEnded]);

  return (
    <div className="space-y-10">
      <SectionHeader as="h1" title="Tournaments" Icon={Trophy} />

      {hero.length > 0 ? (
        <section className="space-y-4">
          <Eyebrow color="sunset">In the field</Eyebrow>
          <div
            className={cn(
              "grid grid-cols-1 items-start gap-4",
              hero.length > 1 && "lg:grid-cols-2",
            )}
          >
            {hero.map((t) => (
              <HeroTile key={t._id} data={t} />
            ))}
          </div>
        </section>
      ) : (
        <section className="border-ink bg-paper-deep flex flex-col items-start gap-3 rounded-2xl border-2 p-6 shadow sm:p-8">
          <Eyebrow color="sky">No active tournament</Eyebrow>
          <h2 className="text-h2 text-foreground">
            Nothing on the field right now.
          </h2>
          <p className="text-muted-foreground text-body-sm max-w-prose">
            Pick an upcoming tournament below to join a team, or wait for the
            next active one to kick off.
          </p>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>The schedule</Eyebrow>
            <h2 className="text-h2 text-foreground mt-1">
              Upcoming & open tournaments
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeEnded((v) => !v)}
          >
            {includeEnded ? "Hide past" : "Show past"}
          </Button>
        </div>
        {indexList.length === 0 ? (
          <EmptyNote>No other tournaments to show.</EmptyNote>
        ) : (
          <div className="grid grid-cols-1 items-start gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            {indexList.map((t) => (
              <TournamentOverviewCard key={t._id} data={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HeroTile({ data }: { data: TournamentWithAuthority }) {
  const status = getTournamentStatus(data);
  const progress = tournamentProgress(data);
  const daysLeft = Math.max(0, daysUntil(data.endDate));
  const { team, pendingReviewCount, canReview } = data.authority;

  return (
    <article className="border-ink bg-card flex flex-col gap-5 rounded-2xl border-2 p-6 shadow-[4px_4px_0_var(--color-shadow)]">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow color="grass">
            {STATUS_LABEL[status]} · {daysLeft}{" "}
            {daysLeft === 1 ? "day" : "days"} left
          </Eyebrow>
          <h3 className="text-h2 text-foreground mt-1 truncate">{data.name}</h3>
        </div>
        {team?.isCaptain && (
          <Badge variant="warning" className="gap-1 shrink-0">
            <Crown className="size-3" />
            Captain
          </Badge>
        )}
      </header>

      {/* Progress bar */}
      <div>
        <div className="border-ink-soft bg-paper-deep h-2 overflow-hidden rounded-full border">
          <div
            className="bg-success h-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-muted-foreground text-label-caps mt-1.5 flex justify-between">
          <span>{progress}% complete</span>
          <span>{data.teamCount} teams</span>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-3 gap-3">
        <Metric
          label={team ? team.name : "No team"}
          value={team ? team.points : "—"}
          caption="Points"
          accent="sunset"
        />
        <Metric
          label="Approved"
          value={
            team ? `${team.approvedSubmissions}/${team.totalSubmissions}` : "—"
          }
          caption="Submissions"
          accent="grass"
        />
        <Metric
          label="To review"
          value={canReview ? pendingReviewCount : "—"}
          caption={canReview ? "Pending" : "Reviewers only"}
          accent={pendingReviewCount > 0 ? "sunset" : "mute"}
        />
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-body-sm line-clamp-2 max-w-prose">
          {data.description}
        </p>
        <div className="flex items-center gap-2">
          {canReview && pendingReviewCount > 0 && (
            <Button asChild size="sm">
              <Link
                to="/tournaments/$tournamentId"
                params={{ tournamentId: data._id }}
              >
                <Sparkles />
                Review {pendingReviewCount}
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link
              to="/tournaments/$tournamentId"
              params={{ tournamentId: data._id }}
            >
              Open
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </footer>
    </article>
  );
}

function Metric({
  label,
  value,
  caption,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  caption: string;
  accent: "sunset" | "grass" | "sky" | "mute";
}) {
  const accentClass = {
    sunset: "text-primary",
    grass: "text-success",
    sky: "text-info",
    mute: "text-muted-foreground",
  }[accent];
  return (
    <div className="border-ink-soft bg-paper-deep rounded-lg border p-3">
      <p className="text-muted-foreground text-label-caps truncate">{label}</p>
      <p className={cn("text-metric mt-1", accentClass)}>{value}</p>
      <p className="text-muted-foreground text-body-sm mt-0.5">{caption}</p>
    </div>
  );
}

// ─── Shared ────────────────────────────────────────────────────────────────

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-ink-soft text-muted-foreground text-body-sm rounded-lg border-2 border-dashed py-8 text-center">
      {children}
    </p>
  );
}
