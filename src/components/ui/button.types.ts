export const BUTTON_VARIANTS = {
  DEFAULT: "default",
  SECONDARY: "secondary",
  DESTRUCTIVE: "destructive",
  OUTLINE: "outline",
  GHOST: "ghost",
  LINK: "link",
  ICON: "icon",
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
export type ButtonSizeValues = (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES];
