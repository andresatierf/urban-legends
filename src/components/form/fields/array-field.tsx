import { useStore } from "@tanstack/react-form";
import type React from "react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useFieldContext } from "@/hooks/form-context";

export type ArrayFieldProps<T> = {
  label: string;
  items: T[];
  children: (item: T) => React.ReactNode;
};

export function ArrayField<T>({
  label,
  items,
  children,
}: ArrayFieldProps<T>): React.ReactElement {
  const field = useFieldContext<string[]>();

  const [isInvalid, errors] = useStore(field.store, (state) => [
    state.meta.isTouched && !state.meta.isValid,
    state.meta.errors,
  ]);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <FieldGroup>{items.map((item) => children(item))}</FieldGroup>
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
