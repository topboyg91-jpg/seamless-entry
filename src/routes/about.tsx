import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteLayout } from "@/components/SiteLayout";
import { formatKsh, siteContentQuery, votePrice } from "@/lib/site-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Westgate Arena — Nairobi Modelling Competitions" },
      {
        name: "description",
        content:
          "Westgate Arena is a Nairobi venue for modelling competitions and pageants, with casting, live show nights and audience voting.",
      },
      { property: "og:title", content: "About Westgate Arena" },
      {
        property: "og:description",
        content: "How casting, show nights and live audience voting work at Westgate Arena.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: content } = useQuery(siteContentQuery);
  const price = formatKsh(votePrice(content));

  const pillars = [
    {
      title: "Casting",
      body: "Models apply each season and are shortlisted by our panel of stylists and show directors.",
    },
    {
      title: "Show night",
      body: "Every finalist walks live at the arena while the audience follows along from their seats.",
    },
    {
      title: "Live voting",
      body: `Voting opens with the first walk and closes before the final announcement. Each vote costs ${price}.`,
    },
  ];

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl">About us</h1>
        <p className="mt-6 text-muted-foreground">{content?.["about_intro"]}</p>
        <p className="mt-4 text-muted-foreground">{content?.["about_second"]}</p>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="surface-card p-5">
              <h2 className="text-base">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
