import type { Course, Lesson, Resource, Section, CourseFaq } from "./types";

export const f = String.raw;
export const SAMPLE_VIDEO = "/media/sample-lesson.webm";
export const SAMPLE_CAPTIONS = "/media/sample-lesson.fa.vtt";

export type LessonSpec = { t: string; min: number; s: string; k: string[]; f?: string[] };
export const L = (t: string, min: number, s: string, k: string[], fm: string[] = []): LessonSpec => ({ t, min, s, k, f: fm });

export type CourseSpec = Omit<Course, "sections" | "faq"> & {
  faq?: CourseFaq[];
  sections: [string, LessonSpec[]][];
};

const RES_KINDS: Resource["kind"][] = ["جزوه", "برگه تمرین", "فرمول‌نامه", "پاسخ‌نامه"];
const RES_TITLES = ["جزوهٔ خلاصهٔ درس‌ها", "برگهٔ تمرین بخش‌ها", "فرمول‌نامهٔ دوره", "پاسخ تشریحی برگه‌های تمرین"];

const defaultFaq = (title: string): CourseFaq[] => [
  { q: "پس از خرید، تا چه مدت به دوره دسترسی دارم؟", a: `در این نسخه، دسترسی به «${title}» پس از ثبت سفارش موفق در حساب شما فعال می‌شود و محدودیت زمانی ندارد.` },
  { q: "اگر در یکی از درس‌ها سؤال داشته باشم چه کنم؟", a: "زیر هر درس بخش «پرسش و پاسخ» وجود دارد. سؤال شما برای مدرس ثبت می‌شود و پاسخ در همان بخش نمایش داده می‌شود." },
  { q: "گواهی پایان دوره چگونه صادر می‌شود؟", a: "با دیدن همهٔ درس‌ها و کسب حداقل نمرهٔ قبولی در آزمون پایانی، گواهی آموزشگاه برای شما صادر می‌شود. این گواهی مدرک رسمی دولتی نیست." },
];

export function buildCourse(spec: CourseSpec): { course: Course; resources: Resource[] } {
  const { sections: raw, faq, ...rest } = spec;
  const resources: Resource[] = RES_TITLES.map((title, i) => ({
    id: `${spec.id}-r${i + 1}`,
    courseId: spec.id,
    title,
    kind: RES_KINDS[i],
    sizeKB: 180 + ((spec.id.charCodeAt(spec.id.length - 1) * 37 + i * 91) % 900),
  }));
  let n = 0;
  const sections: Section[] = raw.map(([title, lessons], si) => ({
    id: `${spec.id}-s${si + 1}`,
    title,
    lessons: lessons.map((l, li): Lesson => {
      n += 1;
      const isFirst = n === 1;
      return {
        id: `${spec.id}-l${n}`,
        title: l.t,
        durationMin: l.min,
        isPreview: isFirst || (si === 0 && li === 1),
        summary: l.s,
        keyPoints: l.k,
        formulas: l.f ?? [],
        videoSrc: isFirst ? SAMPLE_VIDEO : undefined,
        captionsSrc: isFirst ? SAMPLE_CAPTIONS : undefined,
        resourceIds: li === 0 ? [resources[Math.min(si, 2)].id] : si === raw.length - 1 && li === lessons.length - 1 ? [resources[3].id] : [],
      };
    }),
  }));
  return { course: { ...rest, faq: faq ?? defaultFaq(spec.title), sections }, resources };
}
