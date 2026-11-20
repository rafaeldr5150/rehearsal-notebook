// Suggests band / artist names while the user types (Deezer public search, with MusicBrainz as a fallback). Returns names only.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey, content-type, authorization, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function getJson(url: string, ms = 5000): Promise<any> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { "User-Agent": "RehearsalNotebook/1.0 (artist suggestions)", Accept: "application/json" }, signal: ctl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch (_) { return null; } finally { clearTimeout(t); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return J({ ok: false }, 405);
  let b: { q?: string } = {};
  try { b = await req.json(); } catch (_) { /* empty */ }
  const q = String(b.q || "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  if (q.length < 2) return J({ ok: true, names: [] });
  const names: string[] = [];
  const add = (n: unknown) => {
    const s = String(n || "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (s && !names.some((x) => x.toLowerCase() === s.toLowerCase())) names.push(s);
  };
  const dz = await getJson(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=8`);
  for (const a of dz?.data || []) add(a.name);
  if (names.length < 3) {
    const mb = await getJson(`https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(q)}&fmt=json&limit=8`);
    for (const a of mb?.artists || []) add(a.name);
  }
  return J({ ok: true, names: names.slice(0, 8) });
});
