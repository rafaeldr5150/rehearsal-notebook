// Sends an e-mail from one musician to another WITHOUT revealing the recipient's address to the sender.
// The caller must be signed in (x-user-token = the user's Supabase access token). The database gate (ce_msg_gate) checks that the
// recipient has a visible profile that accepts messages and applies the rate limits; only this function can call it (service role).
// Mail provider (set one as an Edge Function secret):
//   Resend: RESEND_API_KEY + MAIL_FROM   (MAIL_FROM like  "Rehearsal Notebook <no-reply@your-domain>", on a verified domain)
//   Brevo : BREVO_API_KEY  + MAIL_FROM   (MAIL_FROM is a verified sender address)
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey, content-type, authorization, x-client-info, x-user-token", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const clean = (s: unknown, max: number) => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
const oneLine = (s: unknown, max: number) => clean(s, max).replace(/[\r\n\t]+/g, " ");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resendKey = Deno.env.get("RESEND_API_KEY") || "";
const brevoKey = Deno.env.get("BREVO_API_KEY") || "";
const mailFrom = Deno.env.get("MAIL_FROM") || "";
const configured = !!((resendKey || brevoKey) && mailFrom);

async function sendMail(m: { to: string; toName: string; replyTo: string; replyName: string; subject: string; text: string }): Promise<boolean> {
  if (resendKey) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: "Bearer " + resendKey, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mailFrom, to: [m.to], reply_to: m.replyTo, subject: m.subject, text: m.text }),
    });
    return r.ok;
  }
  if (brevoKey) {
    const addr = /<([^>]+)>/.exec(mailFrom)?.[1] || mailFrom;
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST", headers: { "api-key": brevoKey, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { email: addr, name: "Rehearsal Notebook" }, to: [{ email: m.to, name: m.toName || undefined }], replyTo: { email: m.replyTo, name: m.replyName || undefined }, subject: m.subject, textContent: m.text }),
    });
    return r.ok;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return J({ ok: false }, 405);
  let b: { action?: string; to?: string; text?: string } = {};
  try { b = await req.json(); } catch (_) { /* empty */ }
  if (b.action === "ready") return J({ ok: true, ready: configured });

  const token = req.headers.get("x-user-token") || "";
  if (!token) return J({ ok: false, error: "auth" }, 401);
  const { data: u } = await sb.auth.getUser(token);
  if (!u?.user) return J({ ok: false, error: "auth" }, 401);
  if (!configured) return J({ ok: false, error: "mail_off" }, 503);

  const to = String(b.to || "");
  const text = clean(b.text, 1000);
  if (!UUID.test(to)) return J({ ok: false, error: "to" }, 400);
  if (text.length < 10) return J({ ok: false, error: "short" }, 400);

  const { data: g, error } = await sb.rpc("ce_msg_gate", { p_from: u.user.id, p_to: to });
  if (error || !g) {
    const m = String(error?.message || "");
    const code = /rate_sender/.test(m) ? "rate_sender" : /rate_pair/.test(m) ? "rate_pair" : /rate_recipient/.test(m) ? "rate_recipient" : /closed/.test(m) ? "closed" : /self/.test(m) ? "self" : "gate";
    return J({ ok: false, error: code }, code === "gate" ? 500 : 429);
  }
  const fromName = oneLine(g.from_name, 60) || "Um músico";
  const body =
    `${fromName} enviou uma mensagem para você pelo Rehearsal Notebook:\n\n` +
    `----------------------------------------\n${text}\n----------------------------------------\n\n` +
    `Para responder, basta responder este e-mail. Ele vai direto para ${fromName}, e quem responde passa a mostrar o próprio e-mail.\n\n` +
    `Você recebeu isto porque ligou "Aceito receber mensagens" no seu perfil. Para parar de receber, desligue essa opção em Músicos > Meu perfil.\n` +
    `Se for abuso ou spam, denuncie o perfil de ${fromName} no app.`;
  let sent = false;
  try { sent = await sendMail({ to: g.to_email, toName: oneLine(g.to_name, 60), replyTo: g.from_email, replyName: fromName, subject: `Mensagem de ${fromName} no Rehearsal Notebook`, text: body }); } catch (_) { sent = false; }
  if (!sent) return J({ ok: false, error: "send" }, 502);
  await sb.from("ce_messages").update({ ok: true }).eq("id", g.id);
  return J({ ok: true });
});
