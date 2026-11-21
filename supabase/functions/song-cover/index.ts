// Finds the album cover for a song (Deezer public search). Returns only the cover URL and the album name.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey, content-type, authorization, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function getJson(url: string, ms = 5000): Promise<any> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { "User-Agent": "RehearsalNotebook/1.0 (album covers)", Accept: "application/json" }, signal: ctl.signal });
    return r.ok ? await r.json() : null;
  } catch (_) { return null; } finally { clearTimeout(t); }
}
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[\u0000-\u001f"]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const okCover = (u: unknown) => { try { const h = new URL(String(u)).hostname; return h.endsWith("dzcdn.net") || h.endsWith("deezer.com"); } catch (_) { return false; } };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return J({ ok: false }, 405);
  let b: { title?: string; artist?: string } = {};
  try { b = await req.json(); } catch (_) { /* empty */ }
  const title = clean(b.title, 100), artist = clean(b.artist, 80);
  if (title.length < 1) return J({ ok: false, error: "title" }, 400);
  const queries = artist
    ? [`artist:"${artist}" track:"${title}"`, `${title} ${artist}`]
    : [`track:"${title}"`, title];
  for (const q of queries) {
    const d = await getJson(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`);
    for (const t of d?.data || []) {
      const alb = t?.album;
      const url = alb?.cover_medium || alb?.cover_big;
      if (url && okCover(url)) return J({ ok: true, cover: url, album: clean(alb.title, 100) });
    }
  }
  return J({ ok: false, error: "notfound" }, 404);
});
