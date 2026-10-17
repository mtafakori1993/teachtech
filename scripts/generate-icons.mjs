// Generates brand icons and the social image from vector sources. Run: npm run icons
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const BLUE = "#2F80ED", SUN = "#F2C94C", FLAME = "#F2994A", CREAM = "#FFFDF5", INK = "#1F2937";

const mark = (inset = 0) => `
  <g transform="translate(${inset} ${inset}) scale(${(512 - inset * 2) / 512})">
    <path d="M118 138h276a20 20 0 0 1 20 20v44a20 20 0 0 1-20 20h-96v150a20 20 0 0 1-20 20h-44a20 20 0 0 1-20-20V222h-96a20 20 0 0 1-20-20v-44a20 20 0 0 1 20-20z" fill="${CREAM}"/>
    <path d="M92 408C150 296 214 296 256 352c42 56 106 56 164-56" fill="none" stroke="${SUN}" stroke-width="30" stroke-linecap="round"/>
    <circle cx="404" cy="112" r="30" fill="${FLAME}"/>
  </g>`;

export const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="116" fill="${BLUE}"/>${mark()}</svg>`;
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BLUE}"/>${mark(76)}</svg>`;
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BLUE}"/>${mark(40)}</svg>`;

writeFileSync("src/app/icon.svg", iconSvg);
writeFileSync("public/brand-mark.svg", iconSvg);
const png = (svg, size, out) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
await png(iconSvg, 192, "public/icons/icon-192.png");
await png(iconSvg, 512, "public/icons/icon-512.png");
await png(maskableSvg, 512, "public/icons/maskable-512.png");
await png(maskableSvg, 192, "public/icons/maskable-192.png");
await png(appleSvg, 180, "src/app/apple-icon.png");

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Vazir, Vazirmatn, sans-serif">
  <rect width="1200" height="630" fill="${CREAM}"/>
  <rect x="0" y="0" width="1200" height="630" fill="${BLUE}" opacity="0.07"/>
  <circle cx="190" cy="130" r="220" fill="${SUN}" opacity="0.5"/>
  <circle cx="110" cy="560" r="150" fill="${FLAME}" opacity="0.35"/>
  <path d="M40 560C130 400 240 400 310 480c60 60 150 60 250-60" fill="none" stroke="${BLUE}" stroke-width="14" stroke-linecap="round" opacity="0.55"/>
  <g transform="translate(110 70) scale(0.5)"><rect width="512" height="512" rx="116" fill="${BLUE}"/>${mark()}</g>
  <text x="1110" y="330" text-anchor="start" font-size="104" font-weight="700" fill="${INK}" direction="rtl">TeachTech</text>
  <text x="1110" y="410" text-anchor="start" font-size="46" font-weight="500" fill="${BLUE}" direction="rtl">آموزش آنلاین و یادگیری هوشمند</text>
  <text x="1110" y="486" text-anchor="start" font-size="30" fill="${INK}" opacity="0.8" direction="rtl">دوره‌های ریاضی با تدریس آقای امیر کاویان</text>
  <text x="1110" y="534" text-anchor="start" font-size="26" fill="${INK}" opacity="0.65" direction="rtl">به سفارش آموزشگاه کاویان</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile("src/app/opengraph-image.png");
console.log("icons ok");
