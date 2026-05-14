import { Card } from "../../ui/card";
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
    <Card className="border-ink shadow-fd-lg gap-0 overflow-hidden rounded-2xl border-2 p-0">
      <Header data={data} />
      <div className="flex flex-col gap-3 px-4 py-3">
        <StatsGrid data={data} />
        <MemberRoster data={data} />
        <RoleBanner data={data} />
        <Footer data={data} onLeave={onLeave} joinSlot={joinSlot} />
      </div>
    </Card>
  );
}

export function TeamCardSkeleton() {
  return (
    <Card className="border-ink shadow-fd-lg gap-0 overflow-hidden rounded-2xl border-2 p-0">
      <div className="border-ink bg-paper-deep flex items-center justify-between gap-3 border-b-2 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-[0.15rem]">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-5 w-14" />
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-1 w-full rounded-full" />
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
      </div>
    </Card>
  );
}
