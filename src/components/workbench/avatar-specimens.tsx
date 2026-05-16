import { Crown, User } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { VariantMatrix } from "./shells/variant-matrix";

const SIZES = ["sm", "default", "lg"] as const;
const FALLBACKS = ["image", "initials", "icon", "tinted"] as const;

export function AvatarSpecimens() {
  return (
    <section className="space-y-8">
      <SectionHeader
        as="h1"
        title="Avatar"
        description="The Avatar primitive across sizes and fallback strategies (live image, initials, icon, tinted)."
      />

      <VariantMatrix
        variants={SIZES}
        columns={FALLBACKS}
        columnLabel={(c) => c}
        renderCell={(size, fallback) => (
          <div className="flex items-center justify-center">
            <Avatar size={size}>
              {fallback === "image" && (
                <AvatarImage
                  src={`https://picsum.photos/seed/avatar-${size}/96/96`}
                />
              )}
              {fallback === "initials" && <AvatarFallback>JM</AvatarFallback>}
              {fallback === "icon" && (
                <AvatarFallback>
                  <User className="size-1/2" />
                </AvatarFallback>
              )}
              {fallback === "tinted" && (
                <AvatarFallback className="bg-warning/15">
                  <Crown className="text-warning size-1/2" />
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        )}
      />
    </section>
  );
}
