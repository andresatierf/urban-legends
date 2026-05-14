import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CardVariantsSection() {
  return (
    <section className="mt-12">
      <SectionHeader
        as="h1"
        title="Card Variants"
        description="The Card primitive in default and deep variants, with header, footer, and action row compositions."
      />

      <div className="mt-8 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Card>
            <CardContent>
              <p>
                Default card with card fill, 2px ink border, 4px hard offset
                shadow, 14px radius, 20px padding.
              </p>
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-2 text-center text-[0.625rem]">
            Default
          </p>
        </div>

        <div>
          <Card variant="deep">
            <CardContent>
              <p>
                Deep card with muted fill for inset surfaces and secondary
                content areas.
              </p>
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-2 text-center text-[0.625rem]">
            Deep
          </p>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>With Header</CardTitle>
              <CardDescription>
                Supporting description text below the title.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Body content sits in the CardContent slot with inherited
                padding.
              </p>
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-2 text-center text-[0.625rem]">
            With Header
          </p>
        </div>

        <div>
          <Card>
            <CardContent>
              <p>Card body content above the footer.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
              <Button size="sm" className="ml-auto">
                Save
              </Button>
            </CardFooter>
          </Card>
          <p className="text-muted-foreground mt-2 text-center text-[0.625rem]">
            With Footer
          </p>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Action Row</CardTitle>
              <CardDescription>
                Card with header, body, and action footer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                The full composition: header with title + description, body
                content, and a footer with action buttons.
              </p>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="ghost" size="sm">
                Discard
              </Button>
              <Button variant="outline" size="sm">
                Draft
              </Button>
              <Button size="sm">Publish</Button>
            </CardFooter>
          </Card>
          <p className="text-muted-foreground mt-2 text-center text-[0.625rem]">
            With Action Row
          </p>
        </div>
      </div>
    </section>
  );
}
