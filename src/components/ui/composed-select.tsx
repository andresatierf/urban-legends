"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
};

export type SelectOptionGroup<T extends string = string> = {
  label: string;
  items: SelectOption<T>[];
};

export type ComposedSelectProps<T extends string = string> = {
  options: SelectOption<T>[] | SelectOptionGroup<T>[];
  /** Render a horizontal divider between groups (no-op if options aren't grouped). */
  separator?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** Controlled value. */
  value?: T | "";
  /** Uncontrolled initial value. */
  defaultValue?: T;
  onValueChange?: (value: T | "") => void;
  size?: "sm" | "default";
  /** Forwarded to `SelectContent` — pick the side the popup opens toward. */
  side?: "top" | "bottom" | "left" | "right";
  ariaLabel?: string;
  className?: string;
  id?: string;
  name?: string;
  "aria-invalid"?: boolean;
};

function isGrouped<T extends string>(
  options: SelectOption<T>[] | SelectOptionGroup<T>[],
): options is SelectOptionGroup<T>[] {
  return options.length > 0 && "items" in options[0];
}

export function ComposedSelect<T extends string = string>({
  options,
  separator,
  placeholder = "Select an option...",
  disabled,
  value,
  defaultValue,
  onValueChange,
  size,
  side,
  ariaLabel,
  className,
  id,
  name,
  "aria-invalid": ariaInvalid,
}: ComposedSelectProps<T>) {
  const grouped = isGrouped(options);

  const renderItem = (option: SelectOption<T>) => (
    <SelectItem
      key={option.value}
      value={option.value}
      disabled={option.disabled}
    >
      {option.label}
    </SelectItem>
  );

  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.((next ?? "") as T | "")}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger
        id={id}
        size={size}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        className={cn("w-full", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent side={side}>
        {grouped
          ? (options as SelectOptionGroup<T>[]).map((group, index) => (
              <React.Fragment key={group.label || `__group-${index}`}>
                {separator && index > 0 ? <SelectSeparator /> : null}
                <SelectGroup>
                  {group.label ? (
                    <SelectLabel>{group.label}</SelectLabel>
                  ) : null}
                  {group.items.map(renderItem)}
                </SelectGroup>
              </React.Fragment>
            ))
          : (options as SelectOption<T>[]).map(renderItem)}
      </SelectContent>
    </Select>
  );
}
