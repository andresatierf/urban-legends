"use client";

import {
  Crown,
  LogIn,
  LogOut,
  Search,
  Settings,
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
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  type DemoTeam,
  DEMO_TEAMS,
  DEMO_USER_TEAMS,
  filterTeams,
  getCaptain,
  getInitials,
  getTournament,
  getTournamentStatus,
  isFull,
  sortMembersCapFirst,
} from "./team-listing-fixtures";

const MAX_AVATARS = 5;

function VariantATeamCard({
  team,
  showActions,
}: {
  team: DemoTeam;
  showActions: "member" | "visitor";
}) {
  const tournament = getTournament(team.tournamentId);
  const full = isFull(team);
  const captain = getCaptain(team);
  const sorted = sortMembersCapFirst(team.members);
  const visibleMembers = sorted.slice(0, MAX_AVATARS);
  const overflow = sorted.length - visibleMembers.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{team.name}</CardTitle>
          <Badge variant={team.joinPolicy === "open" ? "default" : "secondary"}>
            {team.joinPolicy === "open" ? "Open" : "Closed"}
          </Badge>
          {full && <Badge variant="destructive">Full</Badge>}
        </div>
        <CardAction>
          <span className="text-muted-foreground text-right text-xs tabular-nums">
            {team.points.toLocaleString()} pts
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {tournament && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Trophy className="size-3.5 shrink-0" />
            <span className="truncate">{tournament.name}</span>
            <Badge variant="outline" className="ml-auto shrink-0">
              {getTournamentStatus(tournament)}
            </Badge>
          </div>
        )}

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Users className="size-3.5 shrink-0" />
          <span>
            {team.members.length}
            {team.maxMembers ? ` / ${team.maxMembers}` : ""} members
          </span>
          {team.maxMembers && (
            <div className="bg-muted ml-auto h-1.5 w-16 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full ${full ? "bg-destructive" : "bg-primary"}`}
                style={{
                  width: `${Math.min(100, (team.members.length / team.maxMembers) * 100)}%`,
                }}
              />
            </div>
          )}
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
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Crown className="size-3 text-amber-500" />
              <span className="max-w-24 truncate">{captain.name}</span>
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        {showActions === "member" ? (
          <>
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="size-3" />
              Manage
            </Button>
            <Button variant="ghost" size="sm">
              <LogOut className="size-3" />
              Leave
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              className="flex-1"
              disabled={full || team.joinPolicy === "closed"}
            >
              <LogIn className="size-3" />
              Join
            </Button>
            <Button variant="outline" size="sm">
              View
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

function TeamSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search teams…"
        className="border-border bg-background placeholder:text-muted-foreground focus:ring-ring h-7 w-full rounded-md border py-1 pr-2.5 pl-8 text-xs outline-none focus:ring-1"
      />
    </div>
  );
}

export function TeamListingVariantA() {
  const [search, setSearch] = useState("");
  const filteredUser = filterTeams(DEMO_USER_TEAMS, search);
  const filteredAll = filterTeams(DEMO_TEAMS, search);

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Teams"
        description="Card grid with tabbed Your / All split, search, and capacity bars"
      />

      <TeamSearch value={search} onChange={setSearch} />

      <Tabs defaultValue="your-teams">
        <TabsList variant="line">
          <TabsTrigger value="your-teams">
            Your Teams ({filteredUser.length})
          </TabsTrigger>
          <TabsTrigger value="all-teams">
            All Teams ({filteredAll.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="your-teams">
          {filteredUser.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              You haven't joined any teams yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredUser.map((team) => (
                <VariantATeamCard
                  key={team._id}
                  team={team}
                  showActions="member"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-teams">
          {filteredAll.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No teams match your search.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredAll.map((team) => (
                <VariantATeamCard
                  key={team._id}
                  team={team}
                  showActions={team.isUserTeam ? "member" : "visitor"}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
