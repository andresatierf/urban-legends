"use client";

import { Plus } from "lucide-react";

import { UpsertActivityFormDialog } from "@/components/activities/form";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useUser } from "@/hooks/useUser";

import { useActivityDialog } from "./activity-dialog-context";

export function FloatingSidebarActions() {
  const { state, isMobile } = useSidebar();
  const { user } = useUser({ shouldThrow: false });
  const { isOpen, openActivityDialog, onOpenChange } = useActivityDialog();

  const isPlayer =
    (user?.roleNames as string[] | undefined)?.includes("player") ?? false;
  const showPlus = isPlayer && (state === "collapsed" || isMobile);

  return (
    <>
      <UpsertActivityFormDialog open={isOpen} onOpenChange={onOpenChange} />
      <div className="pointer-events-auto fixed top-2 left-2 z-50 flex flex-row gap-0.5 p-1">
        <div className="max-sm:bg-sidebar/50 pointer-events-none absolute inset-0 right-auto -z-10 w-8 rounded-lg bg-transparent backdrop-blur-xs transition-[background-color,width] delay-0 duration-250 max-sm:delay-125 max-sm:duration-125" />
        <SidebarTrigger
          size="icon"
          aria-label="Open sidebar"
          className="bg-muted z-10 size-6 transition-colors focus-visible:outline-hidden [&_svg]:size-4"
        />
        {showPlus && (
          <Button
            size="icon"
            variant="ghost"
            aria-label="New activity"
            className="z-10 size-6 transition-colors focus-visible:outline-hidden [&_svg]:size-4"
            onClick={openActivityDialog}
          >
            <Plus />
          </Button>
        )}
      </div>
    </>
  );
}
