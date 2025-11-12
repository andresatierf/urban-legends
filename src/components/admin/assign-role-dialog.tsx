"use client";

import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userId: Id<"users">;
  userName: string;
  currentRoles: string[];
  children?: React.ReactNode;
};

export function AssignRoleDialog({
  open: controlledOpen,
  onOpenChange,
  userId,
  userName,
  currentRoles,
  children,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(
    new Set(currentRoles),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const addUserRole = useMutation(api.admin.addUserRole);
  const removeUserRole = useMutation(api.admin.removeUserRole);
  const rolesData = useQuery(api.admin.listRoles);

  // Sort roles by hierarchy (most access to least access)
  const roles = rolesData?.slice().sort((a, b) => {
    return (a.hierarchy ?? 999) - (b.hierarchy ?? 999);
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset to current roles when closing
      setSelectedRoles(new Set(currentRoles));
    }
  };

  const handleRoleToggle = (roleName: string, checked: boolean) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(roleName);
      } else {
        next.delete(roleName);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentRolesSet = new Set(currentRoles);
      const rolesToAdd = Array.from(selectedRoles).filter(
        (role) => !currentRolesSet.has(role),
      );
      const rolesToRemove = Array.from(currentRolesSet).filter(
        (role) => !selectedRoles.has(role),
      );

      // Add new roles
      for (const roleName of rolesToAdd) {
        await addUserRole({ userId, roleName });
      }

      // Remove unselected roles
      for (const roleName of rolesToRemove) {
        await removeUserRole({ userId, roleName });
      }

      if (rolesToAdd.length > 0 || rolesToRemove.length > 0) {
        toast.success(`Roles updated for ${userName}`);
      }

      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update roles",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges =
    selectedRoles.size !== currentRoles.length ||
    !Array.from(selectedRoles).every((role) => currentRoles.includes(role));

  const hasAdminSelected = selectedRoles.has("admin");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Manage Roles for {userName}</DialogTitle>
            <DialogDescription>
              Select roles for this user. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {roles?.map((role) => (
              <div key={role._id} className="flex items-start gap-3">
                <Checkbox
                  id={`role-${role._id}`}
                  checked={selectedRoles.has(role.name)}
                  onCheckedChange={(checked) =>
                    handleRoleToggle(role.name, checked === true)
                  }
                  disabled={isSubmitting}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`role-${role._id}`}
                    className="cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {role.displayName}
                  </Label>
                  {role.description && (
                    <p className="mt-1 text-muted-foreground text-sm">
                      {role.description}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {hasAdminSelected && !currentRoles.includes("admin") && (
              <div className="flex gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-900 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  This will grant full administrative privileges to {userName},
                  including the ability to manage users, tournaments, and teams.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !hasChanges}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
