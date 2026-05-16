import type { FunctionReturnType } from "convex/server";
import { startCase } from "lodash";
import { Settings } from "lucide-react";
import { useMemo, useState } from "react";

import { ManageRolesFormDialog } from "@/components/users/form";
import { cn } from "@/lib/utils";

import type { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DetailsCardSkeleton } from "../ui/details-card-skeleton";
import { RolesBadgeList } from "./roles-badge-list";

interface UserDetailsCardProps {
  data?: FunctionReturnType<typeof api.users.getDetails>;
  className?: string;
}

export const UserDetailsCard = ({ data, className }: UserDetailsCardProps) => {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const details = useMemo(() => {
    if (!data) return [];

    return [
      { key: "name", value: data.user.name },
      { key: "email", value: data.user.email },
      {
        key: "roles",
        value: <RolesBadgeList roles={data.user.roleNames} className="py-2" />,
      },
      { key: "teams", value: `${data.statistics.teamCount}` },
      {
        key: "submissions",
        value: `${data.statistics.submissionCount} (${data.statistics.approvedSubmissionCount} approved)`,
      },
      { key: "points earned", value: `${data.statistics.totalPointsEarned}` },
    ];
  }, [data]);

  if (!data) {
    return <DetailsCardSkeleton detailsCount={3} className={className} />;
  }

  return (
    <>
      <ManageRolesFormDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        userId={data.user._id}
        userName={data.user.name}
        currentRoles={data.user.roleNames}
      />
      <Card className={cn("min-w-fit", className)}>
        <CardHeader>
          <CardTitle className="flex justify-between text-xl">
            {data.user.name}
            {data.canManageRoles && (
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Manage Roles
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {details.map((detail) => (
              <div key={detail.key} className="flex flex-col">
                <strong>{startCase(detail.key)}:</strong>
                <span className="text-muted-foreground">{detail.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
