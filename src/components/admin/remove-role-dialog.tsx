"use client";

import { useMutation } from "convex/react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";
import z from "zod";
import { useAppForm } from "@/hooks/form";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { FieldGroup } from "../ui/field";

const createFormSchema = (isSelfAdminRemoval: boolean, roleName: string) =>
  z.object({
    confirmation: isSelfAdminRemoval
      ? z
          .string()
          .refine(
            (val) => val === roleName,
            `Type "${roleName}" to confirm removal`,
          )
      : z.string().optional(),
  });

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  userName: string;
  roleName: string;
  isSelf: boolean;
  currentUserId: Id<"users">;
};

export function RemoveRoleDialog({
  open,
  onOpenChange,
  userId,
  userName,
  roleName,
  isSelf,
}: Props) {
  const formId = useId();
  const removeUserRole = useMutation(api.admin.removeUserRole);

  const isAdminRole = roleName === "admin";
  const isSelfAdminRemoval = isSelf && isAdminRole;

  const formSchema = createFormSchema(isSelfAdminRemoval, roleName);

  const form = useAppForm({
    defaultValues: {
      confirmation: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async () => {
      try {
        await removeUserRole({ userId, roleName });
        toast.success(`${roleName} role removed from ${userName}`);
        onOpenChange(false);
        form.reset();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to remove role",
        );
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        form.reset();
      }}
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {roleName} Role</DialogTitle>
            <DialogDescription>
              {isSelfAdminRemoval
                ? "You are about to remove admin privileges from yourself. This action cannot be undone without another admin."
                : `Remove the ${roleName} role from ${userName}?`}
            </DialogDescription>
          </DialogHeader>

          {isSelfAdminRemoval && (
            <div className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-red-900">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>Warning: Self-Demotion</span>
              </div>
              <p className="text-sm">
                You will lose administrative privileges and access to admin
                features. Another admin will need to restore your admin role if
                needed.
              </p>
            </div>
          )}

          {isSelfAdminRemoval && (
            <FieldGroup>
              <form.AppField name="confirmation">
                {(field) => (
                  <field.TextField
                    label={`Type "${roleName}" to confirm`}
                    placeholder={roleName}
                  />
                )}
              </form.AppField>
            </FieldGroup>
          )}

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  form={formId}
                  color="destructive"
                  disabled={isSubmitting || !canSubmit}
                >
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  Remove Role
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
