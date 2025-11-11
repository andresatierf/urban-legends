import { createFormHook } from "@tanstack/react-form";
import { lazy } from "react";
import { fieldContext, formContext } from "./form-context";

const ComboboxField = lazy(
  () => import("../components/form/fields/combobox-field"),
);
const DateField = lazy(() => import("../components/form/fields/date-field"));
const NumberField = lazy(
  () => import("../components/form/fields/number-field"),
);
const SelectField = lazy(
  () => import("../components/form/fields/select-field"),
);
const TextField = lazy(() => import("../components/form/fields/text-field"));
const TextareaField = lazy(
  () => import("../components/form/fields/textarea-field"),
);

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    ComboboxField,
    DateField,
    NumberField,
    SelectField,
    TextField,
    TextareaField,
  },
  formComponents: {},
  fieldContext,
  formContext,
});
