import { useClerk } from "@clerk/nextjs";
import { DoorOpen } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useSidebar } from "./ui/sidebar";
import { getHighestRankingRole, getInitials } from "./users/utils";

export function LoggedUserCard() {
  const { user } = useUser();
  const { open } = useSidebar();
  const { signOut } = useClerk();

  if (user === undefined) return null; // TODO: add skeleton

  if (!open)
    return (
      <Avatar>
        <AvatarImage />
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
    );

  return (
    <Link href={`/users/${user._id}`} className="transition">
      <Card className={cn("transition hover:bg-muted", { "p-0": !open })}>
        <CardContent
          className={cn("flex items-center gap-2 p-3", { "p-0": !open })}
        >
          <Avatar>
            <AvatarImage />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start truncate">
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-muted-foreground text-xs">
              {getHighestRankingRole(user.roles)}
            </p>
          </div>
          <Button
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              signOut();
            }}
            className={cn("ml-auto", { hidden: !open })}
          >
            <DoorOpen className="size-5" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
