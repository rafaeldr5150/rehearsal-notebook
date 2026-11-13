// Google Drive for the band: connect once (OAuth), then upload recordings to  setlist/<song>/  in that account.
// Scope: drive.file (the app only sees files and folders it created). The refresh token never leaves the server.
// Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CRON_SECRET (used to sign the OAuth state).
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const KEY = Deno.env.get("CRON_SECRET") || "";
const SELF = Deno.env.get("SUPABASE_URL")! + "/functions/v1/drive-oauth";
const ORIGINS = ["https://caderno-de-ensaio.vercel.app", "https://caderno-de-ensaio-rafaeldr5150s-projects.vercel.app", "http://localhost:8765"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey, content-type, authorization, x-client-info", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const b64u = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function sign(data: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data)));
}
async function makeState(o: object) { const p = b64u(new TextEncoder().encode(JSON.stringify(o))); return p + "." + (await sign(p)); }
async function readState(s: string) {
  const [p, sig] = s.split(".");
  if (!p || !sig || (await sign(p)) !== sig) return null;
  try {
    const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))));
    return o.exp > Date.now() ? o : null;
  } catch (_) { return null; }
}
const bandOk = async (band: string) => !!band && !!(await sb.from("ce_bands").select("code").eq("code", band).maybeSingle()).data;
const bounce = (ret: string, q: string) => new Response(null, { status: 302, headers: { Location: `${ret}/?${q}#config` } });

async function accessToken(row: { refresh_token: string }) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: row.refresh_token, grant_type: "refresh_token" }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error("token:" + (d.error || r.status));
  return d.access_token as string;
}
const gj = async (url: string, tok: string, init: RequestInit = {}) => {
  const r = await fetch(url, { ...init, headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json", ...(init.headers || {}) } });
  return { status: r.status, data: await r.json().catch(() => ({})), headers: r.headers };
};
const mkFolder = async (tok: string, name: string, parent?: string) => {
  const r = await gj("https://www.googleapis.com/drive/v3/files?fields=id", tok, { method: "POST", body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parent ? { parents: [parent] } : {}) }) });
  if (!r.data.id) throw new Error("folder:" + r.status);
  return r.data.id as string;
};
const alive = async (tok: string, id: string) => {
  const r = await gj(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,trashed`, tok);
  return r.status === 200 && !r.data.trashed;
};
const clean = (s: string) => String(s || "Sem título").replace(/[\/\\<>:"|?*\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || "Sem título";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);

  // 1) start: browser navigation -> Google consent
  if (req.method === "GET" && url.searchParams.get("start")) {
    const band = url.searchParams.get("band") || "", ret = url.searchParams.get("ret") || "";
    if (!ORIGINS.includes(ret) || !(await bandOk(band))) return new Response("bad request", { status: 400 });
    if (!CLIENT_ID || !CLIENT_SECRET) return bounce(ret, "drive=nosecret");
    const state = await makeState({ band, ret, exp: Date.now() + 10 * 60000 });
    const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: SELF, response_type: "code", access_type: "offline", prompt: "consent select_account", include_granted_scopes: "true",
      scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email", state });
    return new Response(null, { status: 302, headers: { Location: "https://accounts.google.com/o/oauth2/v2/auth?" + q } });
  }

  // 2) callback from Google
  if (req.method === "GET" && (url.searchParams.get("code") || url.searchParams.get("error"))) {
    const st = await readState(url.searchParams.get("state") || "");
    if (!st || !ORIGINS.includes(st.ret)) return new Response("invalid or expired state", { status: 400 });
    if (url.searchParams.get("error")) return bounce(st.ret, "drive=denied");
    try {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code: url.searchParams.get("code")!, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: SELF, grant_type: "authorization_code" }),
      });
      const d = await r.json();
      if (!d.refresh_token || !d.access_token) return bounce(st.ret, "drive=err");
      const me = await gj("https://www.googleapis.com/oauth2/v2/userinfo", d.access_token);
      const folder = await mkFolder(d.access_token, "setlist");
      const { data: old } = await sb.from("ce_drive").select("refresh_token").eq("band", st.band).maybeSingle();
      if (old?.refresh_token) await fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(old.refresh_token), { method: "POST" }).catch(() => {});
      await sb.from("ce_drive").upsert({ band: st.band, refresh_token: d.refresh_token, folder_id: folder, email: me.data.email || "", folders: {}, root_name: "", connected_at: new Date().toISOString() });
      return bounce(st.ret, "drive=ok");
    } catch (_) { return bounce(st.ret, "drive=err"); }
  }

  if (req.method !== "POST") return J({ ok: false }, 405);
  let b: any = {};
  try { b = await req.json(); } catch (_) { /* empty */ }
  if (!(await bandOk(b.band))) return J({ ok: false, error: "band" }, 404);
  const { data: row } = await sb.from("ce_drive").select("*").eq("band", b.band).maybeSingle();

  if (b.action === "status") return J({ ok: true, connected: !!row, email: row?.email || "", folder: row?.folder_id || "", root: row?.root_name || "", configured: !!(CLIENT_ID && CLIENT_SECRET) });
  if (!row) return J({ ok: false, error: "not_connected" }, 409);

  // Short-lived token (drive.file only) so the browser can open Google Picker for the connected account.
  if (b.action === "picker-token") {
    try { return J({ ok: true, token: await accessToken(row), appId: CLIENT_ID.split("-")[0] }); } catch (e) { return J({ ok: false, error: String((e as Error).message) }, 502); }
  }

  // The user picked a folder in Google Picker: build  <band name>/setlist/  inside it and use it from now on.
  if (b.action === "set-folder") {
    try {
      const tok = await accessToken(row);
      const g = await gj(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(String(b.folderId))}?fields=id,name,mimeType,trashed,capabilities(canAddChildren)`, tok);
      if (g.status !== 200 || g.data.mimeType !== "application/vnd.google-apps.folder" || g.data.trashed) return J({ ok: false, error: "folder" }, 400);
      if (g.data.capabilities && g.data.capabilities.canAddChildren === false) return J({ ok: false, error: "readonly" }, 403);
      const { data: bd } = await sb.from("ce_docs").select("data").eq("band", b.band).eq("coll", "config").eq("id", "band").maybeSingle();
      const bandFolder = await mkFolder(tok, clean(bd?.data?.name || "Banda"), g.data.id);
      const setlist = await mkFolder(tok, "setlist", bandFolder);
      await sb.from("ce_drive").update({ folder_id: setlist, folders: {}, root_name: g.data.name }).eq("band", b.band);
      return J({ ok: true, root: g.data.name, folder: setlist });
    } catch (e) { return J({ ok: false, error: String((e as Error).message) }, 502); }
  }

  // Recordings of one song (only inside this band's song folder).
  if (b.action === "list") {
    try {
      const sf = (row.folders || {})[b.songId];
      if (!sf) return J({ ok: true, files: [] });
      const tok = await accessToken(row);
      const q = encodeURIComponent(`'${sf}' in parents and trashed=false`);
      const r = await gj(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=50&fields=files(id,name,mimeType,size,createdTime,webViewLink)`, tok);
      if (r.status === 404) return J({ ok: true, files: [] });
      return J({ ok: r.status === 200, files: r.data.files || [] });
    } catch (e) { return J({ ok: false, error: String((e as Error).message) }, 502); }
  }
  // Move one recording to the Drive trash (recoverable). Only files inside this band's song folders.
  if (b.action === "delete") {
    try {
      const tok = await accessToken(row);
      const g = await gj(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(String(b.fileId))}?fields=id,parents`, tok);
      const mine = new Set(Object.values(row.folders || {}));
      if (g.status !== 200 || !(g.data.parents || []).some((p: string) => mine.has(p))) return J({ ok: false, error: "not_found" }, 404);
      const u = await gj(`https://www.googleapis.com/drive/v3/files/${g.data.id}`, tok, { method: "PATCH", body: JSON.stringify({ trashed: true }) });
      return J({ ok: u.status === 200 });
    } catch (e) { return J({ ok: false, error: String((e as Error).message) }, 502); }
  }

  if (b.action === "disconnect") {
    await fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(row.refresh_token), { method: "POST" }).catch(() => {});
    await sb.from("ce_drive").delete().eq("band", b.band);
    return J({ ok: true });
  }

  if (b.action === "upload") {
    if (!ORIGINS.includes(b.origin)) return J({ ok: false, error: "origin" }, 400);
    try {
      const tok = await accessToken(row);
      let setlist = row.folder_id, folders: Record<string, string> = row.folders || {};
      if (!(await alive(tok, setlist))) { setlist = await mkFolder(tok, "setlist"); folders = {}; }
      let sf = folders[b.songId];
      if (!sf || !(await alive(tok, sf))) { sf = await mkFolder(tok, clean(b.title), setlist); folders[b.songId] = sf; }
      await sb.from("ce_drive").update({ folder_id: setlist, folders }).eq("band", b.band);
      const mime = String(b.mime || "application/octet-stream").slice(0, 80);
      const init = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink", {
        method: "POST",
        headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": mime, Origin: b.origin },
        body: JSON.stringify({ name: clean(b.name), parents: [sf], mimeType: mime }),
      });
      const loc = init.headers.get("location");
      if (!loc) return J({ ok: false, error: "init:" + init.status }, 502);
      return J({ ok: true, url: loc, folder: sf });
    } catch (e) { return J({ ok: false, error: String((e as Error).message || e) }, 502); }
  }
  return J({ ok: false, error: "action" }, 400);
});
