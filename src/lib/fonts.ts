import localFont from "next/font/local";

// Vazir v16.1.0, bundled locally (see src/fonts/LICENSE-Vazir.txt). No external font requests.
export const vazir = localFont({
  variable: "--font-vazir",
  display: "swap",
  src: [
    { path: "../fonts/Vazir-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/Vazir.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Vazir-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Vazir-Bold.woff2", weight: "700", style: "normal" },
  ],
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});
