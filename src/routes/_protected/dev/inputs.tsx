"use client";

import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_protected/dev/inputs")({
  component: InputsWorkbenchPage,
});

const FRUIT_OPTIONS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
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

function InputSection() {
  return (
    <Section title="Input">
      <div className="space-y-4">
        <StateRow label="Default">
          <Input placeholder="Type something..." />
        </StateRow>
        <StateRow label="With value">
          <Input defaultValue="Hello world" />
        </StateRow>
        <StateRow label="Focus">
          <Input placeholder="Click to focus" />
        </StateRow>
        <StateRow label="Invalid">
          <div className="space-y-1">
            <Input aria-invalid="true" defaultValue="Bad value" />
            <p className="text-destructive text-xs">This field is required</p>
          </div>
        </StateRow>
        <StateRow label="Disabled">
          <Input disabled placeholder="Disabled input" />
        </StateRow>
        <StateRow label="Date">
          <Input type="date" defaultValue="2026-05-14" />
        </StateRow>
      </div>
    </Section>
  );
}

function TextareaSection() {
  return (
    <Section title="Textarea">
      <div className="space-y-4">
        <StateRow label="Default">
          <Textarea placeholder="Write a description..." />
        </StateRow>
        <StateRow label="With value">
          <Textarea defaultValue="This is a multi-line text area with some content that demonstrates the Field Day treatment." />
        </StateRow>
        <StateRow label="Focus">
          <Textarea placeholder="Click to focus" />
        </StateRow>
        <StateRow label="Invalid">
          <div className="space-y-1">
            <Textarea aria-invalid="true" defaultValue="Bad content" />
            <p className="text-destructive text-xs">
              Description must be at least 20 characters
            </p>
          </div>
        </StateRow>
        <StateRow label="Disabled">
          <Textarea disabled placeholder="Disabled textarea" />
        </StateRow>
      </div>
    </Section>
  );
}

function SelectSection() {
  return (
    <Section title="Select">
      <div className="space-y-4">
        <StateRow label="Default">
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
        </StateRow>
        <StateRow label="With value">
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
        </StateRow>
        <StateRow label="Focus">
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Click to focus" />
            </SelectTrigger>
            <SelectContent>
              {FRUIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </StateRow>
        <StateRow label="Invalid">
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
        </StateRow>
        <StateRow label="Disabled">
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
        </StateRow>
      </div>
    </Section>
  );
}

function ComboboxSection() {
  return (
    <Section title="Combobox">
      <div className="space-y-4">
        <StateRow label="Default">
          <Combobox items={FRUIT_OPTIONS.map((o) => o.value)}>
            <ComboboxInput placeholder="Search fruits..." />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>No results</ComboboxEmpty>
                {FRUIT_OPTIONS.map((opt) => (
                  <ComboboxItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </StateRow>
        <StateRow label="With value">
          <Combobox
            items={FRUIT_OPTIONS.map((o) => o.value)}
            defaultValue="banana"
          >
            <ComboboxInput placeholder="Search fruits..." />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>No results</ComboboxEmpty>
                {FRUIT_OPTIONS.map((opt) => (
                  <ComboboxItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </StateRow>
        <StateRow label="Focus">
          <Combobox items={FRUIT_OPTIONS.map((o) => o.value)}>
            <ComboboxInput placeholder="Click to focus" />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>No results</ComboboxEmpty>
                {FRUIT_OPTIONS.map((opt) => (
                  <ComboboxItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </StateRow>
        <StateRow label="Invalid">
          <div className="space-y-1">
            <Combobox items={FRUIT_OPTIONS.map((o) => o.value)}>
              <ComboboxInput
                aria-invalid="true"
                placeholder="Required field..."
              />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>No results</ComboboxEmpty>
                  {FRUIT_OPTIONS.map((opt) => (
                    <ComboboxItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <p className="text-destructive text-xs">Please pick a fruit</p>
          </div>
        </StateRow>
        <StateRow label="Disabled">
          <Combobox items={FRUIT_OPTIONS.map((o) => o.value)}>
            <ComboboxInput disabled placeholder="Disabled combobox" />
            <ComboboxContent>
              <ComboboxList>
                {FRUIT_OPTIONS.map((opt) => (
                  <ComboboxItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </StateRow>
      </div>
    </Section>
  );
}

function CheckboxSection() {
  return (
    <Section title="Checkbox">
      <div className="space-y-4">
        <StateRow label="Default">
          <div className="flex items-center gap-2">
            <Checkbox id="cb-default" />
            <Label htmlFor="cb-default">Accept terms</Label>
          </div>
        </StateRow>
        <StateRow label="Checked">
          <div className="flex items-center gap-2">
            <Checkbox id="cb-checked" defaultChecked />
            <Label htmlFor="cb-checked">Subscribed</Label>
          </div>
        </StateRow>
        <StateRow label="Invalid">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox id="cb-invalid" aria-invalid="true" />
              <Label htmlFor="cb-invalid">Required checkbox</Label>
            </div>
            <p className="text-destructive pl-6 text-xs">
              You must accept the terms
            </p>
          </div>
        </StateRow>
        <StateRow label="Disabled">
          <div className="flex items-center gap-2">
            <Checkbox id="cb-disabled" disabled />
            <Label htmlFor="cb-disabled" className="opacity-50">
              Disabled option
            </Label>
          </div>
        </StateRow>
        <StateRow label="Disabled checked">
          <div className="flex items-center gap-2">
            <Checkbox id="cb-disabled-checked" disabled defaultChecked />
            <Label htmlFor="cb-disabled-checked" className="opacity-50">
              Locked selection
            </Label>
          </div>
        </StateRow>
      </div>
    </Section>
  );
}

function RadioSection() {
  return (
    <Section title="Radio Group">
      <div className="space-y-4">
        <StateRow label="Default">
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
        </StateRow>
        <StateRow label="Invalid">
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
        </StateRow>
        <StateRow label="Disabled">
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
        </StateRow>
      </div>
    </Section>
  );
}

function SwitchSection() {
  return (
    <Section title="Switch">
      <div className="space-y-4">
        <StateRow label="Default">
          <div className="flex items-center gap-2">
            <Switch id="sw-default" />
            <Label htmlFor="sw-default">Notifications</Label>
          </div>
        </StateRow>
        <StateRow label="Checked">
          <div className="flex items-center gap-2">
            <Switch id="sw-checked" defaultChecked />
            <Label htmlFor="sw-checked">Dark mode</Label>
          </div>
        </StateRow>
        <StateRow label="Invalid">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Switch id="sw-invalid" aria-invalid="true" />
              <Label htmlFor="sw-invalid">Required toggle</Label>
            </div>
            <p className="text-destructive text-xs">You must enable this</p>
          </div>
        </StateRow>
        <StateRow label="Disabled">
          <div className="flex items-center gap-2">
            <Switch id="sw-disabled" disabled />
            <Label htmlFor="sw-disabled" className="opacity-50">
              Disabled off
            </Label>
          </div>
        </StateRow>
        <StateRow label="Disabled checked">
          <div className="flex items-center gap-2">
            <Switch id="sw-disabled-checked" disabled defaultChecked />
            <Label htmlFor="sw-disabled-checked" className="opacity-50">
              Disabled on
            </Label>
          </div>
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
      <InputSection />
      <TextareaSection />
      <SelectSection />
      <ComboboxSection />
      <CheckboxSection />
      <RadioSection />
      <SwitchSection />
    </div>
  );
}
