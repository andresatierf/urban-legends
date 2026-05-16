"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import * as React from "react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export type ComboboxOption<T extends string = string> = {
  value: T;
  label: string;
};

export type ComboboxOptionGroup<T extends string = string> = {
  label: string;
  items: ComboboxOption<T>[];
};

type CommonProps<T extends string> = {
  options: ComboboxOption<T>[] | ComboboxOptionGroup<T>[];
  /** Render a horizontal divider between groups (no-op if options aren't grouped). */
  separator?: boolean;
  emptyMessage?: string;
  placeholder?: string;
  /**
   * Visual mode of the closed control:
   * - `"input"` (default, single): full-width input with caret/clear adornments.
   * - `"trigger"` (single only): outline button whose label is the selection; search lives inside the popup.
   *
   * `multiple` always uses a chips presentation regardless of this prop.
   */
  presentation?: "input" | "trigger";
  /** Label shown on the trigger button when nothing is selected (`presentation="trigger"`). */
  triggerPlaceholder?: React.ReactNode;
  /** Leading icon on the trigger button (`presentation="trigger"`). */
  triggerIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  "aria-invalid"?: boolean;
  /** Optional creatable callback. When provided, a `Create "X"` row appears when the typed query has no match. */
  onCreate?: (label: string) => ComboboxOption<T>;
};

type SingleProps<T extends string> = {
  multiple?: false;
  value?: T | "" | null;
  defaultValue?: T;
  onValueChange?: (value: T | "") => void;
};

type MultipleProps<T extends string> = {
  multiple: true;
  value?: readonly T[];
  defaultValue?: readonly T[];
  onValueChange?: (value: T[]) => void;
};

export type ComposedComboboxProps<T extends string = string> = CommonProps<T> &
  (SingleProps<T> | MultipleProps<T>);

type InternalOption<T extends string> = ComboboxOption<T> & {
  /** Set on the synthetic "Create …" item. */
  __create?: string;
};

const CREATE_VALUE_PREFIX = "__create__:";

function isGrouped<T extends string>(
  options: ComboboxOption<T>[] | ComboboxOptionGroup<T>[],
): options is ComboboxOptionGroup<T>[] {
  return options.length > 0 && "items" in options[0];
}

export function ComposedCombobox<T extends string = string>(
  props: ComposedComboboxProps<T>,
) {
  const {
    options,
    separator,
    emptyMessage = "No results found.",
    placeholder = "Search for an item...",
    presentation = "input",
    triggerPlaceholder = "Select…",
    triggerIcon,
    disabled,
    className,
    id,
    name,
    onCreate,
    multiple,
  } = props;
  const ariaInvalid = props["aria-invalid"];

  const grouped = isGrouped(options);
  const flatBase = React.useMemo<ComboboxOption<T>[]>(
    () =>
      grouped
        ? (options as ComboboxOptionGroup<T>[]).flatMap((g) => g.items)
        : (options as ComboboxOption<T>[]),
    [grouped, options],
  );
  const valueToOption = React.useMemo(
    () => new Map(flatBase.map((o) => [o.value, o] as const)),
    [flatBase],
  );

  // ---- Creatable: synthesize a "Create X" item when query has no exact match
  const [query, setQuery] = React.useState("");
  const trimmed = query.trim();
  const lowered = trimmed.toLocaleLowerCase();
  const exactExists = flatBase.some(
    (o) => o.label.trim().toLocaleLowerCase() === lowered,
  );
  const showCreate = Boolean(onCreate) && trimmed !== "" && !exactExists;

  const decoratedItems = React.useMemo<
    ComboboxOption<T>[] | ComboboxOptionGroup<T>[]
  >(() => {
    if (!showCreate) {
      return options;
    }
    const createItem: InternalOption<T> = {
      __create: trimmed,
      value: `${CREATE_VALUE_PREFIX}${lowered}` as T,
      label: `Create "${trimmed}"`,
    };
    if (grouped) {
      return [
        ...(options as ComboboxOptionGroup<T>[]),
        { label: "", items: [createItem] },
      ];
    }
    return [...(options as ComboboxOption<T>[]), createItem];
  }, [grouped, lowered, options, showCreate, trimmed]);

  // ---- Translate string values ↔ option objects (controlled mode only)
  const controlled = "value" in props && props.value !== undefined;
  const toOption = React.useCallback(
    (v: T) => valueToOption.get(v) ?? null,
    [valueToOption],
  );

  let comboValue: ComboboxOption<T> | ComboboxOption<T>[] | null | undefined;
  let comboDefault: ComboboxOption<T> | ComboboxOption<T>[] | undefined;
  if (multiple) {
    const mp = props as MultipleProps<T> & CommonProps<T>;
    if (controlled) {
      comboValue = (mp.value ?? [])
        .map(toOption)
        .filter((o): o is ComboboxOption<T> => o !== null);
    }
    if (mp.defaultValue !== undefined) {
      comboDefault = mp.defaultValue
        .map(toOption)
        .filter((o): o is ComboboxOption<T> => o !== null);
    }
  } else {
    const sp = props as SingleProps<T> & CommonProps<T>;
    if (controlled) {
      comboValue =
        sp.value == null || sp.value === ""
          ? null
          : (toOption(sp.value as T) ?? null);
    }
    if (sp.defaultValue !== undefined) {
      comboDefault = toOption(sp.defaultValue) ?? undefined;
    }
  }

  const handleValueChange = React.useCallback(
    (next: unknown) => {
      if (multiple) {
        const cb = (props as MultipleProps<T>).onValueChange;
        const selected = (next as InternalOption<T>[] | null) ?? [];
        const createPick = selected.find((o) => o.__create);
        if (createPick && onCreate) {
          const created = onCreate(createPick.__create as string);
          const cleaned = selected
            .filter((o) => !o.__create)
            .map((o) => o.value);
          cb?.([...cleaned, created.value]);
          setQuery("");
          return;
        }
        cb?.(selected.map((o) => o.value));
      } else {
        const cb = (props as SingleProps<T>).onValueChange;
        const opt = next as InternalOption<T> | null;
        if (opt?.__create && onCreate) {
          const created = onCreate(opt.__create);
          cb?.(created.value);
          setQuery("");
          return;
        }
        cb?.((opt ? opt.value : "") as T | "");
      }
    },
    [multiple, onCreate, props],
  );

  // ---- Rendering helpers
  const renderItem = (item: InternalOption<T>) => {
    if (item.__create) {
      return (
        <ComboboxItem key={item.value} value={item}>
          <span className="col-start-1 flex items-center justify-center">
            <CaretDownIcon className="size-3.5 rotate-[-45deg]" />
          </span>
          <div className="col-start-2">{item.label}</div>
        </ComboboxItem>
      );
    }
    return (
      <ComboboxItem key={item.value} value={item}>
        <ComboboxItemIndicator />
        <div className="col-start-2">{item.label}</div>
      </ComboboxItem>
    );
  };

  const list = grouped ? (
    <ComboboxList>
      {(group: ComboboxOptionGroup<T>, groupIndex: number) => (
        <ComboboxGroup
          key={group.label || `__group-${groupIndex}`}
          items={group.items}
          className={separator ? "group" : undefined}
        >
          {group.label ? (
            <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
          ) : null}
          <ComboboxCollection>
            {(item: InternalOption<T>) => renderItem(item)}
          </ComboboxCollection>
          {separator ? (
            <ComboboxSeparator className="my-1 group-last:hidden" />
          ) : null}
        </ComboboxGroup>
      )}
    </ComboboxList>
  ) : (
    <ComboboxList>{(item: InternalOption<T>) => renderItem(item)}</ComboboxList>
  );

  const chipsRef = React.useRef<HTMLDivElement | null>(null);

  // When the popup is open, flatten the edge of the closed control that touches
  // the popup, and flatten the matching edge of the popup itself, so the two
  // shapes read as one unified container.
  const openTriggerRadiusClass =
    "data-[popup-open]:data-[popup-side=bottom]:rounded-b-sm data-[popup-open]:data-[popup-side=top]:rounded-t-sm";
  const popupRadiusClass =
    "data-[side=bottom]:rounded-t-sm data-[side=top]:rounded-b-sm";

  // ---- Closed-control + popup composition per mode
  if (multiple) {
    return (
      <Combobox
        items={decoratedItems}
        multiple
        value={comboValue as ComboboxOption<T>[] | undefined}
        defaultValue={comboDefault as ComboboxOption<T>[] | undefined}
        onValueChange={handleValueChange}
        inputValue={query}
        onInputValueChange={setQuery}
        disabled={disabled}
        isItemEqualToValue={(a, b) =>
          (a as ComboboxOption<T>)?.value === (b as ComboboxOption<T>)?.value
        }
      >
        <ComboboxChips
          ref={chipsRef}
          className={cn(openTriggerRadiusClass, className)}
        >
          <ComboboxValue>
            {(value: ComboboxOption<T>[]) => (
              <>
                {value.map((opt) => (
                  <ComboboxChip key={opt.value} aria-label={opt.label}>
                    {opt.label}
                    <ComboboxChipRemove />
                  </ComboboxChip>
                ))}
                <ComboboxInput
                  id={id}
                  name={name}
                  aria-invalid={ariaInvalid}
                  placeholder={value.length > 0 ? "" : placeholder}
                  className="h-5 min-w-16 flex-1 border-0 bg-transparent p-0 pl-1 shadow-none outline-none focus-visible:ring-0"
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>

        <ComboboxPositioner sideOffset={6} anchor={chipsRef}>
          <ComboboxPopup className={popupRadiusClass}>
            <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
            {list}
          </ComboboxPopup>
        </ComboboxPositioner>
      </Combobox>
    );
  }

  if (presentation === "trigger") {
    return (
      <Combobox
        items={decoratedItems}
        value={comboValue as ComboboxOption<T> | null | undefined}
        defaultValue={comboDefault as ComboboxOption<T> | undefined}
        onValueChange={handleValueChange}
        inputValue={query}
        onInputValueChange={setQuery}
        disabled={disabled}
        isItemEqualToValue={(a, b) =>
          (a as ComboboxOption<T>)?.value === (b as ComboboxOption<T>)?.value
        }
      >
        <ComboboxTrigger
          className={cn(
            "bg-chip w-full justify-between",
            openTriggerRadiusClass,
            ariaInvalid && "border-destructive ring-destructive/20 ring-[3px]",
            className,
          )}
          aria-invalid={ariaInvalid}
        >
          <span className="flex min-w-0 items-center gap-2">
            {triggerIcon}
            <ComboboxValue>
              {(value: ComboboxOption<T> | null) =>
                value ? value.label : triggerPlaceholder
              }
            </ComboboxValue>
          </span>
          <CaretDownIcon className="size-3.5 opacity-60" />
        </ComboboxTrigger>

        <ComboboxPositioner align="start" sideOffset={4}>
          <ComboboxPopup className={cn("pt-0", popupRadiusClass)}>
            <div className="bg-chip sticky top-0 z-1 p-1">
              <ComboboxInput placeholder={placeholder} />
            </div>
            <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
            {list}
          </ComboboxPopup>
        </ComboboxPositioner>
      </Combobox>
    );
  }

  // Default: single + input presentation
  return (
    <Combobox
      items={decoratedItems}
      value={comboValue as ComboboxOption<T> | null | undefined}
      defaultValue={comboDefault as ComboboxOption<T> | undefined}
      onValueChange={handleValueChange}
      inputValue={query}
      onInputValueChange={setQuery}
      disabled={disabled}
      isItemEqualToValue={(a, b) =>
        (a as ComboboxOption<T>)?.value === (b as ComboboxOption<T>)?.value
      }
    >
      <div className={cn("relative", className)}>
        <ComboboxInput
          id={id}
          name={name}
          placeholder={placeholder}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn("pr-12", openTriggerRadiusClass)}
        />
        <div className="text-muted-foreground absolute inset-y-0 right-1.5 flex items-center justify-center gap-0.5">
          <ComboboxClear />
          <ComboboxTrigger
            aria-label="Open popup"
            className="text-muted-foreground h-5 w-5 border-none bg-transparent p-0 shadow-none hover:bg-transparent"
          >
            <CaretDownIcon className="size-3.5" />
          </ComboboxTrigger>
        </div>
      </div>

      <ComboboxPositioner sideOffset={6}>
        <ComboboxPopup className={popupRadiusClass}>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          {list}
        </ComboboxPopup>
      </ComboboxPositioner>
    </Combobox>
  );
}
