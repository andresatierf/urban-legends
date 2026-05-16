import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "../ui/empty";
import { InvitationCard } from "./invitation-card";

type InvitationProps = React.ComponentProps<typeof InvitationCard> & {
  key: string;
};

type Props = {
  title: string;
  itemLabel: { singular: string; plural: string };
  emptyTitle: string;
  emptyDescription: string;
  emptyClassName?: string;
  loading?: boolean;
  pendingOnly?: boolean;
  hidePendingHeader?: boolean;
  pendingHeading?: string;
  pastHeading?: string;
  invitations: InvitationProps[];
};

export function InvitationsList({
  title,
  itemLabel,
  emptyTitle,
  emptyDescription,
  emptyClassName,
  loading = false,
  pendingOnly = false,
  hidePendingHeader = false,
  pendingHeading,
  pastHeading,
  invitations,
}: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pending = invitations.filter((i) => i.invitation.status === "pending");
  const past = invitations.filter((i) => i.invitation.status !== "pending");
  const visiblePast = pendingOnly ? [] : past;
  const isEmpty =
    invitations.length === 0 || (pendingOnly && pending.length === 0);

  if (isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>No pending {itemLabel.plural}</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty className={emptyClassName}>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {pending.length} pending {pluralize(itemLabel, pending.length)}
          {visiblePast.length > 0 &&
            ` · ${visiblePast.length} past ${pluralize(itemLabel, visiblePast.length)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pending.length > 0 && (
          <div className="space-y-3">
            {!hidePendingHeader && (
              <h3 className="text-sm font-medium">
                {pendingHeading ?? `Pending ${capitalize(itemLabel.plural)}`}
              </h3>
            )}
            {pending.map(({ key, ...props }) => (
              <InvitationCard key={key} {...props} />
            ))}
          </div>
        )}

        {visiblePast.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              {pastHeading ?? `Past ${capitalize(itemLabel.plural)}`}
            </h3>
            {visiblePast.map(({ key, ...props }) => (
              <InvitationCard key={key} {...props} className="bg-muted/50" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function pluralize(label: { singular: string; plural: string }, count: number) {
  return count === 1 ? label.singular : label.plural;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
