import { Loader2, Star, Trash2 } from "lucide-react";

import { Button } from "./ui/button";
import { BUTTON_VARIANTS } from "./ui/button.types";

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

function stateLabel(state: State) {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

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

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-label-caps text-muted-foreground bg-paper-deep px-4 py-2 text-left">
                Variant
              </th>
              {STATES.map((state) => (
                <th
                  key={state}
                  className="text-label-caps text-muted-foreground bg-paper-deep px-4 py-2 text-center"
                >
                  {stateLabel(state)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map((variant) => (
              <tr key={variant} className="border-foreground/10 border-b">
                <td className="text-body-sm px-4 py-4 font-medium">
                  {variant}
                </td>
                {STATES.map((state) => (
                  <td key={state} className="px-4 py-4 text-center">
                    <DemoButton variant={variant} state={state} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
