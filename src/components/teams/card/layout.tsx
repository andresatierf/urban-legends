import { ComposedCard } from "@/components/common/card/composed-card";

import { Skeleton } from "../../ui/skeleton";
import { getTeamCardActions } from "./footer";
import { getTeamCardHeader } from "./header";
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
  const header = getTeamCardHeader(data);
  const actions = getTeamCardActions({ data, onLeave, joinSlot });
  return (
    <ComposedCard
      title={header.title}
      eyebrow={header.eyebrow}
      badge={header.badge}
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
    <ComposedCard
      title={<Skeleton className="h-5 w-40" />}
      eyebrow={<Skeleton className="h-3 w-32" />}
      badge={{
        variant: "neutral",
        children: <Skeleton className="h-3 w-10" />,
      }}
      actions={[
        { slot: <Skeleton className="h-7 w-16" /> },
        { slot: <Skeleton className="h-7 w-24" />, align: "end" },
      ]}
    >
      <Skeleton className="h-12 w-full rounded-md" />
      <div className="space-y-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </ComposedCard>
  );
}
