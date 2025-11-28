"use client";

import { Activity, FileText, Plus, Trophy, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpsertTournamentFormDialog } from "../form/upsert-tournament-form";

export function AdminQuickActions() {
  return (
    <Card variant="admin">
      <CardHeader>
        <CardTitle className="font-semibold text-foreground text-xl">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UpsertTournamentFormDialog>
          <Button
            variant="outline"
            color="secondary"
            className="h-auto max-w-full flex-1"
          >
            <Plus className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">Create Tournament</div>
              <div className="mt-1 text-muted-foreground text-xs">
                Set up a new tournament
              </div>
            </div>
          </Button>
        </UpsertTournamentFormDialog>

        <Button variant="outline" className="h-auto flex-1" asChild>
          <Link href="/users">
            <UserCog className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">Manage Users</div>
              <div className="mt-1 text-muted-foreground text-xs">
                View and manage user roles
              </div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-1" asChild>
          <Link href="/manage/submissions">
            <FileText className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">View Submissions</div>
              <div className="mt-1 text-muted-foreground text-xs">
                Review and approve
              </div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-1" asChild>
          <Link href="/manage/tournaments">
            <Trophy className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">All Tournaments</div>
              <div className="mt-1 text-muted-foreground text-xs">
                Manage tournaments
              </div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-1" asChild>
          <Link href="/teams">
            <Users className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">View Teams</div>
              <div className="mt-1 text-muted-foreground text-xs">
                Browse all teams
              </div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-1" asChild>
          <Link href="/admin/system">
            <Activity className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">System Health</div>
              <div className="mt-1 text-muted-foreground text-xs">
                Monitor platform status
              </div>
            </div>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
