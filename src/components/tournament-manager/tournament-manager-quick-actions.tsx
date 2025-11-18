"use client";

import { BarChart3, FileCheck, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TournamentManagerQuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Create Tournament */}
      <Card className="transition-colors hover:border-primary">
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="h-auto w-full flex-col gap-2 p-6"
            asChild
          >
            <Link href="/admin/tournaments">
              <Plus className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">Create Tournament</div>
                <div className="mt-1 text-muted-foreground text-xs">
                  Set up a new tournament
                </div>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* View Pending Submissions */}
      <Card className="transition-colors hover:border-primary">
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="h-auto w-full flex-col gap-2 p-6"
            asChild
          >
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
        </CardContent>
      </Card>

      {/* Manage Teams */}
      <Card className="transition-colors hover:border-primary">
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="h-auto w-full flex-col gap-2 p-6"
            asChild
          >
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
        </CardContent>
      </Card>

      {/* View Tournaments */}
      <Card className="transition-colors hover:border-primary">
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="h-auto w-full flex-col gap-2 p-6"
            asChild
          >
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
    </div>
  );
}
