"use client";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Award, BookOpenCheck, CirclePlay, FileQuestion, GraduationCap, MonitorSmartphone, NotebookPen, Quote, Route, Smartphone } from "lucide-react";
import { CourseCover } from "@/components/brand/course-cover";
import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { Badge, Card, Progress, SectionHeading } from "@/components/ui/primitives";
import { iconByName } from "@/components/ui/icons";
import { ARTICLES, FAQS, LEARNING_PATHS, TESTIMONIALS } from "@/data/content";
import { CATEGORIES } from "@/data/catalog";
import { useApp } from "@/store/app";
import { usePublishedCourses } from "@/store/hooks";
import { formatDate, formatNumber } from "@/lib/format";
import { Tex } from "@/components/ui/tex";

export function Hero() {
  const hp = useApp((s) => s.homepage);
  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-card to-cream">
      <div aria-hidden className="grid-paper absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="container-x relative grid items-center gap-10 py-12 md:py-16 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:py-20">
        <div className="animate-rise">
          <Badge tone="sun" className="mb-4">به سفارش آموزشگاه کاویان</Badge>
          <h1 className="text-4xl font-bold leading-[1.45] sm:text-5xl lg:text-[3.25rem]">{hp.heroTitle}</h1>
          <p className="mt-5 max-w-xl text-lg leading-9 text-ink-700">{hp.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/courses" size="lg" variant="cta">مشاهدهٔ دوره‌ها<ArrowLeft className="size-5" /></Button>
            <Button href="/instructors/amir-kavian" size="lg" variant="outline">آشنایی با مدرس</Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-700">
            {["پایه‌های دهم تا دوازدهم", "آزمون و گواهی پایان دوره", "قابل نصب روی گوشی"].map((t) => <li key={t} className="flex items-center gap-2"><span className="size-2 rounded-full bg-flame-400" aria-hidden />{t}</li>)}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
          <div className="rotate-2 overflow-hidden rounded-xl border-4 border-white shadow-pop"><CourseCover art="parabola" seed="hero" alt="" className="aspect-[4/3] w-full" /></div>
          <Card className="absolute -bottom-6 start-0 w-60 -rotate-3 p-4 sm:start-[-1.5rem]">
            <p className="text-xs text-ink-600">درس امروز</p>
            <p className="font-bold">مشتق و شیب مماس</p>
            <div className="mt-2 rounded-md bg-card py-2 text-center"><Tex>{"f'(a)=\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}"}</Tex></div>
          </Card>
          <Card className="absolute -top-5 end-2 flex items-center gap-2 px-3 py-2 sm:end-[-1rem]"><span className="grid size-9 place-items-center rounded-full bg-sun-400"><Award className="size-5" /></span><span className="text-sm font-bold">گواهی پایان دوره</span></Card>
        </div>
      </div>
    </section>
  );
}

export function InstructorIntro() {
  return (
    <section className="container-x py-16">
      <div className="grid items-center gap-8 rounded-xl bg-brand-800 p-6 text-white sm:p-10 md:grid-cols-[auto_1fr_auto]">
        <div className="mx-auto grid size-28 place-items-center rounded-full bg-sun-400 text-5xl font-bold text-ink" aria-hidden>ک</div>
        <div>
          <p className="text-sm font-bold text-sun-300">مدرس ریاضی</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">آقای امیر کاویان</h2>
          <p className="mt-3 max-w-2xl leading-8 text-brand-100">دوره‌های TeachTech با تکیه بر توضیح مفهومی، حل گام‌به‌گام مثال و تمرین هدفمند طراحی شده‌اند تا دانش‌آموز مسئله را بفهمد، نه اینکه فقط راه‌حل را حفظ کند.</p>
        </div>
        <Button href="/instructors/amir-kavian" variant="cta">پروفایل مدرس</Button>
      </div>
    </section>
  );
}

export function FeaturedCourses() {
  const ids = useApp((s) => s.homepage.featuredCourseIds);
  const published = usePublishedCourses();
  const list = useMemo(() => ids.map((id) => published.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c), [ids, published]);
  return (
    <section className="container-x py-4">
      <SectionHeading eyebrow="دوره‌های منتخب" title="از کجا شروع کنیم؟" action={<Button href="/courses" variant="ghost">همهٔ دوره‌ها<ArrowLeft className="size-4" /></Button>}>
        دوره‌های پرمخاطب این فصل؛ امتیازها و تعداد ثبت‌نام‌های نمایش‌داده‌شده نمونه هستند.
      </SectionHeading>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{list.map((c) => <CourseCard key={c.id} course={c} />)}</div>
    </section>
  );
}

export function Categories() {
  const courses = usePublishedCourses();
  return (
    <section className="container-x py-16">
      <SectionHeading eyebrow="دسته‌بندی" title="مبحث موردنظرتان را پیدا کنید" />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((c) => {
          const Icon = iconByName(c.icon);
          const n = courses.filter((x) => x.categoryId === c.id).length;
          return (
            <li key={c.id}>
              <Link href={`/courses?category=${c.id}`} className="group flex h-full flex-col gap-2 rounded-lg border border-line bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift">
                <span className="grid size-11 place-items-center rounded-md bg-card text-brand-700 transition-colors group-hover:bg-sun-400 group-hover:text-ink"><Icon className="size-5" /></span>
                <span className="font-bold">{c.title}</span>
                <span className="text-xs text-ink-600">{c.description}</span>
                <span className="mt-auto text-xs font-medium text-brand-700">{formatNumber(n)} دوره</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function LearningPaths() {
  return (
    <section id="paths" className="border-y border-line bg-card/60 py-16">
      <div className="container-x">
        <SectionHeading eyebrow="مسیرهای یادگیری" title="ترتیب درست دوره‌ها">مسیرهای پیشنهادی برای اینکه بدانید بعد از هر دوره سراغ کدام دوره بروید.</SectionHeading>
        <div className="grid gap-5 md:grid-cols-3">
          {LEARNING_PATHS.map((p) => (
            <Card key={p.id} as="article" className="p-5">
              <div className="flex items-center gap-2 text-brand-700"><Route className="size-5" aria-hidden /><h3 className="font-bold text-ink">{p.title}</h3></div>
              <ol className="mt-4 space-y-3">
                {p.steps.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sun-400 text-xs font-bold">{formatNumber(i + 1)}</span>
                    <Link href={`/courses/${p.courseSlugs[i]}`} className="hover:text-brand-700 hover:underline">{s}</Link>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const BENEFITS = [
  { Icon: CirclePlay, t: "درس‌های ساختاریافته", d: "هر دوره به بخش و درس‌های کوتاه تقسیم شده و پیشرفت شما خودکار ذخیره می‌شود." },
  { Icon: FileQuestion, t: "آزمون با توضیح پاسخ", d: "بعد از هر دوره آزمون زمان‌دار با تصحیح خودکار و توضیح کامل پاسخ‌ها." },
  { Icon: NotebookPen, t: "یادداشت و نشانه‌گذاری", d: "هنگام یادگیری یادداشت بنویسید و نقطه‌های مهم هر درس را نشانه بزنید." },
  { Icon: Award, t: "گواهی پایان دوره", d: "با تکمیل درس‌ها و قبولی در آزمون پایانی، گواهی آموزشگاه صادر می‌شود." },
  { Icon: MonitorSmartphone, t: "روی هر دستگاهی", d: "طراحی واکنش‌گرا و قابل نصب روی صفحهٔ اصلی گوشی." },
  { Icon: BookOpenCheck, t: "پرسش و پاسخ هر درس", d: "سؤال خود را زیر همان درس بپرسید تا مدرس در همان‌جا پاسخ دهد." },
];
export function Benefits() {
  return (
    <section className="container-x py-16">
      <SectionHeading eyebrow="چرا TeachTech" title="یادگیری که دنبال می‌شود، نه رها" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map(({ Icon, t, d }) => (
          <li key={t} className="flex gap-4 rounded-lg border border-line bg-white p-5 shadow-soft">
            <span className="grid size-12 shrink-0 place-items-center rounded-md bg-sun-100 text-flame-600"><Icon className="size-6" aria-hidden /></span>
            <div><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm leading-7 text-ink-600">{d}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorks() {
  const steps = [["دوره را انتخاب کنید", "با فیلتر پایه و مبحث، دورهٔ مناسب را پیدا کنید و پیش‌نمایش درس‌ها را ببینید."], ["ثبت‌نام کنید", "دوره را به سبد اضافه و سفارش را ثبت کنید. در این نسخه پرداخت شبیه‌سازی‌شده است."], ["درس بخوانید و آزمون بدهید", "درس‌ها را دنبال کنید، یادداشت بنویسید و در آزمون‌ها شرکت کنید."], ["گواهی بگیرید", "پس از تکمیل شرایط، گواهی را چاپ یا به‌صورت PDF ذخیره کنید."]];
  return (
    <section className="py-4">
      <div className="container-x">
        <SectionHeading eyebrow="چطور کار می‌کند" title="چهار قدم تا گواهی" />
        <ol className="grid gap-4 md:grid-cols-4">
          {steps.map(([t, d], i) => (
            <li key={t} className="relative rounded-lg border border-line bg-white p-5 shadow-soft">
              <span className="absolute -top-4 start-5 grid size-9 place-items-center rounded-full bg-flame-400 text-lg font-bold shadow-soft">{formatNumber(i + 1)}</span>
              <h3 className="mt-3 font-bold">{t}</h3><p className="mt-1 text-sm leading-7 text-ink-600">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ProgressHighlight() {
  return (
    <section className="container-x py-16">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="تجربهٔ یادگیری" title="ببینید کجای مسیر هستید">داشبورد دانش‌آموز، درس‌های باقی‌مانده، آزمون‌های پیش‌رو و برنامهٔ مطالعهٔ هفتگی را یک‌جا نشان می‌دهد.</SectionHeading>
          <Button href="/login" variant="secondary"><GraduationCap className="size-4" />ورود به داشبورد</Button>
        </div>
        <Card className="p-5">
          <p className="text-xs text-ink-500">نمونهٔ نمایش داشبورد</p>
          {[["ریاضی یازدهم: تابع، لگاریتم و حد", 75], ["حسابان یازدهم: تابع و مثلثات", 50], ["حد و پیوستگی از صفر", 50]].map(([t, v]) => (
            <div key={t as string} className="mt-4"><div className="mb-1.5 flex justify-between text-sm"><span>{t}</span><span className="tabular text-ink-600">{formatNumber(v as number)}٪</span></div><Progress value={v as number} /></div>
          ))}
        </Card>
      </div>
    </section>
  );
}

export function Resources() {
  return (
    <section className="container-x py-4">
      <SectionHeading eyebrow="منابع آموزشی" title="مقاله و راهنمای رایگان" action={<Button href="/resources" variant="ghost">همهٔ منابع<ArrowLeft className="size-4" /></Button>} />
      <div className="grid gap-5 md:grid-cols-3">
        {ARTICLES.slice(0, 3).map((a) => (
          <Link key={a.slug} href={`/resources/${a.slug}`} className="group overflow-hidden rounded-lg border border-line bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
            <CourseCover art={a.art} seed={a.slug} alt="" className="aspect-[16/7] w-full" />
            <div className="p-4"><Badge tone="neutral">{a.kind}</Badge><h3 className="mt-2 font-bold leading-7 group-hover:text-brand-700">{a.title}</h3><p className="mt-1 line-clamp-2 text-sm text-ink-600">{a.excerpt}</p><p className="mt-2 text-xs text-ink-500">{formatDate(a.publishedAt)} · {formatNumber(a.readMin)} دقیقه مطالعه</p></div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="container-x py-16">
      <SectionHeading eyebrow="بازخورد" title="چه چیزی برای دانش‌آموزان مهم است؟">این متن‌ها نمونه‌هایی برای نمایش چیدمان هستند و به هیچ فرد واقعی نسبت داده نشده‌اند.</SectionHeading>
      <div className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure key={t.id} className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <Quote className="size-6 text-sun-500" aria-hidden />
            <blockquote className="mt-2 leading-8 text-ink-700">{t.text}</blockquote>
            <figcaption className="mt-3 text-sm font-bold">{t.name}<span className="block text-xs font-normal text-ink-500">{t.context}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function FaqPreview() {
  return (
    <section className="container-x py-4">
      <SectionHeading eyebrow="سؤالات متداول" title="پاسخ پرسش‌های رایج" />
      <div className="divide-y divide-line rounded-lg border border-line bg-white shadow-soft">
        {FAQS.slice(0, 5).map((f) => (
          <details key={f.q} className="group px-5 py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">{f.q}<span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-card text-brand-700 transition-transform group-open:rotate-45">+</span></summary>
            <p className="pb-4 leading-8 text-ink-600">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-4 text-sm"><Link href="/faq" className="font-medium text-brand-700 underline underline-offset-4">مشاهدهٔ همهٔ سؤالات</Link></p>
    </section>
  );
}

export function SupportCta() {
  return (
    <section className="container-x py-16">
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl bg-sun-400 p-6 sm:p-10">
        <div className="max-w-xl"><h2 className="text-2xl font-bold">برای انتخاب دوره کمک می‌خواهید؟</h2><p className="mt-2 text-ink-700">پایه و هدف خود را بنویسید تا پشتیبانی آموزشگاه مناسب‌ترین مسیر را پیشنهاد دهد.</p></div>
        <div className="flex flex-wrap gap-3"><Button href="/contact" variant="primary" size="lg">تماس با پشتیبانی</Button><Button href="/install" variant="outline" size="lg"><Smartphone className="size-5" />نصب اپلیکیشن</Button></div>
      </div>
    </section>
  );
}
