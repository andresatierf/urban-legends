import { Link } from "@tanstack/react-router";
import { FileText, Plus, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QuickActionsPanelProps {
  hasActiveTeams: boolean;
}

export function QuickActionsPanel({ hasActiveTeams }: QuickActionsPanelProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-4 font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            asChild
          >
            <Link to="/tournaments">
              <Trophy className="h-5 w-5" />
              <span className="text-wrap text-center text-xs">
                Browse Tournaments
              </span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            asChild
          >
            <Link to="/submissions">
              <FileText className="h-5 w-5" />
              <span className="text-wrap text-center text-xs">
                My Submissions
              </span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            asChild
          >
            <Link to="/teams">
              <Users className="h-5 w-5" />
              <span className="text-wrap text-center text-xs">My Teams</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            disabled={!hasActiveTeams}
            asChild={hasActiveTeams}
          >
            {hasActiveTeams ? (
              <Link to={"/submissions/new" as never}>
                <Plus className="h-5 w-5" />
                <span className="text-wrap text-center text-xs">
                  New Submission
                </span>
              </Link>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="text-wrap text-center text-xs">
                  New Submission
                </span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
