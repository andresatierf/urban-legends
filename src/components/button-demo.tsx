import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";
import { Button } from "./ui/button";
import {
  BUTTON_COLORS,
  BUTTON_SHAPES,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
} from "./ui/button.types";

export function ButtonDemo() {
  const sizes = Object.values(BUTTON_SIZES);
  const variants = Object.values(BUTTON_VARIANTS);
  const colors = Object.values(BUTTON_COLORS);
  const shapes = Object.values(BUTTON_SHAPES);

  const getButtonText = (variant: string, color: string, size: string) => {
    const isIconSize = size.startsWith("icon");

    if (isIconSize) {
      const variantInitial = variant.charAt(0);
      const colorInitial = color.charAt(0);
      return `${variantInitial}${colorInitial}`;
    }

    return `${variant} ${color}`;
  };

  return (
    <>
      <SectionHeader as="h1" title="Button Demo" />
      <div className="grid grid-cols-4 gap-2">
        {sizes.map((size) => (
          <div
            key={size}
            className={cn("space-y-2", {
              "col-span-2": !size.startsWith("icon"),
            })}
          >
            <h3 className="font-medium text-gray-600 text-sm">Size: {size}</h3>
            <div className="flex flex-col gap-2">
              {colors.map((color) => (
                <div key={color} className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <Button
                      key={variant}
                      variant={variant}
                      color={color}
                      size={size}
                    >
                      {getButtonText(variant, color, size)}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
        {shapes.map((shape) => (
          <div key={shape} className="col-span-2 space-y-2">
            <h3 className="font-medium text-gray-600 text-sm">
              Shape: {shape}
            </h3>
            <div className="flex flex-col gap-2">
              {colors.map((color) => (
                <div key={color} className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <Button
                      key={variant}
                      variant={variant}
                      color={color}
                      shape={shape}
                    >
                      {getButtonText(variant, color, shape)}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
