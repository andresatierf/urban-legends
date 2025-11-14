import { SectionHeader } from "../section-header";
import { DetailsCardSkeleton } from "./details-card-skeleton";
import { Skeleton } from "./skeleton";

type Props = {
  showHeader?: boolean;
  headerTitle?: string;
  sections?: number;
};

export function PageSkeleton({
  showHeader = true,
  headerTitle = "Loading...",
  sections = 2,
}: Props) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: div with role="status" is the correct ARIA pattern for loading states
    <div className="space-y-6" role="status" aria-busy="true">
      {showHeader && <SectionHeader as="h1" title={headerTitle} />}

      {Array.from({ length: sections }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton placeholder - order never changes
        <div key={i} className="space-y-4">
          {i > 0 && <Skeleton className="h-6 w-48" />}
          <DetailsCardSkeleton />
        </div>
      ))}

      <span className="sr-only">Loading content...</span>
    </div>
  );
}
