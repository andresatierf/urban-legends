"use client";

import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
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
  DialogTrigger,
} from "../ui/dialog";
import { FieldGroup } from "../ui/field";

const formSchema = z.object({
  roleName: z.string().min(1, "Please select a role"),
});

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
  const formId = useId();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const addUserRole = useMutation(api.admin.addUserRole);
  const roles = useQuery(api.admin.listRoles);

  const availableRoles = useMemo(
    () =>
      roles
        ?.filter((role) => !currentRoles.includes(role.name))
        .map((role) => ({
          value: role.name,
          label: `${role.name}${role.description ? ` - ${role.description}` : ""}`,
        })) ?? [],
    [roles, currentRoles],
  );

  const form = useAppForm({
    defaultValues: {
      roleName: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value: { roleName } }) => {
      try {
        await addUserRole({ userId, roleName });
        toast.success(`${roleName} role assigned to ${userName}`);
        setOpen(false);
        form.reset();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to assign role",
        );
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
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
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to {userName}</DialogTitle>
            <DialogDescription>
              Select a role to assign to this user. Role changes take effect
              immediately.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <form.AppField name="roleName">
              {(field) => {
                const isAdminRole = field.state.value === "admin";
                return (
                  <>
                    <field.SelectField
                      label="Role"
                      options={availableRoles}
                      placeholder="Select a role"
                    />
                    {isAdminRole && (
                      <div className="mt-2 flex gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-900 text-sm">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <p>
                          This will grant full administrative privileges to{" "}
                          {userName}, including the ability to manage users,
                          tournaments, and teams.
                        </p>
                      </div>
                    )}
                  </>
                );
              }}
            </form.AppField>
          </FieldGroup>

          <form.Subscribe
            selector={(state) => [
              state.isPristine,
              state.canSubmit,
              state.isSubmitting,
            ]}
          >
            {([isPristine, canSubmit, isSubmitting]) => (
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
                  disabled={isSubmitting || isPristine || !canSubmit}
                >
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  Assign Role
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
