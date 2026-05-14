import { useStore } from "@tanstack/react-form";

import { useFieldContext } from "@/hooks/form-context";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../../ui/field";
import { Slider } from "../../ui/slider";

export type SliderFieldProps = {
  label: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
};

export function SliderField({
  label,
  description,
  min = 0,
  max = 100,
  step = 1,
}: SliderFieldProps) {
  const field = useFieldContext<number>();

  const [isInvalid, errors] = useStore(field.store, (state) => [
    state.meta.isTouched && !state.meta.isValid,
    state.meta.errors,
  ]);

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        <output
          htmlFor={field.name}
          className="text-body-sm text-muted-foreground tabular-nums"
        >
          {field.state.value}
        </output>
      </div>
      <Slider
        id={field.name}
        min={min}
        max={max}
        step={step}
        value={[field.state.value]}
        onValueChange={([v]) => field.handleChange(v)}
        onValueCommit={() => field.handleBlur()}
        aria-invalid={isInvalid}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
