import { Link, type LinkComponentProps } from "@tanstack/react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { type ComponentProps, Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Separator } from "./separator";

export type SidebarCardBadge = {
  label: string;
  variant?: ComponentProps<typeof Badge>["variant"];
  icon?: LucideIcon;
};

export type SidebarCardStat = {
  label: string;
  value: string;
  icon?: LucideIcon;
  iconColor?: string;
};

/**
 * Link options accepted by SidebarCard. Construct with `linkOptions({...})`
 * from `@tanstack/react-router` at the call site to get full route validation.
 */
export type SidebarCardLink = LinkComponentProps;

export type SidebarCardAction = {
  label: string;
  icon?: LucideIcon;
  variant?: ComponentProps<typeof Button>["variant"];
  disabled?: boolean;
  /** If set, the action renders as a Link instead of a button. */
  link?: SidebarCardLink;
  onClick?: () => void;
};

type SidebarCardProps = {
  icon?: LucideIcon;
  iconColor?: string;
  badges?: SidebarCardBadge[];
  title?: string;
  description?: string;
  descriptionIcon?: LucideIcon;
  descriptionLink?: SidebarCardLink;
  /** Single group, or multiple groups separated by a Separator. */
  stats?: SidebarCardStat[] | SidebarCardStat[][];
  actions?: SidebarCardAction[];
  className?: string;
  /** Optional content rendered above the stats (e.g. a timeline). */
  children?: ReactNode;
};

export function SidebarCard({
  icon: Icon,
  iconColor,
  badges,
  title,
  description,
  descriptionIcon,
  descriptionLink,
  stats,
  actions,
  className,
  children,
}: SidebarCardProps) {
  const hasBadgeRow = Boolean(Icon || (badges && badges.length > 0));
  const hasHeader = Boolean(hasBadgeRow || title || description);
  const groups = normalizeGroups(stats);
  const hasStats = groups.length > 0;
  const hasActions = Boolean(actions && actions.length > 0);
  const hasBody = Boolean(children) || hasStats || hasActions;
  const useRowLayout = groups.some((group) => group.some((s) => s.icon));

  return (
    <Card className={className}>
      {hasHeader && (
        <CardHeader>
          {hasBadgeRow && (
            <div className="flex flex-wrap items-center gap-2">
              {Icon && (
                <Icon className={cn("h-5 w-5", iconColor ?? "text-primary")} />
              )}
              {badges?.map((badge) => (
                <Badge key={badge.label} variant={badge.variant ?? "default"}>
                  {badge.icon && <badge.icon className="h-3 w-3" />}
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && (
            <CardDescription>
              <DescriptionContent
                text={description}
                icon={descriptionIcon}
                link={descriptionLink}
              />
            </CardDescription>
          )}
        </CardHeader>
      )}
      {hasBody && (
        <CardContent
          className={cn(useRowLayout ? "space-y-2 text-xs" : "space-y-4")}
        >
          {children}
          {hasStats && <Separator />}
          {hasStats &&
            groups.map((group, i) => (
              <Fragment key={i}>
                {i > 0 && <Separator />}
                <StatGroup stats={group} useRowLayout={useRowLayout} />
              </Fragment>
            ))}
          {hasActions && hasStats && <Separator />}
          {hasActions && (
            <div className="space-y-2">
              {actions?.map((action) => (
                <ActionButton key={action.label} action={action} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function ActionButton({ action }: { action: SidebarCardAction }) {
  const Icon = action.icon;
  const content = (
    <>
      {Icon && <Icon className="h-4 w-4" />}
      {action.label}
    </>
  );

  if (action.link) {
    return (
      <Button
        variant={action.variant ?? "outline"}
        size="sm"
        className="w-full"
        disabled={action.disabled}
        asChild
      >
        <Link {...action.link}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      variant={action.variant ?? "outline"}
      size="sm"
      className="w-full"
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {content}
    </Button>
  );
}

function DescriptionContent({
  text,
  icon: Icon,
  link,
}: {
  text: string;
  icon?: LucideIcon;
  link?: SidebarCardLink;
}) {
  if (link) {
    return (
      <Link
        {...link}
        className="hover:text-foreground flex items-center gap-1.5 transition-colors"
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="flex-1 truncate">{text}</span>
        <ChevronRight className="h-3 w-3 shrink-0" />
      </Link>
    );
  }

  if (Icon) {
    return (
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{text}</span>
      </div>
    );
  }

  return <span>{text}</span>;
}

function normalizeGroups(
  stats?: SidebarCardStat[] | SidebarCardStat[][],
): SidebarCardStat[][] {
  if (!stats || stats.length === 0) return [];
  return Array.isArray(stats[0])
    ? (stats as SidebarCardStat[][])
    : [stats as SidebarCardStat[]];
}

function StatGroup({
  stats,
  useRowLayout,
}: {
  stats: SidebarCardStat[];
  useRowLayout: boolean;
}) {
  if (useRowLayout) {
    return (
      <>
        {stats.map((stat) => (
          <StatRow key={stat.label} stat={stat} />
        ))}
      </>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <StatTile key={stat.label} stat={stat} />
      ))}
    </div>
  );
}

function StatTile({ stat }: { stat: SidebarCardStat }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{stat.value}</div>
      <div className="text-muted-foreground text-xs">{stat.label}</div>
    </div>
  );
}

function StatRow({ stat }: { stat: SidebarCardStat }) {
  const Icon = stat.icon;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className={cn("h-3.5 w-3.5", stat.iconColor)} />}
        {stat.label}
      </span>
      <span className="font-medium">{stat.value}</span>
    </div>
  );
}
