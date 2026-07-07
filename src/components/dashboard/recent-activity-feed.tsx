import { Link } from "@tanstack/react-router";

import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import type { DashboardRecentActivityItem } from "./types";

export type RecentActivityFeedProps = {
  items: DashboardRecentActivityItem[];
};

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label="Recent tournament activity"
      className="flex flex-col gap-3"
    >
      <div className="flex items-baseline justify-between">
        <Eyebrow>Recent activity</Eyebrow>
        <span className="text-mute text-body-sm font-mono">
          {items.length} {items.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <RecentActivityRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function RecentActivityRow({ item }: { item: DashboardRecentActivityItem }) {
  const summary = item.description
    ? item.description
    : item.type === "group"
      ? `${tierLabel(item.tier)} team activity`
      : `${tierLabel(item.tier)} activity`;

  return (
    <li
      className={cn(
        "border-ink bg-card flex flex-col gap-1 rounded-xl border-2 px-4 py-3 shadow sm:flex-row sm:items-center sm:gap-4 sm:px-5",
        item.isViewerTeam && "bg-cream/60 ring-plum/40 ring-2",
      )}
    >
      <div className="min-w-0 sm:flex-1">
        <p className="text-ink text-body-sm">
          <Link
            to="/teams/$teamId"
            params={{ teamId: item.team._id }}
            className="font-heading font-bold underline-offset-4 hover:underline"
          >
            {item.team.name}
          </Link>
          {item.isViewerTeam && (
            <span className="text-mute text-body-xs ml-2 font-mono tracking-wide uppercase">
              your team
            </span>
          )}
        </p>
        <p className="text-mute text-body-sm truncate">
          {summary}
          {item.actorName && (
            <>
              {" · "}
              <span>{item.actorName}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3 sm:shrink-0">
        <span className="text-ink font-heading text-body-sm font-bold whitespace-nowrap">
          +{item.pointsEarned} pts
        </span>
        <span className="text-mute text-body-xs font-mono whitespace-nowrap">
          {formatRelative(item.timestamp)}
        </span>
      </div>
    </li>
  );
}

function tierLabel(tier: "base" | "advanced"): string {
  return tier === "advanced" ? "Advanced" : "Base";
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 0) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
