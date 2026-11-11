#!/usr/bin/env node
/**
 * Genera el blog de olara-re.com a partir de content/blog/*.md.
 *   node scripts/blog.mjs
 * Salida: blog/index.html, blog/<slug>.html, sitemap.xml y llms.txt.
 * Reutiliza cabecera, pie, estilos y banner de cookies de index.html (fuente única de diseño).
 * Frontmatter: title, description, date (AAAA-MM-DD), updated (opcional), category, slug (opcional).
 * Una sección "## Preguntas frecuentes" con "### Pregunta" + respuesta genera FAQPage (JSON-LD).
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.olara-re.com";
const home = readFileSync(join(ROOT, "index.html"), "utf8");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------- piezas de diseño tomadas de la home ---------- */
const styles = [...home.matchAll(/<style>[\s\S]*?<\/style>/g)].map((m) => m[0]);
const mainCss = styles.slice(0, 2).join("\n"); // @font-face + CSS principal
const consentCss = styles.find((s) => s.includes("#ck{")) ?? "";
let header = home.match(/<header class="nav"[\s\S]*?<\/header>/)[0];
header = header
  .replace(/<div class="lang"[\s\S]*?<\/div>\s*/, "")
  .replace('class="nav"', 'class="nav solid"')
  .replace('href="#top"', 'href="/"')
  .replace(/href="#(servicios|proceso|zonas|contacto)"/g, 'href="/#$1"');
let footer = home.match(/<footer[\s\S]*?<\/footer>/)[0]
  .replace(/href="#(servicios|proceso|contacto)"/g, 'href="/#$1"')
  .replace(/<span id="yr"><\/span>/, String(new Date().getFullYear()));
const wa = home.match(/<a class="wa"[\s\S]*?<\/a>/)[0];
const consentBlock = (() => {
  const i = home.indexOf('<div id="ck"');
  const j = home.lastIndexOf("</script>");
  return home.slice(i, j + "</script>".length);
})();

const blogCss = `<style>
.post-hero{padding:clamp(7rem,16vh,11rem) 0 clamp(2rem,5vh,3.5rem)}
.post-hero h1{font-size:clamp(2.2rem,5.4vw,4rem);line-height:1.08;max-width:22ch}
.post-meta{margin-top:1.5rem;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.post-lead{margin-top:1.75rem;max-width:60ch;font-size:clamp(1.0625rem,1.5vw,1.25rem);color:var(--cream-2);line-height:1.65}
.prose{max-width:46rem;margin:0 auto;padding:0 var(--pad)}
.on-light .prose h2{font-family:var(--serif);font-weight:400;font-size:clamp(1.6rem,3vw,2.2rem);line-height:1.15;margin:3rem 0 1rem}
.on-light .prose h3{font-family:var(--serif);font-weight:500;font-size:1.3rem;margin:2rem 0 .5rem}
.on-light .prose p,.on-light .prose li{font-size:1.0625rem;line-height:1.75;color:#2B3544}
.on-light .prose p{margin:0 0 1.25rem}
.on-light .prose ul,.on-light .prose ol{margin:0 0 1.5rem 1.25rem;padding:0}
.on-light .prose li{margin-bottom:.5rem}
.on-light .prose a{text-decoration:underline;text-underline-offset:3px;color:var(--navy)}
.on-light .prose a:hover{color:var(--gold)}
.post-cta{margin-top:3.5rem;padding:2rem;border:1px solid var(--hair-light);background:var(--cream-2)}
.post-cta p{margin:0 0 1.25rem}
.sources{margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--hair-light);font-size:.875rem}
.list{display:grid;gap:0;border-top:1px solid var(--hair-light)}
.list a{display:block;padding:2rem 0;border-bottom:1px solid var(--hair-light);transition:padding-left .3s}
.list a:hover{padding-left:.75rem}
.list h2{font-family:var(--serif);font-weight:400;font-size:clamp(1.5rem,2.8vw,2.1rem);line-height:1.15}
.list p{margin-top:.6rem;color:var(--ink-soft);max-width:60ch;font-size:.9375rem}
.list .k{display:block;margin-bottom:.6rem;font-size:.6875rem;letter-spacing:.18em;text-transform:uppercase;color:#8A8375}
</style>`;

/* ---------- markdown mínimo ---------- */
function inline(t) {
  return esc(t)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (_, a, u) =>
      `<a href="${u}"${u.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${a}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
}
function md(src) {
  const out = [];
  let list = null;
  const flush = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of src.split("\n")) {
    const l = raw.trimEnd();
    let m;
    if (!l.trim()) { flush(); continue; }
    if ((m = l.match(/^###\s+(.*)/))) { flush(); out.push(`<h3>${inline(m[1])}</h3>`); }
    else if ((m = l.match(/^##\s+(.*)/))) { flush(); out.push(`<h2>${inline(m[1])}</h2>`); }
    else if ((m = l.match(/^[-*]\s+(.*)/))) { if (list !== "ul") { flush(); out.push("<ul>"); list = "ul"; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = l.match(/^\d+\.\s+(.*)/))) { if (list !== "ol") { flush(); out.push("<ol>"); list = "ol"; } out.push(`<li>${inline(m[1])}</li>`); }
    else { flush(); out.push(`<p>${inline(l)}</p>`); }
  }
  flush();
  return out.join("\n");
}
function parse(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Sin frontmatter: ${file}`);
  const fm = {};
  for (const line of m[1].split("\n")) {
    const k = line.match(/^(\w+):\s*(.*)$/);
    if (k) fm[k[1]] = k[2].replace(/^["']|["']$/g, "");
  }
  return { fm, body: m[2].trim() };
}
function faqs(body) {
  const i = body.search(/^##\s+Preguntas frecuentes/im);
  if (i < 0) return [];
  const sect = body.slice(i).split("\n").slice(1).join("\n");
  const items = [];
  for (const block of sect.split(/^###\s+/m).slice(1)) {
    const [q, ...rest] = block.split("\n");
    const a = rest.join(" ").replace(/\s+/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "").trim();
    if (q && a) items.push({ q: q.trim(), a });
  }
  return items;
}

/* ---------- plantilla ---------- */
function page({ title, description, canonical, body, ld = [] }) {
  const ldTags = ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n");
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Olara RE">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/img/hero-1200.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/fonts/cormorant-garamond.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
${mainCss}
${blogCss}
${ldTags}
</head>
<body>
${header}
${body}
${footer}
${wa}
${consentCss}
${consentBlock}
</body>
</html>
`;
}

/* ---------- build ---------- */
const dir = join(ROOT, "content", "blog");
if (!existsSync(dir)) throw new Error("Falta content/blog");
const posts = readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const { fm, body } = parse(join(dir, f));
    const slug = fm.slug || f.replace(/\.md$/, "");
    if (!fm.title || !fm.description || !fm.date) throw new Error(`Faltan campos en ${f}`);
    if (fm.title.length > 60) console.warn(`AVISO title >60 (${fm.title.length}): ${f}`);
    if (fm.description.length > 155) console.warn(`AVISO description >155 (${fm.description.length}): ${f}`);
    return { ...fm, slug, body };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

mkdirSync(join(ROOT, "blog"), { recursive: true });
const org = { "@type": "Organization", name: "Olara RE", url: SITE, logo: `${SITE}/logo-olara-simbolo-navy.svg` };

for (const p of posts) {
  const url = `${SITE}/blog/${p.slug}`;
  const f = faqs(p.body);
  const ld = [
    { "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.description,
      datePublished: p.date, dateModified: p.updated || p.date, inLanguage: "es", mainEntityOfPage: url,
      image: `${SITE}/img/hero-1200.jpg`, author: org, publisher: org },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      { "@type": "ListItem", position: 3, name: p.title, item: url } ] },
  ];
  if (f.length) ld.push({ "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: f.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) });
  const paras = p.body.split(/\n\s*\n/);
  const lead = paras[0].startsWith("#") ? "" : paras.shift();
  const cta = p.cta === "compradores"
    ? { t: "¿Quiere comprar en Madrid?", b: "Cuéntenos qué busca y le respondemos por WhatsApp en menos de 24 horas laborables.", href: "https://wa.me/34686862017", l: "Escribir por WhatsApp" }
    : { t: "¿Quiere saber cuánto vale su vivienda?", b: "Valoración sin coste y sin compromiso de mandato, con operaciones realmente cerradas en su zona.", href: "/#contacto", l: "Solicitar valoración" };
  const body = `<main>
<section class="post-hero"><div class="wrap">
  <hr class="mark"><p class="eyebrow">${esc(p.category || "Blog")}</p>
  <h1>${esc(p.title)}</h1>
  <p class="post-lead">${inline(lead)}</p>
  <p class="post-meta">${new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })} · Olara RE</p>
</div></section>
<section class="on-light band" style="padding-top:clamp(3rem,8vh,5rem)"><article class="prose">
${md(paras.join("\n\n"))}
<div class="post-cta"><p><strong>${cta.t}</strong></p><p>${cta.b}</p><a class="btn btn-solid" href="${cta.href}">${cta.l}</a></div>
</article></section>
</main>`;
  writeFileSync(join(ROOT, "blog", `${p.slug}.html`), page({ title: `${p.title} | Olara RE`, description: p.description, canonical: url, body, ld }));
}

const listBody = `<main>
<section class="post-hero"><div class="wrap"><hr class="mark"><p class="eyebrow">Blog</p>
<h1>Mercado inmobiliario premium en Madrid, <em>sin humo.</em></h1>
<p class="post-lead">Guías prácticas para quien vende vivienda de alto valor en Madrid y para quien compra desde fuera de España.</p></div></section>
<section class="on-light band" style="padding-top:clamp(3rem,8vh,5rem)"><div class="wrap"><div class="list">
${posts.map((p) => `<a href="/blog/${p.slug}"><span class="k">${esc(p.category || "Blog")} · ${p.date}</span><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p></a>`).join("\n")}
</div></div></section></main>`;
writeFileSync(join(ROOT, "blog", "index.html"), page({
  title: "Blog inmobiliario premium en Madrid | Olara RE",
  description: "Guías para vender vivienda de alto valor en Madrid y para comprar en Madrid desde México y el extranjero.",
  canonical: `${SITE}/blog`, body: listBody,
  ld: [{ "@context": "https://schema.org", "@type": "Blog", name: "Blog de Olara RE", url: `${SITE}/blog`, inLanguage: "es" }],
}));

/* Página de compradores desde México (landing de campañas y SEO) */
{
  const url = `${SITE}/compradores-mexico`;
  const faq = [
    ["¿Puede un mexicano comprar vivienda en Madrid sin residir en España?", "Sí. Los extranjeros pueden comprar vivienda en España sin ser residentes. Hace falta NIE y cumplir los trámites habituales de notaría, impuestos y registro."],
    ["¿Hace falta viajar a Madrid para comprar?", "No necesariamente. Con un poder notarial otorgado en México y apostillado, un representante puede firmar. Conocer la vivienda y la zona en persona reduce riesgos."],
    ["¿Qué barrios de Madrid cubre Olara RE?", "Salamanca, Chamberí, Justicia, Almagro, El Viso, Jerónimos, Chamartín y Retiro. Trabajamos también fuera de estas zonas cuando la vivienda lo merece."],
    ["¿Cuánto tarda una compra?", "Depende del NIE, de la cuenta bancaria y de la verificación de la vivienda. Es realista contar con varias semanas desde el acuerdo de precio hasta la firma."],
  ];
  const ld = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Comprar en Madrid desde México", item: url } ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  const body = `<main>
<section class="post-hero"><div class="wrap"><hr class="mark"><p class="eyebrow">Compradores desde México</p>
<h1>Comprar vivienda en Madrid <em>desde México.</em></h1>
<p class="post-lead">Olara RE es una agencia inmobiliaria premium en Madrid. Acompañamos a compradores mexicanos en la búsqueda, la verificación y la compra de vivienda de alto valor, con un único interlocutor y toda la comunicación en español.</p>
<p class="hero-cta" style="margin-top:2rem"><a class="btn btn-solid" href="https://wa.me/34686862017?text=Hola%2C%20quiero%20comprar%20vivienda%20en%20Madrid%20desde%20M%C3%A9xico">Escribir por WhatsApp</a>
<a class="btn btn-ghost" href="/blog/comprar-vivienda-madrid-desde-mexico">Leer la guía de compra</a></p></div></section>
<section class="on-light band"><div class="wrap"><div class="sec-head"><div><hr class="mark"><p class="eyebrow">Cómo le ayudamos</p></div>
<h2>Un proceso claro, <em>sin sorpresas.</em></h2></div>
<div class="services">
<article class="service"><div class="idx">I</div><h3>Búsqueda y filtro</h3><p>Seleccionamos pocas viviendas que encajan con su presupuesto y su uso, en lugar de enviarle decenas de anuncios.</p></article>
<article class="service"><div class="idx">II</div><h3>Verificación</h3><p>Revisamos nota simple, cargas, certificado energético y estado de la comunidad antes de que usted reserve.</p></article>
<article class="service"><div class="idx">III</div><h3>Coordinación de la compra</h3><p>Trabajamos con su abogado o gestor, o le orientamos para encontrarlo: NIE, cuenta, arras, notaría e inscripción.</p></article>
<article class="service"><div class="idx">IV</div><h3>Visitas y seguimiento a distancia</h3><p>Visitas filtradas, información detallada por WhatsApp y videollamada para que decida sin viajar a ciegas.</p></article>
</div></div></section>
<section class="band"><div class="wrap"><div class="sec-head"><div><hr class="mark"><p class="eyebrow">Dónde</p></div><h2>Madrid, <em>por barrios.</em></h2></div>
<ul class="zones"><li>Salamanca</li><li>Chamberí</li><li>Justicia</li><li>Almagro</li><li>El Viso</li><li>Jerónimos</li><li>Chamartín</li><li>Retiro</li></ul></div></section>
<section class="on-light band"><article class="prose"><h2>Preguntas frecuentes</h2>
${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("\n")}
<div class="post-cta"><p><strong>Cuéntenos qué busca</strong></p><p>Zona, presupuesto y uso previsto. Le respondemos por WhatsApp en menos de 24 horas laborables.</p><a class="btn btn-solid" href="https://wa.me/34686862017">Escribir por WhatsApp</a></div>
</article></section></main>`;
  writeFileSync(join(ROOT, "compradores-mexico.html"), page({
    title: "Comprar vivienda en Madrid desde México | Olara RE",
    description: "Agencia premium en Madrid para compradores mexicanos: búsqueda, verificación y compra de vivienda, con atención en español y seguimiento a distancia.",
    canonical: url, body, ld }));
}


/* Página de valoración en 24 horas (landing de Google Ads para propietarios) */
{
  const url = `${SITE}/valoracion`;
  const faq = [
    ["¿La valoración es una tasación oficial?", "No. Es una valoración orientativa basada en comparables reales y en las superficies de su escritura. Una tasación oficial solo la emite un tasador homologado."],
    ["¿Cuánto cuesta y me compromete a algo?", "Es gratuita y no le compromete a firmar ningún encargo. Usted decide después si quiere vender, con quién y cómo."],
    ["¿Valoran viviendas heredadas?", "Sí, también las que aún no están repartidas entre los herederos o que tienen hipoteca u otras cargas."],
    ["¿Quién me contesta y en cuánto tiempo?", "Le contesta una persona del equipo, por el canal que prefiera (WhatsApp, teléfono o correo), el mismo día o, como máximo, en 24 horas laborables."],
    ["¿En qué zonas valoran?", "Madrid capital y las zonas residenciales del norte, el noroeste y el este de la Comunidad de Madrid."],
  ];
  const ld = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Valoración de su vivienda en 24 horas", item: url } ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  const body = `<main>
<section class="post-hero"><div class="wrap"><hr class="mark"><p class="eyebrow">Valoración de su vivienda</p>
<h1>Valoración realista de su vivienda en Madrid, <em>en 24 horas.</em></h1>
<p class="post-lead">Olara RE le da una valoración orientativa de su vivienda en un máximo de 24 horas laborables, con comparables reales y sin inflar el precio. Es gratuita, sin compromiso y no es una tasación oficial.</p>
<p class="hero-cta" style="margin-top:2rem"><a class="btn btn-solid" href="#valorar">Pedir mi valoración</a>
<a class="btn btn-ghost" href="https://wa.me/34686862017?text=Hola%2C%20quiero%20una%20valoraci%C3%B3n%20de%20mi%20vivienda%20en%20Madrid">Escribir por WhatsApp</a></p></div></section>
<section class="on-light band"><div class="wrap"><div class="sec-head"><div><hr class="mark"><p class="eyebrow">Cómo trabajamos</p></div>
<h2>Un precio que se <em>puede defender.</em></h2></div>
<div class="services">
<article class="service"><div class="idx">I</div><h3>Superficies reales</h3><p>Trabajamos con la superficie útil y la de su escritura, no solo con la del catastro, que suele diferir.</p></article>
<article class="service"><div class="idx">II</div><h3>Comparables de operaciones reales</h3><p>Le explicamos con qué ventas cercanas comparamos su vivienda y por qué, para que el precio no sea una cifra sin respaldo.</p></article>
<article class="service"><div class="idx">III</div><h3>Su decisión, con información</h3><p>Le explicamos las opciones: vender con una agencia o, si su vivienda encaja y necesita reforma, estudiar una oferta de compra directa al contado.</p></article>
</div></div></section>
<section class="band" id="valorar"><div class="wrap"><div class="sec-head"><div><hr class="mark"><p class="eyebrow">Solicitud</p></div><h2>Cuéntenos <em>su vivienda.</em></h2></div>
<form id="valform" novalidate style="max-width:40rem">
<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;width:0">
<div class="two"><div class="field"><label for="v-name">Nombre</label><input id="v-name" name="name" type="text" autocomplete="name" required></div>
<div class="field"><label for="v-phone">Teléfono</label><input id="v-phone" name="phone" type="tel" autocomplete="tel" required></div></div>
<div class="field"><label for="v-email">Email</label><input id="v-email" name="email" type="email" autocomplete="email" required></div>
<div class="field"><label for="v-addr">Dirección o zona de la vivienda</label><input id="v-addr" name="address" type="text" required></div>
<div class="two"><div class="field"><label for="v-m2">Metros aproximados</label><input id="v-m2" name="m2" type="text"></div>
<div class="field"><label for="v-why">Situación</label><select id="v-why" name="type"><option>Herencia</option><option>Quiero cambiar de vivienda</option><option>Otro motivo</option></select></div></div>
<div class="field"><label for="v-msg">Algo más que debamos saber (opcional)</label><textarea id="v-msg" name="message"></textarea></div>
<label class="consent"><input type="checkbox" name="consent" required><span>Acepto que Olara RE trate mis datos para responder a esta solicitud, conforme a la <a href="/privacidad" target="_blank">política de privacidad</a>.</span></label>
<button class="btn btn-solid" type="submit">Pedir mi valoración</button>
<p class="form-msg" id="valMsg" role="status"></p></form></div></section>
<section class="on-light band"><article class="prose"><h2>Preguntas frecuentes</h2>
${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("\n")}
<p class="sources">La valoración es orientativa y no sustituye a una tasación. Los resultados dependen de cada vivienda y del momento del mercado.</p>
</article></section></main>
<script>
(function(){
  var f=document.getElementById('valform'), m=document.getElementById('valMsg'), b=f.querySelector('button[type=submit]');
  function say(t){ m.textContent=t; m.classList.add('show'); }
  f.addEventListener('submit', async function(e){
    e.preventDefault();
    if(!f.checkValidity()){ say('Complete los campos obligatorios.'); var x=f.querySelector(':invalid'); if(x) x.focus(); return; }
    var d=new FormData(f);
    var msg='Dirección o zona: '+(d.get('address')||'')+'. Metros: '+(d.get('m2')||'—')+'. '+(d.get('message')||'');
    var payload={name:d.get('name')||'',phone:d.get('phone')||'',email:d.get('email')||'',type:'Valoración · '+(d.get('type')||''),message:msg,consent:true,website:d.get('website')||'',page:location.pathname};
    b.disabled=true; say('Enviando…');
    try{
      var r=await fetch('/api/contacto',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!r.ok) throw new Error(r.status);
      f.reset();
      try{ if(window.fbq) fbq('track','Lead',{content_name:'valoracion'}); }catch(e1){}
      try{ if(window.gtag) gtag('event','conversion',{send_to:'AW-18567283541/FBQqCPrp27UdENWGyZVF',value:1.0,currency:'EUR'}); }catch(e2){}
      say('Gracias. Le contestamos el mismo día o, como máximo, en 24 horas laborables.');
    }catch(err){ say('Ha ocurrido un error. Escríbanos a info@olara-re.com o por WhatsApp.'); }
    finally{ b.disabled=false; }
  });
})();
</script>`;
  writeFileSync(join(ROOT, "valoracion.html"), page({
    title: "Valoración de su vivienda en Madrid en 24 horas | Olara RE",
    description: "Valoración orientativa y gratuita de su vivienda en Madrid en un máximo de 24 horas laborables, con comparables reales y sin inflar el precio.",
    canonical: url, body, ld }));
}

/* sitemap.xml: páginas fijas + blog */
const fixed = ["/", "/blog", ...(existsSync(join(ROOT, "compradores-mexico.html")) ? ["/compradores-mexico"] : []), "/valoracion"];
const today = new Date().toISOString().slice(0, 10);
const urls = [
  ...fixed.map((u) => ({ loc: SITE + (u === "/" ? "/" : u), lastmod: today, p: u === "/" ? "1.0" : "0.8" })),
  ...posts.map((p) => ({ loc: `${SITE}/blog/${p.slug}`, lastmod: p.updated || p.date, p: "0.6" })),
];
writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.p}</priority></url>`).join("\n")}\n</urlset>\n`);

/* llms.txt */
writeFileSync(join(ROOT, "llms.txt"), `# Olara RE
> Agencia inmobiliaria premium en Madrid. Venta de vivienda de alto valor y asesoramiento a compradores internacionales, con foco en México.

## Páginas
- [Inicio](${SITE}/): servicios, forma de trabajar y zonas.
- [Blog](${SITE}/blog): guías para vender y comprar vivienda en Madrid.
- [Valoración de su vivienda en 24 horas](${SITE}/valoracion)
${fixed.includes("/compradores-mexico") ? `- [Comprar en Madrid desde México](${SITE}/compradores-mexico)\n` : ""}
## Artículos
${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`).join("\n")}

## Contacto
info@olara-re.com · WhatsApp +34 686 862 017
`);
console.log(`Blog generado: ${posts.length} entradas.`);
