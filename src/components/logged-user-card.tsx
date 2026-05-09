import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";

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

  if (user === undefined) return null; // TODO: add skeleton

  if (!open)
    return (
      <Avatar>
        <AvatarImage />
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
    );

  return (
    <Card className={cn("hover:bg-muted transition", { "p-0": !open })}>
      <CardContent
        className={cn("flex items-center gap-2 p-3", { "p-0": !open })}
      >
        <Link
          to="/users/$userId"
          params={{ userId: user._id }}
          className="flex flex-1 items-center gap-2 transition"
        >
          <Avatar>
            <AvatarImage />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start truncate">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-muted-foreground text-xs">
              {getHighestRankingRole(user.roles)}
            </p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto", { hidden: !open })}
          asChild
        >
          <Link to="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
