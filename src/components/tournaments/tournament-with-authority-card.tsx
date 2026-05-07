"use client";

import {
  BarChart3,
  Calendar,
  ChevronRight,
  Edit,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import type { TournamentWithAuthority } from "../../../convex/tournaments";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { getStatusBadge } from "./utils";

type Props = {
  tournament: TournamentWithAuthority;
};

export function TournamentWithAuthorityCard({ tournament }: Props) {
  const { format } = useFormattedDate();
  const { authority, teamCount } = tournament;

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        {/* Header: name + status */}
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>
            <Button
              variant="link"
              className="h-min cursor-pointer p-0 font-semibold text-base leading-none tracking-tight"
              asChild
            >
              <Link href={`/tournaments/${tournament._id}`}>
                <span className="text-wrap">{tournament.name}</span>
              </Link>
            </Button>
          </CardTitle>
          {getStatusBadge(tournament)}
        </div>

        {/* Description */}
        {tournament.description && (
          <CardDescription className="line-clamp-2">
            {tournament.description}
          </CardDescription>
        )}

        {/* Common metadata */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {teamCount} team{teamCount === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(tournament.startDate, "short")} –{" "}
            {format(tournament.endDate, "short")}
          </div>
        </div>

        {/* Reviewer call-out: only when pending > 0 */}
        {authority.canReview && authority.pendingReviewCount > 0 && (
          <Link href="/reviewer" className="block">
            <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-secondary-foreground text-sm">
              <Trophy className="h-4 w-4 shrink-0" />
              Review queue ({authority.pendingReviewCount} pending)
            </div>
          </Link>
        )}

        {/* TeamMember context */}
        {authority.team && (
          <div className="rounded-md border px-3 py-2 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Link
                href={`/teams/${authority.team._id}`}
                className="hover:underline"
              >
                Your Team: {authority.team.name}
              </Link>
              {authority.team.isCaptain && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 text-xs"
                >
                  <Shield className="h-3 w-3" />
                  Captain
                </Badge>
              )}
            </div>
            <div className="mt-1 text-muted-foreground">
              {authority.team.points} pts · {authority.team.approvedSubmissions}
              /{authority.team.totalSubmissions} submissions approved
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {authority.canManage && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/tournaments?edit=${tournament._id}`}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tournaments/${tournament._id}/leaderboard`}>
                  <BarChart3 className="h-4 w-4" />
                  Leaderboard
                </Link>
              </Button>
            </>
          )}
          {!authority.canManage && (
            <Button asChild>
              <Link href={`/tournaments/${tournament._id}`}>
                <span>Browse Teams</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TournamentWithAuthorityCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-9 w-28" />
      </CardContent>
    </Card>
  );
}
