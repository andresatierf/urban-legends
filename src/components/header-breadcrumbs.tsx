import { Link, useRouterState } from "@tanstack/react-router";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { ROUTE_LABELS, SEGMENT_LABELS } from "@/lib/route-labels";

type Crumb = {
  label: string;
  href: string;
  isLast: boolean;
};

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = ROUTE_LABELS[href] ?? SEGMENT_LABELS[segment] ?? segment;
    return {
      label,
      href,
      isLast: i === segments.length - 1,
    };
  });
}

export function HeaderBreadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <>
      <Separator
        orientation="vertical"
        className="mx-1 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb) => (
            <Fragment key={crumb.href}>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
