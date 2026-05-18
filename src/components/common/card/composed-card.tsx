import { Link, type LinkProps } from "@tanstack/react-router";
import type * as React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

type ComposedCardProps = Omit<React.ComponentProps<typeof Card>, "title"> & {
  title?: string;
  titleSize?: "default" | "lg";
  eyebrow?: string;
  eyebrowTo?: LinkProps["to"];
  eyebrowParams?: LinkProps["params"];
  badge?: BadgeProps | BadgeProps[];
  bodyClassName?: string;
};

export function ComposedCard({
  className,
  title,
  titleSize = "default",
  eyebrow,
  eyebrowTo,
  eyebrowParams,
  badge,
  bodyClassName,
  children,
  ...props
}: ComposedCardProps) {
  const badges = badge && (Array.isArray(badge) ? badge : [badge]);
  const hasHeader =
    title !== undefined || eyebrow !== undefined || badges !== undefined;

  const eyebrowNode = eyebrow && (
    <Eyebrow className="block truncate">{eyebrow}</Eyebrow>
  );

  return (
    <Card
      className={cn(
        "border-ink gap-0 overflow-visible rounded-2xl border-2 p-0 shadow-lg",
        className,
      )}
      {...props}
    >
      {hasHeader && (
        <header className="border-ink bg-paper-deep flex flex-wrap items-center justify-between gap-3 rounded-t-[18px] border-b-2 px-4 py-3">
          <div className="flex min-w-0 flex-col gap-[0.15rem]">
            {eyebrowNode &&
              (eyebrowTo ? (
                <Link
                  to={eyebrowTo}
                  params={eyebrowParams}
                  className="hover:text-ink min-w-0 transition-colors"
                >
                  {eyebrowNode}
                </Link>
              ) : (
                eyebrowNode
              ))}
            {title && (
              <h3
                className={cn(
                  "font-heading m-0 truncate font-extrabold",
                  titleSize === "lg" ? "text-xl" : "text-base",
                )}
              >
                {title}
              </h3>
            )}
          </div>
          {badges && (
            <div className="flex flex-wrap items-center gap-2">
              {badges.map((b, i) => (
                <Badge size="default" {...b} key={i} />
              ))}
            </div>
          )}
        </header>
      )}
      <div
        className={cn("flex flex-1 flex-col gap-3 px-4 py-3", bodyClassName)}
      >
        {children}
      </div>
    </Card>
  );
}
