const { one, esc, md, eur } = require('./_lib');

const HEADER = `<header class="top"><div class="wrap">
  <a href="/" aria-label="Olara Real Estate"><img src="/logo-olara-re-horizontal-navy.svg" alt="Olara Real Estate" width="128" height="42"></a>
  <nav><a href="/viviendas" class="on">Viviendas</a><a href="/#servicios">Servicios</a><a href="/#contacto">Contacto</a></nav>
</div></header>`;

const FOOTER = `<footer class="ft"><div class="wrap">
  <div><strong style="color:var(--ink);letter-spacing:.2em">OLARA REAL ESTATE</strong><br>Sitio operado por Olara Capital SL · info@olara-re.com</div>
  <div><a href="/aviso-legal">Aviso legal</a> · <a href="/privacidad">Privacidad</a> · <a href="/cookies">Cookies</a><br>Información orientativa, sin valor contractual. Precios sin impuestos ni gastos.</div>
</div></footer>`;

function notFound(res) {
  res.setHeader('Cache-Control', 'public, s-maxage=600');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(404).send(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Vivienda no disponible · Olara RE</title><link rel="stylesheet" href="/viviendas.css"></head><body>${HEADER}
<main class="wrap" style="padding:120px 0;min-height:50vh"><p class="eyebrow">Vivienda no disponible</p><h1 class="serif" style="margin:12px 0 28px">Esta vivienda ya no está a la venta</h1><a class="btn" href="/viviendas">Ver viviendas disponibles</a></main>${FOOTER}</body></html>`);
}

module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || '').trim();
  const p = await one(id).catch(() => null);
  if (!p) return notFound(res);

  const name = `${p.type} en ${p.street}`;
  const specs = [p.m2 && `${p.m2} m²`, p.bed != null && `${p.bed} dormitorios`, p.bath != null && `${p.bath} baños`].filter(Boolean).join(' · ');
  const title = `${name}, ${p.city} · ${eur(p.price)} · Olara RE`;
  const metaDesc = `${name} (${p.city}): ${specs}. ${eur(p.price)}.`.slice(0, 160);
  const url = `https://www.olara-re.com/viviendas/${p.id}`;
  const yes = b => (b ? 'Sí' : 'No');
  const facts = [
    ['Precio', eur(p.price)],
    ['€/m²', p.eurm2 && eur(p.eurm2)],
    ['Superficie útil', p.m2 && `${p.m2} m²`],
    ['Dormitorios', p.bed],
    ['Baños', p.bath],
    ['Tipo', p.type],
    ['Planta', p.floor && `${p.floor}ª${p.exterior ? ' · exterior' : ''}`],
    ['Orientación', p.orientation],
    ['Estado', p.soon ? 'Próximamente' : (p.works || 'Disponible')],
    ['Garaje', yes(p.garage)],
    ['Trastero', yes(p.storage)],
    ['Terraza', yes(p.terrace)],
    ['Aire acondicionado', yes(p.ac)],
    ['Ascensor', yes(p.elevator)]
  ].filter(f => f[1] != null && f[1] !== '');

  const imgs = p.images.slice(0, 12);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Offer',
    url, price: p.price, priceCurrency: 'EUR', availability: 'https://schema.org/InStock',
    itemOffered: { '@type': 'Apartment', name, numberOfRooms: p.bed, floorSize: p.m2 ? { '@type': 'QuantitativeValue', value: p.m2, unitCode: 'MTK' } : undefined, address: { '@type': 'PostalAddress', streetAddress: p.street, addressLocality: p.city, addressCountry: 'ES' } },
    image: imgs.slice(0, 3),
    seller: { '@type': 'RealEstateAgent', name: 'Olara Real Estate', url: 'https://www.olara-re.com' }
  };
  const mail = `mailto:info@olara-re.com?subject=${encodeURIComponent('Información · ' + name + ' (' + p.id.slice(-6) + ')')}`;
  const wa = `https://wa.me/34686862017?text=${encodeURIComponent('Hola, me interesa la vivienda ' + name + ' (' + eur(p.price) + '): ' + url)}`;

  const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${url}">
<meta name="referrer" content="no-referrer">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(name + ' · ' + eur(p.price))}"><meta property="og:description" content="${esc(metaDesc)}"><meta property="og:url" content="${url}">${imgs[0] ? `<meta property="og:image" content="${esc(imgs[0])}">` : ''}
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
.head{display:flex;justify-content:space-between;align-items:end;gap:24px;flex-wrap:wrap;margin:36px 0 10px}
.head .pr{text-align:right}.head .pr strong{font-size:32px;font-weight:600;display:block}.head .pr span{font-size:13px;color:var(--mute)}
.body{display:grid;grid-template-columns:1.6fr 1fr;gap:60px;margin-top:36px}
.desc p{margin-bottom:16px;font-size:15px;color:#2a3442}
.desc h3{font-family:var(--serif);font-weight:500;font-size:28px;line-height:1.2;margin-bottom:18px}
.desc blockquote{font-family:var(--serif);font-style:italic;font-size:24px;line-height:1.3;border-left:2px solid var(--gold);padding-left:18px;margin:6px 0 20px;color:var(--ink)}
.facts{border-top:1px solid var(--gold)}
.facts div{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--line);font-size:13px}
.facts div span:first-child{color:var(--mute)}
aside .ctas{display:grid;gap:10px;margin-top:26px}
aside{position:sticky;top:96px;align-self:start}
#map{height:280px;margin-top:22px;background:var(--soft)}
.note{font-size:11px;color:var(--mute);margin-top:8px}
.lb{position:fixed;inset:0;background:rgba(5,10,16,.95);z-index:60;display:none;align-items:center;justify-content:center}
.lb.open{display:flex}.lb img{max-width:92vw;max-height:88vh;width:auto;height:auto;object-fit:contain}
.lb button{position:absolute;background:none;border:none;color:#fff;font-size:32px;cursor:pointer;padding:20px}
.lb .x{top:8px;right:14px}.lb .p{left:8px}.lb .nx{right:8px}
@media(max-width:860px){.body{grid-template-columns:1fr;gap:34px}aside{position:static}.gal{grid-template-columns:1fr 1fr;grid-auto-rows:150px}.gal button:first-child{grid-column:span 2;grid-row:span 2}.head .pr{text-align:left}}
</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
</head><body>
${HEADER}
<main class="wrap">
  <div class="crumb"><a href="/viviendas">Viviendas</a> / ${esc(p.city)} / ${esc(p.street)}</div>
  <div class="gal n${Math.min(imgs.length, 5)}">
    ${imgs.slice(0, 5).map((u, i) => `<button onclick="lb(${i})" aria-label="Ver foto ${i + 1}"><img src="${esc(u)}" alt="${esc(name)} foto ${i + 1}" ${i ? 'loading="lazy"' : ''}>${i === 4 && imgs.length > 5 ? `<span class="more">+${imgs.length - 5} fotos</span>` : ''}</button>`).join('')}
  </div>
  <div class="head">
    <div><p class="eyebrow">${esc(p.type)} · ${esc(p.city)}${p.soon ? ' · Próximamente' : ''}${p.works ? ' · ' + esc(p.works) : ''}</p><h1 class="serif" style="margin-top:6px">${esc(p.street)}</h1></div>
    <div class="pr"><strong>${eur(p.price)}</strong><span>${esc(specs)}</span></div>
  </div>
  <div class="body">
    <div class="desc">${md(p.desc) || '<p>Solicítenos la información completa de esta vivienda.</p>'}</div>
    <aside>
      <div class="facts">${facts.map(f => `<div><span>${esc(f[0])}</span><span>${esc(f[1])}</span></div>`).join('')}</div>
      <div class="ctas">
        <a class="btn" href="${wa}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
        <a class="btn ghost" href="${mail}">Pedir información · info@olara-re.com</a>
      </div>
      ${p.lat && p.lng ? `<div id="map"></div><p class="note">Ubicación aproximada.</p>` : ''}
    </aside>
  </div>
</main>
${FOOTER}
<div class="lb" id="lb"><button class="x" onclick="lbx()" aria-label="Cerrar">✕</button><button class="p" onclick="go(-1)" aria-label="Anterior">‹</button><img id="lbi" alt=""><button class="nx" onclick="go(1)" aria-label="Siguiente">›</button></div>
<script>
const I=${JSON.stringify(imgs).replace(/</g, '\\u003c')};let k=0;
function lb(i){k=i;document.getElementById('lbi').src=I[k];document.getElementById('lb').classList.add('open')}
function go(d){k=(k+d+I.length)%I.length;document.getElementById('lbi').src=I[k]}
function lbx(){document.getElementById('lb').classList.remove('open')}
document.addEventListener('keydown',e=>{if(!document.getElementById('lb').classList.contains('open'))return;if(e.key==='Escape')lbx();if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1)});
</script>
${p.lat && p.lng ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
const m=L.map('map',{scrollWheelZoom:false,zoomControl:true}).setView([${p.lat},${p.lng}],15);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap',maxZoom:16}).addTo(m);
L.circle([${p.lat},${p.lng}],{radius:180,color:'#B8996A',weight:1,fillColor:'#B8996A',fillOpacity:.25}).addTo(m);
</script>` : ''}
</body></html>`;

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
