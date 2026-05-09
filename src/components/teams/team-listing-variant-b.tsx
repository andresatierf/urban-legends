"use client";

import {
  ChevronDown,
  ChevronRight,
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
  type DemoTeam,
  DEMO_OTHER_TEAMS,
  DEMO_USER_TEAMS,
  filterTeams,
  getCaptain,
  getInitials,
  getTournament,
  isFull,
  sortMembersCapFirst,
} from "./team-listing-fixtures";

const MAX_AVATARS = 3;

function TeamRow({ team, isMember }: { team: DemoTeam; isMember: boolean }) {
  const tournament = getTournament(team.tournamentId);
  const full = isFull(team);
  const captain = getCaptain(team);
  const sorted = sortMembersCapFirst(team.members);
  const visibleMembers = sorted.slice(0, MAX_AVATARS);
  const overflow = sorted.length - visibleMembers.length;

  return (
    <div className="border-border hover:bg-muted/40 flex items-center gap-3 border-b px-3 py-2 transition-colors last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-foreground min-w-0 truncate text-sm font-medium">
          {team.name}
        </span>
        <Badge variant={team.joinPolicy === "open" ? "default" : "secondary"}>
          {team.joinPolicy === "open" ? "Open" : "Closed"}
        </Badge>
        {full && <Badge variant="destructive">Full</Badge>}
      </div>

      <div className="text-muted-foreground hidden items-center gap-1.5 text-xs sm:flex">
        <Trophy className="size-3 shrink-0" />
        <span className="max-w-32 truncate">{tournament?.name ?? "—"}</span>
      </div>

      <div className="text-muted-foreground hidden items-center gap-1 text-xs md:flex">
        <Users className="size-3 shrink-0" />
        <span className="tabular-nums">
          {team.members.length}
          {team.maxMembers ? `/${team.maxMembers}` : ""}
        </span>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
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
            <span className="max-w-20 truncate">{captain.name}</span>
          </span>
        )}
      </div>

      <span className="text-muted-foreground hidden text-xs tabular-nums xl:inline">
        {team.points.toLocaleString()} pts
      </span>

      <div className="flex shrink-0 items-center gap-1">
        {isMember ? (
          <>
            <Button variant="outline" size="xs">
              <Settings className="size-2.5" />
              Manage
            </Button>
            <Button variant="ghost" size="xs">
              <LogOut className="size-2.5" />
            </Button>
          </>
        ) : (
          <>
            <Button size="xs" disabled={full || team.joinPolicy === "closed"}>
              <LogIn className="size-2.5" />
              Join
            </Button>
            <Button variant="outline" size="xs">
              View
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="bg-muted/50 hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors"
      >
        {open ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        {title}
        <Badge variant="outline">{count}</Badge>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export function TeamListingVariantB() {
  const [search, setSearch] = useState("");
  const filteredUser = filterTeams(DEMO_USER_TEAMS, search);
  const filteredOther = filterTeams(DEMO_OTHER_TEAMS, search);

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Teams"
        description="Compact list rows with collapsible sections and inline actions"
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

      <div className="hidden items-center gap-3 px-3 text-xs sm:flex">
        <span className="text-muted-foreground flex-1 font-medium">Team</span>
        <span className="text-muted-foreground hidden w-36 font-medium sm:block">
          Tournament
        </span>
        <span className="text-muted-foreground hidden w-12 font-medium md:block">
          Size
        </span>
        <span className="text-muted-foreground hidden w-40 font-medium lg:block">
          Roster
        </span>
        <span className="text-muted-foreground hidden w-16 text-right font-medium xl:block">
          Points
        </span>
        <span className="w-24" />
      </div>

      <CollapsibleSection
        title="Your Teams"
        count={filteredUser.length}
        defaultOpen={true}
      >
        {filteredUser.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-xs">
            No teams to show.
          </p>
        ) : (
          filteredUser.map((team) => (
            <TeamRow key={team._id} team={team} isMember={true} />
          ))
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="All Teams"
        count={filteredOther.length}
        defaultOpen={true}
      >
        {filteredOther.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-xs">
            No teams to show.
          </p>
        ) : (
          filteredOther.map((team) => (
            <TeamRow key={team._id} team={team} isMember={false} />
          ))
        )}
      </CollapsibleSection>
    </div>
  );
}
