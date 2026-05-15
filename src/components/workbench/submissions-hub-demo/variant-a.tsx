"use client";

import { Calendar, ChevronDown, List, Plus } from "lucide-react";
import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { DEMO_MY_TEAMS } from "./fixtures";
import { MockCalendar } from "./mock-calendar";
import { MockReviewList } from "./mock-review-list";
import { MockCalendarStats } from "./mock-stats";
import { MockSubmissionList } from "./mock-submission-list";
import {
  DEMO_ROLES,
  DemoHeader,
  DemoRoleSwitcher,
  type DemoRole,
} from "./role-context";

export function SubmissionsHubVariantA() {
  const [role, setRole] = useState<DemoRole>("player");

  return (
    <div className="space-y-6">
      <DemoHeader
        variant="Variant A · Role-routed segments"
        blurb="Three roles, three dedicated panels. One viewer, one job at a time — switching is a deliberate context change."
      />
      <DemoRoleSwitcher role={role} setRole={setRole} />

      <SectionHeader
        as="h1"
        title="Submissions"
        description={DEMO_ROLES.find((r) => r.value === role)?.description}
      />

      {role === "player" && <PlayerPanel />}
      {role === "reviewer" && <ReviewerPanel />}
      {role === "manager" && <ManagerPanel />}
    </div>
  );
}

function PlayerPanel() {
  const [team, setTeam] = useState(DEMO_MY_TEAMS[0]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TeamPicker team={team} onChange={setTeam} />
        <Button>
          <Plus className="size-4" /> New submission
        </Button>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="ml-auto">
          <TabsTrigger value="calendar">
            <Calendar className="mr-2 size-4" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="mr-2 size-4" /> List
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <MockCalendar />
            <MockCalendarStats />
          </div>
        </TabsContent>
        <TabsContent value="list">
          <MockSubmissionList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TeamPicker({
  team,
  onChange,
}: {
  team: (typeof DEMO_MY_TEAMS)[number];
  onChange: (t: (typeof DEMO_MY_TEAMS)[number]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-foreground bg-card hover:bg-accent inline-flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-left text-xs shadow-[2px_2px_0_var(--color-shadow)]"
      >
        <div>
          <Eyebrow>Team</Eyebrow>
          <div className="text-foreground text-sm font-semibold">
            {team.name}
          </div>
          <div className="text-muted-foreground text-[10px]">
            {team.tournamentName} · #{team.rank}/{team.totalTeams}
          </div>
        </div>
        <ChevronDown className="text-muted-foreground size-4" />
      </button>
      {open && (
        <div className="border-foreground bg-card absolute z-10 mt-2 w-72 rounded-lg border-2 p-1 shadow-[3px_3px_0_var(--color-shadow)]">
          {DEMO_MY_TEAMS.map((t) => (
            <button
              key={t._id}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={cn(
                "hover:bg-accent w-full rounded-md p-2 text-left text-xs",
                team._id === t._id && "bg-accent",
              )}
            >
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-muted-foreground text-[10px]">
                {t.tournamentName} · #{t.rank}/{t.totalTeams} · {t.points} pts
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewerPanel() {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <Eyebrow color="gold">Pending queue</Eyebrow>
          <Badge variant="warning" size="sm">
            5 awaiting
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Approve or reject inline — no search, no filters. Aimed at fast
          single-purpose triage.
        </p>
        <MockReviewList filter="pending" showFilters={false} />
      </CardContent>
    </Card>
  );
}

function ManagerPanel() {
  return (
    <Tabs defaultValue="pending" className="flex flex-col gap-4">
      <TabsList className="self-end">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="done">Done</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <MockReviewList filter="all" showFilters />
      </TabsContent>
      <TabsContent value="pending">
        <MockReviewList filter="pending" showFilters />
      </TabsContent>
      <TabsContent value="done">
        <MockReviewList filter="done" showFilters />
      </TabsContent>
    </Tabs>
  );
}
