import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+254${digits.slice(1)}`;
  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) return `+254${digits}`;
  return null;
}

export const startVotePayment = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        modelId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10000),
        phone: z.string().min(9).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const username = process.env["AT_USERNAME"];
    const apiKey = process.env["AT_API_KEY"];
    const productName = process.env["AT_PRODUCT_NAME"];
    if (!username || !apiKey || !productName) {
      return { ok: false as const, error: "M-Pesa payments are not set up yet. Please try again later." };
    }
    const phone = normalizePhone(data.phone);
    if (!phone) return { ok: false as const, error: "Enter a valid Safaricom number, e.g. 0712 345 678." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: model } = await supabaseAdmin
      .from("models")
      .select("id,event_id,events(voting_open)")
      .eq("id", data.modelId)
      .maybeSingle();
    const ev = (model as { events?: { voting_open: boolean } } | null)?.events;
    if (!model || !ev?.voting_open) return { ok: false as const, error: "Voting is closed for this event." };

    const { data: priceRow } = await supabaseAdmin
      .from("site_content")
      .select("value")
      .eq("key", "vote_price")
      .maybeSingle();
    const price = Number(priceRow?.value) > 0 ? Number(priceRow?.value) : 10;
    const amount = price * data.quantity;

    const { data: vote, error } = await supabaseAdmin
      .from("votes")
      .insert({ event_id: model.event_id, model_id: model.id, quantity: data.quantity, amount, phone, status: "pending" })
      .select("id")
      .single();
    if (error || !vote) return { ok: false as const, error: "Could not start the payment." };

    const host = username === "sandbox" ? "payments.sandbox.africastalking.com" : "payments.africastalking.com";
    try {
      const res = await fetch(`https://${host}/mobile/checkout/request`, {
        method: "POST",
        headers: { apiKey, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          productName,
          phoneNumber: phone,
          currencyCode: "KES",
          amount,
          metadata: { voteId: vote.id },
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { status?: string; transactionId?: string; description?: string };
      if (body.status !== "PendingConfirmation") {
        console.error("AT checkout failed", res.status, body);
        await supabaseAdmin.from("votes").update({ status: "failed" }).eq("id", vote.id);
        return { ok: false as const, error: "M-Pesa could not send the prompt. Please try again." };
      }
      await supabaseAdmin.from("votes").update({ transaction_id: body.transactionId ?? null }).eq("id", vote.id);
      return { ok: true as const, voteId: vote.id };
    } catch (e) {
      console.error(e);
      await supabaseAdmin.from("votes").update({ status: "failed" }).eq("id", vote.id);
      return { ok: false as const, error: "Payment service unavailable. Please try again." };
    }
  });

export const getVoteStatus = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ voteId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: v } = await supabaseAdmin.from("votes").select("status").eq("id", data.voteId).maybeSingle();
    return { status: v?.status ?? "unknown" };
  });
