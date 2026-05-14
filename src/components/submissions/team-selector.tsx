"use client";

import { useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Doc, Id } from "../../../convex/_generated/dataModel";

interface TeamSelectorProps {
  teams: Array<Doc<"teams"> & { tournament?: Doc<"tournaments"> | null }>;
  selectedTeamId?: Id<"teams">;
  onTeamChange: (teamId: Id<"teams">) => void;
  label?: string;
  className?: string;
}

const STORAGE_KEY = "selectedTeamId";

export function TeamSelector({
  teams,
  selectedTeamId,
  onTeamChange,
  label = "Team",
  className,
}: TeamSelectorProps) {
  useEffect(() => {
    if (!selectedTeamId && teams.length > 0) {
      const savedTeamId = localStorage.getItem(STORAGE_KEY);
      if (savedTeamId && teams.some((t) => t._id === savedTeamId)) {
        onTeamChange(savedTeamId as Id<"teams">);
      } else {
        onTeamChange(teams[0]._id);
      }
    }
  }, [teams, selectedTeamId, onTeamChange]);

  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem(STORAGE_KEY, selectedTeamId);
    }
  }, [selectedTeamId]);

  if (teams.length === 0) {
    return null;
  }

  const selectedTeam = teams.find((t) => t._id === selectedTeamId);

  return (
    <Select
      value={selectedTeamId || undefined}
      onValueChange={(value) => onTeamChange(value as Id<"teams">)}
    >
      <SelectTrigger
        className={`border-ink bg-chip dark:bg-chip text-ink hover:bg-chip dark:hover:bg-chip shadow-fd-xs !h-auto w-fit gap-[0.5rem] rounded-full border-2 px-[0.75rem] py-[0.25rem] focus-visible:ring-0 ${className ?? ""}`}
      >
        <span className="text-mute text-label-caps font-heading font-extrabold">
          {label}
        </span>
        <span className="text-ink text-body-sm font-semibold">
          <SelectValue placeholder="Select a team...">
            {selectedTeam?.name}
          </SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="border-ink bg-chip text-ink shadow-fd-sm w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] rounded-2xl border-2"
      >
        {teams.map((team) => (
          <SelectItem
            key={team._id}
            value={team._id}
            className="text-ink focus:bg-ink/10 text-body-sm font-semibold"
          >
            <div className="flex flex-col items-start">
              <span>{team.name}</span>
              {team.tournament && (
                <span className="text-mute text-label-caps font-heading font-extrabold">
                  {team.tournament.name}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
