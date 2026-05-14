export function RibbonBanner({
  label,
  small,
}: {
  label: string;
  small?: boolean;
}) {
  return (
    <div
      className={`bg-gold text-ink mx-auto mb-6 flex min-h-12 w-fit items-stretch ${small ? "!mb-5 !min-h-9" : ""}`}
    >
      <svg
        aria-hidden
        className={`text-gold -ml-px block flex-shrink-0 ${small ? "h-9" : "h-12"}`}
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
        className={`text-gold -mr-px block flex-shrink-0 ${small ? "h-9" : "h-12"}`}
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
