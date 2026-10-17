import type { Metadata } from "next";
import { PageHero } from "@/components/pages/prose";
import { InstallPanel } from "@/components/pwa/install-panel";
export const metadata: Metadata = { title: "نصب اپلیکیشن", description: "راهنمای نصب TeachTech روی صفحهٔ اصلی گوشی و رایانه.", alternates: { canonical: "/install" } };
export default function InstallPage() {
  return (<><PageHero eyebrow="اپلیکیشن" title="نصب TeachTech">TeachTech را مثل یک اپلیکیشن روی دستگاهتان نصب کنید.</PageHero><div className="container-x max-w-2xl py-12"><InstallPanel /></div></>);
}
