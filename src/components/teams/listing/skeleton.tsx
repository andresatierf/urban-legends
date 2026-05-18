import { Users } from "lucide-react";

import { SectionHeader } from "@/components/section-header";

import { Skeleton } from "../../ui/skeleton";
import { TeamCardSkeleton } from "../card/layout";

export function TeamListingSkeleton({
  headerActions,
}: {
  headerActions?: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <SectionHeader as="h1" title="Teams" Icon={Users}>
        {headerActions}
      </SectionHeader>

      <section className="border-ink bg-paper-deep rounded-2xl border-2 p-5 shadow sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-36" />
          </div>
          <Skeleton className="h-8 w-44 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
