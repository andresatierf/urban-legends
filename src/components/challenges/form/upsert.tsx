import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useId, useState } from "react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/hooks/form";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

const formSchema = z.object({
  description: z.string().min(1, "Description can't be empty"),
  individualAmount: z.number().min(0, "Amount must be non-negative"),
  teamAmount: z.number().min(0, "Amount must be non-negative"),
  threshold: z
    .number()
    .min(0.01, "Threshold must be between 0.01 and 1")
    .max(1, "Threshold must be between 0.01 and 1"),
});

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  tournamentId: Id<"tournaments">;
  challenge?: Doc<"challenges">;
  children?: React.ReactNode;
};

export function UpsertChallengeFormDialog({
  open: controlledOpen,
  onOpenChange,
  tournamentId,
  challenge,
  children,
}: Props) {
  const formId = useId();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const createChallenge = useMutation(api.challenges.create);
  const editChallenge = useMutation(api.challenges.edit);

  const form = useAppForm({
    defaultValues: {
      description: challenge?.description ?? "",
      individualAmount: challenge?.individualAmount ?? 0,
      teamAmount: challenge?.teamAmount ?? 0,
      threshold: challenge?.threshold ?? 1,
    } as z.input<typeof formSchema>,
    validators: { onChange: formSchema },
    onSubmit: async ({ value }) => {
      await tryMutate({
        fn: () =>
          challenge
            ? editChallenge({ challengeId: challenge._id, ...value })
            : createChallenge({ tournamentId, ...value }),
        onSuccess: () => setOpen(false),
        successToast: `Challenge ${challenge ? "updated" : "created"} successfully!`,
        defaultFailureToast: `Failed to ${challenge ? "update" : "create"} challenge`,
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
      {children ? (
        <DialogTrigger render={children as React.ReactElement} />
      ) : (
        controlledOpen === undefined &&
        onOpenChange === undefined && (
          <DialogTrigger render={<Button />}>
            {challenge ? "Edit Challenge" : "Create Challenge"}
          </DialogTrigger>
        )
      )}
      <DialogContent className="sm:max-w-lg">
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex"
        >
          <DialogHeader>
            <DialogTitle>
              {challenge ? "Edit Challenge" : "Create Challenge"}
            </DialogTitle>
            <DialogDescription>
              {challenge
                ? "Update the challenge's description, amounts, and threshold."
                : "Define a tournament-wide scoring opportunity."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <form.AppField name="description">
              {(field) => (
                <field.TextareaField
                  label="Description"
                  placeholder="What is the challenge?"
                />
              )}
            </form.AppField>
            <FieldGroup className="flex-row">
              <form.AppField name="individualAmount">
                {(field) => <field.NumberField label="Individual amount" />}
              </form.AppField>
              <form.AppField name="teamAmount">
                {(field) => <field.NumberField label="Team amount" />}
              </form.AppField>
            </FieldGroup>
            <form.AppField name="threshold">
              {(field) => (
                <field.NumberField
                  label="Threshold (participation rate, 0.01–1)"
                  step="0.05"
                  min="0.01"
                  max="1"
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
                  disabled={isSubmitting || isPristine || !canSubmit}
                >
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  {challenge ? "Update Challenge" : "Create Challenge"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
