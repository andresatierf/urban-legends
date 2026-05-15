"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import z from "zod";

import { useAppForm } from "@/hooks/form";
import { tryMutate } from "@/lib/utils";

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
  newCaptainId: z.custom<Id<"users">>(
    (val) => typeof val === "string" && val.length >= 1,
    "Please select a new captain",
  ),
});

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  teamId: Id<"teams">;
  isViewerCaptain?: boolean;
  children?: React.ReactNode;
};

export function TransferCaptaincyFormDialog({
  open: controlledOpen,
  onOpenChange,
  teamId,
  isViewerCaptain = false,
  children,
}: Props) {
  const formId = useId();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const transferCaptaincy = useMutation(api.teams.transferCaptaincy);
  const teamMembers = useQuery(
    api.teams.listTeamMembers,
    teamId ? { teamId } : "skip",
  );

  const memberOptions = useMemo(
    () =>
      teamMembers
        ?.filter((member) => member.role !== "captain")
        .map((member) => ({
          value: member._id,
          label: `${member.name || "unknown name"} (${member.email})`,
        })) ?? [],
    [teamMembers],
  );

  const form = useAppForm({
    defaultValues: {
      newCaptainId: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value: { newCaptainId } }) => {
      await tryMutate({
        fn: () => transferCaptaincy({ teamId, newCaptainId }),
        onSuccess: () => {
          setOpen(false);
        },
        successToast: "Captaincy transferred successfully!",
        defaultFailureToast: "Failed to transfer captaincy",
      });
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transfer Captaincy</DialogTitle>
            <DialogDescription>
              {isViewerCaptain
                ? "Select a team member to transfer the captain role to. Once transferred, you will become a regular member and lose captain privileges."
                : "Select a team member to transfer the captain role to. The current captain will be demoted to a regular member."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <form.AppField name="newCaptainId">
              {(field) => (
                <field.SelectField
                  label="New Captain"
                  options={memberOptions}
                />
              )}
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
                  Transfer Captaincy
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
