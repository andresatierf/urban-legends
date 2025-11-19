import { SectionHeader } from "./section-header";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

const CARD_VARIANTS = [
  "default",
  "admin",
  "tournament_manager",
  "info",
  "dashed",
] as const;

export function CardDemo() {
  return (
    <>
      <SectionHeader as="h1" title="Card Demo" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CARD_VARIANTS.map((variant) => (
          <Card key={variant} variant={variant}>
            <CardHeader>
              <CardTitle className="capitalize">
                {variant === "tournament_manager"
                  ? "Tournament Manager"
                  : variant}
              </CardTitle>
              <CardDescription>
                This is a {variant} card variant showing how it appears in both
                light and dark modes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Card content goes here. This variant demonstrates the themed
                colors and styling.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <SectionHeader as="h2" title="Card with Different Content" />
        <div className="grid gap-6 md:grid-cols-2">
          {CARD_VARIANTS.map((variant) => (
            <Card key={`${variant}-alt`} variant={variant}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {variant === "tournament_manager"
                    ? "Tournament Manager Card"
                    : `${variant} Card`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Label:
                    </span>
                    <span className="font-medium text-sm">Value</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Status:
                    </span>
                    <span className="font-medium text-sm">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Progress:
                    </span>
                    <span className="font-medium text-sm">75%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader as="h2" title="Minimal Cards" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {CARD_VARIANTS.map((variant) => (
            <Card key={`${variant}-minimal`} variant={variant}>
              <CardContent className="flex min-h-[100px] items-center justify-center p-6">
                <p className="text-center font-medium capitalize">
                  {variant === "tournament_manager" ? "TM" : variant}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
