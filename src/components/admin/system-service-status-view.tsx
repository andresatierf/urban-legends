import { CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ServiceStatusMap } from "./system-panel-types";

interface SystemServiceStatusViewProps {
  services: ServiceStatusMap;
}

const ROWS: { label: string; key: keyof ServiceStatusMap }[] = [
  { label: "Convex Backend", key: "convex" },
  { label: "Clerk Auth", key: "clerk" },
  { label: "Database", key: "database" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "healthy") {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Healthy
      </Badge>
    );
  }
  return <Badge variant="error">Unhealthy</Badge>;
}

export function SystemServiceStatusView({
  services,
}: SystemServiceStatusViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ROWS.map(({ label, key }) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <span className="text-sm font-medium">{label}</span>
            <StatusBadge status={services[key]} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
