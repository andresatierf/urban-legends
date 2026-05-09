export const BUTTON_VARIANTS = {
  DEFAULT: "default",
  OUTLINE: "outline",
  SECONDARY: "secondary",
  GHOST: "ghost",
  DESTRUCTIVE: "destructive",
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
  XS: "xs",
  SM: "sm",
  LG: "lg",
  ICON: "icon",
  ICON_XS: "icon-xs",
  ICON_SM: "icon-sm",
  ICON_LG: "icon-lg",
} as const;

export type ButtonVariantValues =
  (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];
export type ButtonColorValues =
  (typeof BUTTON_COLORS)[keyof typeof BUTTON_COLORS];
export type ButtonSizeValues = (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES];
