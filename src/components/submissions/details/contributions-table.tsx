import { Users } from "lucide-react";

import { SectionHeader } from "@/components/section-header";

import type { UserWithRoles } from "../../../../convex/users";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Card } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { getInitials } from "../../users/utils";

type Props = {
  submitter: UserWithRoles;
  teammates: UserWithRoles[];
};

export function ContributionsTable({ submitter, teammates }: Props) {
  const participants = [
    { ...submitter, isSubmitter: true as const },
    ...teammates.map((t) => ({ ...t, isSubmitter: false as const })),
  ];
  const share = participants.length > 0 ? 100 / participants.length : 0;

  return (
    <>
      <SectionHeader as="h2" title="Contributions" Icon={Users} />
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p, i) => (
                <TableRow
                  key={p._id}
                  className={p.isSubmitter ? "bg-card-info-from/40" : undefined}
                >
                  <TableCell className="text-muted-foreground w-12 text-center">
                    #{i + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage src={p.imageUrl} />
                        <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.isSubmitter ? (
                      <Badge variant="info">Submitter</Badge>
                    ) : (
                      <Badge variant="neutral">Member</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs">
                        {share.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
