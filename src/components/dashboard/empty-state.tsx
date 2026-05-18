import { Link } from "@tanstack/react-router";
import { ArrowRight, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export function EmptyState({ viewerFirstName }: { viewerFirstName: string }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <Eyebrow>Your dashboard</Eyebrow>
        <h1 className="text-h1 text-ink">
          {greeting()}, {viewerFirstName}.
        </h1>
      </header>

      <section className="border-ink bg-card shadow-fd-lg flex flex-col items-start gap-5 rounded-2xl border-2 p-8 sm:flex-row sm:items-center sm:gap-8 sm:p-10">
        <span
          aria-hidden
          className="border-ink bg-paper-deep flex size-16 shrink-0 items-center justify-center rounded-2xl border-2"
        >
          <Trophy className="text-sunset size-8" />
        </span>
        <div className="flex-1">
          <h2 className="font-heading text-h2 text-ink">
            You're not on a team yet.
          </h2>
          <p className="text-mute text-body-md mt-1 max-w-prose">
            Pick a tournament to join. Open teams accept requests directly,
            closed teams need a captain's invite. Your inbox will surface
            invitations the moment they arrive.
          </p>
          <div className="mt-5">
            <Button asChild>
              <Link to="/tournaments">
                Browse tournaments
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
