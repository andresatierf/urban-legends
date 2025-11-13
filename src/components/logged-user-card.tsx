import { useClerk } from "@clerk/nextjs";
import { DoorOpen } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { getHighestRankingRole, getInitials } from "./users/utils";

export function LoggedUserCard() {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (user === undefined) return null; // TODO: add skeleton

  return (
    <Link href={`/users/${user._id}`}>
      <Card className="transition hover:bg-muted">
        <CardContent className="flex items-center gap-2 p-3">
          <Avatar>
            <AvatarImage />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <p className="truncate font-medium text-sm">{user.name}</p>
            <p className="text-muted-foreground text-xs">
              {getHighestRankingRole(user.roles)}
            </p>
          </div>
          <Button size="icon" onClick={() => signOut()} className="ml-auto">
            <DoorOpen className="size-5" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
