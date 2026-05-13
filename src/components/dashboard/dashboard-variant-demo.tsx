"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DashboardVariantE } from "./dashboard-variant-e";
import { DashboardVariantF } from "./dashboard-variant-f";
import {
  DASHBOARD_ADMIN_FIXTURE,
  DASHBOARD_USER_FIXTURE,
  type DashboardFixtureData,
} from "./dashboard-variant-fixtures";
import { DashboardVariantH } from "./dashboard-variant-h";
import { DashboardVariantM } from "./dashboard-variant-m";
import { DashboardVariantN } from "./dashboard-variant-n";
import { DashboardVariantP } from "./dashboard-variant-p";
import { DashboardVariantT } from "./dashboard-variant-t";
import { DashboardVariantU } from "./dashboard-variant-u";

type VariantKey = "e" | "f" | "h" | "m" | "n" | "p" | "t" | "u";

export function DashboardVariantDemo({ variant }: { variant: VariantKey }) {
  const [persona, setPersona] = useState<"user" | "admin">("admin");
  const data =
    persona === "admin" ? DASHBOARD_ADMIN_FIXTURE : DASHBOARD_USER_FIXTURE;

  const Variant = VARIANT_MAP[variant];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground text-sm font-medium">
          Viewing as:
        </span>
        <Tabs
          value={persona}
          onValueChange={(v) => setPersona(v as "user" | "admin")}
        >
          <TabsList>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
        </Tabs>
        <Badge variant="outline">{VARIANT_LABELS[variant]}</Badge>
      </div>

      <Variant data={data} />
    </div>
  );
}

const VARIANT_MAP: Record<
  VariantKey,
  (props: { data: DashboardFixtureData }) => React.ReactNode
> = {
  e: DashboardVariantE,
  f: DashboardVariantF,
  h: DashboardVariantH,
  m: DashboardVariantM,
  n: DashboardVariantN,
  p: DashboardVariantP,
  t: DashboardVariantT,
  u: DashboardVariantU,
};

const VARIANT_LABELS: Record<VariantKey, string> = {
  e: "Variant E — Aurora Glass (Dark Editorial Luxury)",
  f: "Variant F — Riso Pop Zine (Playful Memphis)",
  h: "Variant H — Sketchnote (Hand-Drawn Notebook)",
  m: "Variant M — Stride (Fitness Tracker)",
  n: "Variant N — Field Day (Office Sports Day)",
  p: "Variant P — Locker Room (Chalkboard Tale of the Tape)",
  t: "Variant T — Arcade HUD (Coin-Op High Score)",
  u: "Variant U — Sports Almanac (Editorial Yearbook)",
};
