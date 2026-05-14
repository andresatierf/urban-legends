import { LogOut, Settings } from "lucide-react";

import {
  ComposedCard,
  type ComposedCardAction,
} from "@/components/common/card/composed-card";
import type { BadgeProps } from "@/components/ui/badge";

import { getTournamentStatus, STATUS_LABEL } from "../../tournaments/utils";
import { Skeleton } from "../../ui/skeleton";
import { MemberRoster } from "./member-roster";
import { RoleBanner } from "./role-banner";
import { StatsGrid } from "./stats-grid";
import type { TeamCardData } from "./types";

type Props = {
  data: TeamCardData;
  onLeave?: () => void;
  joinSlot?: React.ReactNode;
};

export function TeamCard({ data, onLeave, joinSlot }: Props) {
  const { team, tournament, memberCount, isUserMember, userRole } = data;
  const isFull = team.maxMembers != null && memberCount >= team.maxMembers;

  const badge: BadgeProps[] = [
    {
      variant: team.joinPolicy === "open" ? "success" : "neutral",
      children: team.joinPolicy === "open" ? "Open" : "Closed",
    },
  ];
  if (isFull) badge.push({ variant: "error", children: "Full" });

  const canLeave =
    userRole === "member" || (userRole === "captain" && memberCount === 1);

  const actions: ComposedCardAction[] = [];
  if (isUserMember) {
    if (canLeave && onLeave) {
      actions.push({
        label: "Leave",
        icon: <LogOut className="size-3.5" />,
        variant: "destructive",
        onClick: onLeave,
      });
    }
    actions.push({
      label: "Manage",
      icon: <Settings className="size-3.5" />,
      variant: "default",
      align: "end",
      to: "/teams/$teamId",
      params: { teamId: team._id },
    });
  } else {
    if (joinSlot) actions.push({ slot: joinSlot });
    actions.push({
      label: "View",
      variant: "default",
      align: "end",
      to: "/teams/$teamId",
      params: { teamId: team._id },
    });
  }

  return (
    <ComposedCard
      className={isUserMember ? "border-sky" : undefined}
      title={team.name}
      eyebrow={
        tournament
          ? `${tournament.name} · ${STATUS_LABEL[getTournamentStatus(tournament)]}`
          : undefined
      }
      eyebrowTo={tournament ? "/tournaments/$tournamentId" : undefined}
      eyebrowParams={tournament ? { tournamentId: tournament._id } : undefined}
      badge={badge}
      actions={actions}
    >
      <StatsGrid data={data} />
      <MemberRoster data={data} />
      <RoleBanner data={data} />
    </ComposedCard>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className="border-ink shadow-fd-lg flex flex-col gap-0 overflow-visible rounded-2xl border-2 bg-card">
      <header className="border-ink bg-paper-deep flex items-center justify-between gap-3 rounded-t-[18px] border-b-2 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-5 w-12" />
      </header>
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="-mb-3.5 flex items-center gap-2 px-4">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="ml-auto h-7 w-24" />
      </div>
    </div>
  );
}
