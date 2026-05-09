"use client";

import { useEffect, useId } from "react";

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
}

const STORAGE_KEY = "selectedTeamId";

export function TeamSelector({
  teams,
  selectedTeamId,
  onTeamChange,
}: TeamSelectorProps) {
  const selectId = useId();

  // Load saved team selection from localStorage on mount
  useEffect(() => {
    if (!selectedTeamId && teams.length > 0) {
      const savedTeamId = localStorage.getItem(STORAGE_KEY);
      if (savedTeamId && teams.some((t) => t._id === savedTeamId)) {
        onTeamChange(savedTeamId as Id<"teams">);
      } else {
        // Default to first team
        onTeamChange(teams[0]._id);
      }
    }
  }, [teams, selectedTeamId, onTeamChange]);

  // Save selection to localStorage whenever it changes
  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem(STORAGE_KEY, selectedTeamId);
    }
  }, [selectedTeamId]);

  const handleValueChange = (value: string) => {
    onTeamChange(value as Id<"teams">);
  };

  if (teams.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="text-sm font-medium">
        Team:
      </label>
      <Select
        value={selectedTeamId || undefined}
        onValueChange={handleValueChange}
      >
        <SelectTrigger id={selectId} className="h-12 w-[280px]">
          <SelectValue placeholder="Select a team..." />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team._id} value={team._id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{team.name}</span>
                {team.tournament && (
                  <span className="text-xs text-gray-500">
                    {team.tournament.name}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
