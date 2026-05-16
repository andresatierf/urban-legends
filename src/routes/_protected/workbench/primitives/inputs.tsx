"use client";

import {
  CaretDownIcon,
  CaretUpDownIcon,
  MapPinIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
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
  ComboboxIcon,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_protected/workbench/primitives/inputs")(
  {
    component: InputsWorkbenchPage,
  },
);

const FRUIT_OPTIONS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
  { value: "elderberry", label: "Elderberry" },
  { value: "fig", label: "Fig" },
];

interface Language {
  id: string;
  value: string;
}

const LANGUAGE_OPTIONS: Language[] = [
  { id: "ts", value: "TypeScript" },
  { id: "js", value: "JavaScript" },
  { id: "py", value: "Python" },
  { id: "go", value: "Go" },
  { id: "rust", value: "Rust" },
  { id: "ruby", value: "Ruby" },
  { id: "java", value: "Java" },
];

interface FoodGroup {
  value: string;
  items: { value: string; label: string }[];
}

const FOOD_GROUPS: FoodGroup[] = [
  {
    value: "Fruits",
    items: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      { value: "mango", label: "Mango" },
    ],
  },
  {
    value: "Vegetables",
    items: [
      { value: "carrot", label: "Carrot" },
      { value: "broccoli", label: "Broccoli" },
      { value: "spinach", label: "Spinach" },
    ],
  },
  {
    value: "Dairy",
    items: [
      { value: "milk", label: "Milk" },
      { value: "cheese", label: "Cheese" },
      { value: "yogurt", label: "Yogurt" },
    ],
  },
];

interface Country {
  code: string;
  value: string | null;
  label: string;
}

const COUNTRIES: Country[] = [
  { code: "", value: null, label: "Select country" },
  { code: "pt", value: "portugal", label: "Portugal" },
  { code: "us", value: "united-states", label: "United States" },
  { code: "gb", value: "united-kingdom", label: "United Kingdom" },
  { code: "de", value: "germany", label: "Germany" },
  { code: "fr", value: "france", label: "France" },
  { code: "jp", value: "japan", label: "Japan" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-h3">{title}</h3>
      <div className="bg-card border-border rounded-xl border-2 p-6 shadow-[4px_4px_0_var(--shadow)]">
        {children}
      </div>
    </section>
  );
}

function StateRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-4">
      <span className="text-label-caps text-muted-foreground pt-1.5">
        {label}
      </span>
      <div className="max-w-sm">{children}</div>
    </div>
  );
}

function MatrixSection({
  title,
  columns,
  children,
}: {
  title: string;
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-h3">{title}</h3>
      <div className="bg-card border-border rounded-xl border-2 p-6 shadow-[4px_4px_0_var(--shadow)]">
        <div
          className="grid gap-x-6 gap-y-4"
          style={{
            gridTemplateColumns: `120px repeat(${columns.length}, minmax(0, 1fr))`,
          }}
        >
          <div />
          {columns.map((col) => (
            <div
              key={col}
              className="text-label-caps text-muted-foreground pb-2"
            >
              {col}
            </div>
          ))}
          {children}
        </div>
      </div>
    </section>
  );
}

function MatrixRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <span className="text-label-caps text-muted-foreground pt-1.5">
        {label}
      </span>
      {children}
    </>
  );
}

function MatrixCell({ children }: { children?: React.ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

function FieldsMatrix() {
  return (
    <MatrixSection title="Fields" columns={["Input", "Textarea"]}>
      <MatrixRow label="Default">
        <MatrixCell>
          <Input placeholder="Type something..." />
        </MatrixCell>
        <MatrixCell>
          <Textarea placeholder="Write a description..." />
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="With value">
        <MatrixCell>
          <Input defaultValue="Hello world" />
        </MatrixCell>
        <MatrixCell>
          <Textarea defaultValue="This is a multi-line text area with some content that demonstrates the Field Day treatment." />
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Focus">
        <MatrixCell>
          <Input className="pseudo-focus" placeholder="Focused" />
        </MatrixCell>
        <MatrixCell>
          <Textarea className="pseudo-focus" placeholder="Focused" />
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Invalid">
        <MatrixCell>
          <div className="space-y-1">
            <Input aria-invalid="true" defaultValue="Bad value" />
            <p className="text-destructive text-xs">This field is required</p>
          </div>
        </MatrixCell>
        <MatrixCell>
          <div className="space-y-1">
            <Textarea aria-invalid="true" defaultValue="Bad content" />
            <p className="text-destructive text-xs">
              Description must be at least 20 characters
            </p>
          </div>
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Disabled">
        <MatrixCell>
          <Input disabled placeholder="Disabled input" />
        </MatrixCell>
        <MatrixCell>
          <Textarea disabled placeholder="Disabled textarea" />
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Date">
        <MatrixCell>
          <Input type="date" defaultValue="2026-05-14" />
        </MatrixCell>
        <MatrixCell />
      </MatrixRow>
    </MatrixSection>
  );
}

function PickersMatrix() {
  return (
    <MatrixSection title="Pickers" columns={["Select", "Combobox"]}>
      <MatrixRow label="Default">
        <MatrixCell>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a fruit..." />
            </SelectTrigger>
            <SelectContent>
              {FRUIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MatrixCell>
        <MatrixCell>
          <Combobox items={FRUIT_OPTIONS}>
            <FruitInput />
            <FruitPopup />
          </Combobox>
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="With value">
        <MatrixCell>
          <Select defaultValue="banana">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FRUIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MatrixCell>
        <MatrixCell>
          <Combobox items={FRUIT_OPTIONS} defaultValue={FRUIT_OPTIONS[1]}>
            <FruitInput />
            <FruitPopup />
          </Combobox>
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Focus">
        <MatrixCell>
          <Select>
            <SelectTrigger className="pseudo-focus w-full">
              <SelectValue placeholder="Focused" />
            </SelectTrigger>
            <SelectContent>
              {FRUIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MatrixCell>
        <MatrixCell>
          <Combobox items={FRUIT_OPTIONS}>
            <FruitInput className="pseudo-focus" placeholder="Focused" />
            <FruitPopup />
          </Combobox>
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Invalid">
        <MatrixCell>
          <Select>
            <SelectTrigger className="w-full" aria-invalid="true">
              <SelectValue placeholder="Required field..." />
            </SelectTrigger>
            <SelectContent>
              {FRUIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MatrixCell>
        <MatrixCell>
          <div className="space-y-1">
            <Combobox items={FRUIT_OPTIONS}>
              <FruitInput aria-invalid="true" placeholder="Required field..." />
              <FruitPopup />
            </Combobox>
            <p className="text-destructive text-xs">Please pick a fruit</p>
          </div>
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Disabled">
        <MatrixCell>
          <Select disabled>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Disabled select" />
            </SelectTrigger>
            <SelectContent>
              {FRUIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MatrixCell>
        <MatrixCell>
          <Combobox items={FRUIT_OPTIONS}>
            <FruitInput disabled placeholder="Disabled combobox" />
            <FruitPopup />
          </Combobox>
        </MatrixCell>
      </MatrixRow>
    </MatrixSection>
  );
}

type FruitOption = (typeof FRUIT_OPTIONS)[number];

function FruitInput({
  placeholder = "Search fruits...",
  ...inputProps
}: React.ComponentProps<typeof ComboboxInput>) {
  return (
    <div className="relative">
      <ComboboxInput
        placeholder={placeholder}
        className="pr-12"
        {...inputProps}
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
  );
}

function FruitPopup() {
  return (
    <ComboboxPositioner sideOffset={6}>
      <ComboboxPopup>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(option: FruitOption) => (
            <ComboboxItem key={option.value} value={option}>
              <ComboboxItemIndicator />
              <div className="col-start-2">{option.label}</div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </ComboboxPositioner>
  );
}

function ChipsRow() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <Combobox items={LANGUAGE_OPTIONS} multiple>
      <ComboboxChips ref={containerRef}>
        <ComboboxValue>
          {(value: Language[]) => (
            <>
              {value.map((lang) => (
                <ComboboxChip key={lang.id} aria-label={lang.value}>
                  {lang.value}
                  <ComboboxChipRemove />
                </ComboboxChip>
              ))}
              <ComboboxInput
                placeholder={value.length > 0 ? "" : "e.g. TypeScript"}
                className="h-6 flex-1 border-0 bg-transparent pl-2 shadow-none outline-none focus-visible:ring-0"
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>

      <ComboboxPositioner sideOffset={6} anchor={containerRef}>
        <ComboboxPopup>
          <ComboboxEmpty>No languages found.</ComboboxEmpty>
          <ComboboxList>
            {(lang: Language) => (
              <ComboboxItem key={lang.id} value={lang}>
                <ComboboxItemIndicator />
                <div className="col-start-2">{lang.value}</div>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </ComboboxPositioner>
    </Combobox>
  );
}

interface CreatableLabel {
  id: string;
  value: string;
  creatable?: string;
}

const INITIAL_LABELS: CreatableLabel[] = [
  { id: "bug", value: "bug" },
  { id: "docs", value: "documentation" },
  { id: "enhancement", value: "enhancement" },
  { id: "help-wanted", value: "help wanted" },
];

function CreatableRow() {
  const [labels, setLabels] = React.useState<CreatableLabel[]>(INITIAL_LABELS);
  const [selected, setSelected] = React.useState<CreatableLabel[]>([]);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const trimmed = query.trim();
  const lowered = trimmed.toLocaleLowerCase();
  const exactExists = labels.some(
    (l) => l.value.trim().toLocaleLowerCase() === lowered,
  );
  const itemsForView: CreatableLabel[] =
    trimmed !== "" && !exactExists
      ? [
          ...labels,
          {
            creatable: trimmed,
            id: `create:${lowered}`,
            value: `Create "${trimmed}"`,
          },
        ]
      : labels;

  return (
    <Combobox
      items={itemsForView}
      multiple
      value={selected}
      inputValue={query}
      onInputValueChange={setQuery}
      onValueChange={(items) => {
        const next = items as CreatableLabel[];
        const last = next[next.length - 1];
        if (last && last.creatable) {
          const created: CreatableLabel = {
            id: `${last.creatable.replace(/\s+/g, "-").toLocaleLowerCase()}`,
            value: last.creatable,
          };
          setLabels((prev) =>
            prev.some((l) => l.id === created.id) ? prev : [...prev, created],
          );
          setSelected((prev) =>
            prev.some((l) => l.id === created.id) ? prev : [...prev, created],
          );
          setQuery("");
          return;
        }
        setSelected(next.filter((i) => !i.creatable));
        setQuery("");
      }}
    >
      <ComboboxChips ref={containerRef}>
        <ComboboxValue>
          {(value: CreatableLabel[]) => (
            <>
              {value.map((label) => (
                <ComboboxChip key={label.id} aria-label={label.value}>
                  {label.value}
                  <ComboboxChipRemove />
                </ComboboxChip>
              ))}
              <ComboboxInput
                placeholder={value.length > 0 ? "" : "e.g. bug"}
                className="h-6 flex-1 border-0 bg-transparent pl-2 shadow-none outline-none focus-visible:ring-0"
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>

      <ComboboxPositioner sideOffset={4} anchor={containerRef}>
        <ComboboxPopup>
          <ComboboxEmpty>No labels found.</ComboboxEmpty>
          <ComboboxList>
            {(item: CreatableLabel) =>
              item.creatable ? (
                <ComboboxItem key={item.id} value={item}>
                  <span className="col-start-1">
                    <PlusIcon className="size-3" />
                  </span>
                  <div className="col-start-2">
                    Create &quot;{item.creatable}&quot;
                  </div>
                </ComboboxItem>
              ) : (
                <ComboboxItem key={item.id} value={item}>
                  <ComboboxItemIndicator />
                  <div className="col-start-2">{item.value}</div>
                </ComboboxItem>
              )
            }
          </ComboboxList>
        </ComboboxPopup>
      </ComboboxPositioner>
    </Combobox>
  );
}

type FoodItem = FoodGroup["items"][number];

function GroupsRow() {
  return (
    <Combobox items={FOOD_GROUPS}>
      <FruitInput placeholder="e.g. Apple" />
      <ComboboxPositioner sideOffset={6}>
        <ComboboxPopup className="pt-0">
          <ComboboxEmpty className="not-empty:pt-3">
            No results found.
          </ComboboxEmpty>
          <ComboboxList>
            {(group: FoodGroup) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxGroupLabel className="mb-1 border-b">
                  {group.value}
                </ComboboxGroupLabel>
                <ComboboxCollection>
                  {(item: FoodItem) => (
                    <ComboboxItem key={item.value} value={item}>
                      <ComboboxItemIndicator />
                      <div className="col-start-2">{item.label}</div>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </ComboboxPositioner>
    </Combobox>
  );
}

function SeparatorRow() {
  return (
    <Combobox items={FOOD_GROUPS}>
      <FruitInput placeholder="e.g. Apple" />
      <ComboboxPositioner sideOffset={6}>
        <ComboboxPopup>
          <ComboboxEmpty className="not-empty:pt-3">
            No foods found.
          </ComboboxEmpty>
          <ComboboxList>
            {(group: FoodGroup) => (
              <ComboboxGroup
                key={group.value}
                items={group.items}
                className="group"
              >
                <ComboboxCollection>
                  {(item: FoodItem) => (
                    <ComboboxItem key={item.value} value={item}>
                      <ComboboxItemIndicator />
                      <div className="col-start-2">{item.label}</div>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
                <ComboboxSeparator className="group-last:hidden my-3" />
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </ComboboxPositioner>
    </Combobox>
  );
}

function InsidePopupRow() {
  return (
    <Combobox items={COUNTRIES} defaultValue={COUNTRIES[0]}>
      <ComboboxTrigger className="bg-chip w-full max-w-[14rem] justify-between">
        <div className="flex items-center gap-2">
          <MapPinIcon />
          <ComboboxValue />
        </div>
        <ComboboxIcon className="flex">
          <CaretUpDownIcon />
        </ComboboxIcon>
      </ComboboxTrigger>
      <ComboboxPositioner align="start" sideOffset={4}>
        <ComboboxPopup className="w-full pt-0" aria-label="Select country">
          <div className="bg-popover sticky top-0 z-1 w-64 p-2 text-center">
            <ComboboxInput placeholder="e.g. United Kingdom" />
          </div>
          <ComboboxEmpty>No countries found.</ComboboxEmpty>
          <ComboboxList>
            {(country: Country) => (
              <ComboboxItem key={country.code} value={country}>
                <ComboboxItemIndicator />
                <div className="col-start-2">{country.label}</div>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </ComboboxPositioner>
    </Combobox>
  );
}

function ComboboxVariantsSection() {
  return (
    <Section title="Combobox variants">
      <div className="space-y-4">
        <StateRow label="Chips">
          <ChipsRow />
        </StateRow>
        <StateRow label="Creatable">
          <CreatableRow />
        </StateRow>
        <StateRow label="Groups">
          <GroupsRow />
        </StateRow>
        <StateRow label="Separator">
          <SeparatorRow />
        </StateRow>
        <StateRow label="Inside popup">
          <InsidePopupRow />
        </StateRow>
      </div>
    </Section>
  );
}

function TogglesMatrix() {
  return (
    <MatrixSection
      title="Toggles"
      columns={["Checkbox", "Radio Group", "Switch"]}
    >
      <MatrixRow label="Default">
        <MatrixCell>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-default" />
            <Label htmlFor="cb-default">Accept terms</Label>
          </div>
        </MatrixCell>
        <MatrixCell>
          <RadioGroup defaultValue="option-1">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="option-1" id="r1" />
              <Label htmlFor="r1">Option One</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="option-2" id="r2" />
              <Label htmlFor="r2">Option Two</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="option-3" id="r3" />
              <Label htmlFor="r3">Option Three</Label>
            </div>
          </RadioGroup>
        </MatrixCell>
        <MatrixCell>
          <div className="flex items-center gap-2">
            <Switch id="sw-default" />
            <Label htmlFor="sw-default">Notifications</Label>
          </div>
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Checked">
        <MatrixCell>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-checked" defaultChecked />
            <Label htmlFor="cb-checked">Subscribed</Label>
          </div>
        </MatrixCell>
        <MatrixCell />
        <MatrixCell>
          <div className="flex items-center gap-2">
            <Switch id="sw-checked" defaultChecked />
            <Label htmlFor="sw-checked">Dark mode</Label>
          </div>
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Invalid">
        <MatrixCell>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox id="cb-invalid" aria-invalid="true" />
              <Label htmlFor="cb-invalid">Required checkbox</Label>
            </div>
            <p className="text-destructive pl-6 text-xs">
              You must accept the terms
            </p>
          </div>
        </MatrixCell>
        <MatrixCell>
          <div className="space-y-1">
            <RadioGroup>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="option-x"
                  id="r-inv1"
                  aria-invalid="true"
                />
                <Label htmlFor="r-inv1">Option X</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="option-y"
                  id="r-inv2"
                  aria-invalid="true"
                />
                <Label htmlFor="r-inv2">Option Y</Label>
              </div>
            </RadioGroup>
            <p className="text-destructive text-xs">Please select an option</p>
          </div>
        </MatrixCell>
        <MatrixCell>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Switch id="sw-invalid" aria-invalid="true" />
              <Label htmlFor="sw-invalid">Required toggle</Label>
            </div>
            <p className="text-destructive text-xs">You must enable this</p>
          </div>
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Disabled">
        <MatrixCell>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-disabled" disabled />
            <Label htmlFor="cb-disabled" className="opacity-50">
              Disabled option
            </Label>
          </div>
        </MatrixCell>
        <MatrixCell>
          <RadioGroup defaultValue="option-a" disabled>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="option-a" id="r-d1" />
              <Label htmlFor="r-d1" className="opacity-50">
                Disabled A
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="option-b" id="r-d2" />
              <Label htmlFor="r-d2" className="opacity-50">
                Disabled B
              </Label>
            </div>
          </RadioGroup>
        </MatrixCell>
        <MatrixCell>
          <div className="flex items-center gap-2">
            <Switch id="sw-disabled" disabled />
            <Label htmlFor="sw-disabled" className="opacity-50">
              Disabled off
            </Label>
          </div>
        </MatrixCell>
      </MatrixRow>
      <MatrixRow label="Disabled checked">
        <MatrixCell>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-disabled-checked" disabled defaultChecked />
            <Label htmlFor="cb-disabled-checked" className="opacity-50">
              Locked selection
            </Label>
          </div>
        </MatrixCell>
        <MatrixCell />
        <MatrixCell>
          <div className="flex items-center gap-2">
            <Switch id="sw-disabled-checked" disabled defaultChecked />
            <Label htmlFor="sw-disabled-checked" className="opacity-50">
              Disabled on
            </Label>
          </div>
        </MatrixCell>
      </MatrixRow>
    </MatrixSection>
  );
}

function SliderSection() {
  return (
    <Section title="Slider">
      <div className="space-y-4">
        <StateRow label="Default">
          <Slider defaultValue={[50]} />
        </StateRow>
        <StateRow label="With value">
          <div className="flex items-center gap-3">
            <Slider defaultValue={[72]} className="flex-1" />
            <span className="text-body-sm text-muted-foreground w-8 text-right tabular-nums">
              72
            </span>
          </div>
        </StateRow>
        <StateRow label="Focus">
          <Slider defaultValue={[40]} className="pseudo-focus" />
        </StateRow>
        <StateRow label="Range">
          <Slider defaultValue={[25, 75]} />
        </StateRow>
        <StateRow label="Stepped">
          <Slider defaultValue={[3]} min={0} max={10} step={1} />
        </StateRow>
        <StateRow label="Disabled">
          <Slider defaultValue={[30]} disabled />
        </StateRow>
      </div>
    </Section>
  );
}

function InputsWorkbenchPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-h2">Form Inputs</h2>
      <p className="text-body-sm text-muted-foreground">
        Every form input primitive in every state — default, focus, invalid,
        disabled, with helper text.
      </p>
      <FieldsMatrix />
      <PickersMatrix />
      <ComboboxVariantsSection />
      <TogglesMatrix />
      <SliderSection />
    </div>
  );
}
