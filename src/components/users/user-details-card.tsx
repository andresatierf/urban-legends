import { DetailsCard } from "../details-card";

type Props = {
  user: any;
  className?: string;
};

export const UserDetailsCard = ({ user, className }: Props) => {
  if (!user) return null; // TODO: Add skeleton

  const details = [{ key: "roles", value: user.roles?.join(", ") }];

  return (
    <DetailsCard title={user.email} details={details} className={className} />
  );
};
