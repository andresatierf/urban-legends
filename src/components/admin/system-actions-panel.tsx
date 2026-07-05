"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "../../../convex/_generated/api";
import { SystemActionsPanelView } from "./system-actions-panel-view";

export function SystemActionsPanel() {
  const runIntegrityCheck = useMutation(api.role.admin.runIntegrityCheck);
  const cleanupOrphanedRecords = useMutation(
    api.role.admin.cleanupOrphanedRecords,
  );

  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const handleIntegrityCheck = async () => {
    setIsCheckingIntegrity(true);
    try {
      const result = await runIntegrityCheck();
      if (result.success) {
        toast.success(result.message, {
          description:
            result.totalIssues > 0
              ? `Found ${result.issuesFound.orphanedTeams} orphaned teams, ${result.issuesFound.orphanedSubmissions} orphaned submissions, ${result.issuesFound.orphanedTeamMembers} orphaned team members`
              : undefined,
        });
      }
    } catch (error) {
      toast.error("Failed to run integrity check", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const result = await cleanupOrphanedRecords();
      if (result.success) {
        toast.success(result.message, {
          description:
            result.deletedCount > 0
              ? `Deleted ${result.deletedCount} orphaned records`
              : undefined,
        });
      }
    } catch (error) {
      toast.error("Failed to cleanup orphaned records", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <SystemActionsPanelView
      isCheckingIntegrity={isCheckingIntegrity}
      isCleaningUp={isCleaningUp}
      onIntegrityCheck={handleIntegrityCheck}
      onCleanup={handleCleanup}
    />
  );
}
