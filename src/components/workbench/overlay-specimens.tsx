import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function OverlaySpecimens() {
  return (
    <TooltipProvider>
      <section className="space-y-8">
        <SectionHeader
          as="h1"
          title="Overlays"
          description="The full set of layered surfaces — dialog (modal), sheet (drawer), popover (anchored), hover card (anchored on hover), tooltip (caption)."
        />

        <div className="bg-paper grid gap-4 rounded-lg p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Specimen label="Dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm submission</DialogTitle>
                  <DialogDescription>
                    Once submitted, your teammates will see this in their review
                    queue.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </Specimen>

          <Specimen label="Sheet">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Edit team</SheetTitle>
                  <SheetDescription>
                    Update name and join policy for your team.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </Specimen>

          <Specimen label="Popover">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <p className="text-body-sm">
                  Anchored to its trigger, dismissible on outside click.
                </p>
              </PopoverContent>
            </Popover>
          </Specimen>

          <Specimen label="HoverCard">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost">Hover me</Button>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-body-sm">
                  Shows on hover, used for inline previews.
                </p>
              </HoverCardContent>
            </HoverCard>
          </Specimen>

          <Specimen label="Tooltip">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hover for tip</Button>
              </TooltipTrigger>
              <TooltipContent>Single-line caption.</TooltipContent>
            </Tooltip>
          </Specimen>
        </div>
      </section>
    </TooltipProvider>
  );
}

function Specimen({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-label-caps text-muted-foreground">{label}</h3>
      <div>{children}</div>
    </div>
  );
}
