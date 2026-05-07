"use client";

import { Plus } from "lucide-react";
import { UpsertSubmissionFormDialog } from "@/components/form/upsert-submission-form";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useUser } from "@/hooks/useUser";
import { useSubmissionDialog } from "./submission-dialog-context";

export function FloatingSidebarActions() {
  const { state, isMobile } = useSidebar();
  const { user } = useUser({ shouldThrow: false });
  const { isOpen, openSubmissionDialog, onOpenChange } = useSubmissionDialog();

  const isPlayer =
    (user?.roleNames as string[] | undefined)?.includes("player") ?? false;
  const showPlus = isPlayer && (state === "collapsed" || isMobile);

  return (
    <>
      <UpsertSubmissionFormDialog open={isOpen} onOpenChange={onOpenChange} />
      <div className="pointer-events-auto fixed top-2 left-2 z-50 flex flex-row gap-0.5 p-1">
        <div className="-z-10 pointer-events-none absolute inset-0 right-auto w-8 rounded-lg bg-transparent backdrop-blur-xs transition-[background-color,width] delay-0 duration-250 max-sm:bg-sidebar/50 max-sm:delay-125 max-sm:duration-125" />
        <SidebarTrigger
          size="icon"
          aria-label="Open sidebar"
          className="z-10 size-6 bg-muted transition-colors focus-visible:outline-hidden [&_svg]:size-4"
        />
        {showPlus && (
          <Button
            size="icon"
            variant="ghost"
            aria-label="New submission"
            className="z-10 size-6 transition-colors focus-visible:outline-hidden [&_svg]:size-4"
            onClick={openSubmissionDialog}
          >
            <Plus />
          </Button>
        )}
      </div>
    </>
  );
}
