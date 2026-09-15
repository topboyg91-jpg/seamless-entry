import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { SiteLayout } from "@/components/SiteLayout";
import { siteContentQuery } from "@/lib/site-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Westgate Arena — Shows, Casting & Partnerships" },
      {
        name: "description",
        content:
          "Get in touch with the Westgate Arena team about show nights, model casting or partnership enquiries in Nairobi.",
      },
      { property: "og:title", content: "Contact Westgate Arena" },
      {
        property: "og:description",
        content: "Questions about a show, casting or partnerships? Send the team a note.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: content } = useQuery(siteContentQuery);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.from("contact_messages").insert(form);
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-4xl">Contact us</h1>
        <p className="mt-4 text-muted-foreground">
          Questions about a show, casting or partnerships? Send us a note and the team will reply.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Email: <span className="text-foreground">{content?.contact_email}</span>
          <br />
          Address: <span className="text-foreground">{content?.contact_address}</span>
        </p>

        <form onSubmit={onSubmit} className="surface-card mt-8 space-y-4 p-6">
          <div>
            <label className="label-xs" htmlFor="name">Name</label>
            <input
              id="name"
              required
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label-xs" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label-xs" htmlFor="message">Message</label>
            <textarea
              id="message"
              required
              rows={5}
              className="field"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
          {status === "sent" ? (
            <p className="text-sm text-primary">Thanks — your message has been sent.</p>
          ) : null}
          {status === "error" ? (
            <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
          ) : null}
        </form>
      </section>
    </SiteLayout>
  );
}
