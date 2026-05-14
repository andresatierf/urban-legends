type RibbonColor = "gold" | "sunset" | "mute" | "sky";

const RIBBON_COLORS: Record<
  RibbonColor,
  { bg: string; notch: string; text: string }
> = {
  gold: { bg: "bg-gold", notch: "text-gold", text: "text-ink" },
  sunset: {
    bg: "bg-primary",
    notch: "text-primary",
    text: "text-primary-foreground",
  },
  mute: {
    bg: "bg-muted",
    notch: "text-muted",
    text: "text-muted-foreground",
  },
  sky: { bg: "bg-info", notch: "text-info", text: "text-ink" },
};

export type { RibbonColor };

export function RibbonBanner({
  label,
  small,
  color = "gold",
}: {
  label: string;
  small?: boolean;
  color?: RibbonColor;
}) {
  const palette = RIBBON_COLORS[color];
  return (
    <div
      className={`mx-auto flex w-fit items-stretch ${palette.bg} ${palette.text} ${small ? "mb-5 min-h-9" : "mb-6 min-h-12"}`}
    >
      <svg
        aria-hidden
        className={`${palette.notch} -ml-px block flex-shrink-0 ${small ? "h-9" : "h-12"}`}
        width="18"
        height="100%"
        viewBox="0 0 18 40"
        preserveAspectRatio="none"
      >
        <polygon points="18,0 18,40 0,20" fill="currentColor" />
      </svg>
      <div
        className={`font-heading flex items-center px-5 font-extrabold tracking-[0.14em] whitespace-nowrap uppercase ${small ? "text-body-sm" : "text-body-md"} group-hover:[animation:va-ribbon-flutter_0.4s_ease]`}
      >
        {label}
      </div>
      <svg
        aria-hidden
        className={`${palette.notch} -mr-px block flex-shrink-0 ${small ? "h-9" : "h-12"}`}
        width="18"
        height="100%"
        viewBox="0 0 18 40"
        preserveAspectRatio="none"
      >
        <polygon points="0,0 0,40 18,20" fill="currentColor" />
      </svg>
    </div>
  );
}
