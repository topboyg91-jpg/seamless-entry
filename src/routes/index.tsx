import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteLayout } from "@/components/SiteLayout";
import { EventCard } from "@/components/EventCard";
import { eventsQuery, fetchAllModels, formatKsh, siteContentQuery, votePrice } from "@/lib/site-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Westgate Arena — Live Modelling Competition Voting" },
      {
        name: "description",
        content:
          "Vote for your favourite model at Westgate Arena, Nairobi. Browse live competitions, meet every contestant and cast your votes from KSh 10.",
      },
      { property: "og:title", content: "Westgate Arena — Live Modelling Competition Voting" },
      {
        property: "og:description",
        content: "Live modelling competitions and audience voting in Nairobi, Kenya.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: content } = useQuery(siteContentQuery);
  const { data: events } = useQuery(eventsQuery);
  const { data: models } = useQuery({ queryKey: ["models", "all"], queryFn: fetchAllModels });
  const price = votePrice(content);

  return (
    <SiteLayout>
      <section className="stage-hero">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="kicker">{content?.hero_kicker ?? "LIVE VOTING"}</p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
            {content?.hero_title ?? "Vote for your favourite model"}
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            {content?.hero_subtitle ??
              "Choose a competition below, meet every contestant, and cast your votes."}
          </p>
          <p className="mt-3 text-sm font-medium text-accent">
            Each vote costs {formatKsh(price)}
          </p>
          <Link to="/events" className="btn-primary mt-8">
            Browse events
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl">Voting events</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(events ?? []).map((event) => (
            <EventCard key={event.id} event={event} models={models ?? []} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
