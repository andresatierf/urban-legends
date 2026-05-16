import { SectionHeader } from "@/components/section-header";
import { FooterRibbon } from "@/components/ui/footer-ribbon";
import { RibbonBanner, type RibbonColor } from "@/components/ui/ribbon-banner";

import { VariantMatrix } from "./shells/variant-matrix";

const COLORS: readonly RibbonColor[] = ["gold", "sunset", "mute", "sky"];
const SIZES = ["default", "small"] as const;

export function RibbonSpecimens() {
  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <SectionHeader
          as="h1"
          title="RibbonBanner"
          description="Headline ribbon used to crown sections. Color × size matrix."
        />

        <VariantMatrix
          variants={COLORS}
          columns={SIZES}
          cellFit="content"
          renderCell={(color, size) => (
            <RibbonBanner
              label={color}
              color={color}
              small={size === "small"}
            />
          )}
        />
      </section>

      <section className="space-y-6">
        <SectionHeader
          as="h1"
          title="FooterRibbon"
          description="Bottom-of-card date strip used by tournament cards."
        />
        <div className="bg-paper rounded-lg p-6">
          <FooterRibbon date="2026-05-15" />
        </div>
      </section>
    </div>
  );
}
