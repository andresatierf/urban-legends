import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

type Props = {
  field: any;
  label: string;
};

export function NumberField({ field, label }: Props) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

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
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
