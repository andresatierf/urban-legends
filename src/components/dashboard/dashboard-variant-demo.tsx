"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DashboardVariantA } from "./dashboard-variant-a";
import { DashboardVariantB } from "./dashboard-variant-b";
import { DashboardVariantC } from "./dashboard-variant-c";
import {
  DASHBOARD_ADMIN_FIXTURE,
  DASHBOARD_USER_FIXTURE,
} from "./dashboard-variant-fixtures";

export function DashboardVariantDemo({
  variant,
}: {
  variant: "a" | "b" | "c";
}) {
  const [persona, setPersona] = useState<"user" | "admin">("admin");
  const data =
    persona === "admin" ? DASHBOARD_ADMIN_FIXTURE : DASHBOARD_USER_FIXTURE;

  const Variant = VARIANT_MAP[variant];

  return (
    <div className="space-y-6">
      {/* Persona toggle */}
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

const VARIANT_MAP = {
  a: DashboardVariantA,
  b: DashboardVariantB,
  c: DashboardVariantC,
} as const;

const VARIANT_LABELS = {
  a: "Variant A — Command Center (Action-First)",
  b: "Variant B — Overview Hub (Status-First)",
  c: "Variant C — Activity Stream (Feed-First)",
} as const;
