"use client";

import { useEffect } from "react";

import { PrefixedSelect } from "@/components/ui/prefixed-select";

import type { Doc, Id } from "../../../../convex/_generated/dataModel";

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

  return (
    <PrefixedSelect
      prefix={label}
      value={selectedTeamId}
      onValueChange={(value) => onTeamChange(value as Id<"teams">)}
      placeholder="Select a team..."
      className={className}
      options={teams.map((team) => ({
        value: team._id,
        triggerLabel: team.name,
        children: (
          <div className="flex flex-col items-start">
            <span>{team.name}</span>
            {team.tournament && (
              <span className="text-mute text-body-sm font-normal">
                {team.tournament.name}
              </span>
            )}
          </div>
        ),
      }))}
    />
  );
}
