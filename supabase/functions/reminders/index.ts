// Sends rehearsal reminders (web push): the evening before (18h) and the morning of (8h), local time of each device.
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);

type Row = { id: number; band: string; endpoint: string; sub: any; mid: string | null; tz: string; lang: string };
type Reh = { date?: string; time?: string; place?: string };

function localParts(tz: string, d = new Date()) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(d)) p[x.type] = x.value;
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour };
}
function dayBefore(date: string) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
const T: Record<string, any> = {
  pt: {
    eve: "Ensaio amanhã", day: "Ensaio hoje",
    todo: (n: number) => `Você ainda tem ${n} ${n === 1 ? "música" : "músicas"} para tirar.`,
    ok: "Você está em dia com as músicas. Bom ensaio!",
    at: (t: string) => ` às ${t}`, test: "Lembretes ativados", testBody: "Você vai receber um aviso na véspera e no dia do ensaio.",
  },
  en: {
    eve: "Rehearsal tomorrow", day: "Rehearsal today",
    todo: (n: number) => `You still have ${n} ${n === 1 ? "song" : "songs"} to learn.`,
    ok: "You're caught up on the songs. Have a great rehearsal!",
    at: (t: string) => ` at ${t}`, test: "Reminders on", testBody: "You'll get a notice the evening before and the day of the rehearsal.",
  },
  es: {
    eve: "Ensayo mañana", day: "Ensayo hoy",
    todo: (n: number) => `Todavía te ${n === 1 ? "falta 1 canción" : `faltan ${n} canciones`} por sacar.`,
    ok: "Estás al día con las canciones. ¡Buen ensayo!",
    at: (t: string) => ` a las ${t}`, test: "Recordatorios activados", testBody: "Recibirás un aviso la víspera y el día del ensayo.",
  },
};

async function push(row: Row, payload: object) {
  try {
    await webpush.sendNotification(row.sub, JSON.stringify(payload), { TTL: 6 * 3600 });
    return "sent";
  } catch (e: any) {
    if (e?.statusCode === 404 || e?.statusCode === 410) {
      await sb.from("ce_push").delete().eq("id", row.id);
      return "gone";
    }
    return "error:" + (e?.statusCode ?? e?.message);
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let body: any = {};
  try { body = await req.json(); } catch (_) { /* empty */ }

  // Test notification: only for a subscription that exists (the endpoint is the proof).
  if (body.action === "test") {
    const { data } = await sb.from("ce_push").select("*").eq("band", body.band).eq("endpoint", body.endpoint).maybeSingle();
    if (!data) return new Response(JSON.stringify({ ok: false }), { status: 404 });
    const t = T[data.lang] || T.pt;
    const r = await push(data, { title: t.test, body: t.testBody, tag: "rehearsal-test", url: "./" });
    return new Response(JSON.stringify({ ok: r === "sent", r }));
  }

  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return new Response("forbidden", { status: 403 });
  const dry = url.searchParams.get("dry") === "1";
  const now = body.now ? new Date(body.now) : new Date();

  const { data: rows } = await sb.from("ce_push").select("*");
  const byBand = new Map<string, Row[]>();
  for (const r of (rows || []) as Row[]) byBand.set(r.band, [...(byBand.get(r.band) || []), r]);

  const out: any[] = [];
  for (const [band, subs] of byBand) {
    const { data: docs } = await sb.from("ce_docs").select("coll,id,data").eq("band", band).in("coll", ["config", "songs"]);
    const reh: Reh = (docs || []).find((d: any) => d.coll === "config" && d.id === "rehearsal")?.data || {};
    if (!reh.date || !/^\d{4}-\d{2}-\d{2}$/.test(reh.date)) continue;
    const songs = (docs || []).filter((d: any) => d.coll === "songs").map((d: any) => d.data);
    for (const s of subs) {
      const lp = localParts(s.tz, now);
      let kind = "";
      if (lp.date === reh.date && lp.hour >= 8 && lp.hour < 12) kind = "day";
      else if (lp.date === dayBefore(reh.date) && lp.hour >= 18 && lp.hour < 22) kind = "eve";
      if (!kind) continue;
      const { data: done } = await sb.from("ce_push_log").select("push_id").eq("push_id", s.id).eq("kind", kind).eq("for_date", reh.date).maybeSingle();
      if (done) continue;
      const t = T[s.lang] || T.pt;
      let n = 0;
      if (s.mid) n = songs.filter((x: any) => x.next && ((x.parts?.[s.mid]?.status ?? 0) < 2)).length;
      const hasNext = songs.some((x: any) => x.next);
      const title = t[kind] + (kind === "day" && reh.time ? t.at(reh.time) : "");
      const text = [hasNext ? (n > 0 ? t.todo(n) : t.ok) : "", reh.place || ""].filter(Boolean).join(" · ");
      const payload = { title, body: text, tag: "rehearsal-" + kind, url: "./" };
      if (dry) { out.push({ band, push: s.id, kind, payload }); continue; }
      const r = await push(s, payload);
      if (r === "sent") await sb.from("ce_push_log").insert({ push_id: s.id, kind, for_date: reh.date });
      out.push({ band, push: s.id, kind, r });
    }
  }
  return new Response(JSON.stringify({ ok: true, dry, now: now.toISOString(), out }), { headers: { "Content-Type": "application/json" } });
});
