export const BUTTON_VARIANTS = {
  DEFAULT: "default",
  DESTRUCTIVE: "destructive",
  OUTLINE: "outline",
  SECONDARY: "secondary",
  GHOST: "ghost",
  LINK: "link",
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

export type ButtonVariantValues =
  (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];
export type ButtonSizeValues =
  (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES];
