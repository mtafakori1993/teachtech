import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildSeed } from "@/data/seed";
import { CourseDetail } from "@/components/course/course-detail";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/config";
import { courseMinutes } from "@/lib/progress";

const seed = buildSeed();
const published = seed.courses.filter((c) => c.status === "published");
const isLocal = (slug: string) => slug.startsWith("local-");

export const dynamicParams = true;
export const generateStaticParams = () => published.map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = published.find((x) => x.slug === slug);
  if (!c) return { title: "دوره", robots: { index: false } };
  return {
    title: c.title,
    description: `${c.subtitle}. ${c.description}`.slice(0, 200),
    alternates: { canonical: `/courses/${c.slug}` },
    openGraph: { type: "website", title: `${c.title} | ${SITE.name}`, description: c.subtitle, url: `${SITE.url}/courses/${c.slug}`, locale: "fa_IR" },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = seed.courses.find((x) => x.slug === slug);
  if (!c && !isLocal(slug)) notFound();
  return (
    <>
      {c && c.status === "published" && (
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "Course", name: c.title, description: c.description, url: `${SITE.url}/courses/${c.slug}`, inLanguage: "fa",
          provider: { "@type": "Organization", name: SITE.academy },
          hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${courseMinutes(c)}M` },
        }} />
      )}
      <CourseDetail slug={slug} />
    </>
  );
}
