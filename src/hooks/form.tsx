import { createFormHook } from "@tanstack/react-form";

import { ArrayField } from "@/components/form/fields/array-field";
import { ComboboxField } from "@/components/form/fields/combobox-field";
import { DateField } from "@/components/form/fields/date-field";
import { NumberField } from "@/components/form/fields/number-field";
import { SelectField } from "@/components/form/fields/select-field";
import { TextField } from "@/components/form/fields/text-field";
import { TextareaField } from "@/components/form/fields/textarea-field";

import { fieldContext, formContext } from "./form-context";

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    ArrayField,
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
