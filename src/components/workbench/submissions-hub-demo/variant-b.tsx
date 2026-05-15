"use client";

import { CalendarCheck2, FileCheck, Gavel, Plus, User } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import { DEMO_CALENDAR_STATS, DEMO_MY_TEAMS } from "./fixtures";
import { MockCalendar } from "./mock-calendar";
import { MockReviewList } from "./mock-review-list";
import { MockSubmissionList } from "./mock-submission-list";
import { DemoHeader } from "./role-context";

const SECTIONS = [
  {
    id: "mine",
    label: "My activity",
    Icon: User,
    color: "text-success",
    eyebrow: "Player",
  },
  {
    id: "queue",
    label: "Review queue",
    Icon: Gavel,
    color: "text-warning",
    eyebrow: "Reviewer",
  },
  {
    id: "manage",
    label: "Manage all",
    Icon: FileCheck,
    color: "text-social",
    eyebrow: "Manager",
  },
] as const;

export function SubmissionsHubVariantB() {
  const [active, setActive] = useState<(typeof SECTIONS)[number]["id"]>("mine");

  return (
    <div className="space-y-6">
      <DemoHeader
        variant="Variant B · Stacked hub"
        blurb="All three role surfaces stacked into one scroll. Left rail acts as anchor nav + role context — the page is one hub, not three apps."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card variant="deep" size="sm" className="gap-2">
            <Eyebrow>Jump to</Eyebrow>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map(({ id, label, Icon, eyebrow }) => (
                <a
                  key={id}
                  href={`#hub-${id}`}
                  onClick={() => setActive(id)}
                  className={cn(
                    "hover:bg-accent flex items-center gap-2 rounded-md border-2 border-transparent px-2 py-1.5 text-xs transition-colors",
                    active === id &&
                      "border-foreground bg-card shadow-[2px_2px_0_var(--color-shadow)]",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] opacity-60">{eyebrow}</span>
                    <span className="font-semibold">{label}</span>
                  </div>
                </a>
              ))}
            </nav>

            <div className="border-border/40 mt-3 space-y-1 border-t pt-3">
              <Eyebrow>Today</Eyebrow>
              <Button size="sm" className="w-full">
                <Plus className="size-3.5" /> Log activity
              </Button>
              <p className="text-muted-foreground mt-1 text-[10px]">
                {DEMO_CALENDAR_STATS.streak}-day streak active
              </p>
            </div>
          </Card>
        </aside>

        <div className="space-y-12">
          <section id="hub-mine" className="scroll-mt-4 space-y-3">
            <SectionLabel
              eyebrow="Player"
              title="My activity"
              hint={`${DEMO_CALENDAR_STATS.approved} approved · ${DEMO_CALENDAR_STATS.pending} pending this month`}
              Icon={User}
            />
            <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,360px)]">
              <MockCalendar />
              <div className="space-y-3">
                <TeamSummary />
                <MockSubmissionList />
              </div>
            </div>
          </section>

          <section id="hub-queue" className="scroll-mt-4 space-y-3">
            <SectionLabel
              eyebrow="Reviewer"
              title="Review queue"
              hint="Inline approve / reject across your assigned tournaments."
              Icon={Gavel}
              badge={
                <Badge variant="warning" size="sm">
                  5 pending
                </Badge>
              }
            />
            <MockReviewList filter="pending" showFilters={false} />
          </section>

          <section id="hub-manage" className="scroll-mt-4 space-y-3">
            <SectionLabel
              eyebrow="Manager"
              title="Manage all submissions"
              hint="Search, filter, and resolve across teams and tournaments."
              Icon={CalendarCheck2}
            />
            <MockReviewList filter="all" showFilters />
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({
  eyebrow,
  title,
  hint,
  Icon,
  badge,
}: {
  eyebrow: string;
  title: string;
  hint: string;
  Icon: typeof User;
  badge?: React.ReactNode;
}) {
  return (
    <div className="border-border flex items-center gap-3 border-b-2 pb-3">
      <Icon className="text-foreground/70 size-5" />
      <div className="flex-1">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-h2 text-foreground">{title}</h2>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      {badge}
    </div>
  );
}

function TeamSummary() {
  return (
    <Card size="sm" className="gap-2">
      <Eyebrow>My teams</Eyebrow>
      {DEMO_MY_TEAMS.map((t) => (
        <div
          key={t._id}
          className="border-border/50 flex items-center justify-between border-b py-1.5 last:border-b-0"
        >
          <div>
            <div className="text-sm font-semibold">{t.name}</div>
            <div className="text-muted-foreground text-[10px]">
              {t.tournamentName}
            </div>
          </div>
          <div className="text-right">
            <Badge variant="warning" size="xs">
              #{t.rank}/{t.totalTeams}
            </Badge>
            <div className="text-muted-foreground mt-0.5 text-[10px]">
              {t.points} pts
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}
