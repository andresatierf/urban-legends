"use client";

import { ChevronDownIcon } from "lucide-react";

import { useState } from "react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type Props = {
  id: string;
  value: string;
  onChange: (date: string) => void;
};

export function DatePicker({ id, value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="w-48 justify-between font-normal"
          >
            {value ? new Date(value).toLocaleDateString() : "Select date"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={new Date(value)}
            captionLayout="dropdown"
            onSelect={(date) => {
              onChange(date?.toISOString() || "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
