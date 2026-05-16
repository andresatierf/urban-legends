import { Loader2, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BUTTON_VARIANTS } from "@/components/ui/button.types";

import { VariantMatrix } from "./shells/variant-matrix";

const VARIANTS = Object.values(BUTTON_VARIANTS);

const STATES = [
  "rest",
  "hover",
  "focus",
  "active",
  "disabled",
  "loading",
] as const;
type State = (typeof STATES)[number];

const PSEUDO_CLASSES: Partial<Record<State, string>> = {
  hover: "pseudo-hover",
  focus: "pseudo-focus",
  active: "pseudo-active",
};

function DemoButton({
  variant,
  state,
}: {
  variant: (typeof VARIANTS)[number];
  state: State;
}) {
  const isIcon = variant === "icon";
  const label = isIcon ? <Star className="size-4" /> : variant;
  const size = isIcon ? ("icon" as const) : ("default" as const);

  if (state === "loading") {
    return (
      <Button variant={variant} size={size} disabled>
        {isIcon ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Loader2 className="size-4 animate-spin" />
            Loading
          </>
        )}
      </Button>
    );
  }

  if (state === "disabled") {
    return (
      <Button variant={variant} size={size} disabled>
        {label}
      </Button>
    );
  }

  const stateClass = PSEUDO_CLASSES[state];

  return (
    <Button variant={variant} size={size} className={stateClass}>
      {label}
    </Button>
  );
}

export function ButtonDemo() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 text-foreground">Button Variants</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          All 7 variants × 6 states. Hover/focus/active columns use CSS
          pseudo-class overrides for static preview.
        </p>
      </div>

      <VariantMatrix
        variants={VARIANTS}
        columns={STATES}
        cellFit="content"
        renderCell={(variant, state) => (
          <DemoButton variant={variant} state={state} />
        )}
      />

      <div className="space-y-4">
        <h2 className="text-h2 text-foreground">Sizes</h2>
        <div className="flex flex-wrap items-end gap-3">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Button variant="icon" size="icon-xs">
            <Star className="size-3" />
          </Button>
          <Button variant="icon" size="icon-sm">
            <Star className="size-3.5" />
          </Button>
          <Button variant="icon" size="icon">
            <Star className="size-4" />
          </Button>
          <Button variant="icon" size="icon-lg">
            <Star className="size-5" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-h2 text-foreground">With Icons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Star data-icon="inline-start" className="size-4" />
            Primary
          </Button>
          <Button variant="secondary">
            <Star data-icon="inline-start" className="size-4" />
            Secondary
          </Button>
          <Button variant="destructive">
            <Trash2 data-icon="inline-start" className="size-4" />
            Delete
          </Button>
          <Button variant="outline">
            <Star data-icon="inline-start" className="size-4" />
            Outline
          </Button>
          <Button variant="ghost">
            <Star data-icon="inline-start" className="size-4" />
            Ghost
          </Button>
        </div>
      </div>
    </div>
  );
}
