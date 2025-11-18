"use client";

import { BarChart3, FileCheck, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UpsertTournamentFormDialog } from "../form/upsert-tournament-form";

export function TournamentManagerQuickActions() {
  return (
    <Card variant="tournament_manager">
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UpsertTournamentFormDialog>
          <Button variant="outline" className="h-auto max-w-full flex-1">
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
          <Link href="/tournament-manager/submissions">
            <FileCheck className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">Pending Submissions</div>
              <div className="mt-1 text-muted-foreground text-xs">
                Review and approve
              </div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-1" asChild disabled>
          <Link href="/admin/teams">
            <Users className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">Manage Teams</div>
              <div className="mt-1 text-muted-foreground text-xs">
                View all teams
              </div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-1" asChild disabled>
          <Link href="/admin/tournaments">
            <BarChart3 className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">All Tournaments</div>
              <div className="mt-1 text-muted-foreground text-xs">
                View and manage
              </div>
            </div>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
