import type { FunctionReturnType } from "convex/server";
import { Settings, Trophy } from "lucide-react";
import { useState } from "react";

import { ManageRolesFormDialog } from "@/components/users/form";
import { getInitials } from "@/components/users/utils";
import { cn } from "@/lib/utils";

import type { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Eyebrow } from "../ui/eyebrow";
import { RibbonBanner } from "../ui/ribbon-banner";
import { RolesBadgeList } from "./roles-badge-list";

interface UserDetailsCardProps {
  data: FunctionReturnType<typeof api.users.getDetails>;
  className?: string;
}

export const UserDetailsCard = ({ data, className }: UserDetailsCardProps) => {
  const [open, setOpen] = useState(false);
  const { user, statistics, teams, canManageRoles } = data;

  const approvalRate =
    statistics.submissionCount > 0
      ? Math.round(
          (statistics.approvedSubmissionCount / statistics.submissionCount) *
            100,
        )
      : null;

  const metrics: {
    label: string;
    value: string;
    note: string;
  }[] = [
    {
      label: "Points",
      value: statistics.totalPointsEarned.toLocaleString(),
      note: "Earned across all tournaments",
    },
    {
      label: "Approved",
      value: statistics.approvedSubmissionCount.toString(),
      note: `of ${statistics.submissionCount} submissions`,
    },
    {
      label: "Approval rate",
      value: approvalRate === null ? "—" : `${approvalRate}%`,
      note: "Approved over total",
    },
    {
      label: "Teams",
      value: statistics.teamCount.toString(),
      note: statistics.teamCount === 1 ? "Tournament" : "Tournaments",
    },
  ];

  return (
    <>
      <ManageRolesFormDialog
        open={open}
        onOpenChange={setOpen}
        userId={user._id}
        userName={user.name}
        currentRoles={user.roleNames}
      />

      <div className={cn("flex flex-col gap-6", className)}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="items-center gap-4 rounded-2xl p-8 text-center">
            {statistics.totalPointsEarned > 0 && (
              <RibbonBanner
                label={`${statistics.totalPointsEarned} pts on the board`}
                small
              />
            )}
            <Avatar className="size-32 border-[3px]">
              <AvatarImage src={user.imageUrl} alt={user.name} />
              <AvatarFallback className="text-display">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <Eyebrow as="div" color="sunset">
                Player profile
              </Eyebrow>
              <p className="text-h1 break-words">{user.name}</p>
              <p className="text-body-sm text-muted-foreground break-all">
                {user.email}
              </p>
            </div>
            <RolesBadgeList roles={user.roleNames} className="justify-center" />
            {canManageRoles && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                className="mt-2"
              >
                <Settings className="h-4 w-4" />
                Manage roles
              </Button>
            )}
          </Card>

          <section className="flex flex-col gap-3">
            <Eyebrow as="div">By the numbers</Eyebrow>
            <dl className="flex flex-col">
              {metrics.map((m, idx) => (
                <div
                  key={m.label}
                  className={cn(
                    "flex items-baseline justify-between gap-6 py-4",
                    idx > 0 && "border-t border-border/10",
                  )}
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <Eyebrow as="div">{m.label}</Eyebrow>
                    <span className="truncate text-body-sm text-muted-foreground">
                      {m.note}
                    </span>
                  </div>
                  <dd className="text-metric text-foreground tabular-nums">
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <Eyebrow as="div">Tournament history</Eyebrow>
          </div>
          {teams.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">
              No tournaments yet.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {teams.map((team, idx) => (
                <li key={team._id}>
                  <Card
                    size="sm"
                    className="flex-row items-center justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="w-8 text-right text-metric tabular-nums text-muted-foreground">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <Eyebrow as="div" className="mb-0.5">
                          {team.tournamentName}
                        </Eyebrow>
                        <p className="truncate text-body-md font-medium">
                          {team.name}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={team.role === "captain" ? "warning" : "neutral"}
                    >
                      {team.role}
                    </Badge>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
};
