"use client";

import { ArrowRight, PencilLine } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogActivityFabProps = {
  teamName: string;
  tournamentName: string;
} & Omit<ComponentProps<typeof Button>, "variant" | "size">;

/**
 * Tilted CTA — sits absolutely positioned over the bottom-right corner
 * of its (relatively positioned) parent on sm+ viewports, and falls back
 * to a full-width button on mobile.
 */
export function LogActivityFab({
  teamName,
  tournamentName,
  className,
  ...buttonProps
}: LogActivityFabProps) {
  return (
    <Button
      type="button"
      variant="field-day"
      {...buttonProps}
      className={cn(
        "mt-5 grid h-auto w-full max-w-none grid-cols-[1fr_auto] grid-rows-[auto_auto] items-center gap-x-[0.9rem] gap-y-[0.15rem] px-[1.05rem] pt-3 pb-[0.85rem] text-left whitespace-normal sm:mt-0 sm:w-auto sm:max-w-[min(420px,88%)]",
        className,
      )}
    >
      <span className="col-span-2 inline-flex items-center gap-[0.4rem] text-[0.78rem] font-extrabold tracking-[0.1em] uppercase opacity-95">
        <PencilLine className="size-[14px]" strokeWidth={2.5} />
        Log today&apos;s activity
      </span>
      <span className="flex gap-1 justify-end">
        <ArrowRight
          className="row-start-2 size-4 self-center"
          strokeWidth={1.5}
          aria-hidden
        />
        <span className="text-[0.95rem] leading-[1.15]">
          <strong className="font-bold">{teamName}</strong>
          <span className="text-[0.85rem] opacity-85"> · {tournamentName}</span>
        </span>
      </span>
    </Button>
  );
}
