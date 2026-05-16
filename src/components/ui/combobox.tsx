"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const Combobox = ComboboxPrimitive.Root;

function ComboboxInput(
  props: ComboboxPrimitive.Input.Props & {
    ref?: RefObject<HTMLInputElement | null>;
  },
) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      render={<Input />}
      {...props}
    />
  );
}

function ComboboxTrigger({
  className,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      render={<Button variant="outline" size="sm" />}
      className={cn(
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxIcon(props: ComboboxPrimitive.Icon.Props) {
  return <ComboboxPrimitive.Icon data-slot="combobox-icon" {...props} />;
}

function ComboboxClear({
  children,
  className,
  ...props
}: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      aria-label="Clear selection"
      className={cn(
        "text-muted-foreground hover:text-foreground flex h-6 w-5 items-center justify-center rounded bg-transparent p-0 transition-colors",
        className,
      )}
      {...props}
    >
      {children ?? <XIcon className="size-3.5" />}
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxValue(props: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxChips({
  className,
  ...props
}: ComboboxPrimitive.Chips.Props & { ref?: RefObject<HTMLDivElement | null> }) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "border-border bg-chip focus-within:border-ring focus-within:ring-ring/20 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 flex min-h-7 w-full flex-wrap items-center gap-1 rounded-md border-2 px-1.5 py-0.5 text-xs/relaxed transition-[color,box-shadow] focus-within:ring-[3px] has-aria-invalid:ring-[3px]",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({ className, ...props }: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "bg-muted-foreground/10 text-foreground focus-within:bg-accent focus-within:text-accent-foreground flex h-5 cursor-default items-center gap-1 rounded-sm pr-0 pl-1.5 text-xs/relaxed font-medium whitespace-nowrap outline-none has-data-[slot=combobox-chip-remove]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChipRemove({
  className,
  children,
  ...props
}: ComboboxPrimitive.ChipRemove.Props) {
  return (
    <ComboboxPrimitive.ChipRemove
      data-slot="combobox-chip-remove"
      aria-label="Remove"
      className={cn(
        "hover:bg-accent-foreground/10 -ml-0.5 flex h-5 w-5 items-center justify-center rounded text-inherit opacity-60 transition-[color,background-color,opacity] hover:opacity-100",
        className,
      )}
      {...props}
    >
      {children ?? <XIcon className="size-3" />}
    </ComboboxPrimitive.ChipRemove>
  );
}

function ComboboxPopup({ className, ...props }: ComboboxPrimitive.Popup.Props) {
  return (
    <ComboboxPrimitive.Popup
      data-slot="combobox-popup"
      className={cn(
        "border-foreground bg-chip text-popover-foreground max-h-[min(var(--available-height),23rem)] w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-xl border-2 py-1 text-xs/relaxed shadow-[4px_4px_0_var(--color-shadow)] transition-[transform,scale,opacity] duration-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxPositioner({
  className,
  ...props
}: ComboboxPrimitive.Positioner.Props) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        data-slot="combobox-positioner"
        className={cn("isolate z-50 outline-none", className)}
        {...props}
      />
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxArrow(props: ComboboxPrimitive.Arrow.Props) {
  return <ComboboxPrimitive.Arrow data-slot="combobox-arrow" {...props} />;
}

function ComboboxStatus({
  className,
  ...props
}: ComboboxPrimitive.Status.Props) {
  return (
    <ComboboxPrimitive.Status
      data-slot="combobox-status"
      className={cn(
        "text-muted-foreground px-2 py-1.5 text-xs/relaxed empty:m-0 empty:p-0",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "text-muted-foreground flex items-center justify-center text-xs/relaxed not-empty:py-2",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxList(props: ComboboxPrimitive.List.Props) {
  return <ComboboxPrimitive.List data-slot="combobox-list" {...props} />;
}

function ComboboxRow(props: ComboboxPrimitive.Row.Props) {
  return <ComboboxPrimitive.Row data-slot="combobox-row" {...props} />;
}

function ComboboxItem({ className, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "data-highlighted:bg-foreground/10 data-highlighted:text-foreground relative mx-1 grid min-h-7 cursor-default grid-cols-[0.95rem_1fr] items-center gap-2 rounded-md px-2 py-1 text-xs/relaxed outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItemIndicator({
  className,
  children,
  ...props
}: ComboboxPrimitive.ItemIndicator.Props) {
  return (
    <ComboboxPrimitive.ItemIndicator
      data-slot="combobox-item-indicator"
      className={cn("col-start-1 flex items-center justify-center", className)}
      {...props}
    >
      {children ?? <CheckIcon className="size-3.5" />}
    </ComboboxPrimitive.ItemIndicator>
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("bg-border/50 -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn("scroll-my-1", className)}
      {...props}
    />
  );
}

function ComboboxGroupLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-group-label"
      className={cn(
        "bg-chip text-muted-foreground sticky top-0 z-1 px-3 py-1.5 text-xs/relaxed font-medium",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxCollection(props: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

export {
  Combobox,
  ComboboxArrow,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxIcon,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxRow,
  ComboboxSeparator,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
};
