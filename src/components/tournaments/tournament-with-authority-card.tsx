"use client";

import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  ChevronRight,
  Edit,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

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
          <CardTitle>{tournament.name}</CardTitle>
          {getStatusBadge(tournament)}
        </div>

        {/* Description */}
        {tournament.description && (
          <CardDescription className="line-clamp-2">
            {tournament.description}
          </CardDescription>
        )}

        {/* Common metadata */}
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
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
          <Link to="/reviewer" className="block">
            <div className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm">
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
                to="/teams/$teamId"
                params={{ teamId: authority.team._id }}
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
            <div className="text-muted-foreground mt-1">
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
                <Link to={`/admin/tournaments?edit=${tournament._id}` as never}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/tournaments/$tournamentId/leaderboard"
                  params={{ tournamentId: tournament._id }}
                >
                  <BarChart3 className="h-4 w-4" />
                  Leaderboard
                </Link>
              </Button>
            </>
          )}
          {!authority.canManage && (
            <Button asChild>
              <Link
                to="/tournaments/$tournamentId"
                params={{ tournamentId: tournament._id }}
              >
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
