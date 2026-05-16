import { SectionHeader } from "@/components/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "overview", label: "Overview", body: "High-level summary." },
  {
    value: "activity",
    label: "Activity",
    body: "Recent activity log entries.",
  },
  { value: "members", label: "Members", body: "Roster and roles." },
];

const VARIANTS = ["default", "line"] as const;
const ORIENTATIONS = ["horizontal", "vertical"] as const;

export function TabsSpecimens() {
  return (
    <section className="space-y-8">
      <SectionHeader
        as="h1"
        title="Tabs"
        description="Radix tabs across list variants (default / line) and orientations (horizontal / vertical)."
      />

      <div className="space-y-10">
        {ORIENTATIONS.map((orientation) => (
          <div key={orientation} className="space-y-4">
            <h3 className="text-label-caps text-muted-foreground">
              {orientation}
            </h3>
            <div className="bg-paper grid gap-8 rounded-lg p-6 sm:grid-cols-2">
              {VARIANTS.map((variant) => (
                <div key={variant} className="space-y-2">
                  <h4 className="text-muted-foreground text-xs">{variant}</h4>
                  <Tabs
                    defaultValue={TABS[0].value}
                    orientation={orientation}
                    className={orientation === "vertical" ? "flex-row" : ""}
                  >
                    <TabsList variant={variant}>
                      {TABS.map((t) => (
                        <TabsTrigger key={t.value} value={t.value}>
                          {t.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {TABS.map((t) => (
                      <TabsContent
                        key={t.value}
                        value={t.value}
                        className="text-body-sm text-muted-foreground"
                      >
                        {t.body}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
