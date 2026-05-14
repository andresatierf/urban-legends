import type { ReactNode } from "react";

import { SectionHeader } from "./section-header";

type DetailsPageLayoutProps = {
  title: string;
  eyebrow?: string;
  headerActions?: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
};

export function DetailsPageLayout({
  title,
  eyebrow,
  headerActions,
  sidebar,
  children,
}: DetailsPageLayoutProps) {
  return (
    <>
      <SectionHeader as="h1" title={title} eyebrow={eyebrow}>
        {headerActions}
      </SectionHeader>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">{sidebar}</div>
        <div className="space-y-6">{children}</div>
      </div>
    </>
  );
}
