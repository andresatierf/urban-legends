import { Inbox } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { DetailsCardSkeleton } from "@/components/ui/details-card-skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PodiumSkeleton } from "@/components/ui/podium-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCardsGridSkeleton } from "@/components/ui/stat-cards-grid-skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { WinnerAnnouncementSkeleton } from "@/components/ui/winner-announcement-skeleton";

export function StateSpecimens() {
  return (
    <div className="space-y-16">
      <EmptySection />
      <SkeletonSection />
    </div>
  );
}

function EmptySection() {
  return (
    <section className="space-y-8">
      <SectionHeader
        as="h1"
        title="Empty"
        description="The Empty primitive composed across the common slots — bare header, with media, and with action content."
      />

      <Specimen label="Header + description only">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No tournaments yet</EmptyTitle>
            <EmptyDescription>
              Once an admin creates a tournament, it'll show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Specimen>

      <Specimen label="With icon media">
        <Empty>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No submissions to review</EmptyTitle>
            <EmptyDescription>
              You're all caught up. Check back after teammates log activity.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Specimen>

      <Specimen label="With content slot">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Join a team</EmptyTitle>
            <EmptyDescription>
              You can join a team from the list or create your own.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <a href="#">Browse teams</a>
            <a href="#">Create a team</a>
          </EmptyContent>
        </Empty>
      </Specimen>
    </section>
  );
}

function SkeletonSection() {
  return (
    <section className="space-y-8">
      <SectionHeader
        as="h1"
        title="Skeletons"
        description="Loading placeholders used across the app, sized like the content they stand in for."
      />

      <Specimen label="Skeleton (primitive)">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Specimen>

      <Specimen label="StatCardsGridSkeleton (count=4)">
        <StatCardsGridSkeleton count={4} />
      </Specimen>

      <Specimen label="TableSkeleton">
        <TableSkeleton columns={4} />
      </Specimen>

      <Specimen label="DetailsCardSkeleton">
        <DetailsCardSkeleton />
      </Specimen>

      <Specimen label="PodiumSkeleton">
        <PodiumSkeleton className="grid grid-cols-1 gap-4 md:grid-cols-3" />
      </Specimen>

      <Specimen label="WinnerAnnouncementSkeleton">
        <WinnerAnnouncementSkeleton />
      </Specimen>

      <Specimen label="PageSkeleton">
        <PageSkeleton />
      </Specimen>
    </section>
  );
}

function Specimen({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-label-caps text-muted-foreground">{label}</h3>
      <div className="bg-paper rounded-lg p-6">{children}</div>
    </div>
  );
}
