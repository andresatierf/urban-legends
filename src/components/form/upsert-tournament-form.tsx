import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import * as z from "zod";
import { useAppForm } from "@/hooks/form";
import { useUser } from "@/hooks/useUser";
import { toastFormValues } from "@/lib/form";
import { tryMutate } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
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
  name: z.string().min(1, "Name can't be empty"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Please select a start date"),
  endDate: z.string().min(1, "Please select an end date"),
  teamMinSize: z.number().min(1, "Team minimum size must be at least 1"),
  teamMaxSize: z.number().min(1, "Team maximum size must be at least 1"),
  maxSubmissionsPerDay: z.number().int().min(1).optional(),
  // Scoring configuration
  scoringConfig: z
    .object({
      individualPoints: z.object({
        base: z.number().min(0, "Points must be non-negative"),
        advanced: z.number().min(0, "Points must be non-negative"),
      }),
      teamExercisePoints: z.object({
        base: z.number().min(0, "Points must be non-negative"),
        advanced: z.number().min(0, "Points must be non-negative"),
      }),
      teamExerciseThreshold: z
        .number()
        .min(0, "Threshold must be between 0 and 1")
        .max(1, "Threshold must be between 0 and 1"),
    })
    .optional(),
});

type UpsertTournamentFormProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  tournament?: Doc<"tournaments">;
  children?: React.ReactNode;
};

export function UpsertTournamentFormDialog({
  open: controlledOpen,
  onOpenChange,
  tournament,
  children,
}: UpsertTournamentFormProps) {
  const { isDev } = useUser();
  const formId = useId();
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const upsertTournament = useMutation(api.tournaments.upsert);

  const form = useAppForm({
    defaultValues: {
      name: tournament?.name ?? "",
      description: tournament?.description ?? "",
      startDate: tournament?.startDate ?? "",
      endDate: tournament?.endDate ?? "",
      teamMinSize: tournament?.teamMinSize ?? 1,
      teamMaxSize: tournament?.teamMaxSize ?? 5,
      maxSubmissionsPerDay: tournament?.maxSubmissionsPerDay ?? undefined,
      scoringConfig: tournament?.scoringConfig ?? {
        individualPoints: { base: 2, advanced: 3 },
        teamExercisePoints: { base: 20, advanced: 30 },
        teamExerciseThreshold: 0.5,
      },
    } as z.input<typeof formSchema>,
    validators: {
      onChange: formSchema,
      // onBlur: formSchema,
      // onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await tryMutate({
        fn: () => upsertTournament({ ...value, _id: tournament?._id }),
        onSuccess: (upsertedId) => {
          router.push(`/tournaments/${upsertedId}`);
          setOpen(false);
        },
        successToast: `Tournament ${tournament ? "updated" : "created"} successfully!`,
        defaultFailureToast: `Failed to ${tournament ? "update" : "create"} tournament`,
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
        className="flex"
      >
        {children ? (
          <DialogTrigger asChild>{children}</DialogTrigger>
        ) : (
          controlledOpen === undefined &&
          onOpenChange === undefined && (
            <DialogTrigger asChild>
              <Button>
                {tournament ? "Edit Tournament" : "Create Tournament"}
              </Button>
            </DialogTrigger>
          )
        )}
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {tournament ? "Edit Tournament" : "Create Tournament"}
            </DialogTitle>
            <DialogDescription>
              {tournament
                ? "Edit the tournament details"
                : "Create a new tournament"}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label="Name"
                  placeholder="The name of the tournament"
                />
              )}
            </form.AppField>
            <form.AppField name="description">
              {(field) => (
                <field.TextareaField
                  label="Description"
                  placeholder="Add a description of the event"
                />
              )}
            </form.AppField>
            <FieldGroup className="flex-row">
              <form.AppField
                name="teamMinSize"
                validators={{
                  onChangeListenTo: ["teamMaxSize"],
                  onChange: ({ value, fieldApi }) => {
                    if (value > fieldApi.form.getFieldValue("teamMaxSize")) {
                      return {
                        message:
                          "Team minimum size must be lesser than team maximum size",
                      };
                    }
                  },
                }}
              >
                {(field) => <field.NumberField label="Minimum Team Size" />}
              </form.AppField>
              <form.AppField
                name="teamMaxSize"
                validators={{
                  onChangeListenTo: ["teamMinSize"],
                  onChange: ({ value, fieldApi }) => {
                    if (value < fieldApi.form.getFieldValue("teamMinSize")) {
                      return {
                        message:
                          "Team maximum size must be greater than team minimum size",
                      };
                    }
                  },
                }}
              >
                {(field) => <field.NumberField label="Maximum Team Size" />}
              </form.AppField>
            </FieldGroup>
            <form.AppField name="maxSubmissionsPerDay">
              {(field) => (
                <field.NumberField
                  label="Max Submissions Per Day (leave empty for unlimited)"
                  placeholder="Unlimited"
                />
              )}
            </form.AppField>
            <FieldGroup className="flex-row">
              <form.AppField
                name="startDate"
                validators={{
                  onChangeListenTo: ["endDate"],
                  onChange: ({ value, fieldApi }) => {
                    const endDate = fieldApi.form.getFieldValue("endDate");
                    if (endDate && new Date(value) >= new Date(endDate)) {
                      return {
                        message: "Start date must be before end date",
                      };
                    }
                  },
                }}
              >
                {(field) => <field.DateField label="Start Date" />}
              </form.AppField>
              <form.AppField
                name="endDate"
                validators={{
                  onChangeListenTo: ["startDate"],
                  onChange: ({ value, fieldApi }) => {
                    const startDate = fieldApi.form.getFieldValue("startDate");
                    if (startDate && new Date(value) <= new Date(startDate)) {
                      return {
                        message: "End date must be after start date",
                      };
                    }
                  },
                }}
              >
                {(field) => <field.DateField label="End Date" />}
              </form.AppField>
            </FieldGroup>

            <div className="space-y-4">
              <div className="font-medium text-sm">Scoring Configuration</div>
              <div className="space-y-3">
                <div className="font-medium text-muted-foreground text-xs">
                  Individual Exercise Points
                </div>
                <FieldGroup className="flex-row">
                  <form.AppField name="scoringConfig.individualPoints.base">
                    {(field) => <field.NumberField label="Base Tier" />}
                  </form.AppField>
                  <form.AppField name="scoringConfig.individualPoints.advanced">
                    {(field) => <field.NumberField label="Advanced Tier" />}
                  </form.AppField>
                </FieldGroup>

                <div className="font-medium text-muted-foreground text-xs">
                  Team Exercise Points
                </div>
                <FieldGroup className="flex-row">
                  <form.AppField name="scoringConfig.teamExercisePoints.base">
                    {(field) => <field.NumberField label="Base Tier" />}
                  </form.AppField>
                  <form.AppField name="scoringConfig.teamExercisePoints.advanced">
                    {(field) => <field.NumberField label="Advanced Tier" />}
                  </form.AppField>
                </FieldGroup>

                <form.AppField name="scoringConfig.teamExerciseThreshold">
                  {(field) => (
                    <field.NumberField
                      label="Team Exercise Threshold (0-1)"
                      step="0.1"
                      min="0"
                      max="1"
                    />
                  )}
                </form.AppField>
              </div>
            </div>
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
                  {tournament ? "Update Tournament" : "Create Tournament"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </DialogContent>
      </form>
    </Dialog>
  );
}
