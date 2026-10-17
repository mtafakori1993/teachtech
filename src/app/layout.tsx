import type { Metadata, Viewport } from "next";
import { vazir } from "@/lib/fonts";
import { SITE } from "@/lib/config";
import { AnnouncementBar, Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppProviders } from "@/components/layout/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  authors: [{ name: SITE.developer }],
  openGraph: { type: "website", locale: "fa_IR", siteName: SITE.name, url: SITE.url, title: `${SITE.name} | ${SITE.tagline}`, description: SITE.description },
  twitter: { card: "summary_large_image", title: `${SITE.name} | ${SITE.tagline}`, description: SITE.description },
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: "TeachTech", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: SITE.themeColor, width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <head>
        {/* Capture beforeinstallprompt even if it fires before React hydrates; the install provider adopts it on mount. */}
        <script dangerouslySetInnerHTML={{ __html: "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__ttBip=e;});" }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:end-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-cream">پرش به محتوای اصلی</a>
        <AppProviders>
          <AnnouncementBar />
          <Header />
          <main id="main" className="flex-1">{children}</main>
          <Footer />
          <BottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
