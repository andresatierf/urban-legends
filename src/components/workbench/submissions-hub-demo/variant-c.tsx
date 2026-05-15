"use client";

import {
  Calendar,
  Check,
  ChevronRight,
  Filter,
  List,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  DEMO_CALENDAR_STATS,
  DEMO_MY_TEAMS,
  DEMO_REVIEW_ITEMS,
} from "./fixtures";
import { MockCalendar } from "./mock-calendar";
import { MockReviewList } from "./mock-review-list";
import { MockSubmissionList } from "./mock-submission-list";
import { DemoHeader } from "./role-context";

type SidePanel = "off" | "review" | "manage";

export function SubmissionsHubVariantC() {
  const [panel, setPanel] = useState<SidePanel>("review");

  return (
    <div className="space-y-6">
      <DemoHeader
        variant="Variant C · Split workspace"
        blurb="Your own activity is always primary on the left. The right rail flips between off, lightweight review, or full management — review/manage never owns the page."
      />

      <div
        className={cn(
          "grid gap-6 transition-[grid-template-columns] duration-300",
          panel === "off"
            ? "grid-cols-1"
            : panel === "review"
              ? "lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
              : "lg:grid-cols-[minmax(0,1fr)_minmax(380px,540px)]",
        )}
      >
        <PlayerWorkspace />
        {panel !== "off" && <SideRail panel={panel} setPanel={setPanel} />}
      </div>

      {panel === "off" && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setPanel("review")}>
            <ChevronRight className="size-4" /> Open reviewer rail
          </Button>
        </div>
      )}
    </div>
  );
}

function PlayerWorkspace() {
  const team = DEMO_MY_TEAMS[0];
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow>Player view</Eyebrow>
          <h1 className="text-h1">{team.name}</h1>
          <p className="text-muted-foreground text-sm">
            {team.tournamentName} · #{team.rank}/{team.totalTeams} ·{" "}
            {DEMO_CALENDAR_STATS.streak}-day streak
          </p>
        </div>
        <Button>
          <Plus className="size-4" /> Log activity
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
          <MockCalendar />
        </TabsContent>
        <TabsContent value="list">
          <MockSubmissionList />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function SideRail({
  panel,
  setPanel,
}: {
  panel: SidePanel;
  setPanel: (p: SidePanel) => void;
}) {
  const pendingCount = DEMO_REVIEW_ITEMS.filter(
    (i) => i.data.state === "pending",
  ).length;
  return (
    <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-center justify-between gap-2">
        <div className="bg-muted text-muted-foreground inline-flex rounded-lg p-[3px]">
          <button
            type="button"
            onClick={() => setPanel("review")}
            className={cn(
              "rounded-md border-2 border-transparent px-3 py-1 text-xs font-medium transition-colors",
              panel === "review" &&
                "border-foreground bg-background text-foreground shadow-[2px_2px_0_var(--color-shadow)]",
            )}
          >
            Review
          </button>
          <button
            type="button"
            onClick={() => setPanel("manage")}
            className={cn(
              "rounded-md border-2 border-transparent px-3 py-1 text-xs font-medium transition-colors",
              panel === "manage" &&
                "border-foreground bg-background text-foreground shadow-[2px_2px_0_var(--color-shadow)]",
            )}
          >
            Manage
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Close rail"
          onClick={() => setPanel("off")}
        >
          <X className="size-4" />
        </Button>
      </div>

      {panel === "review" ? (
        <ReviewRail pending={pendingCount} />
      ) : (
        <ManageRail />
      )}
    </aside>
  );
}

function ReviewRail({ pending }: { pending: number }) {
  const pendingItems = DEMO_REVIEW_ITEMS.filter(
    (i) => i.data.state === "pending",
  ).slice(0, 5);
  return (
    <Card variant="deep" size="sm" className="gap-3">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow color="gold">Review queue</Eyebrow>
          <p className="text-muted-foreground text-xs">
            {pending} awaiting · oldest first
          </p>
        </div>
        <Badge variant="warning" size="sm">
          {pending}
        </Badge>
      </div>
      <div className="space-y-2">
        {pendingItems.map((item) => {
          const team = item.data.team.name;
          const date = new Date(
            item.type === "individual"
              ? item.data.submission.date
              : item.data.group.date,
          );
          const evidenceCount =
            item.type === "individual"
              ? item.data.evidence.length
              : item.data.submitterEvidence.reduce(
                  (acc, s) => acc + s.evidence.length,
                  0,
                );
          return (
            <Card
              key={
                item.type === "individual"
                  ? item.data.submission._id
                  : item.data.group._id
              }
              size="sm"
              className="gap-2 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold">{team}</div>
                  <div className="text-muted-foreground text-[10px]">
                    {date.toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    ·{" "}
                    {item.type === "individual"
                      ? "Individual"
                      : `Team (${item.data.submitters.length})`}{" "}
                    · {evidenceCount} photos
                  </div>
                </div>
                <Badge variant="warning" size="xs">
                  pending
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="grass" className="flex-1">
                  <Check className="size-3.5" /> Approve
                </Button>
                <Button size="sm" variant="destructive" className="flex-1">
                  <X className="size-3.5" /> Reject
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}

function ManageRail() {
  return (
    <Card variant="deep" size="sm" className="gap-3">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow color="plum">Manage all</Eyebrow>
          <p className="text-muted-foreground text-xs">
            Search, filter, sort across teams.
          </p>
        </div>
        <Button size="sm" variant="ghost">
          <Filter className="size-3.5" /> Filters
        </Button>
      </div>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search team / tournament / submitter"
          className="pl-9"
        />
      </div>
      <CardContent className="p-0">
        <Tabs defaultValue="pending" className="flex flex-col gap-2">
          <TabsList className="self-start">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="max-h-[600px] overflow-y-auto pr-1">
              <MockReviewList filter="all" showFilters={false} />
            </div>
          </TabsContent>
          <TabsContent value="pending">
            <div className="max-h-[600px] overflow-y-auto pr-1">
              <MockReviewList filter="pending" showFilters={false} />
            </div>
          </TabsContent>
          <TabsContent value="done">
            <div className="max-h-[600px] overflow-y-auto pr-1">
              <MockReviewList filter="done" showFilters={false} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
