import { supabase } from "@/integrations/supabase/client";

import runwayCover from "@/assets/event-runway.jpg";
import crownCover from "@/assets/event-crown.jpg";
import model1 from "@/assets/model-1.jpg";
import model2 from "@/assets/model-2.jpg";
import model3 from "@/assets/model-3.jpg";
import model4 from "@/assets/model-4.jpg";
import model5 from "@/assets/model-5.jpg";
import model6 from "@/assets/model-6.jpg";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  date_label: string | null;
  time_label: string | null;
  venue: string | null;
  cover_url: string | null;
  voting_open: boolean;
  sort_order: number;
};

export type ModelRow = {
  id: string;
  event_id: string;
  name: string;
  number: string | null;
  city: string | null;
  bio: string | null;
  image_url: string | null;
  votes: number;
  sort_order: number;
};

const eventCovers: Record<string, string> = {
  "runway-finale": runwayCover,
  "crown-night": crownCover,
};

const modelPortraits: Record<string, string> = {
  "Amara Njeri": model1,
  "Kelvin Otieno": model2,
  "Zawadi Kimani": model3,
  "Naliaka Wekesa": model4,
  "Shani Mwangi": model5,
  "Tesa Achieng": model6,
};

const fallbackPortraits = [model1, model2, model3, model4, model5, model6];

export function eventCover(event: Pick<EventRow, "slug" | "cover_url">) {
  return event.cover_url || eventCovers[event.slug] || crownCover;
}

export function modelPortrait(model: Pick<ModelRow, "name" | "image_url">, index = 0) {
  return (
    model.image_url || modelPortraits[model.name] || fallbackPortraits[index % fallbackPortraits.length]
  );
}

export async function fetchSiteContent() {
  const { data, error } = await supabase.from("site_content").select("key,value");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export async function fetchEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function fetchEventBySlug(slug: string) {
  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as EventRow | null) ?? null;
}

export async function fetchModels(eventId: string) {
  const { data, error } = await supabase
    .from("models")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ModelRow[];
}

export async function fetchAllModels() {
  const { data, error } = await supabase
    .from("models")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ModelRow[];
}

export const siteContentQuery = {
  queryKey: ["site-content"],
  queryFn: fetchSiteContent,
};

export const eventsQuery = {
  queryKey: ["events"],
  queryFn: fetchEvents,
};

export function votePrice(content: Record<string, string> | undefined) {
  const raw = Number(content?.vote_price ?? 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 10;
}

export function formatKsh(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}
