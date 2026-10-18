// ph-verify: after paying, the browser sends Razorpay's three values. We check the signature with your secret, then mark the order paid.
import { cors, json, rest, hmacHex, safeEq } from "./_common.ts";
const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "bad_request" }, 405);
  if (!KEY_SECRET) return json({ error: "payments_not_configured" }, 503);
  let b: any; try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const oid = String(b.razorpay_order_id || ""), pid = String(b.razorpay_payment_id || ""), sig = String(b.razorpay_signature || "");
  if (!oid || !pid || !sig) return json({ error: "bad_request" }, 400);
  if (!safeEq(await hmacHex(KEY_SECRET, oid + "|" + pid), sig)) return json({ error: "bad_signature" }, 400);
  const a = await rest("rpc/ph_mark_paid", { method: "POST", body: JSON.stringify({ p_order: oid, p_payment: pid }) });
  if (!a.ok) return json({ error: "db" }, 500);
  const r = await a.json();
  if (!r.ok) return json({ error: r.error || "not_paid" }, 404);
  return json(r);
});
