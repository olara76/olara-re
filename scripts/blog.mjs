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
  .replace(/href="#(servicios|proceso|zonas|contacto)"/g, 'href="/#$1"')
  .replace(
    '<a href="/#contacto"',
    '<a href="/blog" aria-current="page">Blog</a>\n    <a href="/#contacto"'
  );
let footer = home.match(/<footer[\s\S]*?<\/footer>/)[0]
  .replace(/href="#(servicios|proceso|contacto)"/g, 'href="/#$1"')
  .replace('<a href="/socios"', '<a href="/blog">Blog</a>\n      <a href="/socios"')
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

/* sitemap.xml: páginas fijas + blog */
const fixed = ["/", "/blog", ...(existsSync(join(ROOT, "compradores-mexico.html")) ? ["/compradores-mexico"] : [])];
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
${fixed.includes("/compradores-mexico") ? `- [Comprar en Madrid desde México](${SITE}/compradores-mexico)\n` : ""}
## Artículos
${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`).join("\n")}

## Contacto
info@olara-re.com · WhatsApp +34 686 862 017
`);
console.log(`Blog generado: ${posts.length} entradas.`);
