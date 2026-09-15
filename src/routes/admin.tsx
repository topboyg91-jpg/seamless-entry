import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  eventsQuery,
  fetchAllModels,
  formatKsh,
  siteContentQuery,
  votePrice,
  type EventRow,
  type ModelRow,
} from "@/lib/site-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Westgate Arena Voting" },
      {
        name: "description",
        content: "Manage Westgate Arena events, contestants, site text and vote totals.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Westgate Arena Voting" },
      { property: "og:description", content: "Manage events, contestants and votes." },
    ],
  }),
  component: AdminPage,
});

type Tab = "events" | "models" | "votes" | "content" | "messages";

const tabs: { id: Tab; label: string }[] = [
  { id: "events", label: "Events" },
  { id: "models", label: "Models" },
  { id: "votes", label: "Votes" },
  { id: "content", label: "Site text" },
  { id: "messages", label: "Messages" },
];

function AdminPage() {
  const [tab, setTab] = useState<Tab>("events");

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open access — no sign in needed. Everything you change here goes live immediately.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={tab === t.id ? "btn-primary" : "btn-outline"}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "events" ? <EventsAdmin /> : null}
          {tab === "models" ? <ModelsAdmin /> : null}
          {tab === "votes" ? <VotesAdmin /> : null}
          {tab === "content" ? <ContentAdmin /> : null}
          {tab === "messages" ? <MessagesAdmin /> : null}
        </div>
      </section>
    </SiteLayout>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyEvent = {
  title: "",
  slug: "",
  description: "",
  date_label: "",
  time_label: "",
  venue: "",
  cover_url: "",
  voting_open: true,
  sort_order: 0,
};

function EventsAdmin() {
  const queryClient = useQueryClient();
  const { data: events } = useQuery(eventsQuery);
  const [draft, setDraft] = useState({ ...emptyEvent });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    await queryClient.invalidateQueries();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...draft,
      slug: draft.slug ? slugify(draft.slug) : slugify(draft.title),
      cover_url: draft.cover_url || null,
    };
    const { error: err } = await supabase.from("events").insert(payload);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDraft({ ...emptyEvent });
    await refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="surface-card space-y-4 p-6">
        <h2 className="text-lg">Add an event</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} required />
          <Field
            label="URL name (optional)"
            value={draft.slug}
            onChange={(v) => setDraft({ ...draft, slug: v })}
            placeholder="auto from title"
          />
          <Field label="Date" value={draft.date_label} onChange={(v) => setDraft({ ...draft, date_label: v })} placeholder="Sat 26 Sep" />
          <Field label="Time" value={draft.time_label} onChange={(v) => setDraft({ ...draft, time_label: v })} placeholder="7:00 PM" />
          <Field label="Venue" value={draft.venue} onChange={(v) => setDraft({ ...draft, venue: v })} />
          <Field label="Cover image URL (optional)" value={draft.cover_url} onChange={(v) => setDraft({ ...draft, cover_url: v })} />
        </div>
        <div>
          <label className="label-xs">Description</label>
          <textarea
            className="field"
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
        <button className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Add event"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      <div className="space-y-4">
        {(events ?? []).map((event) => (
          <EventRowEditor key={event.id} event={event} onSaved={refresh} />
        ))}
      </div>
    </div>
  );
}

function EventRowEditor({ event, onSaved }: { event: EventRow; onSaved: () => void }) {
  const [row, setRow] = useState(event);
  const [saving, setSaving] = useState(false);

  useEffect(() => setRow(event), [event]);

  async function save() {
    setSaving(true);
    await supabase
      .from("events")
      .update({
        title: row.title,
        slug: slugify(row.slug),
        description: row.description,
        date_label: row.date_label,
        time_label: row.time_label,
        venue: row.venue,
        cover_url: row.cover_url || null,
        voting_open: row.voting_open,
        sort_order: row.sort_order,
      })
      .eq("id", event.id);
    setSaving(false);
    onSaved();
  }

  async function remove() {
    if (!confirm(`Delete "${event.title}" and all its models and votes?`)) return;
    await supabase.from("events").delete().eq("id", event.id);
    onSaved();
  }

  return (
    <div className="surface-card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" value={row.title} onChange={(v) => setRow({ ...row, title: v })} />
        <Field label="URL name" value={row.slug} onChange={(v) => setRow({ ...row, slug: v })} />
        <Field label="Date" value={row.date_label ?? ""} onChange={(v) => setRow({ ...row, date_label: v })} />
        <Field label="Time" value={row.time_label ?? ""} onChange={(v) => setRow({ ...row, time_label: v })} />
        <Field label="Venue" value={row.venue ?? ""} onChange={(v) => setRow({ ...row, venue: v })} />
        <Field label="Cover image URL" value={row.cover_url ?? ""} onChange={(v) => setRow({ ...row, cover_url: v })} />
      </div>
      <div>
        <label className="label-xs">Description</label>
        <textarea
          className="field"
          rows={2}
          value={row.description ?? ""}
          onChange={(e) => setRow({ ...row, description: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={row.voting_open}
            onChange={(e) => setRow({ ...row, voting_open: e.target.checked })}
          />
          Voting open
        </label>
        <label className="flex items-center gap-2 text-sm">
          Order
          <input
            type="number"
            className="field w-20"
            value={row.sort_order}
            onChange={(e) => setRow({ ...row, sort_order: Number(e.target.value) })}
          />
        </label>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button className="btn-outline" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}

const emptyModel = {
  event_id: "",
  name: "",
  number: "",
  city: "",
  bio: "",
  image_url: "",
  votes: 0,
  sort_order: 0,
};

function ModelsAdmin() {
  const queryClient = useQueryClient();
  const { data: events } = useQuery(eventsQuery);
  const { data: models } = useQuery({ queryKey: ["models", "all"], queryFn: fetchAllModels });
  const [draft, setDraft] = useState({ ...emptyModel });
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const eventId = draft.event_id || events?.[0]?.id;
    if (!eventId) {
      setError("Create an event first.");
      return;
    }
    const { error: err } = await supabase
      .from("models")
      .insert({ ...draft, event_id: eventId, image_url: draft.image_url || null });
    if (err) {
      setError(err.message);
      return;
    }
    setDraft({ ...emptyModel });
    await refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="surface-card space-y-4 p-6">
        <h2 className="text-lg">Add a model</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-xs">Event</label>
            <select
              className="field"
              value={draft.event_id}
              onChange={(e) => setDraft({ ...draft, event_id: e.target.value })}
            >
              <option value="">{events?.[0]?.title ?? "No events yet"}</option>
              {(events ?? []).map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
          <Field label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} required />
          <Field label="Number" value={draft.number} onChange={(v) => setDraft({ ...draft, number: v })} placeholder="04" />
          <Field label="City" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} />
          <Field label="Photo URL" value={draft.image_url} onChange={(v) => setDraft({ ...draft, image_url: v })} />
          <div>
            <label className="label-xs">Starting votes</label>
            <input
              type="number"
              className="field"
              value={draft.votes}
              onChange={(e) => setDraft({ ...draft, votes: Number(e.target.value) })}
            />
          </div>
        </div>
        <div>
          <label className="label-xs">Bio</label>
          <textarea
            className="field"
            rows={2}
            value={draft.bio}
            onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          />
        </div>
        <button className="btn-primary">Add model</button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      <div className="space-y-4">
        {(events ?? []).map((ev) => (
          <div key={ev.id} className="space-y-3">
            <h3 className="text-base">{ev.title}</h3>
            {(models ?? [])
              .filter((m) => m.event_id === ev.id)
              .map((model) => (
                <ModelRowEditor key={model.id} model={model} onSaved={refresh} />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelRowEditor({ model, onSaved }: { model: ModelRow; onSaved: () => void }) {
  const [row, setRow] = useState(model);
  const [saving, setSaving] = useState(false);

  useEffect(() => setRow(model), [model]);

  async function save() {
    setSaving(true);
    await supabase
      .from("models")
      .update({
        name: row.name,
        number: row.number,
        city: row.city,
        bio: row.bio,
        image_url: row.image_url || null,
        votes: row.votes,
        sort_order: row.sort_order,
      })
      .eq("id", model.id);
    setSaving(false);
    onSaved();
  }

  async function remove() {
    if (!confirm(`Delete ${model.name}?`)) return;
    await supabase.from("models").delete().eq("id", model.id);
    onSaved();
  }

  return (
    <div className="surface-card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" value={row.name} onChange={(v) => setRow({ ...row, name: v })} />
        <Field label="Number" value={row.number ?? ""} onChange={(v) => setRow({ ...row, number: v })} />
        <Field label="City" value={row.city ?? ""} onChange={(v) => setRow({ ...row, city: v })} />
        <Field label="Photo URL" value={row.image_url ?? ""} onChange={(v) => setRow({ ...row, image_url: v })} />
      </div>
      <div>
        <label className="label-xs">Bio</label>
        <textarea
          className="field"
          rows={2}
          value={row.bio ?? ""}
          onChange={(e) => setRow({ ...row, bio: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          Votes
          <input
            type="number"
            className="field w-24"
            value={row.votes}
            onChange={(e) => setRow({ ...row, votes: Number(e.target.value) })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          Order
          <input
            type="number"
            className="field w-20"
            value={row.sort_order}
            onChange={(e) => setRow({ ...row, sort_order: Number(e.target.value) })}
          />
        </label>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button className="btn-outline" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}

function VotesAdmin() {
  const { data: content } = useQuery(siteContentQuery);
  const price = votePrice(content);
  const { data: models } = useQuery({ queryKey: ["models", "all"], queryFn: fetchAllModels });
  const { data: votes } = useQuery({
    queryKey: ["votes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalVotes = (models ?? []).reduce((s, m) => s + m.votes, 0);
  const nameOf = (id: string) => (models ?? []).find((m) => m.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total votes" value={totalVotes.toLocaleString("en-KE")} />
        <Stat label="Revenue" value={formatKsh(totalVotes * price)} />
        <Stat label="Paid transactions" value={(votes?.length ?? 0).toLocaleString("en-KE")} />
      </div>

      <div className="surface-card overflow-x-auto p-5">
        <h2 className="mb-4 text-lg">Recent votes</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-2">When</th>
              <th className="pb-2">Model</th>
              <th className="pb-2">Votes</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {(votes ?? []).map((v) => (
              <tr key={v.id} className="border-t border-border">
                <td className="py-2">{new Date(v.created_at).toLocaleString("en-KE")}</td>
                <td className="py-2">{nameOf(v.model_id)}</td>
                <td className="py-2">{v.quantity}</td>
                <td className="py-2">{formatKsh(v.amount)}</td>
                <td className="py-2">{v.phone ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {votes?.length === 0 ? <p className="text-sm text-muted-foreground">No votes yet.</p> : null}
      </div>
    </div>
  );
}

function ContentAdmin() {
  const queryClient = useQueryClient();
  const { data: content } = useQuery(siteContentQuery);
  const [rows, setRows] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (content) setRows(content);
  }, [content]);

  async function save() {
    setSaving(true);
    const payload = Object.entries(rows).map(([key, value]) => ({ key, value }));
    await supabase.from("site_content").upsert(payload);
    setSaving(false);
    await queryClient.invalidateQueries({ queryKey: ["site-content"] });
  }

  return (
    <div className="surface-card space-y-4 p-6">
      <h2 className="text-lg">Site text</h2>
      {Object.keys(rows)
        .sort()
        .map((key) => (
          <div key={key}>
            <label className="label-xs">{key.replace(/_/g, " ")}</label>
            {rows[key].length > 80 ? (
              <textarea
                className="field"
                rows={3}
                value={rows[key]}
                onChange={(e) => setRows({ ...rows, [key]: e.target.value })}
              />
            ) : (
              <input
                className="field"
                value={rows[key]}
                onChange={(e) => setRows({ ...rows, [key]: e.target.value })}
              />
            )}
          </div>
        ))}
      <button className="btn-primary" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save text"}
      </button>
    </div>
  );
}

function MessagesAdmin() {
  const { data: messages } = useQuery({
    queryKey: ["contact_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      {(messages ?? []).map((m) => (
        <div key={m.id} className="surface-card p-5">
          <p className="text-sm text-muted-foreground">
            {new Date(m.created_at).toLocaleString("en-KE")}
          </p>
          <p className="mt-1 font-medium">
            {m.name} · {m.email}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{m.message}</p>
        </div>
      ))}
      {messages?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-5">
      <p className="label-xs">{label}</p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label-xs">{label}</label>
      <input
        className="field"
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
