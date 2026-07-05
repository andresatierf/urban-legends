"use client";

import { Link } from "@tanstack/react-router";
import { Activity, FileText, Plus, Trophy, UserCog, Users } from "lucide-react";

import { UpsertTournamentFormDialog } from "@/components/tournaments/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminQuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground text-xl font-semibold">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UpsertTournamentFormDialog>
          <Button variant="outline" className="h-auto max-w-full flex-1">
            <Plus className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">Create Tournament</div>
              <div className="text-muted-foreground mt-1 text-xs">
                Set up a new tournament
              </div>
            </div>
          </Button>
        </UpsertTournamentFormDialog>

        <Button variant="outline" className="h-auto flex-1" asChild>
          <Link to="/users">
            <UserCog className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">Manage Users</div>
              <div className="text-muted-foreground mt-1 text-xs">
                View and manage user roles
              </div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-1" asChild>
          <Link to="/activities/review">
            <FileText className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">View Activities</div>
              <div className="text-muted-foreground mt-1 text-xs">
                Review and approve
              </div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-1" asChild>
          <Link to={"/manage/tournaments" as never}>
            <Trophy className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">All Tournaments</div>
              <div className="text-muted-foreground mt-1 text-xs">
                Manage tournaments
              </div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-1" asChild>
          <Link to="/teams">
            <Users className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">View Teams</div>
              <div className="text-muted-foreground mt-1 text-xs">
                Browse all teams
              </div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-1" asChild>
          <Link to="/admin/system">
            <Activity className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">System Health</div>
              <div className="text-muted-foreground mt-1 text-xs">
                Monitor platform status
              </div>
            </div>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
