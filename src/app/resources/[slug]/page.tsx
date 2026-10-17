import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES } from "@/data/content";
import { Tex } from "@/components/ui/tex";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/pages/prose";
import { formatDate, formatNumber } from "@/lib/format";
import { SITE } from "@/lib/config";

export const generateStaticParams = () => ARTICLES.map((a) => ({ slug: a.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) return {};
  return { title: a.title, description: a.excerpt, alternates: { canonical: `/resources/${a.slug}` }, openGraph: { type: "article", title: a.title, description: a.excerpt, url: `${SITE.url}/resources/${a.slug}`, locale: "fa_IR" } };
}
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  return (
    <>
      <PageHero eyebrow={a.kind} title={a.title}>{a.excerpt}</PageHero>
      <article className="container-x max-w-3xl py-10">
        <p className="mb-8 flex flex-wrap items-center gap-3 text-sm text-ink-600"><span>{formatDate(a.publishedAt)}</span><span>·</span><span>{formatNumber(a.readMin)} دقیقه مطالعه</span>{a.tags.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}</p>
        <div className="space-y-5 leading-9 text-ink-700">
          {a.body.map((b, i) => b.h ? <h2 key={i} className="pt-4 text-xl font-bold text-ink">{b.h}</h2> : b.math ? <div key={i} className="rounded-lg bg-card p-4 text-center text-lg"><Tex display>{b.math}</Tex></div> : <p key={i}>{b.p}</p>)}
        </div>
        <div className="mt-10 flex gap-3"><Button href="/courses" variant="cta">دوره‌های مرتبط</Button><Button href="/resources" variant="outline">منابع بیشتر</Button></div>
      </article>
    </>
  );
}
