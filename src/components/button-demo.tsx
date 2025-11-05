import { Button } from "./ui/button";
import { BUTTON_SIZES, BUTTON_VARIANTS } from "./ui/button.types";

export function ButtonDemo() {
  const sizes = Object.values(BUTTON_SIZES);
  const variants = Object.values(BUTTON_VARIANTS);

  return (
    <>
      {sizes.map((size) => (
        <div key={size}>
          {variants.map((variant) => (
            <Button key={variant} variant={variant} size={size}>
              {variant} - {size}
            </Button>
          ))}
        </div>
      ))}
    </>
  );
}
