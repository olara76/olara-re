/* Olara RE — páginas del portal generadas en el servidor (SEO/AEO).
   Lee los inmuebles del CMS de Wix (colección "Propiedades") con un token de
   visitante y sirve HTML completo: listado, ficha y sitemap. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = 'https://www.olara-re.com';
const CLIENT_ID = 'cabed414-66cb-4a79-8068-8ea486765bb0';
const API = 'https://www.wixapis.com';
const COLLECTION = 'Propiedades';
const OG_IMG = 'https://www.olara-re.com/img/hero.jpg';
/* Campos internos que nunca salen a la web */
const PRIVATE = ['direccion', 'inversor', 'idExterno', 'origen'];

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TPL = { list: read('_tpl/propiedades.html'), one: read('_tpl/inmueble.html') };

/* Reutiliza las funciones de pintado del navegador (portal.js) */
const sandbox = { window: {}, Intl, console, setTimeout };
vm.runInNewContext(read('portal.js'), sandbox);
const P = sandbox.window.OlaraPortal;

let tok = null;
async function token() {
  if (tok && tok.exp > Date.now() + 60000) return tok.access;
  const r = await fetch(API + '/oauth2/token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: CLIENT_ID, grantType: 'anonymous' })
  });
  if (!r.ok) throw new Error('token ' + r.status);
  const d = await r.json();
  tok = { access: d.access_token, exp: Date.now() + d.expires_in * 1000 };
  return tok.access;
}
async function query(q) {
  const r = await fetch(API + '/wix-data/v2/items/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: await token() },
    body: JSON.stringify({ dataCollectionId: COLLECTION, query: q })
  });
  if (!r.ok) throw new Error('wix ' + r.status);
  return r.json();
}
function clean(it) {
  const x = Object.assign({}, it.data || {});
  x._id = x._id || it.id;
  PRIVATE.forEach(k => delete x[k]);
  return x;
}
async function fetchAll() {
  const out = [];
  let cursor = null, guard = 0;
  do {
    const q = cursor ? { cursorPaging: { limit: 100, cursor } }
      : { filter: { estado: { $in: ['activa', 'reservada', 'vendida'] } }, sort: [{ fieldName: '_createdDate', order: 'DESC' }], cursorPaging: { limit: 100 } };
    const d = await query(q);
    (d.dataItems || []).forEach(it => out.push(clean(it)));
    cursor = d.pagingMetadata && d.pagingMetadata.cursors && d.pagingMetadata.cursors.next;
  } while (cursor && ++guard < 20);
  return out;
}
async function fetchOne(key) {
  const d = await query({ filter: { $or: [{ slug: { $eq: key } }, { _id: { $eq: key } }] }, cursorPaging: { limit: 1 } });
  const it = d.dataItems && d.dataItems[0];
  return it ? clean(it) : null;
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const ld = o => '<script type="application/ld+json">' + json(o) + '</script>';
const url = p => SITE + P.link(p);
const head = (o) => [
  '<meta name="description" content="' + esc(o.desc) + '">',
  '<link rel="canonical" href="' + esc(o.url) + '">',
  '<meta property="og:type" content="' + (o.type || 'website') + '">',
  '<meta property="og:site_name" content="Olara Real Estate">',
  '<meta property="og:locale" content="es_ES">',
  '<meta property="og:title" content="' + esc(o.title) + '">',
  '<meta property="og:description" content="' + esc(o.desc) + '">',
  '<meta property="og:url" content="' + esc(o.url) + '">',
  '<meta property="og:image" content="' + esc(o.img || OG_IMG) + '">',
  '<meta name="twitter:card" content="summary_large_image">',
  o.robots ? '<meta name="robots" content="' + o.robots + '">' : ''
].concat(o.ld || []).filter(Boolean).join('\n');

const AVAIL = { activa: 'https://schema.org/InStock', reservada: 'https://schema.org/LimitedAvailability', vendida: 'https://schema.org/SoldOut' };
const TYPE = t => /chalet|casa|unifamiliar|adosado/i.test(t || '') ? 'SingleFamilyResidence' : 'Apartment';

function listingLd(p) {
  const g = P.gallery(p);
  const c = p.ubicacionAproximada ? null : P.coords(p);
  const place = {
    '@type': TYPE(p.tipologia),
    name: p.title || p.tipologia || 'Inmueble',
    address: { '@type': 'PostalAddress', addressLocality: p.municipio || 'Madrid', addressRegion: 'Madrid', addressCountry: 'ES' }
  };
  if (p.barrio || p.distrito) place.containedInPlace = { '@type': 'Place', name: [p.barrio, p.distrito].filter(Boolean).join(', ') };
  if (p.dormitorios) place.numberOfBedrooms = p.dormitorios;
  if (p.banos) place.numberOfBathroomsTotal = p.banos;
  if (p.superficie) place.floorSize = { '@type': 'QuantitativeValue', value: p.superficie, unitCode: 'MTK' };
  if (c) place.geo = { '@type': 'GeoCoordinates', latitude: c[0], longitude: c[1] };
  const o = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.title || 'Inmueble en venta',
    url: url(p),
    image: g.slice(0, 6),
    mainEntity: place,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      availability: AVAIL[p.estado] || AVAIL.activa,
      businessFunction: 'https://purl.org/goodrelations/v1#Sell',
      seller: { '@type': 'RealEstateAgent', name: 'Olara Real Estate', url: SITE }
    }
  };
  if (p.descripcion) o.description = p.descripcion;
  if (p.precio) o.offers.price = p.precio;
  const d = P.dateOf(p._createdDate); if (d) o.datePosted = d.toISOString().slice(0, 10);
  return o;
}
function crumbsLd(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })) };
}
function summary(p) {
  return [p.tipologia || 'Vivienda', 'en venta en', P.zona(p) + (p.municipio && p.municipio !== P.zona(p) ? ' (' + p.municipio + ')' : ''), '·', P.facts(p), p.precio ? '· ' + P.eur(p.precio) : ''].join(' ').replace(/\s+/g, ' ').trim();
}

function fill(tpl, map) { return Object.keys(map).reduce((s, k) => s.split('{{' + k + '}}').join(map[k]), tpl); }

async function pageList() {
  let all = [], err = false;
  try { all = await fetchAll(); } catch (e) { console.error(e); err = true; }
  const visible = all.filter(p => p.estado !== 'vendida');
  const n = visible.length;
  const grid = err
    ? '<div class="state"><h2>Algo no ha ido <em>bien.</em></h2><p>No hemos podido cargar el listado en este momento. Inténtelo de nuevo en unos minutos o escríbanos a info@olara-re.com.</p></div>'
    : n ? visible.map(P.card).join('')
      : '<div class="state"><hr class="mark" style="margin:0 auto 1.5rem"><h2>Nuevas propiedades <em>muy pronto.</em></h2><p>Estamos preparando la primera selección de viviendas. Si busca algo concreto, cuéntenoslo y le avisamos antes de que salga al mercado.</p></div>';
  const ldList = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: 'Propiedades en venta en Madrid — Olara RE',
    itemListElement: visible.slice(0, 100).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: url(p), name: p.title || summary(p) }))
  };
  return fill(TPL.list, {
    HEAD: head({
      title: 'Propiedades en venta en Madrid — Olara RE',
      desc: 'Vivienda de alto valor en venta en Madrid. Busque en el mapa, filtre por zona, precio y superficie y guarde sus favoritas.',
      url: SITE + '/propiedades',
      ld: [ld(ldList), ld(crumbsLd([['Inicio', SITE + '/'], ['Propiedades', SITE + '/propiedades']]))]
    }),
    COUNT: err ? 'No se han podido cargar los inmuebles' : n ? n + (n === 1 ? ' inmueble' : ' inmuebles') : 'Ningún inmueble publicado todavía',
    GRID: grid,
    DATA: err ? '' : '<script>window.__OLARA_DATA__=' + json(all) + ';</script>'
  });
}

function notFoundBody() {
  return '<p class="crumbs"><a href="/propiedades">Propiedades</a></p><div class="state"><h2>Este inmueble ya no está <em>disponible.</em></h2><p>Puede que se haya vendido o retirado del mercado. Le enseñamos alternativas parecidas.</p><a class="btn btn-solid" href="/propiedades">Ver propiedades</a></div>';
}
async function pageOne(key) {
  const p = key ? await fetchOne(key) : null;
  if (!p || p.estado === 'retirada') {
    return { status: 404, html: fill(TPL.one, { TITLE: 'Inmueble no disponible — Olara RE', HEAD: '<meta name="robots" content="noindex">', BODY: notFoundBody(), DATA: '' }) };
  }
  const title = (p.title || summary(p)) + ' — Olara RE';
  const desc = (p.descripcion ? p.descripcion.slice(0, 150).replace(/\s+\S*$/, '') + '…' : summary(p));
  const g = P.gallery(p);
  return {
    status: 200,
    redirect: p.slug && key !== p.slug ? P.link(p) : null,
    html: fill(TPL.one, {
      TITLE: esc(title),
      HEAD: head({
        title, desc, url: url(p), type: 'article', img: g[0] ? P.thumb(g[0], 1200, 630) : OG_IMG,
        ld: [ld(listingLd(p)), ld(crumbsLd([['Inicio', SITE + '/'], ['Propiedades', SITE + '/propiedades'], [p.title || 'Inmueble', url(p)]]))]
      }),
      BODY: P.renderFicha(p),
      DATA: '<script>window.__OLARA_ONE__=' + json(p) + ';</script>'
    })
  };
}

async function sitemap() {
  let all = [];
  try { all = await fetchAll(); } catch (e) { console.error(e); }
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    [SITE + '/', today, '1.0'],
    [SITE + '/propiedades', today, '0.9']
  ].concat(all.filter(p => p.estado !== 'vendida').map(p => {
    const d = P.dateOf(p._updatedDate) || P.dateOf(p._createdDate);
    return [url(p), d ? d.toISOString().slice(0, 10) : today, '0.8'];
  }));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + esc(u[0]) + '</loc><lastmod>' + u[1] + '</lastmod><priority>' + u[2] + '</priority></url>').join('\n') +
    '\n</urlset>\n';
}

module.exports = async (req, res) => {
  const q = req.query || {};
  /* 5 min en caché del CDN; se sirve la copia anterior mientras se refresca */
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  try {
    if (q.r === 'sitemap') {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.status(200).send(await sitemap());
    }
    if (q.r === 'legacy') {
      res.setHeader('Location', q.id ? '/propiedades/' + encodeURIComponent(q.id) : '/propiedades');
      return res.status(301).end();
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (q.r === 'one') {
      const o = await pageOne(String(q.slug || ''));
      if (o.redirect) { res.setHeader('Location', o.redirect); return res.status(301).end(); }
      return res.status(o.status).send(o.html);
    }
    return res.status(200).send(await pageList());
  } catch (e) {
    console.error(e);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).send('Error');
  }
};
