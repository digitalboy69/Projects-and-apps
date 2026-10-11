// get-app: returns the app HTML only to signed-in members whose access is valid.
// The encrypted app (app.enc) is public; the key lives ONLY in this function.
const KEY_HEX = "__APP_KEY__";
const BLOB_URL = "https://digitalboy69.github.io/vedic-gate/app.enc";
const TRIAL_DAYS = 7;
const SB = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
let cache: { t: number; html: Uint8Array } | null = null;

function hexToBytes(h: string) { const a = new Uint8Array(h.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
function b64ToBytes(b: string) { const s = atob(b.trim()); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }

async function loadApp(): Promise<Uint8Array> {
  if (cache && Date.now() - cache.t < 300000) return cache.html;
  const r = await fetch(BLOB_URL + "?t=" + Math.floor(Date.now() / 300000));
  if (!r.ok) throw new Error("blob " + r.status);
  const raw = b64ToBytes(await r.text());
  const iv = raw.slice(0, 12), ct = raw.slice(12);
  const key = await crypto.subtle.importKey("raw", hexToBytes(KEY_HEX), "AES-GCM", false, ["decrypt"]);
  const gz = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
  const html = new Uint8Array(await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
  cache = { t: Date.now(), html };
  return html;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ reason: "login" }, 401);
  // 1) who is this? (validated by Supabase Auth, not by us)
  const u = await fetch(SB + "/auth/v1/user", { headers: { apikey: SRK, Authorization: "Bearer " + jwt } });
  if (!u.ok) return json({ reason: "login" }, 401);
  const user = await u.json();
  if (!user || !user.id) return json({ reason: "login" }, 401);
  // 2) are they allowed?
  const m = await fetch(SB + "/rest/v1/member_access?user_id=eq." + user.id + "&select=status,expires_at,created_at", { headers: { apikey: SRK, Authorization: "Bearer " + SRK } });
  const rows = m.ok ? await m.json() : [];
  const row = rows[0];
  if (!row) return json({ reason: "no_record" }, 403);
  const now = Date.now();
  if (row.status === "blocked") return json({ reason: "blocked" }, 403);
  if (row.status === "active") {
    if (row.expires_at && new Date(row.expires_at).getTime() < now) return json({ reason: "expired" }, 402);
  } else {
    const end = new Date(row.created_at).getTime() + TRIAL_DAYS * 86400000;
    if (now > end) return json({ reason: "trial_over" }, 402);
  }
  // 3) allowed: send the app
  try {
    const html = await loadApp();
    return new Response(html, { headers: { ...cors, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (e) {
    return json({ reason: "unavailable", detail: String(e) }, 503);
  }
});
