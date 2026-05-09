"use client";

import { CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemServiceStatusProps {
  services: {
    convex: string;
    clerk: string;
    database: string;
  };
}

export function SystemServiceStatus({ services }: SystemServiceStatusProps) {
  const getStatusBadge = (status: string) => {
    if (status === "healthy") {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Healthy
        </Badge>
      );
    }
    return <Badge variant="destructive">Unhealthy</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm font-medium">Convex Backend</span>
          {getStatusBadge(services.convex)}
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm font-medium">Clerk Auth</span>
          {getStatusBadge(services.clerk)}
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm font-medium">Database</span>
          {getStatusBadge(services.database)}
        </div>
      </CardContent>
    </Card>
  );
}
