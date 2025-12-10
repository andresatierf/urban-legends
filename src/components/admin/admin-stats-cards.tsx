"use client";

import { FileText, Trophy, UserCog, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminStatsCardsProps {
  stats: {
    totalUsers: number;
    totalTournaments: number;
    totalTeams: number;
    totalSubmissions: number;
  };
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Users</CardTitle>
          <UserCog className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.totalUsers}</div>
          <p className="mt-2 text-muted-foreground text-xs">
            Total registered users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Tournaments</CardTitle>
          <Trophy className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.totalTournaments}</div>
          <p className="mt-2 text-muted-foreground text-xs">
            All tournaments in system
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Teams</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.totalTeams}</div>
          <p className="mt-2 text-muted-foreground text-xs">
            Active teams across all tournaments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Submissions</CardTitle>
          <FileText className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.totalSubmissions}</div>
          <p className="mt-2 text-muted-foreground text-xs">
            Total submissions received
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
