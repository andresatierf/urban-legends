import { Card, CardContent, CardFooter, CardHeader } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import { Footer } from "./footer";
import { Header } from "./header";
import { MemberRoster } from "./member-roster";
import { RoleBanner } from "./role-banner";
import { StatsGrid } from "./stats-grid";
import { TournamentBand } from "./tournament-band";
import type { TeamCardData } from "./types";

export function TeamCard({ data }: { data: TeamCardData }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <TournamentBand data={data} />
      <Header data={data} />
      <CardContent className="flex flex-col gap-3 px-4 pt-3">
        <StatsGrid data={data} />
        <MemberRoster data={data} />
        <RoleBanner data={data} />
      </CardContent>
      <Footer data={data} />
    </Card>
  );
}

export function TeamCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Skeleton className="h-7 w-full rounded-none" />
      <CardHeader className="px-4 pt-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pt-3">
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
      </CardContent>
      <CardFooter className="gap-2 px-4 py-3">
        <Skeleton className="h-7 flex-1" />
        <Skeleton className="h-7 w-16" />
      </CardFooter>
    </Card>
  );
}
