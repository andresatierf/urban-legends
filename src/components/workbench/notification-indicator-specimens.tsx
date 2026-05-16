import { NotificationIndicator } from "@/components/notifications/notification-indicator";
import { SectionHeader } from "@/components/section-header";

const COUNTS = [0, 1, 9, 42, 99, 100, 250] as const;

export function NotificationIndicatorSpecimens() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="NotificationIndicator"
        description="Bell button with unread-count badge. Badge hides at 0, clamps to 99+ above 99."
      />

      <div className="bg-paper rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-8">
          {COUNTS.map((count) => (
            <div key={count} className="flex flex-col items-center gap-2">
              <NotificationIndicator unreadCount={count} />
              <span className="text-muted-foreground font-mono text-xs">
                {count}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2">
            <NotificationIndicator unreadCount={5} isOpen />
            <span className="text-muted-foreground font-mono text-xs">
              5 · open
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
