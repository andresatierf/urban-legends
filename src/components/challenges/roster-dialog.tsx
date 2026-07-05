import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Loader2, Minus, Plus, Search, Users } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/components/users/utils";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ChallengeItem = FunctionReturnType<
  typeof api.views.challenges.listByTournament
>[number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: ChallengeItem;
};

export function ChallengeRosterDialog({
  open,
  onOpenChange,
  challenge,
}: Props) {
  const players = useQuery(api.views.challenges.tournamentPlayers, {
    tournamentId: challenge.tournamentId,
  });
  const addToRoster = useMutation(api.challenges.addToRoster);
  const removeFromRoster = useMutation(api.challenges.removeFromRoster);
  const [pendingUser, setPendingUser] = useState<Id<"users"> | null>(null);
  const [query, setQuery] = useState("");

  const rosterIds = useMemo(
    () => new Set(challenge.roster.map((r) => r.userId)),
    [challenge.roster],
  );

  const disabled = challenge.state !== "pending";

  const filtered = useMemo(() => {
    if (!players) return undefined;
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q),
    );
  }, [players, query]);

  async function handleToggle(userId: Id<"users">, isOnRoster: boolean) {
    setPendingUser(userId);
    await tryMutate({
      fn: () =>
        isOnRoster
          ? removeFromRoster({ challengeId: challenge._id, userId })
          : addToRoster({ challengeId: challenge._id, userId }),
      defaultFailureToast: isOnRoster
        ? "Failed to remove from roster"
        : "Failed to add to roster",
    });
    setPendingUser(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Roster
          </DialogTitle>
          <DialogDescription>
            {disabled
              ? "This Challenge has been approved — the roster is locked."
              : "Add or remove participants across any team in the tournament."}
          </DialogDescription>
        </DialogHeader>

        <Badge variant="neutral">
          {challenge.roster.length}{" "}
          {challenge.roster.length === 1 ? "participant" : "participants"}
        </Badge>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
          <Input
            className="pl-8"
            placeholder="Search players by name, email, or team"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {filtered === undefined ? (
            <p className="text-body-md text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-body-md text-muted-foreground">
              No players match your search.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map((player) => {
                const isOnRoster = rosterIds.has(player.userId);
                const isPending = pendingUser === player.userId;
                let icon: ReactNode;
                if (isPending) icon = <Loader2 className="animate-spin" />;
                else if (isOnRoster) icon = <Minus />;
                else icon = <Plus />;
                return (
                  <li
                    key={player.userId}
                    className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-md px-2 py-1.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar size="default">
                        {player.imageUrl && (
                          <AvatarImage
                            src={player.imageUrl}
                            alt={player.name}
                          />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(player.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm">{player.name}</div>
                        <div className="text-muted-foreground truncate text-xs">
                          {player.teamName}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isOnRoster ? "outline" : "default"}
                      disabled={disabled || isPending}
                      onClick={() => handleToggle(player.userId, isOnRoster)}
                    >
                      {icon}
                      {isOnRoster ? "Remove" : "Add"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
