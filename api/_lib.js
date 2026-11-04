// Fuente: cartera de Arctempus (API pública de su portal, bestflat).
// Se publican todos los activos, incluidos los OFFMARKET.
const API = 'https://api.app.bestflat.com/v1/properties';

const fs = require('fs');
const path = require('path');
const TYPES = { Flat: 'flat', 'Ático': 'penthouse', Penthouse: 'penthouse', 'Dúplex': 'duplex', Duplex: 'duplex', House: 'house', Casa: 'house' };
const ORIENT = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
const WORKS = {
  completed: null,
  delivery_process_to_up: 'delivery',
  furniture_and_decoration: 'furnishing',
  final_finishing: 'finishing',
  carpentry_and_kitchen: 'renovation'
};

async function getJSON(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'OlaraRE-portal/1.0' } });
  if (!r.ok) throw new Error('upstream ' + r.status);
  return r.json();
}

function feats(arr) {
  const o = {};
  for (const f of arr || []) o[f.name] = f.value;
  return o;
}

// "O'Donnell 46 Madrid" -> { street: "O'Donnell", num: "46", city: "Madrid" }
function splitTitle(t) {
  const m = String(t || '').trim().match(/^(.*?)\s+(\d+[A-Za-z]?(?:[-–]\d+)?)\s+(.+)$/);
  if (m) return { street: m[1], num: m[2], city: m[3] };
  const parts = String(t || '').trim().split(/\s+/);
  const city = parts.length > 1 ? parts.pop() : '';
  return { street: parts.join(' '), num: '', city };
}

function isOff(p) {
  return (p.tags || []).some(t => String(t).toUpperCase() === 'OFFMARKET');
}

function norm(p) {
  const f = feats(p.features);
  const { street, num, city } = splitTitle(p.title);
  const r3 = v => (v == null || v === '' ? null : Math.round(parseFloat(v) * 1000) / 1000);
  const m2 = Number(f.usable_square_meters) || null;
  const price = p.price && p.price.amount ? Number(p.price.amount) : null;
  return {
    id: p.id,
    street,
    num,
    city: city || 'Madrid',
    type: TYPES[p.type] || 'other',
    price,
    m2,
    eurm2: price && m2 ? Math.round(price / m2) : null,
    bed: f.bedrooms ?? null,
    bath: f.bathrooms ?? null,
    floor: f.floor_number && f.floor_number !== '0' ? String(f.floor_number) : null,
    exterior: f.situation === 'exterior',
    garage: !!f.garage,
    storage: !!f.storage_room,
    terrace: !!f.terrace,
    ac: !!f.air_conditioning,
    heating: !!f.heating,
    elevator: !!f.elevator,
    orientation: ORIENT.includes(f.orientation) ? f.orientation : null,
    soon: p.sale_status === 'soon',
    works: WORKS[p.construction_status] || null,
    cover: p.cover_image || null,
    lat: r3(p.location && p.location.latitude),
    lng: r3(p.location && p.location.longitude),
    updated: p.updated_at || p.created_at || null
  };
}

async function list() {
  const j = await getJSON(`${API}?page=1&limit=10000&lang=es`);
  return (j.data || []).map(norm).map(x => { delete x.num; return x; });
}

async function one(id) {
  if (!/^[0-9a-f-]{20,40}$/i.test(id || '')) return null;
  let j;
  try { j = await getJSON(`${API}/${id}?lang=es`); } catch (e) { return null; }
  const p = j && j.data;
  if (!p) return null;
  // El listado trae estado de venta y portada; si ya no está, la vivienda se ha retirado
  const all = await getJSON(`${API}?page=1&limit=10000&lang=es`);
  const inList = (all.data || []).find(x => x.id === p.id);
  if (!inList) return null;
  const base = norm(Object.assign({}, inList, p, { tags: inList.tags, sale_status: inList.sale_status }));
  const gallery = (p.gallery || []).filter(g => g.type !== 'video' && g.url).map(g => g.url);
  const desc = (p.gallery || []).map(g => g.description).find(Boolean) || p.description || '';
  base.images = gallery.length ? gallery : (base.cover ? [base.cover] : []);
  base.desc = scrub(desc, base.street, base.num);
  base.textos = textos(p.id);
  if (base.textos) for (const k of Object.keys(base.textos)) base.textos[k] = scrub(base.textos[k], base.street, base.num);
  delete base.num;
  return base;
}

// Quita el número de portal del texto para no publicar la dirección exacta
function scrub(text, street, num) {
  let t = String(text || '');
  if (street && num) {
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(esc(street) + '\\s*,?\\s*(n[ºo°.]\\s*)?' + esc(num) + '\\b', 'gi'), street);
  }
  return t;
}

// Textos reescritos y traducidos por IA (los genera scripts/textos.mjs vía GitHub Actions)
function textos(id) {
  try {
    const f = path.join(process.cwd(), 'textos', id + '.json');
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    return j.t || null;
  } catch (e) { return null; }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Markdown mínimo -> HTML seguro
function md(text) {
  const blocks = esc(text).replace(/\r/g, '').split(/\n\s*\n/);
  return blocks.map(b => {
    b = b.trim();
    if (!b) return '';
    const inline = s => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
    if (/^#{1,6}\s/.test(b)) return '<h3>' + inline(b.replace(/^#{1,6}\s*/, '')) + '</h3>';
    if (/^&gt;\s?/.test(b)) return '<blockquote>' + inline(b.replace(/^&gt;\s?/gm, '')) + '</blockquote>';
    // un bloque que mezcla línea normal y "> cita"
    if (/\n&gt;\s?/.test(b)) {
      return b.split('\n').map(l => /^&gt;/.test(l) ? '<blockquote>' + inline(l.replace(/^&gt;\s?/, '')) + '</blockquote>' : '<p>' + inline(l) + '</p>').join('');
    }
    return '<p>' + inline(b) + '</p>';
  }).join('\n');
}

const eur = (n, loc) => (n == null ? '' : Number(n).toLocaleString(loc || 'es-ES') + ' €');

module.exports = { list, one, esc, md, eur, API, splitTitle, scrub };
