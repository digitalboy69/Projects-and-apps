// ph-webhook: Razorpay calls this by itself, as a backup in case the customer closes the tab right after paying.
// Orders that are not Pay Hub orders (for example the Door app) are ignored, so both can share one Razorpay account.
import { cors, json, rest, hmacHex, safeEq } from "./_common.ts";
const WH_SECRET = Deno.env.get("PH_WEBHOOK_SECRET") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (!WH_SECRET) return json({ error: "webhook_not_configured" }, 503);
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  if (!safeEq(await hmacHex(WH_SECRET, raw), sig)) return json({ error: "bad_signature" }, 400);
  let ev: any; try { ev = JSON.parse(raw); } catch { return json({ error: "bad_json" }, 400); }
  const pay = ev?.payload?.payment?.entity;
  if (ev.event === "payment.captured" || ev.event === "order.paid") {
    const oid = pay?.order_id, pid = pay?.id;
    if (!oid || !pid) return json({ ok: true, skipped: true });
    const p = await rest("ph_orders?order_id=eq." + encodeURIComponent(oid) + "&select=amount_paise");
    const row = (p.ok ? await p.json() : [])[0];
    if (!row) return json({ ok: true, unknown_order: true });
    if (Number(pay.amount) !== Number(row.amount_paise)) return json({ ok: true, amount_mismatch: true });
    const a = await rest("rpc/ph_mark_paid", { method: "POST", body: JSON.stringify({ p_order: oid, p_payment: pid }) });
    return json(a.ok ? await a.json() : { error: "db" }, a.ok ? 200 : 500);
  }
  if (ev.event === "payment.failed" && pay?.order_id) {
    await rest("ph_orders?order_id=eq." + encodeURIComponent(pay.order_id) + "&status=eq.created", { method: "PATCH", body: JSON.stringify({ status: "failed" }) });
    return json({ ok: true });
  }
  if ((ev.event === "refund.processed" || ev.event === "refund.created") && ev?.payload?.refund?.entity?.payment_id) {
    await rest("ph_orders?payment_id=eq." + encodeURIComponent(ev.payload.refund.entity.payment_id), { method: "PATCH", body: JSON.stringify({ status: "refunded" }) });
    return json({ ok: true });
  }
  return json({ ok: true, ignored: ev.event });
});
