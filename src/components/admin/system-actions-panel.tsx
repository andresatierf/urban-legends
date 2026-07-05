"use client";

import { useMutation } from "convex/react";
import { Trash2, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { api } from "../../../convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

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
              ? `Found ${result.issuesFound.orphanedTeams} orphaned teams, ${result.issuesFound.orphanedActivities} orphaned activities, ${result.issuesFound.orphanedTeamMembers} orphaned team members`
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
    <Card>
      <CardHeader>
        <CardTitle>System Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleIntegrityCheck}
          disabled={isCheckingIntegrity}
        >
          <Wrench className="mr-2 h-4 w-4" />
          {isCheckingIntegrity ? "Running..." : "Run Data Integrity Check"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={isCleaningUp}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isCleaningUp ? "Cleaning..." : "Cleanup Orphaned Records"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all orphaned records. This action
              cannot be undone.
            </AlertDialogDescription>
            <AlertDialogAction onClick={handleCleanup}>
              Delete
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
