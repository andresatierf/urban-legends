import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "../../ui/empty";
import { InvitationCard } from "../card";

type InvitationProps = React.ComponentProps<typeof InvitationCard> & {
  key: string;
};

type ItemLabel = { singular: string; plural: string };

type Props = {
  title: string;
  itemLabel: ItemLabel;
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
    return <ListShell title={title} description="Loading..." />;
  }

  const pending = invitations.filter((i) => i.invitation.status === "pending");
  const past = invitations.filter((i) => i.invitation.status !== "pending");
  const visiblePast = pendingOnly ? [] : past;
  const isEmpty =
    invitations.length === 0 || (pendingOnly && pending.length === 0);

  if (isEmpty) {
    return (
      <ListShell title={title} description={`No pending ${itemLabel.plural}`}>
        <Empty className={emptyClassName}>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </Empty>
      </ListShell>
    );
  }

  const description = [
    `${pending.length} pending ${pluralize(itemLabel, pending.length)}`,
    visiblePast.length > 0 &&
      `${visiblePast.length} past ${pluralize(itemLabel, visiblePast.length)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListShell title={title} description={description}>
      <div className="space-y-4">
        {pending.length > 0 && (
          <Section
            heading={
              hidePendingHeader
                ? undefined
                : (pendingHeading ?? `Pending ${capitalize(itemLabel.plural)}`)
            }
            items={pending}
          />
        )}

        {visiblePast.length > 0 && (
          <Section
            heading={pastHeading ?? `Past ${capitalize(itemLabel.plural)}`}
            items={visiblePast}
            cardClassName="bg-muted/50"
          />
        )}
      </div>
    </ListShell>
  );
}

function ListShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}

function Section({
  heading,
  items,
  cardClassName,
}: {
  heading?: string;
  items: InvitationProps[];
  cardClassName?: string;
}) {
  return (
    <div className="space-y-8">
      {heading && <h3 className="text-sm font-medium">{heading}</h3>}
      {items.map(({ key, className, ...props }) => (
        <InvitationCard
          key={key}
          {...props}
          className={className ?? cardClassName}
        />
      ))}
    </div>
  );
}

function pluralize(label: ItemLabel, count: number) {
  return count === 1 ? label.singular : label.plural;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
