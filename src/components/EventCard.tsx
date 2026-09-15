import { Link } from "@tanstack/react-router";

import { eventCover, type EventRow, type ModelRow } from "@/lib/site-data";

export function EventCard({ event, models }: { event: EventRow; models: ModelRow[] }) {
  const count = models.filter((m) => m.event_id === event.id).length;

  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="surface-card group block overflow-hidden transition-transform hover:-translate-y-1"
    >
      <img
        src={eventCover(event)}
        alt={event.title}
        loading="lazy"
        width={1024}
        height={1024}
        className="aspect-square w-full object-cover"
      />
      <div className="space-y-2 p-5">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            event.voting_open
              ? "bg-primary/15 text-primary"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {event.voting_open ? "Voting open" : "Voting closed"}
        </span>
        <h3 className="text-lg">{event.title}</h3>
        <p className="text-sm text-muted-foreground">
          {[event.date_label, event.time_label].filter(Boolean).join(" · ")}
          {event.venue ? <><br />{event.venue}</> : null}
        </p>
        <p className="text-sm font-medium text-accent">
          Enter event · {count} {count === 1 ? "model" : "models"}
        </p>
      </div>
    </Link>
  );
}
