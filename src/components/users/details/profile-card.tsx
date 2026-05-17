import { Mail } from "lucide-react";

import { RolesBadgeList } from "@/components/users/roles-badge-list";
import { getInitials } from "@/components/users/utils";

import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Card, CardContent } from "../../ui/card";
import { Eyebrow } from "../../ui/eyebrow";
import { RibbonBanner } from "../../ui/ribbon-banner";
import type { UserDetails } from "./types";

export function ProfileCard({ data }: { data: UserDetails }) {
  const { user, statistics } = data;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 text-center">
        {statistics.totalPointsEarned > 0 && (
          <RibbonBanner
            label={`${statistics.totalPointsEarned} pts on the board`}
            small
          />
        )}
        <Avatar className="size-24 border-[3px]">
          <AvatarImage src={user.imageUrl} alt={user.name} />
          <AvatarFallback className="text-h2">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <Eyebrow as="div" color="sunset">
            Player profile
          </Eyebrow>
          <p className="text-h3 break-words">{user.name}</p>
          <p className="text-body-sm text-muted-foreground flex items-center justify-center gap-1.5 break-all">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {user.email}
          </p>
        </div>
        <RolesBadgeList roles={user.roleNames} className="justify-center" />
      </CardContent>
    </Card>
  );
}
