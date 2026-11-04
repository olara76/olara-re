// Reescribe y traduce las descripciones de la cartera de Arctempus con Claude.
// Guarda un JSON por vivienda en /textos/<id>.json con { src, t: { es, en, de, fr, it, ru, zh } }.
// Solo procesa viviendas nuevas o cuya descripción original haya cambiado.
// Uso: ANTHROPIC_API_KEY=... node scripts/textos.mjs [max]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const API = 'https://api.app.bestflat.com/v1/properties';
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.TEXTOS_MODEL || 'claude-sonnet-5-5';
const MAX = Number(process.argv[2] || process.env.TEXTOS_MAX || 60);
const CONC = 4;
const DIR = path.join(process.cwd(), 'textos');
const LANGS = { es: 'español de España', en: 'inglés británico', de: 'alemán', fr: 'francés', it: 'italiano', ru: 'ruso', zh: 'chino simplificado' };

if (!KEY) { console.error('Falta ANTHROPIC_API_KEY'); process.exit(1); }
fs.mkdirSync(DIR, { recursive: true });

const get = async u => { const r = await fetch(u, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); };
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

function splitTitle(t) {
  const m = String(t || '').trim().match(/^(.*?)\s+(\d+[A-Za-z]?(?:[-–]\d+)?)\s+(.+)$/);
  return m ? { street: m[1], num: m[2] } : { street: t, num: '' };
}

const SYSTEM = `Eres el redactor de Olara Real Estate, agencia inmobiliaria premium de Madrid.
Recibes la descripción de una vivienda escrita por otra agencia. Tu trabajo:
1. Reescribirla en español con redacción propia y distinta (otras frases, otro orden cuando tenga sentido), con una extensión parecida. Debe transmitir exactamente la misma información.
2. Traducir tu versión al resto de idiomas pedidos, con un tono natural, elegante y propio de un portal inmobiliario de lujo en cada idioma.
Reglas estrictas:
- No inventes nada: ni datos, ni cifras, ni calidades, ni servicios, ni distancias que no estén en el original.
- No incluyas el número de la calle, la planta exacta con puerta ni ninguna referencia a la agencia original o a su marca.
- Mantén los nombres propios de calles, barrios y marcas tal cual (sin traducir).
- Si el original usa un nombre de proyecto en mayúsculas (p. ej. EXUO), puedes mantenerlo.
- Usa párrafos separados por una línea en blanco. Puedes usar **negrita** con moderación. Sin títulos ni listas.
- Responde SOLO con las etiquetas pedidas, sin comentarios.`;

async function claude(desc, street) {
  const tags = Object.keys(LANGS).map(l => `<${l}>…</${l}>`).join('\n');
  const user = `Calle: ${street}\nIdiomas: ${Object.entries(LANGS).map(([k, v]) => `${k} = ${v}`).join(', ')}\n\nDescripción original:\n<original>\n${desc}\n</original>\n\nDevuelve:\n${tags}`;
  for (let i = 0; i < 3; i++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 8000, system: SYSTEM, messages: [{ role: 'user', content: user }] })
    });
    if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 5000 * (i + 1))); continue; }
    const j = await r.json();
    if (!r.ok) throw new Error('Claude ' + r.status + ' ' + JSON.stringify(j).slice(0, 300));
    const text = (j.content || []).map(c => c.text || '').join('');
    const out = {};
    for (const l of Object.keys(LANGS)) {
      const m = text.match(new RegExp(`<${l}>([\\s\\S]*?)</${l}>`));
      if (!m || m[1].trim().length < 40) throw new Error('falta idioma ' + l);
      out[l] = m[1].trim();
    }
    return out;
  }
  throw new Error('Claude sin respuesta');
}

const list = (await get(`${API}?page=1&limit=10000&lang=es`)).data || [];
console.log('Cartera:', list.length);
const todo = [];
for (const p of list) {
  const f = path.join(DIR, p.id + '.json');
  todo.push({ p, f });
}

let done = 0, skipped = 0, failed = 0, queue = [...todo];
async function worker() {
  while (queue.length && done < MAX) {
    const { p, f } = queue.shift();
    try {
      const d = (await get(`${API}/${p.id}?lang=es`)).data;
      const desc = ((d.gallery || []).map(g => g.description).find(Boolean) || d.description || '').trim();
      if (desc.length < 80) { skipped++; continue; }
      const h = hash(desc);
      if (fs.existsSync(f)) {
        const old = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (old.src === h) { skipped++; continue; }
      }
      if (done >= MAX) break;
      done++;
      const { street } = splitTitle(p.title);
      const t = await claude(desc, street);
      fs.writeFileSync(f, JSON.stringify({ id: p.id, src: h, model: MODEL, at: new Date().toISOString(), t }, null, 1) + '\n');
      console.log('ok', p.id, p.title);
    } catch (e) {
      failed++;
      console.error('error', p.id, e.message);
    }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));

// Borra textos de viviendas que ya no están en la cartera
const ids = new Set(list.map(p => p.id));
let removed = 0;
for (const f of fs.readdirSync(DIR)) if (f.endsWith('.json') && !ids.has(f.slice(0, -5))) { fs.unlinkSync(path.join(DIR, f)); removed++; }
console.log({ generados: done, sin_cambios: skipped, errores: failed, borrados: removed });
