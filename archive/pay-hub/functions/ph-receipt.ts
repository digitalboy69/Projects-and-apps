// ph-receipt: a customer comes back to their purchase with the order id + payment id they were given. Returns the delivery only for PAID orders.
import { cors, json, rest } from "./_common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "bad_request" }, 405);
  let b: any; try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const oid = String(b.order_id || "").slice(0, 60), pid = String(b.payment_id || "").slice(0, 60);
  if (!/^order_[A-Za-z0-9]+$/.test(oid) || !/^pay_[A-Za-z0-9]+$/.test(pid)) return json({ error: "bad_request" }, 400);
  const a = await rest("rpc/ph_receipt", { method: "POST", body: JSON.stringify({ p_order: oid, p_payment: pid }) });
  if (!a.ok) return json({ error: "db" }, 500);
  const r = await a.json();
  if (!r || !r.ok) return json({ error: "not_found" }, 404);
  return json(r);
});
