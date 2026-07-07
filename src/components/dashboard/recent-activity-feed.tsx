import { Link } from "@tanstack/react-router";

import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import type { DashboardRecentActivityItem } from "./types";

export type RecentActivityFeedProps = {
  items: DashboardRecentActivityItem[];
};

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  if (items.length === 0) return null;

  // Group consecutive items by coarse time bucket, preserving feed order.
  const groups: { bucket: string; items: DashboardRecentActivityItem[] }[] = [];
  for (const item of items) {
    const bucket = timeBucket(item.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.bucket === bucket) last.items.push(item);
    else groups.push({ bucket, items: [item] });
  }

  return (
    <section
      aria-label="Recent tournament activity"
      className="flex flex-col gap-4"
    >
      <div className="flex items-baseline justify-between">
        <Eyebrow>Recent activity</Eyebrow>
        <span className="text-mute text-body-sm font-mono">
          {items.length} {items.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.bucket} className="flex flex-col gap-3">
            <p className="text-mute text-label-caps">{group.bucket}</p>
            <ol className="relative flex flex-col">
              <span
                aria-hidden
                className="bg-ink/15 absolute top-2 bottom-2 left-[7px] w-0.5"
              />
              {group.items.map((item) => (
                <RecentActivityRow key={item.id} item={item} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentActivityRow({ item }: { item: DashboardRecentActivityItem }) {
  let summary: string;
  if (item.description) {
    summary = item.description;
  } else {
    const label = tierLabel(item.tier);
    summary =
      item.type === "group" ? `${label} team activity` : `${label} activity`;
  }

  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      <span
        aria-hidden
        className={cn(
          "border-ink relative z-10 mt-1 size-4 shrink-0 rounded-full border-2",
          item.tier === "advanced" ? "bg-sunset" : "bg-sky",
          item.isViewerTeam && "ring-plum/50 ring-4",
        )}
      />
      <div className="-mt-0.5 flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <Link
            to="/teams/$teamId"
            params={{ teamId: item.team._id }}
            className="font-heading text-ink truncate font-bold underline-offset-4 hover:underline"
          >
            {item.team.name}
          </Link>
          <span className="text-ink font-heading text-body-sm shrink-0 font-bold tabular-nums">
            +{item.pointsEarned} pts
          </span>
        </div>
        <p className="text-mute text-body-sm truncate">
          {summary}
          {item.actorName && ` · ${item.actorName}`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-mute text-body-xs font-mono">
            {formatRelative(item.timestamp)}
          </span>
          {item.isViewerTeam && (
            <span className="text-plum text-body-xs font-mono tracking-wide uppercase">
              your team
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function tierLabel(tier: "base" | "advanced"): string {
  return tier === "advanced" ? "Advanced" : "Base";
}

/** Coarse time buckets used as section headers in the timeline. */
function timeBucket(timestamp: number): string {
  const hours = (Date.now() - timestamp) / 3_600_000;
  if (hours < 24) return "Today";
  if (hours < 24 * 7) return "This week";
  return "Earlier";
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
