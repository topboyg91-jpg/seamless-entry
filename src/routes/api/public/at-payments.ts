import { createFileRoute } from "@tanstack/react-router";

// Africa's Talking payment notification callback.
// Verified by matching the transactionId we stored and the amount paid.
export const Route = createFileRoute("/api/public/at-payments")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as {
          transactionId?: string;
          status?: string;
          value?: string;
          requestMetadata?: { voteId?: string };
        } | null;
        if (!body?.transactionId) return new Response("bad request", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: vote } = await supabaseAdmin
          .from("votes")
          .select("id,amount,status")
          .eq("transaction_id", body.transactionId)
          .maybeSingle();
        if (!vote) return new Response("unknown transaction", { status: 404 });
        if (vote.status !== "pending") return new Response("ok");

        const paid = Number(String(body.value ?? "").replace(/[^\d.]/g, ""));
        const success = body.status === "Success" && paid >= vote.amount;
        await supabaseAdmin
          .from("votes")
          .update({ status: success ? "paid" : "failed" })
          .eq("id", vote.id);
        return new Response("ok");
      },
    },
  },
});
