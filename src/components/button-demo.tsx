import { Button } from "./ui/button";
import {
  BUTTON_COLORS,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
} from "./ui/button.types";

export function ButtonDemo() {
  const sizes = Object.values(BUTTON_SIZES);
  const variants = Object.values(BUTTON_VARIANTS);
  const colors = Object.values(BUTTON_COLORS);

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
    <div className="space-y-4">
      {sizes.map((size) => (
        <div key={size} className="space-y-2">
          <h3 className="font-medium text-gray-600 text-sm">Size: {size}</h3>
          <div className="flex flex-col gap-2">
            {colors.map((color) => (
              <div key={colors} className="flex flex-wrap gap-2">
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
    </div>
  );
}
