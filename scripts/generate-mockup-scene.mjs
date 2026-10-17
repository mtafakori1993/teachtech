#!/usr/bin/env node
/**
 * Generates a photographic 4:3 device scene (laptop + phone with flat green screens) through OpenRouter.
 * The AI never draws the product UI: screens are chroma-key placeholders that scripts/compose-mockup.mjs fills with
 * genuine screenshots of the running app.   OPENROUTER_API_KEY=… node scripts/generate-mockup-scene.mjs [out.png] [variant]
 */
import fs from "node:fs";
if (!process.env.OPENROUTER_API_KEY) { console.error("OPENROUTER_API_KEY is required"); process.exit(1); }
const out = process.argv[2] ?? ".tmp/scene.png";
const MODEL = process.env.IMAGE_MODEL ?? "openai/gpt-image-2.5-flare";
// Chat-style models (Gemini "nano banana") use /chat/completions; dedicated image models use OpenRouter's /images endpoint.
const CHAT = MODEL.startsWith("google/");
const SAFE = process.env.SAFE_ZONE !== "0"; // theme crops covers (16:9 derivative into a 4:3 frame): keep devices in the central ~70% of the frame
const prompt = `Photorealistic product-mockup photograph, 4:3 landscape. A modern silver laptop, open, sits on a clean light-oak desk beside a window with soft daylight; a modern black smartphone stands upright next to it, leaning slightly against a small stack of books on the laptop's right side. The mood is bright, friendly and educational: a few soft sky-blue and lemon-yellow accents (a blue notebook, a yellow pencil, a small green plant), warm cream wall in the background, shallow depth of field, subtle natural shadows.
CRITICAL framing rules: the camera is exactly front-on at eye level; the laptop and the phone are perfectly frontal and square to the camera with NO rotation, NO tilt and NO perspective distortion, so both screens are clean upright rectangles. The laptop screen is filled edge-to-edge with one flat, uniform, pure chroma-key green (#00FF00) with NO text, NO logos, NO reflections, NO glare and NO gradients. The phone screen is likewise filled with the same flat pure green (#00FF00). ${SAFE ? "Pull the camera well back: the laptop and the phone TOGETHER occupy only the central 62% of the frame width and about 58% of the frame height, centred in the frame, with generous empty desk and wall margin (at least 18% of the frame) on the left, right, top and bottom so nothing important is near an edge. The phone stands upright just to the right of the laptop, fully in frame and well inside the centre area." : "The laptop is large and occupies the left two-thirds of the frame; the phone is smaller on the right, fully in frame."} No people, no hands, no text anywhere.`;
let b64;
for (let attempt = 1; attempt <= (+process.env.TRIES || 6); attempt++) {
  const url = `https://openrouter.ai/api/v1/${CHAT ? "chat/completions" : "images"}`;
  const body = CHAT
    ? { model: MODEL, messages: [{ role: "user", content: prompt }], modalities: ["image", "text"], image_config: { aspect_ratio: "4:3" } }
    : { model: MODEL, prompt, size: "1536x1152" };
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "X-Title": "TeachTech portfolio mockup" }, body: JSON.stringify(body), signal: AbortSignal.timeout(240_000) })
    .catch((e) => ({ ok: false, status: 0, json: async () => ({ error: String(e) }) }));
  const j = await r.json();
  if (r.ok) { b64 = CHAT ? j.choices?.[0]?.message?.images?.[0]?.image_url?.url?.split(",")[1] : j.data?.[0]?.b64_json; if (b64) { console.log("usage", JSON.stringify(j.usage ?? {})); break; } console.error("no image in response", JSON.stringify(j).slice(0, 300)); process.exit(1); }
  if ((r.status === 429 || r.status >= 500 || r.status === 0) && attempt < (+process.env.TRIES || 6)) { const wait = 8000 * attempt; console.error(`attempt ${attempt}: HTTP ${r.status}, retrying in ${wait / 1000}s`); await new Promise((x) => setTimeout(x, wait)); continue; }
  console.error("HTTP", r.status, JSON.stringify(j).slice(0, 400)); process.exit(1);
}
if (!b64) process.exit(1);
fs.writeFileSync(out, Buffer.from(b64, "base64"));
console.log("saved", out);
