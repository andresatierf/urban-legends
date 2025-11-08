import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context";
import { Field, FieldError, FieldLabel } from "../../ui/field";
import { Input } from "../../ui/input";

type Props = {
  label: string;
};

export default function NumberField({ label }: Props) {
  const field = useFieldContext<number>();

  const [isInvalid, errors] = useStore(field.store, (state) => [
    state.meta.isTouched && !state.meta.isValid,
    state.meta.errors,
  ]);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel html-for={field.name}>{label}</FieldLabel>
      <Input
        type="number"
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(Number(e.target.value))}
        aria-invalid={isInvalid}
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
