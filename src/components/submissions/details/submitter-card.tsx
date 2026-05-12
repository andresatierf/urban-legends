import { Shield } from "lucide-react";

import type { UserWithRoles } from "../../../../convex/users";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { getInitials } from "../../users/utils";

type Props = {
  submitter: UserWithRoles;
};

export function SubmitterCard({ submitter }: Props) {
  return (
    <Card className="border-card-info-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="text-primary h-4 w-4" />
          <CardTitle>Submitter</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={submitter.imageUrl} />
            <AvatarFallback>{getInitials(submitter.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{submitter.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {submitter.email}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
