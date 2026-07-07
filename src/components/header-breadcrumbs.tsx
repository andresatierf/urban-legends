import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ROUTE_LABELS, SEGMENT_LABELS } from "@/lib/route-labels";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Collections whose dynamic child segment is an entity id that can be resolved
// to a human-readable name.
type ResolvableKind = "tournaments" | "teams" | "users";

const ID_COLLECTIONS: Record<string, ResolvableKind> = {
  tournaments: "tournaments",
  teams: "teams",
  users: "users",
};

type Crumb = {
  label: string;
  href: string;
  isLast: boolean;
  resolve?: { kind: ResolvableKind; id: string };
};

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const staticLabel = ROUTE_LABELS[href] ?? SEGMENT_LABELS[segment];
    const parent = segments[i - 1];
    const kind = !staticLabel && parent ? ID_COLLECTIONS[parent] : undefined;
    return {
      label: staticLabel ?? segment,
      href,
      isLast: i === segments.length - 1,
      resolve: kind ? { kind, id: segment } : undefined,
    };
  });
}

type CrumbLabelProps = { id: string; fallback: string };

function TournamentCrumbLabel({ id, fallback }: CrumbLabelProps) {
  const data = useQuery(api.tournaments.getDetails, {
    tournamentId: id as Id<"tournaments">,
  });
  return <>{data?.tournament.name ?? fallback}</>;
}

function TeamCrumbLabel({ id, fallback }: CrumbLabelProps) {
  const data = useQuery(api.teams.getDetails, { teamId: id as Id<"teams"> });
  return <>{data?.team.name ?? fallback}</>;
}

function UserCrumbLabel({ id, fallback }: CrumbLabelProps) {
  const data = useQuery(api.users.getDetails, { userId: id as Id<"users"> });
  return <>{data?.user.name ?? fallback}</>;
}

const RESOLVERS: Record<
  ResolvableKind,
  (props: CrumbLabelProps) => React.ReactNode
> = {
  tournaments: TournamentCrumbLabel,
  teams: TeamCrumbLabel,
  users: UserCrumbLabel,
};

function CrumbLabel({ crumb }: { crumb: Crumb }) {
  if (!crumb.resolve) return <>{crumb.label}</>;
  const Resolver = RESOLVERS[crumb.resolve.kind];
  return <Resolver id={crumb.resolve.id} fallback={crumb.label} />;
}

export function HeaderBreadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>
                  <CrumbLabel crumb={crumb} />
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href}>
                    <CrumbLabel crumb={crumb} />
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
