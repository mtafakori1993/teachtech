#!/usr/bin/env node
/**
 * Fills the chroma-key (#00FF00) screens of the AI-generated device scene with GENUINE screenshots.
 * The largest green region receives the desktop screenshot, the second the mobile one; non-green pixels (bezels, notch) are untouched.
 * Usage: node scripts/compose-mockup.mjs scene.png desktop.png mobile.png out.webp [--crop=cx,cy,w]
 * --crop (scene pixels) takes a 4:3 window centred on the devices; the portfolio theme trims covers (16:9 derivative into a 4:3 frame),
 * so the devices must stay inside the central ~75% of the delivered image.
 */
import sharp from "sharp";
const [scenePath, deskPath, mobPath, out] = process.argv.slice(2);
const cropArg = process.argv.find((a) => a.startsWith("--crop="))?.split("=")[1]?.split(",").map(Number);
const SS = 2; // work at 2x for clean edges, then downsample
const scene = sharp(scenePath).ensureAlpha();
const { width: w0, height: h0 } = await scene.metadata();
const W = w0 * SS, H = h0 * SS;
const base = await scene.resize(W, H, { kernel: "lanczos3" }).raw().toBuffer();

const isGreen = (i) => { const r = base[i], g = base[i + 1], b = base[i + 2]; return g > 150 && g - r > 70 && g - b > 70; };
const mask = new Uint8Array(W * H);
for (let p = 0; p < W * H; p++) mask[p] = isGreen(p * 4) ? 1 : 0;

// connected components (iterative flood fill)
const label = new Int32Array(W * H); const comps = [];
for (let s = 0; s < W * H; s++) {
  if (!mask[s] || label[s]) continue;
  const id = comps.length + 1; const stack = [s]; label[s] = id;
  let minX = W, maxX = 0, minY = H, maxY = 0, n = 0;
  while (stack.length) {
    const p = stack.pop(); const x = p % W, y = (p / W) | 0; n++;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    for (const q of [p - 1, p + 1, p - W, p + W]) if (q >= 0 && q < W * H && mask[q] && !label[q] && !(Math.abs((q % W) - x) > 1)) { label[q] = id; stack.push(q); }
  }
  comps.push({ id, n, minX, maxX, minY, maxY });
}
const screens = comps.filter((c) => c.n > 20000).sort((a, b) => b.n - a.n).slice(0, 2);
if (screens.length < 2) { console.error("could not find two green screens", comps.map((c) => c.n).slice(0, 6)); process.exit(1); }
const [desk, mob] = screens;
console.log("desktop screen", desk.maxX - desk.minX + 1, "x", desk.maxY - desk.minY + 1, "| mobile screen", mob.maxX - mob.minX + 1, "x", mob.maxY - mob.minY + 1);

const result = Buffer.from(base);
async function fill(c, imgPath) {
  const bw = c.maxX - c.minX + 1, bh = c.maxY - c.minY + 1;
  const shot = await sharp(imgPath).resize(bw, bh, { fit: "cover", position: "top", kernel: "lanczos3" }).removeAlpha().raw().toBuffer();
  for (let y = c.minY; y <= c.maxY; y++) for (let x = c.minX; x <= c.maxX; x++) {
    const p = y * W + x;
    // fill the screen region plus a 1px dilation so no green fringe survives anti-aliasing
    let inside = label[p] === c.id;
    if (!inside) for (const q of [p - 1, p + 1, p - W, p + W, p - W - 1, p - W + 1, p + W - 1, p + W + 1]) if (label[q] === c.id) { inside = true; break; }
    if (!inside) continue;
    const s = ((y - c.minY) * bw + (x - c.minX)) * 3;
    result[p * 4] = shot[s]; result[p * 4 + 1] = shot[s + 1]; result[p * 4 + 2] = shot[s + 2]; result[p * 4 + 3] = 255;
  }
}
await fill(desk, deskPath); await fill(mob, mobPath);
let img = sharp(result, { raw: { width: W, height: H, channels: 4 } });
if (cropArg) { const [cx, cy, cw] = cropArg; const w = Math.round(cw * SS), h = Math.round((cw * 3 * SS) / 4); img = img.extract({ left: Math.round(cx * SS - w / 2), top: Math.round(cy * SS - h / 2), width: w, height: h }); }
await img.resize(1600, 1200, { kernel: "lanczos3" }).webp({ quality: 90 }).toFile(out);
console.log("saved", out);
