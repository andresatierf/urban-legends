export const BUTTON_VARIANTS = {
  SOLID: "solid",
  OUTLINE: "outline",
  GHOST: "ghost",
  LINK: "link",
} as const;

export const BUTTON_COLORS = {
  DEFAULT: "default",
  DESTRUCTIVE: "destructive",
  SECONDARY: "secondary",
  PURPLE: "purple",
  BLUE: "blue",
  GREEN: "green",
  ORANGE: "orange",
} as const;

export const BUTTON_SIZES = {
  DEFAULT: "default",
  SM: "sm",
  MD: "md",
  LG: "lg",
  ICON: "icon",
  ICON_SM: "icon-sm",
  ICON_MD: "icon-md",
  ICON_LG: "icon-lg",
} as const;

export const BUTTON_SHAPES = {
  DEFAULT: "default",
  ROUNDED: "rounded",
  SQUARED: "squared",
  PILL: "pill",
} as const;

export type ButtonVariantValues =
  (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];
export type ButtonColorValues =
  (typeof BUTTON_COLORS)[keyof typeof BUTTON_COLORS];
export type ButtonSizeValues = (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES];
export type ButtonShapeValues =
  (typeof BUTTON_SHAPES)[keyof typeof BUTTON_SHAPES];
