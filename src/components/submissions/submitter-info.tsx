import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Doc } from "../../../convex/_generated/dataModel";
import { getInitials } from "../users/utils";

interface SubmitterInfoProps {
  submitter: Doc<"users"> & { roleNames: string[] };
  teammates: (Doc<"users"> & { roleNames: string[] })[];
}

export function SubmitterInfo({ submitter, teammates }: SubmitterInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{getInitials(submitter.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{submitter.name}</p>
                <Badge variant="secondary">Submitter</Badge>
                {submitter.roleNames.includes("admin") && (
                  <Badge variant="default">Admin</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{submitter.email}</p>
            </div>
          </div>

          {teammates.length > 0 && (
            <>
              <hr />
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm font-medium">
                  Teammates ({teammates.length})
                </p>
                {teammates.map((teammate) => (
                  <div key={teammate._id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(teammate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{teammate.name}</p>
                        {teammate.roleNames.includes("admin") && (
                          <Badge variant="default">Admin</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {teammate.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
