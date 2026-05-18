import { Check, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

import type { DashboardInboxItem } from "./types";

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
