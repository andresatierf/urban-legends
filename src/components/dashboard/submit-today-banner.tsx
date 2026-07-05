import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

export type SubmitTodayBannerProps = {
  todayActivities: number;
  limit: number | undefined;
  teamName: string;
};

export function SubmitTodayBanner({
  todayActivities,
  limit,
  teamName,
}: SubmitTodayBannerProps) {
  const atLimit = limit !== undefined && todayActivities >= limit;
  if (atLimit) return null;

  const hasLogged = todayActivities > 0;
  if (hasLogged && limit === undefined) return null;

  const eyebrowText = hasLogged ? "Going strong" : "Today";
  // limit is defined here when hasLogged (early return above handles the other case)
  const title = hasLogged
    ? `${todayActivities} of ${limit} logged today`
    : `${teamName} hasn't logged today`;
  const subtitle = hasLogged
    ? `One more counts toward ${teamName}.`
    : `Snap your evidence, give ${teamName} the points.`;
  const cta = hasLogged ? "Log another" : "Log activity";

  return (
    <section
      aria-label="Daily activity prompt"
      className="border-ink bg-card grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 rounded-xl border-2 px-4 py-4 shadow sm:grid-cols-[auto_1fr_auto] sm:gap-x-6 sm:gap-y-0 sm:px-6"
    >
      <span
        aria-hidden
        className={cn(
          "border-ink flex size-11 shrink-0 items-center justify-center rounded-full border-2 sm:size-12",
          hasLogged ? "bg-grass/30 text-ink" : "bg-sunset text-white",
        )}
      >
        {hasLogged ? (
          <Check className="size-5" />
        ) : (
          <PencilLine className="size-5" />
        )}
      </span>
      <div className="min-w-0">
        <Eyebrow>{eyebrowText}</Eyebrow>
        <p className="font-heading text-h3 text-ink mt-0.5 leading-tight">
          {title}
        </p>
        <p className="text-mute text-body-sm mt-0.5 leading-snug">{subtitle}</p>
      </div>
      <Button
        asChild
        variant={hasLogged ? "secondary" : "default"}
        className="col-span-2 w-full justify-center sm:col-span-1 sm:w-auto sm:self-center"
      >
        <Link to="/activities">
          {cta}
          <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}
