// Sends an e-mail from one musician to another WITHOUT revealing the recipient's address to the sender.
// The caller must be signed in (x-user-token = the user's Supabase access token). The database gate (ce_msg_gate) checks that the
// recipient has a visible profile that accepts messages and applies the rate limits; only this function can call it (service role).
// Mail provider (set one as an Edge Function secret):
//   Resend: RESEND_API_KEY + MAIL_FROM   (MAIL_FROM like  "Rehearsal Notebook <no-reply@your-domain>", on a verified domain)
//   Brevo : BREVO_API_KEY  + MAIL_FROM   (MAIL_FROM is a verified sender address)
//   SMTP  : SMTP_USER + SMTP_PASS (+ optional SMTP_HOST, default smtp.gmail.com, port 465 over TLS). For Gmail, SMTP_PASS is an "app password".
//           MAIL_FROM is optional here (defaults to SMTP_USER).
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey, content-type, authorization, x-client-info, x-user-token", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const clean = (s: unknown, max: number) => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
const oneLine = (s: unknown, max: number) => clean(s, max).replace(/[\r\n\t]+/g, " ");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resendKey = Deno.env.get("RESEND_API_KEY") || "";
const brevoKey = Deno.env.get("BREVO_API_KEY") || "";
const smtpUser = Deno.env.get("SMTP_USER") || "";
const smtpPass = Deno.env.get("SMTP_PASS") || "";
const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
const mailFrom = Deno.env.get("MAIL_FROM") || smtpUser;
const configured = !!(((resendKey || brevoKey) && mailFrom) || (smtpUser && smtpPass));

let lastErr = "";
async function sendMail(m: { to: string; toName: string; replyTo: string; replyName: string; subject: string; text: string; html: string }): Promise<boolean> {
  if (resendKey) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: "Bearer " + resendKey, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mailFrom, to: [m.to], reply_to: m.replyTo, subject: m.subject, text: m.text, html: m.html }),
    });
    if (!r.ok) lastErr = "resend:" + r.status + " " + (await r.text()).slice(0, 120);
    return r.ok;
  }
  if (brevoKey) {
    const addr = /<([^>]+)>/.exec(mailFrom)?.[1] || mailFrom;
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST", headers: { "api-key": brevoKey, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { email: addr, name: "Rehearsal Notebook" }, to: [{ email: m.to, name: m.toName || undefined }], replyTo: { email: m.replyTo, name: m.replyName || undefined }, subject: m.subject, textContent: m.text, htmlContent: m.html }),
    });
    if (!r.ok) lastErr = "brevo:" + r.status + " " + (await r.text()).slice(0, 120);
    return r.ok;
  }
  if (smtpUser && smtpPass) {
    const addr = /<([^>]+)>/.exec(mailFrom)?.[1] || mailFrom;
    const client = new SMTPClient({ connection: { hostname: smtpHost, port: 465, tls: true, auth: { username: smtpUser, password: smtpPass } } });
    try {
      await client.send({ from: `Rehearsal Notebook <${addr}>`, to: m.to, replyTo: m.replyTo, subject: m.subject, content: m.text, html: m.html });
      return true;
    } catch (e) { lastErr = "smtp:" + String((e as Error).message || e).slice(0, 160); return false; } finally { try { await client.close(); } catch (_) { /* ignore */ } }
  }
  return false;
}


const SITE = "https://rehearsal-notebook-band.vercel.app";
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function emailHtml(fromName: string, toName: string, text: string, profileUrl: string): string {
  const name = escHtml(fromName);
  const msg = escHtml(text).replace(/\r?\n/g, "<br>");
  const hi = toName ? `Olá, ${escHtml(toName)}.` : "Olá.";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>Nova mensagem no Rehearsal Notebook</title></head>
<body style="margin:0;padding:0;background:#0b0b10;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${name} enviou uma mensagem para você.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0b10" style="background:#0b0b10;"><tr><td align="center" style="padding:28px 14px;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
  <tr><td style="padding:0 4px 18px 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#a9a9bd;font-weight:bold;">Rehearsal Notebook</td></tr>
  <tr><td bgcolor="#17181f" style="background:#17181f;border:1px solid #2a2b36;border-radius:18px;overflow:hidden;">
   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td height="6" bgcolor="#ff4d8d" style="height:6px;line-height:6px;font-size:6px;background:#ff4d8d;background-image:linear-gradient(90deg,#ff3d8b,#ff9a3c);">&nbsp;</td></tr>
    <tr><td style="padding:28px 26px 8px 26px;font-family:Arial,Helvetica,sans-serif;">
      <div style="font-size:13px;color:#a9a9bd;margin:0 0 6px 0;">${hi}</div>
      <div style="font-size:24px;line-height:1.25;color:#ffffff;font-weight:bold;margin:0;">${name} enviou uma mensagem para você</div>
    </td></tr>
    <tr><td style="padding:14px 26px 8px 26px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="4" bgcolor="#ff4d8d" style="background:#ff4d8d;border-radius:4px;">&nbsp;</td>
        <td bgcolor="#1f2029" style="background:#1f2029;padding:16px 18px;border-radius:0 12px 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#f2f2f7;">${msg}</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:22px 26px 6px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#d6d6e2;">
      Para responder, é só <b style="color:#ffffff;">responder este e-mail</b>. A resposta vai direto para ${name}.
    </td></tr>
    <tr><td style="padding:16px 26px 28px 26px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#ff4d8d" style="background:#ff4d8d;background-image:linear-gradient(90deg,#ff3d8b,#ff9a3c);border-radius:12px;">
        <a href="${profileUrl}" target="_blank" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Ver o perfil de ${name}</a>
      </td></tr></table>
    </td></tr>
   </table>
  </td></tr>
  <tr><td style="padding:20px 8px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8b8ba0;">
    Quem responde passa a mostrar o próprio e-mail para a outra pessoa.<br>
    Você recebeu esta mensagem porque ligou “Aceito receber mensagens” no seu perfil. Para parar de receber, desligue essa opção em <b>Músicos &gt; Meu perfil</b>.<br>
    Se for abuso ou spam, denuncie o perfil de ${name} no app.
    <div style="margin-top:14px;color:#6c6c80;">Rehearsal Notebook · <a href="${SITE}" target="_blank" style="color:#8b8ba0;">${SITE.replace("https://", "")}</a></div>
  </td></tr>
 </table>
</td></tr></table></body></html>`;
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
  const toName = oneLine(g.to_name, 60);
  const profileUrl = `${SITE}/#musico-${UUID.test(String(g.from_id || "")) ? g.from_id : ""}`;
  const body =
    `${fromName} enviou uma mensagem para você pelo Rehearsal Notebook:\n\n` +
    `----------------------------------------\n${text}\n----------------------------------------\n\n` +
    `Para responder, basta responder este e-mail. A resposta vai direto para ${fromName}.\n` +
    `Ver o perfil de ${fromName}: ${profileUrl}\n\n` +
    `Quem responde passa a mostrar o próprio e-mail para a outra pessoa.\n` +
    `Você recebeu isto porque ligou "Aceito receber mensagens" no seu perfil. Para parar de receber, desligue essa opção em Músicos > Meu perfil.\n` +
    `Se for abuso ou spam, denuncie o perfil de ${fromName} no app.`;
  const html = emailHtml(fromName, toName, text, profileUrl);
  let sent = false;
  lastErr = "";
  try { sent = await sendMail({ to: g.to_email, toName: oneLine(g.to_name, 60), replyTo: g.from_email, replyName: fromName, subject: `${fromName} enviou uma mensagem para você · Rehearsal Notebook`, text: body, html }); } catch (e) { sent = false; lastErr = "throw:" + String((e as Error).message || e).slice(0, 160); }
  if (!sent) { console.error("send-message failed:", lastErr); return J({ ok: false, error: "send", detail: lastErr }, 502); }
  await sb.from("ce_messages").update({ ok: true }).eq("id", g.id);
  return J({ ok: true });
});
