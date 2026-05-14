import type * as React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function ComposedCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "border-ink shadow-fd-lg gap-0 overflow-hidden rounded-2xl border-2 p-0",
        className,
      )}
      {...props}
    />
  );
}

type ComposedCardHeaderProps = React.ComponentProps<"header"> & {
  badge?: BadgeProps | BadgeProps[];
};

function ComposedCardHeader({
  className,
  badge,
  children,
  ...props
}: ComposedCardHeaderProps) {
  const badges = badge && (Array.isArray(badge) ? badge : [badge]);
  return (
    <header
      className={cn(
        "border-ink bg-paper-deep flex flex-wrap items-center justify-between gap-3 border-b-2 px-4 py-3",
        className,
      )}
      {...props}
    >
      {badges ? (
        <>
          <div className="flex min-w-0 flex-col gap-[0.15rem]">{children}</div>
          <div className="flex flex-wrap items-center gap-2">
            {badges.map((b, i) => (
              <Badge size="default" {...b} key={i} />
            ))}
          </div>
        </>
      ) : (
        children
      )}
    </header>
  );
}

function ComposedCardBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-3 px-4 py-3", className)}
      {...props}
    />
  );
}

export { ComposedCard, ComposedCardBody, ComposedCardHeader };
