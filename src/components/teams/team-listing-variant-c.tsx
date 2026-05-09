"use client";

import {
  Crown,
  LogIn,
  LogOut,
  Search,
  Settings,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  type DemoTeam,
  type DemoTournament,
  DEMO_TEAMS,
  DEMO_TOURNAMENTS,
  getCaptain,
  getInitials,
  getTournamentStatus,
  isFull,
  sortMembersCapFirst,
} from "./team-listing-fixtures";

const MAX_AVATARS = 4;

function TournamentColumnCard({ team }: { team: DemoTeam }) {
  const full = isFull(team);
  const captain = getCaptain(team);
  const sorted = sortMembersCapFirst(team.members);
  const visibleMembers = sorted.slice(0, MAX_AVATARS);
  const overflow = sorted.length - visibleMembers.length;

  return (
    <Card size="sm" className={team.isUserTeam ? "ring-primary/30 ring-2" : ""}>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {team.isUserTeam && (
              <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
            )}
            <CardTitle className="min-w-0 truncate">{team.name}</CardTitle>
          </div>
          <div className="flex shrink-0 gap-1">
            <Badge
              variant={team.joinPolicy === "open" ? "default" : "secondary"}
            >
              {team.joinPolicy === "open" ? "Open" : "Closed"}
            </Badge>
            {full && <Badge variant="destructive">Full</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="size-3" />
            <span className="tabular-nums">
              {team.members.length}
              {team.maxMembers ? ` / ${team.maxMembers}` : ""}
            </span>
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {team.points.toLocaleString()} pts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AvatarGroup>
            {visibleMembers.map((m) => (
              <Avatar key={m._id} size="sm">
                <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
              </Avatar>
            ))}
            {overflow > 0 && <AvatarGroupCount>+{overflow}</AvatarGroupCount>}
          </AvatarGroup>
          {captain && (
            <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
              <Crown className="size-2.5 text-amber-500" />
              <span className="max-w-16 truncate">{captain.name}</span>
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-1.5">
        {team.isUserTeam ? (
          <>
            <Button variant="outline" size="xs" className="flex-1">
              <Settings className="size-2.5" />
              Manage
            </Button>
            <Button variant="ghost" size="xs">
              <LogOut className="size-2.5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="xs"
              className="flex-1"
              disabled={full || team.joinPolicy === "closed"}
            >
              <LogIn className="size-2.5" />
              Join
            </Button>
            <Button variant="outline" size="xs">
              View
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

function TournamentColumn({
  tournament,
  teams,
}: {
  tournament: DemoTournament;
  teams: DemoTeam[];
}) {
  const status = getTournamentStatus(tournament);
  const userTeamCount = teams.filter((t) => t.isUserTeam).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border bg-card sticky top-0 z-10 flex items-center gap-2 rounded-lg border px-3 py-2">
        <Trophy className="text-muted-foreground size-4 shrink-0" />
        <span className="min-w-0 truncate text-sm font-medium">
          {tournament.name}
        </span>
        <Badge variant="outline" className="ml-auto shrink-0">
          {status}
        </Badge>
      </div>

      <div className="text-muted-foreground flex items-center gap-3 px-1 text-xs">
        <span>
          {teams.length} team{teams.length !== 1 ? "s" : ""}
        </span>
        {userTeamCount > 0 && (
          <span className="flex items-center gap-0.5">
            <Star className="size-2.5 fill-amber-400 text-amber-400" />
            {userTeamCount} yours
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {teams.map((team) => (
          <TournamentColumnCard key={team._id} team={team} />
        ))}
      </div>
    </div>
  );
}

function filterTeams(teams: DemoTeam[], query: string): DemoTeam[] {
  if (!query) return teams;
  const q = query.toLowerCase();
  return teams.filter((t) => t.name.toLowerCase().includes(q));
}

export function TeamListingVariantC() {
  const [search, setSearch] = useState("");

  const filtered = filterTeams(DEMO_TEAMS, search);

  const tournamentsWithTeams = DEMO_TOURNAMENTS.map((t) => ({
    tournament: t,
    teams: filtered.filter((team) => team.tournamentId === t._id),
  })).filter(({ teams }) => teams.length > 0);

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Teams"
        description="Tournament-grouped columns — teams organized by the tournament they belong to"
      />

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams…"
          className="border-border bg-background placeholder:text-muted-foreground focus:ring-ring h-7 w-full rounded-md border py-1 pr-2.5 pl-8 text-xs outline-none focus:ring-1"
        />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <Star className="size-3 fill-amber-400 text-amber-400" />
        <span className="text-muted-foreground">= Your team</span>
      </div>

      {tournamentsWithTeams.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No teams match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {tournamentsWithTeams.map(({ tournament, teams }) => (
            <TournamentColumn
              key={tournament._id}
              tournament={tournament}
              teams={teams}
            />
          ))}
        </div>
      )}
    </div>
  );
}
