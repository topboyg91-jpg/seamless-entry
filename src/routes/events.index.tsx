import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteLayout } from "@/components/SiteLayout";
import { EventCard } from "@/components/EventCard";
import { eventsQuery, fetchAllModels, formatKsh, siteContentQuery, votePrice } from "@/lib/site-data";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Voting Events — Westgate Arena" },
      {
        name: "description",
        content:
          "Every live modelling competition and pageant at Westgate Arena, with open voting and full contestant line-ups.",
      },
      { property: "og:title", content: "Voting Events — Westgate Arena" },
      {
        property: "og:description",
        content: "Browse open competitions and cast your votes at Westgate Arena, Nairobi.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { data: content } = useQuery(siteContentQuery);
  const { data: events } = useQuery(eventsQuery);
  const { data: models } = useQuery({ queryKey: ["models", "all"], queryFn: fetchAllModels });

  return (
    <SiteLayout>
      <section className="stage-hero">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="kicker">Line-up</p>
          <h1 className="mt-4 text-4xl">Voting events</h1>
          <p className="mt-3 text-sm font-medium text-accent">
            Each vote costs {formatKsh(votePrice(content))}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(events ?? []).map((event) => (
            <EventCard key={event.id} event={event} models={models ?? []} />
          ))}
        </div>
        {events?.length === 0 ? (
          <p className="text-muted-foreground">No events yet. Add one from the admin area.</p>
        ) : null}
      </section>
    </SiteLayout>
  );
}
