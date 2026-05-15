"use client";

import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useId, useState } from "react";
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
  message: z.string().optional(),
});

type Props = {
  teamId: Id<"teams">;
  teamName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};

export function JoinTeamFormDialog({
  teamId,
  teamName,
  open: controlledOpen,
  onOpenChange,
  children,
}: Props) {
  const formId = useId();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const requestToJoin = useMutation(api.joinRequests.requestToJoin);

  const form = useAppForm({
    defaultValues: {
      message: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value: { message } }) => {
      await tryMutate({
        fn: () =>
          requestToJoin({ teamId, message: message?.trim() || undefined }),
        onSuccess: () => setOpen(false),
        successToast: "Join request sent successfully!",
        defaultFailureToast: "Failed to send join request",
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
            <DialogTitle>Request to Join {teamName}</DialogTitle>
            <DialogDescription>
              Send a request to join this team. The team captain will review
              your request.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <form.AppField name="message">
              {(field) => (
                <field.TextareaField
                  label="Message (optional)"
                  placeholder="Introduce yourself or explain why you want to join..."
                  rows={4}
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
                  disabled={isSubmitting || !canSubmit}
                >
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  Send Request
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
