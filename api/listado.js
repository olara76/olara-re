const { LANGS, LOCALE, T, listUrl, pick, header, footer, hreflang } = require('./_i18n');

const CSS = `.intro{padding-top:46px;padding-bottom:26px}
.intro p.sub{color:var(--mute);margin-top:12px;max-width:620px;font-size:15px}
.bar{position:sticky;top:72px;z-index:15;background:var(--paper);border-top:1px solid var(--gold);border-bottom:1px solid var(--line)}
.bar .wrap{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:12px;padding-bottom:12px}
.bar select,.bar input{font:inherit;font-size:12px;border:1px solid var(--line);background:#fff;padding:9px 10px;color:var(--ink);border-radius:0}
.bar input[type=number]{width:110px}
.chk{font-size:12px;display:flex;align-items:center;gap:6px;border:1px solid var(--line);padding:8px 10px;background:#fff;cursor:pointer;user-select:none}
.chk input{accent-color:var(--ink)}
.bar .sp{flex:1}
.count{font-size:12px;color:var(--mute);white-space:nowrap}
.reset{font:inherit;font-size:11px;letter-spacing:.14em;text-transform:uppercase;background:none;border:0;text-decoration:underline;cursor:pointer;color:var(--mute)}
.split{display:grid;grid-template-columns:minmax(0,1fr) 44%;gap:0;min-height:70vh}
.list{padding:24px 28px 40px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:30px 22px}
.mapcol{position:sticky;top:137px;height:calc(100vh - 137px);border-left:1px solid var(--line)}
#map{width:100%;height:100%;background:var(--soft)}
.card{text-decoration:none;display:block}
.card .ph{aspect-ratio:4/3;overflow:hidden;background:var(--soft);position:relative}
.card .ph img{transition:transform .7s ease}
.card:hover .ph img{transform:scale(1.04)}
.card .m{padding-top:12px}
.card .pr{font-size:19px;font-weight:600}
.card .st{font-family:var(--serif);font-size:22px;line-height:1.15;margin-top:2px}
.card .sp2{font-size:12px;color:var(--mute);margin-top:6px}
.card.hl .ph{outline:2px solid var(--gold);outline-offset:3px}
.pin{background:var(--ink);color:#fff;font:600 11px/1 var(--sans);padding:6px 8px;white-space:nowrap;transform:translate(-50%,-100%);box-shadow:0 2px 6px rgba(0,0,0,.25);position:relative;display:inline-block}
.pin:after{content:"";position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-bottom:0;border-top-color:var(--ink)}
.pin.on{background:var(--gold)}.pin.on:after{border-top-color:var(--gold)}
.leaflet-div-icon{background:none;border:0}
.clu{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:var(--ink);color:#fff;font:600 12px var(--sans);border:3px solid rgba(184,153,106,.75)}
[hidden]{display:none!important}
.empty{padding:60px 0;color:var(--mute)}
.more{display:block;margin:34px auto 0}
.mapbtn{display:none}
@media(max-width:980px){
 .split{grid-template-columns:1fr}.list{padding:20px 0 30px}
 .mapcol{display:none;position:fixed;inset:0;top:0;height:100vh;z-index:40;border:0}
 body.showmap .mapcol{display:block}
 .mapbtn{display:inline-block;position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:45;box-shadow:0 6px 18px rgba(0,0,0,.25)}
 .bar input[type=number]{width:96px}
}
`;

module.exports = (req, res) => {
  const lang = pick(String((req.query && req.query.lang) || 'es'));
  const t = T[lang];
  const pathFor = l => listUrl(l);
  const url = `https://www.olara-re.com${pathFor(lang)}`;
  // Textos que necesita el script del navegador
  const C = {
    lang, loc: LOCALE[lang], base: listUrl(lang), types: t.types, works: t.works, soon: t.soon,
    count1: t.count1, countN: t.countN, onMap: t.onMap, bedShort: t.bedShort, bathShort: t.bathShort,
    garageS: t.garageS, terraceS: t.terraceS, mapBtn: t.mapBtn, listBtn: t.listBtn, loadErr: t.loadErr, m2: t.units.m2
  };
  const e = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(t.metaTitle)}</title>
<meta name="description" content="${e(t.metaDesc)}">
<link rel="canonical" href="${url}">
${hreflang(pathFor)}
<meta name="referrer" content="no-referrer">
<meta property="og:title" content="${e(t.metaTitle)}"><meta property="og:description" content="${e(t.metaDesc)}"><meta property="og:url" content="${url}">
<link rel="icon" href="/logo-olara-simbolo-navy.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/cormorant-garamond.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/viviendas.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.min.css">
<style>${CSS}</style>
</head>
<body>
${header(lang, pathFor, t)}

<section class="wrap intro">
  <p class="eyebrow">${e(t.eyebrow)}</p>
  <h1 class="serif" style="margin-top:8px">${t.h1}</h1>
  <p class="sub">${e(t.sub)}</p>
</section>

<div class="bar"><div class="wrap">
  <select id="fType" aria-label="${e(t.f.type)}"><option value="">${e(t.allTypes)}</option></select>
  <input id="fMin" type="number" inputmode="numeric" placeholder="${e(t.priceMin)}" step="50000" min="0">
  <input id="fMax" type="number" inputmode="numeric" placeholder="${e(t.priceMax)}" step="50000" min="0">
  <select id="fM2" aria-label="${e(t.m2min)}"><option value="">${e(t.m2min)}</option><option>60</option><option>80</option><option>100</option><option>150</option><option>200</option><option>300</option></select>
  <select id="fBed" aria-label="${e(t.beds)}"><option value="">${e(t.beds)}</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option><option value="5">5+</option></select>
  <label class="chk"><input type="checkbox" id="fGar"> ${e(t.garage)}</label>
  <label class="chk"><input type="checkbox" id="fTer"> ${e(t.terrace)}</label>
  <label class="chk"><input type="checkbox" id="fNow"> ${e(t.availNow)}</label>
  <span class="sp"></span>
  <select id="fSort" aria-label="Sort">
    <option value="rec">${e(t.sort[0])}</option>
    <option value="pa">${e(t.sort[1])}</option>
    <option value="pd">${e(t.sort[2])}</option>
    <option value="ma">${e(t.sort[3])}</option>
    <option value="sd">${e(t.sort[4])}</option>
  </select>
  <span class="count" id="count">${e(t.loading)}</span>
  <button class="reset" id="reset">${e(t.reset)}</button>
</div></div>

<div class="wrap">
  <div class="split">
    <div class="list">
      <div class="grid" id="grid"></div>
      <div class="empty" id="empty" hidden>${e(t.empty)} <button class="reset" onclick="resetF()">${e(t.resetFilters)}</button></div>
      <button class="btn ghost more" id="more" hidden>${e(t.more)}</button>
    </div>
    <div class="mapcol"><div id="map"></div></div>
  </div>
</div>
<button class="btn mapbtn" id="mapbtn">${e(t.mapBtn)}</button>

${footer(t)}

<script>const C=${JSON.stringify(C).replace(/</g, '\\u003c')};</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js"></script>
<script src="/viviendas.js"></script>
</body>
</html>`;
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
