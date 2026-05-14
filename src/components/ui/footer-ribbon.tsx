export function FooterRibbon({ date }: { date: string }) {
  return (
    <div className="bg-sunset text-ink flex min-h-10 items-stretch">
      <svg
        aria-hidden
        className="text-sunset -ml-px block h-10 flex-shrink-0"
        width="18"
        height="100%"
        viewBox="0 0 18 40"
        preserveAspectRatio="none"
      >
        <polygon points="18,0 18,40 0,20" fill="currentColor" />
      </svg>
      <span className="font-heading text-body-sm flex items-center px-6 font-bold tracking-[0.2em] whitespace-nowrap text-white uppercase">
        GO TEAM &middot; {date} &middot; KEEP IT MOVING
      </span>
      <svg
        aria-hidden
        className="text-sunset -mr-px block h-10 flex-shrink-0"
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
