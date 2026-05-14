"use client";

import { ArrowRight, PencilLine } from "lucide-react";
import type { ComponentProps } from "react";

import { useSubmissionDialog } from "@/components/submission-dialog-context";
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
  onClick,
  ...buttonProps
}: LogActivityFabProps) {
  const { openSubmissionDialog } = useSubmissionDialog();
  return (
    <Button
      type="button"
      variant="default"
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) openSubmissionDialog();
      }}
      {...buttonProps}
      className={cn(
        "mt-5 grid h-auto w-full max-w-none grid-cols-[1fr_auto] grid-rows-[auto_auto] items-center gap-x-[0.9rem] gap-y-[0.15rem] px-[1.05rem] pt-3 pb-[0.85rem] text-left whitespace-normal sm:mt-0 sm:w-auto sm:max-w-[min(420px,88%)]",
        className,
      )}
    >
      <span className="text-label-caps col-span-2 inline-flex items-center gap-[0.4rem] font-extrabold opacity-95">
        <PencilLine className="size-[14px]" strokeWidth={2.5} />
        Log today&apos;s activity
      </span>
      <span className="flex justify-end gap-1">
        <ArrowRight
          className="row-start-2 size-4 self-center"
          strokeWidth={1.5}
          aria-hidden
        />
        <span className="text-base leading-[1.15]">
          <strong className="font-bold">{teamName}</strong>
          <span className="text-sm opacity-85"> · {tournamentName}</span>
        </span>
      </span>
    </Button>
  );
}
