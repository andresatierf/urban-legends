"use client";

import { MapPinIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  ComboboxSelect,
  type ComboboxOption,
} from "@/components/ui/combobox-select";
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

const COUNTRIES: ComboboxOption[] = [
  { value: "portugal", label: "Portugal" },
  { value: "united-states", label: "United States" },
  { value: "united-kingdom", label: "United Kingdom" },
  { value: "germany", label: "Germany" },
  { value: "france", label: "France" },
  { value: "japan", label: "Japan" },
];

const LANGUAGE_OPTION_LIST: ComboboxOption[] = LANGUAGE_OPTIONS.map((l) => ({
  value: l.id,
  label: l.value,
}));

const FOOD_GROUP_OPTIONS = FOOD_GROUPS.map((g) => ({
  label: g.value,
  items: g.items,
}));

interface CreatableLabel {
  value: string;
  label: string;
}

const INITIAL_LABELS: CreatableLabel[] = [
  { value: "bug", label: "bug" },
  { value: "docs", label: "documentation" },
  { value: "enhancement", label: "enhancement" },
  { value: "help-wanted", label: "help wanted" },
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
          <ComboboxSelect
            options={FRUIT_OPTIONS}
            placeholder="Search fruits..."
          />
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
          <ComboboxSelect
            options={FRUIT_OPTIONS}
            defaultValue="banana"
            placeholder="Search fruits..."
          />
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
          <ComboboxSelect
            options={FRUIT_OPTIONS}
            className="pseudo-focus"
            placeholder="Focused"
          />
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
            <ComboboxSelect
              options={FRUIT_OPTIONS}
              aria-invalid
              placeholder="Required field..."
            />
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
          <ComboboxSelect
            options={FRUIT_OPTIONS}
            disabled
            placeholder="Disabled combobox"
          />
        </MatrixCell>
      </MatrixRow>
    </MatrixSection>
  );
}

function CreatableRow() {
  const [labels, setLabels] = React.useState<ComboboxOption[]>(INITIAL_LABELS);
  const [selected, setSelected] = React.useState<string[]>([]);

  return (
    <ComboboxSelect
      multiple
      options={labels}
      value={selected}
      onValueChange={setSelected}
      onCreate={(label) => {
        const opt: ComboboxOption = {
          value: label.replace(/\s+/g, "-").toLocaleLowerCase(),
          label,
        };
        setLabels((prev) =>
          prev.some((l) => l.value === opt.value) ? prev : [...prev, opt],
        );
        return opt;
      }}
      placeholder="e.g. bug"
    />
  );
}

function ComboboxVariantsSection() {
  return (
    <Section title="Combobox variants">
      <div className="space-y-4">
        <StateRow label="Chips">
          <ComboboxSelect
            multiple
            options={LANGUAGE_OPTION_LIST}
            placeholder="e.g. TypeScript"
          />
        </StateRow>
        <StateRow label="Creatable">
          <CreatableRow />
        </StateRow>
        <StateRow label="Groups">
          <ComboboxSelect
            options={FOOD_GROUP_OPTIONS}
            placeholder="e.g. Apple"
          />
        </StateRow>
        <StateRow label="Separator">
          <ComboboxSelect
            options={FOOD_GROUP_OPTIONS}
            separator
            placeholder="e.g. Apple"
          />
        </StateRow>
        <StateRow label="Inside popup">
          <ComboboxSelect
            options={COUNTRIES}
            presentation="trigger"
            triggerIcon={<MapPinIcon />}
            triggerPlaceholder="Select country"
            placeholder="e.g. United Kingdom"
            defaultValue="portugal"
            className="max-w-[14rem]"
          />
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
