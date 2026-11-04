const { one, esc, md, eur } = require('./_lib');
const { LOCALE, T, fill, listUrl, itemUrl, pick, header, footer, hreflang } = require('./_i18n');

function notFound(res, lang, t, id) {
  res.setHeader('Cache-Control', 'public, s-maxage=600');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(404).send(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(t.goneTitle)} · Olara RE</title><link rel="stylesheet" href="/viviendas.css"></head><body>${header(lang, l => itemUrl(l, id), t)}
<main class="wrap" style="padding-top:120px;padding-bottom:120px;min-height:50vh"><p class="eyebrow">${esc(t.goneTitle)}</p><h1 class="serif" style="margin:12px 0 28px">${esc(t.goneH)}</h1><a class="btn" href="${listUrl(lang)}">${esc(t.goneBtn)}</a></main>${footer(t)}</body></html>`);
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const lang = pick(String(q.lang || 'es'));
  const t = T[lang];
  const loc = LOCALE[lang];
  const id = String(q.id || '').trim();
  const p = await one(id).catch(() => null);
  if (!p) return notFound(res, lang, t, id);

  const typeL = t.types[p.type] || t.types.other;
  const name = fill(t.nameTpl, { type: typeL, street: p.street });
  const price = eur(p.price, loc);
  const specs = [p.m2 && `${p.m2} ${t.units.m2}`, p.bed != null && `${p.bed} ${t.units.beds}`, p.bath != null && `${p.bath} ${t.units.baths}`].filter(Boolean).join(' · ');
  const title = `${name}, Madrid · ${price} · Olara RE`;
  const metaDesc = `${name} (Madrid): ${specs}. ${price}.`.slice(0, 160);
  const pathFor = l => itemUrl(l, p.id);
  const url = `https://www.olara-re.com${pathFor(lang)}`;
  const yn = b => (b ? t.f.yes : t.f.no);
  const status = p.soon ? t.soon : (p.works ? t.works[p.works] : t.f.available);
  const facts = [
    [t.f.price, price],
    [t.f.eurm2, p.eurm2 && eur(p.eurm2, loc)],
    [t.f.area, p.m2 && `${p.m2} ${t.units.m2}`],
    [t.f.beds, p.bed],
    [t.f.baths, p.bath],
    [t.f.type, typeL],
    [t.f.floor, p.floor && fill(t.floorFmt, { n: p.floor }) + (p.exterior ? ` · ${t.f.exterior}` : '')],
    [t.f.orient, p.orientation && t.orient[p.orientation]],
    [t.f.status, status],
    [t.f.garage, yn(p.garage)],
    [t.f.storage, yn(p.storage)],
    [t.f.terrace, yn(p.terrace)],
    [t.f.ac, yn(p.ac)],
    [t.f.elevator, yn(p.elevator)]
  ].filter(f => f[1] != null && f[1] !== '');

  // Descripción: texto propio (IA) en el idioma pedido; si aún no existe, el original en español
  const own = p.textos && p.textos[lang];
  const descText = own || p.desc;
  const showNote = !own && lang !== 'es' && p.desc;

  const imgs = p.images.slice(0, 12);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Offer',
    url, price: p.price, priceCurrency: 'EUR', availability: 'https://schema.org/InStock',
    itemOffered: { '@type': 'Apartment', name, numberOfRooms: p.bed, floorSize: p.m2 ? { '@type': 'QuantitativeValue', value: p.m2, unitCode: 'MTK' } : undefined, address: { '@type': 'PostalAddress', streetAddress: p.street, addressLocality: 'Madrid', addressCountry: 'ES' } },
    image: imgs.slice(0, 3),
    seller: { '@type': 'RealEstateAgent', name: 'Olara Real Estate', url: 'https://www.olara-re.com' }
  };
  const mail = `mailto:info@olara-re.com?subject=${encodeURIComponent(fill(t.mailSubj, { name }) + ' (' + p.id.slice(-6) + ')')}`;
  const wa = `https://wa.me/34686862017?text=${encodeURIComponent(fill(t.waMsg, { name, price, url }))}`;

  const html = `<!DOCTYPE html>
<html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${url}">
${hreflang(pathFor)}
<meta name="referrer" content="no-referrer">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(name + ' · ' + price)}"><meta property="og:description" content="${esc(metaDesc)}"><meta property="og:url" content="${url}">${imgs[0] ? `<meta property="og:image" content="${esc(imgs[0])}">` : ''}
<link rel="icon" href="/logo-olara-simbolo-navy.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/cormorant-garamond.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/viviendas.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>
.crumb{padding-top:26px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
.crumb a{text-decoration:none}
.gal{display:grid;grid-template-columns:2fr 1fr 1fr;grid-auto-rows:230px;gap:8px;margin-top:20px}
.gal button{border:0;padding:0;background:var(--soft);overflow:hidden;cursor:zoom-in;position:relative}
.gal button:first-child{grid-row:span 2}
.gal .more{position:absolute;inset:0;background:rgba(13,27,42,.55);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;letter-spacing:.18em;text-transform:uppercase}
.gal.n1{grid-template-columns:1fr;grid-auto-rows:480px}.gal.n2{grid-template-columns:2fr 1fr}.gal.n3{grid-template-columns:2fr 1fr}
.gal.n4 button:last-child{grid-column:span 2}
.head{display:flex;justify-content:space-between;align-items:end;gap:24px;flex-wrap:wrap;margin:36px 0 10px}
.head .pr{text-align:right}.head .pr strong{font-size:32px;font-weight:600;display:block}.head .pr span{font-size:13px;color:var(--mute)}
.body{display:grid;grid-template-columns:1.6fr 1fr;gap:60px;margin-top:36px}
.desc p{margin-bottom:16px;font-size:15px;color:#2a3442}
.desc h3{font-family:var(--serif);font-weight:500;font-size:28px;line-height:1.2;margin-bottom:18px}
.desc blockquote{font-family:var(--serif);font-style:italic;font-size:24px;line-height:1.3;border-left:2px solid var(--gold);padding-left:18px;margin:6px 0 20px;color:var(--ink)}
.desc .orig{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-bottom:14px}
.facts{border-top:1px solid var(--gold)}
.facts div{display:flex;justify-content:space-between;gap:14px;padding:11px 0;border-bottom:1px solid var(--line);font-size:13px}
.facts div span:first-child{color:var(--mute)}
.facts div span:last-child{text-align:right}
aside .ctas{display:grid;gap:10px;margin-top:26px}
aside{position:sticky;top:96px;align-self:start}
#map{height:280px;margin-top:22px;background:var(--soft)}
.note{font-size:11px;color:var(--mute);margin-top:8px}
.lb{position:fixed;inset:0;background:rgba(5,10,16,.95);z-index:80;display:none;align-items:center;justify-content:center}
.lb.open{display:flex}.lb img{max-width:92vw;max-height:88vh;width:auto;height:auto;object-fit:contain}
.lb button{position:absolute;background:none;border:none;color:#fff;font-size:32px;cursor:pointer;padding:20px}
.lb .x{top:8px;right:14px}.lb .p{left:8px}.lb .nx{right:8px}
@media(max-width:860px){.body{grid-template-columns:1fr;gap:34px}aside{position:static}.gal{grid-template-columns:1fr 1fr;grid-auto-rows:150px}.gal button:first-child{grid-column:span 2;grid-row:span 2}.head .pr{text-align:left}}
</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
</head><body>
${header(lang, pathFor, t)}
<main class="wrap">
  <div class="crumb"><a href="${listUrl(lang)}">${esc(t.homes)}</a> / Madrid / ${esc(p.street)}</div>
  <div class="gal n${Math.min(imgs.length, 5)}">
    ${imgs.slice(0, 5).map((u, i) => `<button onclick="lb(${i})" aria-label="${esc(t.photo)} ${i + 1}"><img src="${esc(u)}" alt="${esc(name)} · ${esc(t.photo)} ${i + 1}" ${i ? 'loading="lazy"' : ''}>${i === 4 && imgs.length > 5 ? `<span class="more">${esc(fill(t.morePhotos, { n: imgs.length - 5 }))}</span>` : ''}</button>`).join('')}
  </div>
  <div class="head">
    <div><p class="eyebrow">${esc(typeL)} · Madrid${p.soon ? ' · ' + esc(t.soon) : ''}${p.works ? ' · ' + esc(t.works[p.works]) : ''}</p><h1 class="serif" style="margin-top:6px">${esc(p.street)}</h1></div>
    <div class="pr"><strong>${price}</strong><span>${esc(specs)}</span></div>
  </div>
  <div class="body">
    <div class="desc"${showNote ? ' lang="es"' : ''}>${showNote ? `<p class="orig">${esc(t.origNote)}</p>` : ''}${md(descText) || `<p>${esc(t.noDesc)}</p>`}</div>
    <aside>
      <div class="facts">${facts.map(f => `<div><span>${esc(f[0])}</span><span>${esc(f[1])}</span></div>`).join('')}</div>
      <div class="ctas">
        <a class="btn" href="${wa}" target="_blank" rel="noopener">${esc(t.ctaWa)}</a>
        <a class="btn ghost" href="${mail}">${esc(t.ctaMail)} · info@olara-re.com</a>
      </div>
      ${p.lat && p.lng ? `<div id="map"></div><p class="note">${esc(t.approx)}</p>` : ''}
    </aside>
  </div>
</main>
${footer(t)}
<div class="lb" id="lb"><button class="x" onclick="lbx()" aria-label="✕">✕</button><button class="p" onclick="go(-1)" aria-label="‹">‹</button><img id="lbi" alt=""><button class="nx" onclick="go(1)" aria-label="›">›</button></div>
<script>
const I=${JSON.stringify(imgs).replace(/</g, '\\u003c')};let k=0;
function lb(i){k=i;document.getElementById('lbi').src=I[k];document.getElementById('lb').classList.add('open')}
function go(d){k=(k+d+I.length)%I.length;document.getElementById('lbi').src=I[k]}
function lbx(){document.getElementById('lb').classList.remove('open')}
document.addEventListener('keydown',e=>{if(!document.getElementById('lb').classList.contains('open'))return;if(e.key==='Escape')lbx();if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1)});
</script>
${p.lat && p.lng ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
const m=L.map('map',{scrollWheelZoom:false}).setView([${p.lat},${p.lng}],15);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap',maxZoom:16}).addTo(m);
L.circle([${p.lat},${p.lng}],{radius:180,color:'#B8996A',weight:1,fillColor:'#B8996A',fillOpacity:.25}).addTo(m);
</script>` : ''}
</body></html>`;

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
