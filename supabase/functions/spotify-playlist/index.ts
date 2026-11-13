// Reads a PUBLIC Spotify playlist from its public embed page (no Spotify account or API key needed).
// Returns the track list; the app decides what to add. It is a convenience: if Spotify changes the page, it returns an error and the app keeps working.
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey, content-type, authorization, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function playlistId(s: string) {
  const m = String(s || "").match(/playlist[\/:]([A-Za-z0-9]{22})/) || String(s || "").trim().match(/^([A-Za-z0-9]{22})$/);
  return m ? m[1] : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return J({ ok: false }, 405);
  let b: any = {};
  try { b = await req.json(); } catch (_) { /* empty */ }
  const ok = b.band && (await sb.from("ce_bands").select("code").eq("code", b.band).maybeSingle()).data;
  if (!ok) return J({ ok: false, error: "band" }, 404);
  const id = playlistId(b.playlist);
  if (!id) return J({ ok: false, error: "link" }, 400);
  try {
    // The embed page is occasionally served without the track list: try up to 3 times.
    let e: any = null, status = 0, sawPage = false;
    for (let i = 0; i < 3 && !(e && Array.isArray(e.trackList)); i++) {
      if (i) await new Promise((r) => setTimeout(r, 600));
      const r = await fetch(`https://open.spotify.com/embed/playlist/${id}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; RehearsalNotebook/1.0)", "Accept-Language": "en" } });
      status = r.status;
      if (r.status === 404) return J({ ok: false, error: "missing" }, 404);
      const m = (await r.text()).match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
      if (m) { sawPage = true; e = JSON.parse(m[1])?.props?.pageProps?.state?.data?.entity; }
    }
    if (!sawPage) return J({ ok: false, error: "format", status }, 502);
    if (!e || !Array.isArray(e.trackList)) return J({ ok: false, error: "private" }, 404);
    const tracks = e.trackList
      .map((t: any) => ({ id: String(t.uri || "").split(":").pop(), title: String(t.title || ""), artist: String(t.subtitle || "").replace(/\u00a0/g, " "), duration: Math.round((t.duration || 0) / 1000) }))
      .filter((t: any) => t.id && t.title);
    return J({ ok: true, id, name: e.name || e.title || "", tracks });
  } catch (_) { return J({ ok: false, error: "fetch" }, 502); }
});
