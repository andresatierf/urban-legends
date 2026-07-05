import { createFileRoute } from "@tanstack/react-router";

import { SectionHeader } from "@/components/section-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/components/users/utils";

export const Route = createFileRoute(
  "/_protected/workbench/components/group-activity",
)({
  component: GroupActivityWorkbenchPage,
});

type Member = {
  name: string;
  email: string;
  fulfilled: boolean;
  isCreator?: boolean;
  evidenceCount?: number;
};

const partialRoster: Member[] = [
  {
    name: "Captain Cara",
    email: "cara@example.com",
    fulfilled: true,
    isCreator: true,
    evidenceCount: 2,
  },
  {
    name: "Alice",
    email: "alice@example.com",
    fulfilled: true,
    evidenceCount: 1,
  },
  { name: "Bob", email: "bob@example.com", fulfilled: false },
  { name: "Casey", email: "casey@example.com", fulfilled: false },
];

const fullRoster: Member[] = partialRoster.map((m) => ({
  ...m,
  fulfilled: true,
  evidenceCount: m.evidenceCount ?? 1,
}));

function RosterSpecimen({
  title,
  state,
  members,
}: {
  title: string;
  state: "incomplete" | "pending";
  members: Member[];
}) {
  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{title}</div>
            <div className="text-muted-foreground text-xs">Group Activity</div>
          </div>
          <Badge variant={state === "pending" ? "info" : "warning"}>
            {state}
          </Badge>
        </div>
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.email}
              className="flex items-center gap-3 rounded-md border p-2"
            >
              <Avatar>
                <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{m.name}</span>
                  {m.isCreator && (
                    <Badge variant="neutral" className="text-xs">
                      Creator
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">{m.email}</div>
              </div>
              {m.fulfilled ? (
                <Badge variant="success">
                  Fulfilled · {m.evidenceCount ?? 0}
                </Badge>
              ) : (
                <Badge variant="warning">Awaiting</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GroupActivityWorkbenchPage() {
  return (
    <div className="space-y-6">
      <SectionHeader as="h1" title="Group Activity — roster + fulfilment" />
      <div className="text-muted-foreground text-sm">
        Fixture views for the group Activity model (ADR-0009): declared roster,
        distributed Evidence, and the completeness gate before approval.
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <RosterSpecimen
          title="Partial fulfilment"
          state="incomplete"
          members={partialRoster}
        />
        <RosterSpecimen
          title="Full fulfilment"
          state="pending"
          members={fullRoster}
        />
      </div>
    </div>
  );
}
