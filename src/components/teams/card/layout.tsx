import {
  ComposedCard,
  ComposedCardBody,
  ComposedCardHeader,
} from "@/components/common/card/composed-card";

import { Skeleton } from "../../ui/skeleton";
import { Footer } from "./footer";
import { Header } from "./header";
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
  return (
    <ComposedCard>
      <Header data={data} />
      <ComposedCardBody>
        <StatsGrid data={data} />
        <MemberRoster data={data} />
        <RoleBanner data={data} />
        <Footer data={data} onLeave={onLeave} joinSlot={joinSlot} />
      </ComposedCardBody>
    </ComposedCard>
  );
}

export function TeamCardSkeleton() {
  return (
    <ComposedCard>
      <ComposedCardHeader
        badge={{
          variant: "neutral",
          children: <Skeleton className="h-3 w-10" />,
        }}
      >
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-5 w-40" />
      </ComposedCardHeader>
      <ComposedCardBody>
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 flex-1" />
          <Skeleton className="h-7 w-16" />
        </div>
      </ComposedCardBody>
    </ComposedCard>
  );
}
