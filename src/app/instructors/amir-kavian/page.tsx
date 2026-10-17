import type { Metadata } from "next";
import { INSTRUCTORS } from "@/data/catalog";
import { InstructorCourses } from "@/components/pages/instructor-courses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/config";
import { Compass, Lightbulb, ListChecks, MessagesSquare } from "lucide-react";

const i = INSTRUCTORS[0];
export const metadata: Metadata = { title: "امیر کاویان، مدرس ریاضی", description: "پروفایل آقای امیر کاویان، مدرس ریاضی آموزشگاه کاویان؛ حوزه‌های تدریس، رویکرد آموزشی و دوره‌ها.", alternates: { canonical: "/instructors/amir-kavian" } };

const APPROACH = [
  { Icon: Lightbulb, t: "اول مفهوم", d: "هر مبحث با یک پرسش یا تصویر شروع می‌شود تا دلیل وجود فرمول روشن باشد." },
  { Icon: ListChecks, t: "مثال‌های پلکانی", d: "حل مثال از ساده به دشوار، با نشان‌دادن خطاهای رایج در هر مرحله." },
  { Icon: MessagesSquare, t: "پرسش و پاسخ", d: "سؤال‌ها زیر همان درس پرسیده و پاسخ داده می‌شود تا برای همه قابل‌استفاده باشد." },
  { Icon: Compass, t: "آزمون و بازخورد", d: "آزمون‌های کوتاه با توضیح پاسخ، تا اشتباه‌ها همان لحظه شناخته شوند." },
];
export default function InstructorPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Person", name: i.name, jobTitle: i.title, affiliation: { "@type": "Organization", name: SITE.academy }, url: `${SITE.url}/instructors/amir-kavian` }} />
      <section className="border-b border-line bg-gradient-to-b from-card to-cream">
        <div className="container-x grid items-center gap-8 py-12 md:grid-cols-[auto_1fr]">
          <div className="grid size-36 place-items-center rounded-full border-4 border-white bg-sun-400 text-6xl font-bold shadow-lift" aria-hidden>ک</div>
          <div>
            <p className="text-sm font-bold text-brand-700">{i.title} · {SITE.academy}</p>
            <h1 className="mt-1 text-4xl font-bold">{i.name}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-9 text-ink-700">{i.bio}</p>
            <div className="mt-5 flex flex-wrap gap-3"><Button href="/courses" variant="cta">دوره‌های ایشان</Button><Button href="/contact" variant="outline">تماس و مشاوره</Button></div>
          </div>
        </div>
      </section>
      <div className="container-x space-y-14 py-12">
        <section aria-labelledby="areas"><h2 id="areas" className="mb-4 text-2xl font-bold">حوزه‌های تدریس</h2><ul className="flex flex-wrap gap-2">{i.areas.map((a) => <li key={a} className="rounded-full border border-line bg-white px-4 py-2 text-sm shadow-soft">{a}</li>)}</ul></section>
        <section aria-labelledby="approach"><h2 id="approach" className="mb-4 text-2xl font-bold">رویکرد آموزشی</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{APPROACH.map(({ Icon, t, d }) => <Card key={t} className="p-5"><Icon className="size-6 text-brand-600" aria-hidden /><h3 className="mt-3 font-bold">{t}</h3><p className="mt-1 text-sm leading-7 text-ink-600">{d}</p></Card>)}</div></section>
        <section aria-labelledby="goals"><h2 id="goals" className="mb-4 text-2xl font-bold">هدف دوره‌ها</h2><p className="max-w-3xl leading-9 text-ink-700">هر دوره اهداف یادگیری مشخصی دارد که در صفحهٔ آن دوره نوشته شده است: از تسلط بر مفاهیم پایه تا آمادگی برای امتحان نهایی و کنکور. پیشرفت شما در داشبورد دیده می‌شود و گواهی پایان دوره پس از تکمیل شرایط صادر می‌شود.</p></section>
        <InstructorCourses />
      </div>
    </>
  );
}
