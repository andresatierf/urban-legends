import { Shield } from "lucide-react";

import { getInitials } from "@/components/users/utils";

import type { UserWithRoles } from "../../../../convex/users";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Eyebrow } from "../../ui/eyebrow";

type Props = {
  submitter: UserWithRoles;
};

export function SubmitterCard({ submitter }: Props) {
  return (
    <Card className="border-card-info-border">
      <CardHeader>
        <Eyebrow as="div" className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          Submitter
        </Eyebrow>
        <CardTitle>Submitted by</CardTitle>
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
