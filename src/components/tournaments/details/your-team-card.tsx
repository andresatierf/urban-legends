import { Link } from "@tanstack/react-router";
import { Crown, Shield } from "lucide-react";

import { getInitials } from "@/components/users/utils";

import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import type { TournamentDetails } from "./types";

type Props = {
  userTeam: NonNullable<TournamentDetails["userTeam"]>;
};

export function YourTeamCard({ userTeam }: Props) {
  return (
    <Card className="border-card-info-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="text-primary h-4 w-4" />
          <CardTitle>Your Team</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{userTeam.name}</span>
          <span className="text-sm font-bold">{userTeam.points} pts</span>
        </div>
        <div className="space-y-1.5">
          {userTeam.members.map((m) => (
            <div key={m._id} className="flex items-center gap-2 text-xs">
              <Avatar size="sm">
                <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{m.name}</span>
              {m.memberRole === "captain" && (
                <Crown className="h-3 w-3 shrink-0 text-amber-500" />
              )}
            </div>
          ))}
        </div>
        <Button size="sm" className="w-full" asChild>
          <Link to="/teams/$teamId" params={{ teamId: userTeam._id }}>
            View Team
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
