// Renders a short, locally generated sample clip (no third-party footage) used to demonstrate the lesson player.
// Run: node scripts/generate-media.mjs   (needs ffmpeg + Vazir installed for rendering Persian text)
import sharp from "sharp";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const W = 640, H = 360, FPS = 15, DUR = 18, N = FPS * DUR;
const OX = 210, OY = 300, U = 46;
const ease = (t) => t * t * (3 - 2 * t);
const clamp = (v) => Math.min(1, Math.max(0, v));
const px = (x) => OX + x * U, py = (y) => OY - y * U;

function curve(h, k, upTo) {
  const pts = [];
  for (let x = -2.6; x <= 2.6 + 1e-9; x += 0.05) {
    if (x > -2.6 + upTo * 5.2) break;
    const X = x + h;
    pts.push(`${pts.length ? "L" : "M"}${px(X).toFixed(1)} ${py((x * x) + k).toFixed(1)}`);
  }
  return pts.join("");
}

function frame(i) {
  const t = i / FPS;
  const draw = ease(clamp((t - 2.5) / 4.5));
  const m = ease(clamp((t - 8) / 5));
  const h = 2 * m, k = 1 * m;
  const vertex = t > 13 ? ease(clamp((t - 13) / 1.2)) : 0;
  let title = "نمایش نمودار تابع درجه دوم";
  if (t >= 8) title = "انتقال نمودار: y = (x − h)² + k";
  if (t >= 13) title = "رأس سهمی، نقطهٔ (h, k)";
  const grid = Array.from({ length: 14 }, (_, g) => `<line x1="${g * U}" y1="0" x2="${g * U}" y2="${H}" stroke="#2F80ED" stroke-opacity=".08"/>`).join("") +
    Array.from({ length: 9 }, (_, g) => `<line x1="0" y1="${g * U}" x2="${W}" y2="${g * U}" stroke="#2F80ED" stroke-opacity=".08"/>`).join("");
  const intro = clamp((t - 0.2) / 0.8) * (1 - clamp((t - 2.2) / 0.6));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Vazir, DejaVu Sans, sans-serif">
  <rect width="${W}" height="${H}" fill="#FFFDF5"/>${grid}
  <line x1="0" y1="${OY}" x2="${W}" y2="${OY}" stroke="#1F2937" stroke-width="2"/><line x1="${OX}" y1="0" x2="${OX}" y2="${H}" stroke="#1F2937" stroke-width="2"/>
  <text x="${W - 16}" y="${OY - 8}" font-size="14" fill="#1F2937" text-anchor="end">x</text><text x="${OX + 8}" y="18" font-size="14" fill="#1F2937">y</text>
  ${t >= 2.5 ? `<path d="${curve(h, k, draw)}" fill="none" stroke="#2F80ED" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
  ${t >= 8 ? `<path d="${curve(0, 0, 1)}" fill="none" stroke="#F2994A" stroke-width="2.5" stroke-dasharray="6 6" opacity=".7"/>` : ""}
  ${vertex ? `<circle cx="${px(h)}" cy="${py(k)}" r="${(9 * vertex).toFixed(1)}" fill="#F2C94C" stroke="#1F2937" stroke-width="2"/><text x="${px(h) + 14}" y="${py(k) + 28}" font-size="17" fill="#1F2937" opacity="${vertex}">(2 , 1)</text>` : ""}
  <rect x="0" y="0" width="${W}" height="0"/>
  <g opacity="${intro}"><rect x="120" y="120" width="400" height="110" rx="20" fill="#2F80ED"/>
    <text x="320" y="170" font-size="34" font-weight="700" fill="#FFFFFF" text-anchor="middle">TeachTech</text>
    <text x="320" y="208" font-size="17" fill="#FFFFFF" text-anchor="middle">نمونهٔ کوتاه پخش‌کنندهٔ درس</text></g>
  <rect x="12" y="${H - 52}" width="${W - 24}" height="40" rx="12" fill="#1F2937" opacity=".88"/>
  <text x="${W / 2}" y="${H - 25}" font-size="19" fill="#FFFDF5" text-anchor="middle">${title}</text>
  <rect x="${W - 150}" y="12" width="138" height="26" rx="13" fill="#F2C94C"/><text x="${W - 81}" y="30" font-size="12.5" font-weight="700" fill="#1F2937" text-anchor="middle">نمونهٔ پخش‌کننده</text>
</svg>`;
}

const dir = mkdtempSync(join(tmpdir(), "tt-frames-"));
for (let i = 0; i < N; i++) await sharp(Buffer.from(frame(i))).png({ compressionLevel: 1 }).toFile(join(dir, `f${String(i).padStart(4, "0")}.png`));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%04d.png"), "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", "-pix_fmt", "yuv420p", "-an", "public/media/sample-lesson.webm"]);
rmSync(dir, { recursive: true, force: true });

const vtt = `WEBVTT

00:00.500 --> 00:02.500
این یک ویدیوی نمونهٔ کوتاه برای نمایش پخش‌کننده است.

00:03.000 --> 00:07.500
ابتدا نمودار تابع y = x² را رسم می‌کنیم.

00:08.000 --> 00:12.500
با تغییر h و k، نمودار در صفحه جابه‌جا می‌شود.

00:13.000 --> 00:17.500
رأس سهمی همیشه در نقطهٔ (h, k) قرار دارد.
`;
writeFileSync("public/media/sample-lesson.fa.vtt", vtt);
console.log("media ok");
