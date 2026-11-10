#!/usr/bin/env node
/**
 * Reel de Olara RE (1080x1920, ~15-20 s, sin audio): fotogramas azul marino y dorado con zoom lento y fundidos.
 *   node scripts/reel.mjs content/social/<fecha>.json     (el JSON lleva "stories": [{ "kicker", "text" }, ...] de 3 a 5 fotogramas)
 * Salida: social/<fecha>-reel.mp4 (URL pública https://www.olara-re.com/social/<fecha>-reel.mp4)
 * Usa sharp (de /Users/oscarlarrea/mi-clon/node_modules si no está aquí) y ffmpeg (~/.local/bin/ffmpeg o variable FFMPEG).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require("sharp"); } catch { sharp = require("/Users/oscarlarrea/mi-clon/node_modules/sharp"); }
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const localFfmpeg = path.join(os.homedir(), ".local/bin/ffmpeg");
const ffmpeg = process.env.FFMPEG || (fs.existsSync(localFfmpeg) ? localFfmpeg : "ffmpeg");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function wrap(text, max) {
  const lines = []; let line = "";
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    if ((line + " " + w).trim().length > max) { if (line) lines.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line); return lines;
}
const tsp = (ls, x, y0, lh) => ls.map((l, i) => `<tspan x="${x}" y="${y0 + i * lh}">${esc(l)}</tspan>`).join("");

const d = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), "utf8"));
const stories = d.stories ?? [];
if (stories.length < 3) throw new Error("Hacen falta al menos 3 fotogramas en 'stories'");
const W = 1080, H = 1920, M = 90;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "re-reel-"));
const logo = await sharp(path.join(ROOT, "logo-olara-re-horizontal-crema.svg"), { density: 300 }).resize({ width: 300 }).png().toBuffer();
const files = [];
for (let i = 0; i < stories.length; i++) {
  const s = stories[i];
  const lines = wrap(s.text, 18).slice(0, 7);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="100%" height="100%" fill="#0D1B2A"/>
<rect x="${M}" y="420" width="64" height="3" fill="#B8996A"/>
<text x="${M}" y="500" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" letter-spacing="6" fill="#B8996A">${esc(String(s.kicker ?? "").toUpperCase())}</text>
<text font-family="Didot, 'Bodoni 72', Georgia, serif" font-size="88" font-weight="300" fill="#F5F1EB">${tsp(lines, M, 700, 98)}</text>
<line x1="${M}" y1="${H - 330}" x2="${W - M}" y2="${H - 330}" stroke="#26374B" stroke-width="2"/>
<text x="${M}" y="${H - 260}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="28" letter-spacing="4" fill="#B8996A">${esc(String(d.footer ?? "OLARA-RE.COM").toUpperCase())}</text>
<text x="${W - M}" y="${H - 260}" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="28" fill="#8A94A0">${i + 1}/${stories.length}</text>
</svg>`;
  const f = path.join(tmp, `f${i}.jpg`);
  await sharp(Buffer.from(svg)).composite([{ input: logo, left: M, top: 200 }]).jpeg({ quality: 90 }).toFile(f);
  files.push(f);
}
const SEG = 5, FADE = 0.6, FPS = 30;
const inputs = files.flatMap((f) => ["-i", f]);
const zoom = files.map((_, i) => `[${i}:v]scale=2160:3840,zoompan=z='min(zoom+0.0004,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${SEG * FPS}:s=1080x1920:fps=${FPS},format=yuv420p[v${i}]`).join(";");
let chain = "", prev = "v0", offset = 0;
for (let i = 1; i < files.length; i++) {
  offset += SEG - FADE;
  const out = i === files.length - 1 ? "out" : `x${i}`;
  chain += `;[${prev}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[${out}]`;
  prev = out;
}
const outFile = path.join(ROOT, "social", `${d.fecha}-reel.mp4`);
execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...inputs, "-filter_complex", zoom + chain, "-map", "[out]",
  "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p", "-r", String(FPS), "-movflags", "+faststart", "-an", outFile]);
console.log("reel:", outFile, `${(fs.statSync(outFile).size / 1e6).toFixed(1)} MB`);
