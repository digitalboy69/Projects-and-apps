// ph-order: a visitor presses "Pay" on one of your payment pages. The price always comes from the database, never from the browser
// (except pay-what-you-want pages, where the amount is checked against your minimum).
import { cors, json, rest } from "./_common.ts";
const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "";
const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";
const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "bad_request" }, 405);
  if (!KEY_ID || !KEY_SECRET) return json({ error: "payments_not_configured" }, 503);
  let b: any; try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  if (clean(b.website, 50)) return json({ error: "bad_request" }, 400); // hidden field: bots fill it, people do not
  const slug = clean(b.slug, 61).toLowerCase();
  const name = clean(b.name, 80), email = clean(b.email, 120).toLowerCase();
  const phone = clean(b.phone, 20).replace(/[^\d+]/g, ""), note = clean(b.note, 300);
  if (!name) return json({ error: "name_required" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "email_invalid" }, 400);
  if (phone && !/^\+?\d{8,15}$/.test(phone)) return json({ error: "phone_invalid" }, 400);

  const pr = await rest("ph_pages?slug=eq." + encodeURIComponent(slug) + "&active=eq.true&select=*");
  const page = (pr.ok ? await pr.json() : [])[0];
  if (!page) return json({ error: "page_not_found" }, 404);

  let amount = Number(page.amount_paise);
  if (page.pay_what_you_want) {
    amount = Math.round(Number(b.amount_paise));
    if (!Number.isFinite(amount) || amount < Number(page.min_paise)) return json({ error: "amount_too_low", min_paise: page.min_paise }, 400);
    if (amount > 50000000) return json({ error: "amount_too_high" }, 400);
  }
  if (!amount || amount < 100) return json({ error: "bad_price" }, 500);

  const o = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(KEY_ID + ":" + KEY_SECRET) },
    body: JSON.stringify({ amount, currency: page.currency, receipt: ("ph" + Date.now()).slice(0, 40), notes: { page: page.slug } }),
  });
  if (!o.ok) return json({ error: "razorpay", status: o.status }, 502);
  const order = await o.json();
  const ins = await rest("ph_orders", {
    method: "POST", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ page_id: page.id, order_id: order.id, amount_paise: amount, currency: page.currency, name, email, phone: phone || null, note: note || null }),
  });
  if (!ins.ok) return json({ error: "db" }, 500);
  return json({ order_id: order.id, amount, currency: page.currency, key_id: KEY_ID, title: page.title, description: page.description.slice(0, 250), prefill: { name, email, contact: phone } });
});
