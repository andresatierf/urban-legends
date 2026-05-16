"use client";

import { Loader2 } from "lucide-react";
import { useId, useState } from "react";
import z from "zod";

import { useAppForm } from "@/hooks/form";

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

export type JoinTeamFormValues = { message?: string };

type Props = {
  teamName: string;
  onSubmit: (values: JoinTeamFormValues) => Promise<void> | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};

export function JoinTeamFormDialog({
  teamName,
  onSubmit,
  open: controlledOpen,
  onOpenChange,
  children,
}: Props) {
  const formId = useId();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const form = useAppForm({
    defaultValues: {
      message: "",
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value: { message } }) => {
      await onSubmit({ message: message?.trim() || undefined });
      setOpen(false);
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
        {children && <DialogTrigger render={children as React.ReactElement} />}
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
                <DialogClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                    />
                  }
                >
                  Cancel
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
