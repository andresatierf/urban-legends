export function FooterRibbon({ date }: { date: string }) {
  return (
    <div className="bg-fd-sunset flex min-h-10 items-stretch text-[#2a1f1a]">
      <svg
        aria-hidden
        className="text-fd-sunset [margin-left:-1px] block h-10 flex-shrink-0"
        width="18"
        height="100%"
        viewBox="0 0 18 40"
        preserveAspectRatio="none"
      >
        <polygon points="18,0 18,40 0,20" fill="currentColor" />
      </svg>
      <span className="flex items-center [padding:0_1.5rem] font-[Funnel_Display] text-[0.82rem] font-bold tracking-[0.2em] whitespace-nowrap text-white uppercase">
        GO TEAM &middot; {date} &middot; KEEP IT MOVING
      </span>
      <svg
        aria-hidden
        className="text-fd-sunset [margin-right:-1px] block h-10 flex-shrink-0"
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
