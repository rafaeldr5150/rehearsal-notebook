// Looks up the public title of a video from its link (YouTube, Vimeo or TikTok oEmbed). Returns only the title and the channel name.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey, content-type, authorization, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function endpoint(raw: string): string | null {
  let u: URL;
  try { u = new URL(String(raw || "").trim()); } catch (_) { return null; }
  if (u.protocol !== "https:" || u.username || u.password || String(raw).length > 300) return null;
  const h = u.hostname.replace(/^www\.|^m\./, "");
  const q = encodeURIComponent(u.toString());
  if (h === "youtube.com" || h === "youtu.be" || h === "youtube-nocookie.com") return `https://www.youtube.com/oembed?format=json&url=${q}`;
  if (h === "vimeo.com") return `https://vimeo.com/api/oembed.json?url=${q}`;
  if (h === "tiktok.com") return `https://www.tiktok.com/oembed?url=${q}`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return J({ ok: false }, 405);
  let b: { url?: string } = {};
  try { b = await req.json(); } catch (_) { /* empty */ }
  const ep = endpoint(b.url || "");
  if (!ep) return J({ ok: false, error: "url" }, 400);
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch(ep, { headers: { "User-Agent": "Mozilla/5.0 (compatible; RehearsalNotebook/1.0)", "Accept": "application/json" }, signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return J({ ok: false, error: "notfound" }, 404);
    const d = await r.json();
    const title = String(d.title || "").replace(/\s+/g, " ").trim().slice(0, 100);
    if (!title) return J({ ok: false, error: "notitle" }, 404);
    return J({ ok: true, title, author: String(d.author_name || "").slice(0, 60) });
  } catch (_) { return J({ ok: false, error: "fetch" }, 502); }
});
