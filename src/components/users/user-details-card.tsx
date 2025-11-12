import type { Doc } from "../../../convex/_generated/dataModel";
import { DetailsCard } from "../details-card";

type Props = {
  user: Doc<"users"> & { roles: string[] };
  className?: string;
};

export const UserDetailsCard = ({ user, className }: Props) => {
  if (!user) return null; // TODO: Add skeleton

  const details = [{ key: "roles", value: user.roles?.join(", ") }];

  return (
    <DetailsCard title={user.email} details={details} className={className} />
  );
};
