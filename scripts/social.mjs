#!/usr/bin/env node
/**
 * Imágenes de redes de Olara RE (1080x1350, azul marino y dorado) a partir de JSON.
 *   node scripts/social.mjs content/social/<fecha>.json   → social/<fecha>.jpg
 * JSON: { "fecha": "2026-11-11", "label": "Compradores desde México", "title": "…", "subtitle": "…", "footer": "olara-re.com" }
 * Usa sharp (se toma de /Users/oscarlarrea/mi-clon/node_modules si no está instalado aquí).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require("sharp"); } catch { sharp = require("/Users/oscarlarrea/mi-clon/node_modules/sharp"); }

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function wrap(text, max) {
  const lines = []; let line = "";
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    if ((line + " " + w).trim().length > max) { if (line) lines.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line); return lines;
}
const tsp = (ls, x, y0, lh) => ls.map((l, i) => `<tspan x="${x}" y="${y0 + i * lh}">${esc(l)}</tspan>`).join("");

const file = process.argv[2];
if (!file) throw new Error("Uso: node scripts/social.mjs content/social/<fecha>.json");
const d = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
const W = 1080, H = 1350, M = 90;
const title = wrap(d.title, 22).slice(0, 6);
const fsz = title.length > 4 ? 78 : 92;
const y0 = 520;
const sub = wrap(d.subtitle ?? "", 38).slice(0, 3);
const subY = y0 + title.length * fsz * 1.1 + 50;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="100%" height="100%" fill="#0D1B2A"/>
<rect x="${M}" y="230" width="64" height="3" fill="#B8996A"/>
<text x="${M}" y="300" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="24" letter-spacing="6" fill="#B8996A">${esc(String(d.label ?? "").toUpperCase())}</text>
<text font-family="Didot, 'Bodoni 72', Georgia, serif" font-size="${fsz}" font-weight="300" fill="#F5F1EB">${tsp(title, M, y0, fsz * 1.1)}</text>
<text font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="34" fill="#C9CDD3">${tsp(sub, M, subY, 48)}</text>
<line x1="${M}" y1="${H - 170}" x2="${W - M}" y2="${H - 170}" stroke="#26374B" stroke-width="2"/>
<text x="${M}" y="${H - 110}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="26" letter-spacing="4" fill="#B8996A">${esc(String(d.footer ?? "OLARA-RE.COM").toUpperCase())}</text>
</svg>`;
const logo = await sharp(path.join(ROOT, "logo-olara-re-horizontal-crema.svg"), { density: 300 }).resize({ width: 300 }).png().toBuffer();
fs.mkdirSync(path.join(ROOT, "social"), { recursive: true });
const out = path.join(ROOT, "social", `${d.fecha}.jpg`);
await sharp(Buffer.from(svg)).composite([{ input: logo, left: M, top: 80 }]).jpeg({ quality: 88 }).toFile(out);
console.log("OK", out);
