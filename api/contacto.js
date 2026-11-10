/**
 * Formulario de contacto de olara-re.com: envía un email a info@olara-re.com con Resend.
 * Variables de entorno (Vercel → proyecto olara-re → Settings → Environment Variables):
 *   RESEND_API_KEY   clave de Resend (la misma que usa olara-capital.com)
 *   FORM_FROM_EMAIL  remitente de un dominio verificado en Resend, p. ej. "Olara RE <web@olara-capital.com>"
 *   FORM_TO_EMAIL    (opcional) destino; por defecto info@olara-re.com
 */
const esc = (s) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
const clean = (s, n) => String(s ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false }); }
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  if (b.website) return res.status(200).json({ ok: true }); // trampa para bots
  const name = clean(b.name, 120), phone = clean(b.phone, 40), email = clean(b.email, 160);
  const type = clean(b.type, 80), message = String(b.message ?? "").slice(0, 3000), page = clean(b.page, 200);
  if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || b.consent !== true) {
    return res.status(400).json({ ok: false, error: "datos incompletos" });
  }
  const key = process.env.RESEND_API_KEY, from = process.env.FORM_FROM_EMAIL;
  const to = process.env.FORM_TO_EMAIL || "info@olara-re.com";
  if (!key || !from) return res.status(500).json({ ok: false, error: "no configurado" });
  const html = `<p><strong>Nueva consulta desde olara-re.com</strong></p>
<p>Nombre: ${esc(name)}<br>Teléfono: ${esc(phone)}<br>Email: ${esc(email)}<br>Motivo: ${esc(type)}<br>Página: ${esc(page)}</p>
<p>${esc(message).replace(/\n/g, "<br>")}</p><p>Consentimiento: aceptado.</p>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: email, subject: `Consulta web · ${type || "Olara RE"} · ${name}`, html }),
  });
  if (!r.ok) return res.status(502).json({ ok: false });
  return res.status(200).json({ ok: true });
};
