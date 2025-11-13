"use client";

import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { useAppForm } from "@/hooks/form";
import { useUser } from "@/hooks/useUser";
import { toastFormValues } from "@/lib/form";
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
import { Field, FieldGroup, FieldLabel } from "../ui/field";

const formSchema = z.object({
  roles: z.array(z.string()),
});

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userId: Id<"users">;
  userName: string;
  currentRoles: string[];
  children?: React.ReactNode;
};

export function ManageRolesFormDialog({
  open: controlledOpen,
  onOpenChange,
  userId,
  userName,
  currentRoles,
  children,
}: Props) {
  const { user, isDev } = useUser();
  const formId = useId();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const roles = useQuery(api.admin.listRoles);
  const updateRoles = useMutation(api.admin.updateRoles);

  // Sort roles by hierarchy (most access to least access)
  const sortedRoles = roles?.toSorted((a, b) => {
    return (a.hierarchy ?? 999) - (b.hierarchy ?? 999);
  });

  const form = useAppForm({
    defaultValues: {
      roles: currentRoles || [],
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateRoles({ userId, ...value });
        toast.success("Roles updated successfully!");
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update roles",
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
        {children ? (
          <DialogTrigger asChild>{children}</DialogTrigger>
        ) : (
          controlledOpen === undefined &&
          onOpenChange === undefined && (
            <DialogTrigger asChild>
              <Button>Manage roles</Button>
            </DialogTrigger>
          )
        )}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Roles for {userName}</DialogTitle>
            <DialogDescription>
              Select roles for this user. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>

          {sortedRoles && (
            <FieldGroup>
              <form.AppField name="roles" mode="array">
                {(field) => (
                  <field.ArrayField label="Roles" roles={sortedRoles}>
                    {(role) => {
                      return (
                        <Field
                          key={role._id}
                          orientation="horizontal"
                          className="flex items-start"
                        >
                          <Checkbox
                            id={`role-${role._id}`}
                            name={field.name}
                            checked={field.state.value.includes(role.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.pushValue(role.name);
                                return;
                              }

                              const index = field.state.value.indexOf(
                                role.name,
                              );
                              if (index > -1) field.removeValue(index);
                            }}
                          />
                          <div className="flex-1">
                            <FieldLabel
                              htmlFor={`role-${role._id}`}
                              className="cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {role.displayName}
                            </FieldLabel>
                            <p className="mt-1 text-muted-foreground text-sm">
                              {role.description}
                            </p>
                          </div>
                        </Field>
                      );
                    }}
                  </field.ArrayField>
                )}
              </form.AppField>
            </FieldGroup>
          )}

          <form.Subscribe
            selector={(state) => state.values?.roles.includes("admin")}
          >
            {(hasAdminSelected) => (
              <>
                {!hasAdminSelected &&
                  currentRoles.includes("admin") &&
                  userId === user?._id && (
                    <div className="flex gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-900 text-sm">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <p>
                        This will revoke YOUR administrator privileges. You
                        won't be able to manage users, tournaments or teams, or
                        manage roles anymore.
                      </p>
                    </div>
                  )}
                {hasAdminSelected && !currentRoles.includes("admin") && (
                  <div className="flex gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-900 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>
                      This will grant full administrative privileges to{" "}
                      {userName}, including the ability to manage users,
                      tournaments, and teams.
                    </p>
                  </div>
                )}
              </>
            )}
          </form.Subscribe>

          <form.Subscribe
            selector={(state) => [
              state.isPristine,
              state.canSubmit,
              state.isSubmitting,
            ]}
          >
            {([isPristine, canSubmit, isSubmitting]) => (
              <DialogFooter>
                {isDev && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toastFormValues(form.state.values)}
                  >
                    Check values
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isPristine || isSubmitting}
                  className="mr-auto"
                >
                  Reset
                </Button>
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
                  Save Changes
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
