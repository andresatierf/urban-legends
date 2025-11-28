"use client";

import { Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Id } from "../../../convex/_generated/dataModel";

interface TournamentDiscoveryCardProps {
  tournament: {
    _id: Id<"tournaments">;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
  };
  teamCount: number;
  topTeam: {
    name: string;
    points: number;
  } | null;
}

export function TournamentDiscoveryCard({
  tournament,
  teamCount,
  topTeam,
}: TournamentDiscoveryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {tournament.name}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {tournament.description}
            </CardDescription>
          </div>
          <Badge variant="approved">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            {teamCount} team{teamCount === 1 ? "" : "s"}
          </div>
          {topTeam && (
            <div className="text-muted-foreground">
              Leading: <span className="font-medium">{topTeam.name}</span> (
              {topTeam.points} pts)
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tournaments/${tournament._id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
