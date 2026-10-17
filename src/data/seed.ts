import { buildCourse } from "./builder";
import { COURSES_A } from "./courses-a";
import { COURSES_B } from "./courses-b";
import { QUESTIONS, QUIZZES, quizQuestions } from "./quizzes";
import { CATEGORIES, INSTRUCTORS } from "./catalog";
import type {
  ActivityEvent, Announcement, Instructor, AppNotification, Assignment, Bookmark, Certificate, Course, Discount, Enrollment, Goal, HomepageContent,
  LessonQA, Note, Order, PlatformSettings, Preferences, Question, Quiz, QuizAttempt, Resource, StudyPlanItem, Submission, User,
} from "./types";
import { gradeQuiz } from "@/lib/quiz";
import { allLessons } from "@/lib/progress";
import { lineFromCourse, makeOrder } from "@/lib/pricing";
import { makeCertificateId } from "@/lib/certificates";

export const DEMO_STUDENT_ID = "u-sara";
export const DEMO_INSTRUCTOR_ID = "u-amir";
export const DEMO_ADMIN_ID = "u-admin";

export interface SeedData {
  users: User[];
  instructors: Instructor[];
  courses: Course[];
  resources: Resource[];
  questions: Question[];
  quizzes: Quiz[];
  assignments: Assignment[];
  submissions: Submission[];
  discounts: Discount[];
  orders: Order[];
  enrollments: Enrollment[];
  completed: Record<string, string[]>; // `${userId}:${courseId}` → lesson ids
  attempts: QuizAttempt[];
  certificates: Certificate[];
  announcements: Announcement[];
  notifications: AppNotification[];
  studyPlan: StudyPlanItem[];
  goals: Goal[];
  activity: ActivityEvent[];
  qa: LessonQA[];
  notes: Note[];
  bookmarks: Bookmark[];
  homepage: HomepageContent;
  settings: PlatformSettings;
  prefs: Preferences;
}

const T = (d: string) => `${d}+03:30`;

const USERS: User[] = [
  { id: DEMO_STUDENT_ID, name: "سارا موسوی", email: "student@teachtech.example", role: "student", grade: "11", city: "تهران", phone: "09120000001", joinedAt: T("2026-08-10T10:00:00"), active: true },
  { id: DEMO_INSTRUCTOR_ID, name: "امیر کاویان", email: "instructor@teachtech.example", role: "instructor", city: "تهران", joinedAt: T("2026-02-01T09:00:00"), active: true },
  { id: DEMO_ADMIN_ID, name: "مدیریت آموزشگاه کاویان", email: "admin@teachtech.example", role: "admin", city: "تهران", joinedAt: T("2026-02-01T09:00:00"), active: true },
  { id: "u-parsa", name: "پارسا رضایی", email: "parsa@teachtech.example", role: "student", grade: "12", city: "اصفهان", phone: "09120000002", joinedAt: T("2026-06-14T10:00:00"), active: true },
  { id: "u-mahsa", name: "مهسا کریمی", email: "mahsa@teachtech.example", role: "student", grade: "10", city: "شیراز", phone: "09120000003", joinedAt: T("2026-07-02T10:00:00"), active: true },
  { id: "u-arian", name: "آرین صادقی", email: "arian@teachtech.example", role: "student", grade: "12", city: "مشهد", phone: "09120000004", joinedAt: T("2026-07-21T10:00:00"), active: true },
  { id: "u-negar", name: "نگار حیدری", email: "negar@teachtech.example", role: "student", grade: "11", city: "تبریز", phone: "09120000005", joinedAt: T("2026-08-02T10:00:00"), active: true },
  { id: "u-kian", name: "کیان فرهادی", email: "kian@teachtech.example", role: "student", grade: "konkur", city: "کرج", phone: "09120000006", joinedAt: T("2026-08-19T10:00:00"), active: true },
  { id: "u-elina", name: "الینا رحیمی", email: "elina@teachtech.example", role: "student", grade: "10", city: "رشت", phone: "09120000007", joinedAt: T("2026-09-05T10:00:00"), active: true },
  { id: "u-behrad", name: "بهراد نادری", email: "behrad@teachtech.example", role: "student", grade: "12", city: "تهران", phone: "09120000008", joinedAt: T("2026-09-11T10:00:00"), active: true },
  { id: "u-helia", name: "هلیا شریفی", email: "helia@teachtech.example", role: "student", grade: "11", city: "قم", phone: "09120000009", joinedAt: T("2026-09-24T10:00:00"), active: false },
  { id: "u-sina", name: "سینا امیری", email: "sina@teachtech.example", role: "student", grade: "12", city: "اهواز", phone: "09120000010", joinedAt: T("2026-10-03T10:00:00"), active: true },
];

const DISCOUNTS: Discount[] = [
  { id: "d1", code: "TEACH10", kind: "percent", value: 10, maxOff: 250000, active: true, usedCount: 4, description: "۱۰٪ تخفیف روی کل سبد (حداکثر ۲۵۰٬۰۰۰ تومان)" },
  { id: "d2", code: "KAVIAN20", kind: "percent", value: 20, maxOff: 600000, minSubtotal: 1000000, courseIds: ["c07", "c10", "c11", "c13"], active: true, usedCount: 2, description: "۲۰٪ تخفیف روی دوره‌های امتحان نهایی، کنکور و حسابان دوازدهم (حداقل سفارش ۱٬۰۰۰٬۰۰۰ تومان)" },
  { id: "d3", code: "WELCOME50", kind: "fixed", value: 50000, minSubtotal: 500000, active: true, usedCount: 7, description: "۵۰٬۰۰۰ تومان تخفیف ثابت برای سفارش‌های بالای ۵۰۰٬۰۰۰ تومان" },
  { id: "d4", code: "NOWRUZ", kind: "percent", value: 25, expiresAt: T("2026-04-01T00:00:00"), active: true, usedCount: 11, description: "کد فصلی که مهلتش به پایان رسیده است" },
  { id: "d5", code: "STUDENT15", kind: "percent", value: 15, active: false, usedCount: 0, description: "کد غیرفعال (برای نمایش وضعیت)" },
];

const ASSIGNMENTS: Assignment[] = [
  { id: "as-c03-1", courseId: "c03", title: "تحلیل نوشتاری: چرا لگاریتم وارون نمایی است؟", prompt: "در یک پاراگراف توضیح دهید چرا نمودار $y=\\log_2 x$ قرینهٔ نمودار $y=2^x$ نسبت به خط $y=x$ است.", dueAt: T("2026-11-01T23:00:00"), maxScore: 10 },
  { id: "as-c07-1", courseId: "c07", title: "یک مسئلهٔ بهینه‌سازی را مدل‌سازی کنید", prompt: "از یک ورق مقوایی مربع‌شکل به ضلع ۶۰ سانتی‌متر، با بریدن چهار مربع کوچک از گوشه‌ها جعبه‌ای بدون سرپوش بسازید. تابع حجم را بنویسید و بیشینهٔ آن را بیابید.", dueAt: T("2026-11-10T23:00:00"), maxScore: 20 },
  { id: "as-c06-1", courseId: "c06", title: "اثبات اتحاد مثلثاتی", prompt: "ثابت کنید $\\tan^2\\theta+1=\\dfrac{1}{\\cos^2\\theta}$ و مراحل را توضیح دهید.", dueAt: T("2026-10-30T23:00:00"), maxScore: 10 },
];

const SUBMISSIONS: Submission[] = [
  { id: "sub-1", assignmentId: "as-c03-1", courseId: "c03", userId: DEMO_STUDENT_ID, text: "اگر $y=2^x$ باشد، با عوض کردن جای $x$ و $y$ به $x=2^y$ می‌رسیم که یعنی $y=\\log_2 x$. جابه‌جایی مختصات یعنی بازتاب نسبت به $y=x$؛ پس نمودارها قرینه‌اند.", submittedAt: T("2026-10-12T20:15:00"), status: "pending" },
  { id: "sub-2", assignmentId: "as-c06-1", courseId: "c06", userId: DEMO_STUDENT_ID, text: "از اتحاد $\\sin^2\\theta+\\cos^2\\theta=1$ شروع می‌کنم و دو طرف را بر $\\cos^2\\theta$ تقسیم می‌کنم؛ می‌شود $\\tan^2\\theta+1=\\frac{1}{\\cos^2\\theta}$.", submittedAt: T("2026-10-08T18:40:00"), status: "reviewed", score: 9, feedback: "استدلال کاملاً درست است. فقط شرط $\\cos\\theta\\neq0$ را هم ذکر کنید.", reviewedAt: T("2026-10-09T10:00:00") },
  { id: "sub-3", assignmentId: "as-c07-1", courseId: "c07", userId: "u-parsa", text: "ضلع مربع‌های بریده‌شده را x می‌گیرم؛ حجم $V(x)=x(60-2x)^2$ و با مشتق $V'(x)=(60-2x)(60-6x)$ به x=10 می‌رسم.", submittedAt: T("2026-10-14T21:05:00"), status: "pending" },
  { id: "sub-4", assignmentId: "as-c07-1", courseId: "c07", userId: "u-arian", text: "حجم را $V=x(60-2x)^2$ نوشتم و $x=10$ را به‌عنوان نقطهٔ بیشینه یافتم؛ بیشینهٔ حجم ۱۶۰۰۰ سانتی‌متر مکعب است.", submittedAt: T("2026-10-15T11:20:00"), status: "pending" },
];

const ENROLL = (userId: string, courseId: string, at: string): Enrollment => ({ id: `en-${userId}-${courseId}`, userId, courseId, enrolledAt: T(at), source: "order" });

export function buildSeed(): SeedData {
  const built = [...COURSES_A, ...COURSES_B].map(buildCourse);
  const courses = built.map((b) => b.course);
  const resources = built.flatMap((b) => b.resources);
  const byId = (id: string) => courses.find((c) => c.id === id)!;
  const quizzes = QUIZZES;
  const questions = QUESTIONS;
  const lessonIds = (cid: string, n?: number) => allLessons(byId(cid)).slice(0, n).map((l) => l.id);

  // ----- enrollments & progress (primary demo student has a deliberately varied picture)
  const enrollments: Enrollment[] = [
    ENROLL(DEMO_STUDENT_ID, "c03", "2026-08-12T11:00:00"),
    ENROLL(DEMO_STUDENT_ID, "c06", "2026-09-03T14:30:00"),
    ENROLL(DEMO_STUDENT_ID, "c10", "2026-09-20T09:10:00"),
    ENROLL(DEMO_STUDENT_ID, "c14", "2026-10-02T19:45:00"),
    ENROLL("u-parsa", "c07", "2026-07-01T12:00:00"), ENROLL("u-parsa", "c10", "2026-08-05T12:00:00"), ENROLL("u-parsa", "c13", "2026-09-12T12:00:00"),
    ENROLL("u-mahsa", "c01", "2026-07-04T12:00:00"), ENROLL("u-mahsa", "c02", "2026-07-04T12:00:00"),
    ENROLL("u-arian", "c07", "2026-07-25T12:00:00"), ENROLL("u-arian", "c08", "2026-08-01T12:00:00"), ENROLL("u-arian", "c10", "2026-08-30T12:00:00"),
    ENROLL("u-negar", "c03", "2026-08-06T12:00:00"), ENROLL("u-negar", "c04", "2026-08-06T12:00:00"),
    ENROLL("u-kian", "c11", "2026-09-01T12:00:00"), ENROLL("u-kian", "c07", "2026-08-22T12:00:00"),
    ENROLL("u-elina", "c01", "2026-09-07T12:00:00"), ENROLL("u-behrad", "c10", "2026-09-15T12:00:00"), ENROLL("u-behrad", "c09", "2026-09-15T12:00:00"),
    ENROLL("u-sina", "c15", "2026-10-04T12:00:00"),
  ];
  const completed: Record<string, string[]> = {
    [`${DEMO_STUDENT_ID}:c03`]: lessonIds("c03", 6),
    [`${DEMO_STUDENT_ID}:c06`]: lessonIds("c06", 3),
    [`${DEMO_STUDENT_ID}:c10`]: lessonIds("c10"),
    [`${DEMO_STUDENT_ID}:c14`]: lessonIds("c14", 2),
    "u-parsa:c07": lessonIds("c07", 5), "u-parsa:c10": lessonIds("c10"), "u-parsa:c13": lessonIds("c13", 1),
    "u-mahsa:c01": lessonIds("c01", 4), "u-mahsa:c02": lessonIds("c02", 2),
    "u-arian:c07": lessonIds("c07"), "u-arian:c08": lessonIds("c08", 3), "u-arian:c10": lessonIds("c10", 4),
    "u-negar:c03": lessonIds("c03", 2), "u-negar:c04": lessonIds("c04", 5),
    "u-kian:c07": lessonIds("c07", 2), "u-elina:c01": lessonIds("c01", 1), "u-behrad:c10": lessonIds("c10", 3), "u-behrad:c09": lessonIds("c09", 6),
    "u-sina:c15": lessonIds("c15", 1),
  };

  // ----- quiz attempts: grades are computed from the data, never hand-entered
  const mkAttempt = (id: string, userId: string, quizId: string, at: string, answers: Record<string, string | number | boolean | null>): QuizAttempt => {
    const quiz = quizzes.find((q) => q.id === quizId)!;
    const g = gradeQuiz(quiz, quizQuestions(quiz, questions), answers);
    return { id, quizId, courseId: quiz.courseId, userId, startedAt: T(at), submittedAt: new Date(new Date(T(at)).getTime() + 7 * 60000).toISOString(), answers, marked: [], score: g.score, maxScore: g.maxScore, percent: g.percent, passed: g.passed, timedOut: false };
  };
  const attempts: QuizAttempt[] = [
    mkAttempt("at-1", DEMO_STUDENT_ID, "q-c10-final", "2026-10-05T20:10:00", { "c10-1": "5", "c10-2": 1, "c10-3": true, "c10-4": 0 }),
    mkAttempt("at-2", DEMO_STUDENT_ID, "q-c14-final", "2026-10-09T21:00:00", { "c14-1": "5", "c14-2": true, "c14-3": 1, "c14-4": 0 }),
    mkAttempt("at-3", "u-parsa", "q-c10-final", "2026-09-10T20:00:00", { "c10-1": "5", "c10-2": 1, "c10-3": true, "c10-4": 1 }),
    mkAttempt("at-4", "u-arian", "q-c07-final", "2026-10-12T19:00:00", { "c07-1": "12", "c07-2": 2, "c07-3": false, "c07-4": 1 }),
    mkAttempt("at-5", "u-mahsa", "q-c01-practice", "2026-09-28T17:30:00", { "c01-1": 2, "c01-3": true, "c01-4": "4" }),
  ];

  const certificates: Certificate[] = [
    { id: makeCertificateId("u-sara:c10"), userId: DEMO_STUDENT_ID, courseId: "c10", studentName: "سارا موسوی", courseTitle: byId("c10").title, instructorName: "امیر کاویان", academy: "آموزشگاه کاویان", issuedAt: T("2026-10-05T20:30:00"), scorePercent: attempts[0].percent, revoked: false },
    { id: makeCertificateId("u-parsa:c10"), userId: "u-parsa", courseId: "c10", studentName: "پارسا رضایی", courseTitle: byId("c10").title, instructorName: "امیر کاویان", academy: "آموزشگاه کاویان", issuedAt: T("2026-09-10T20:30:00"), scorePercent: attempts[2].percent, revoked: false },
  ];

  // ----- orders: totals come from the same pricing code the cart uses
  const bill = (id: string) => { const u = USERS.find((x) => x.id === id)!; return { fullName: u.name, email: u.email, phone: u.phone ?? "" }; };
  const L = (...ids: string[]) => ids.map((i) => lineFromCourse(byId(i)));
  const D = (code: string) => DISCOUNTS.find((d) => d.code === code)!;
  const orders: Order[] = [
    makeOrder({ id: "o-1001", number: "TT-10001", userId: DEMO_STUDENT_ID, lines: L("c03"), status: "paid", createdAt: T("2026-08-12T11:00:00"), billing: bill(DEMO_STUDENT_ID) }),
    makeOrder({ id: "o-1002", number: "TT-10002", userId: DEMO_STUDENT_ID, lines: L("c06"), discount: D("TEACH10"), status: "paid", createdAt: T("2026-09-03T14:30:00"), billing: bill(DEMO_STUDENT_ID) }),
    makeOrder({ id: "o-1003", number: "TT-10003", userId: DEMO_STUDENT_ID, lines: L("c10", "c14"), discount: D("KAVIAN20"), status: "paid", createdAt: T("2026-09-20T09:10:00"), billing: bill(DEMO_STUDENT_ID) }),
    makeOrder({ id: "o-1004", number: "TT-10004", userId: DEMO_STUDENT_ID, lines: L("c05"), status: "failed", createdAt: T("2026-10-06T13:00:00"), billing: bill(DEMO_STUDENT_ID) }),
    makeOrder({ id: "o-1005", number: "TT-10005", userId: "u-parsa", lines: L("c07", "c10", "c13"), discount: D("KAVIAN20"), status: "paid", createdAt: T("2026-07-01T12:00:00"), billing: bill("u-parsa") }),
    makeOrder({ id: "o-1006", number: "TT-10006", userId: "u-mahsa", lines: L("c01", "c02"), discount: D("WELCOME50"), status: "paid", createdAt: T("2026-07-04T12:00:00"), billing: bill("u-mahsa") }),
    makeOrder({ id: "o-1007", number: "TT-10007", userId: "u-arian", lines: L("c07", "c08", "c10"), status: "paid", createdAt: T("2026-07-25T12:00:00"), billing: bill("u-arian") }),
    makeOrder({ id: "o-1008", number: "TT-10008", userId: "u-negar", lines: L("c03", "c04"), discount: D("TEACH10"), status: "paid", createdAt: T("2026-08-06T12:00:00"), billing: bill("u-negar") }),
    makeOrder({ id: "o-1009", number: "TT-10009", userId: "u-kian", lines: L("c11", "c07"), discount: D("KAVIAN20"), status: "paid", createdAt: T("2026-08-22T12:00:00"), billing: bill("u-kian") }),
    makeOrder({ id: "o-1010", number: "TT-10010", userId: "u-elina", lines: L("c01"), status: "paid", createdAt: T("2026-09-07T12:00:00"), billing: bill("u-elina") }),
    makeOrder({ id: "o-1011", number: "TT-10011", userId: "u-behrad", lines: L("c10", "c09"), discount: D("TEACH10"), status: "paid", createdAt: T("2026-09-15T12:00:00"), billing: bill("u-behrad") }),
    makeOrder({ id: "o-1012", number: "TT-10012", userId: "u-sina", lines: L("c15"), status: "paid", createdAt: T("2026-10-04T12:00:00"), billing: bill("u-sina") }),
    makeOrder({ id: "o-1013", number: "TT-10013", userId: "u-helia", lines: L("c12"), status: "cancelled", createdAt: T("2026-10-09T12:00:00"), billing: bill("u-helia") }),
  ];

  const announcements: Announcement[] = [
    { id: "an-1", courseId: null, title: "شروع ثبت‌نام دورهٔ کنکور دور اول", body: "ثبت‌نام دورهٔ «آمادگی کنکور ریاضی: دور اول» باز شده و جلسهٔ اول روز ۳۰ آبان برگزار می‌شود.", at: T("2026-10-14T10:00:00"), authorId: DEMO_ADMIN_ID, pinned: true },
    { id: "an-2", courseId: "c07", title: "برگهٔ تمرین بهینه‌سازی منتشر شد", body: "برگهٔ تمرین فصل کاربرد مشتق در بخش منابع درس‌ها قرار گرفت. مهلت ارسال تکلیف تا ۱۹ آبان است.", at: T("2026-10-15T12:00:00"), authorId: DEMO_INSTRUCTOR_ID, pinned: false },
    { id: "an-3", courseId: "c03", title: "پرسش و پاسخ هفتگی لگاریتم", body: "پاسخ سؤال‌های پرتکرار لگاریتم در بخش پرسش و پاسخ درس «معادلهٔ لگاریتمی» جمع‌بندی شد.", at: T("2026-10-11T09:30:00"), authorId: DEMO_INSTRUCTOR_ID, pinned: false },
    { id: "an-4", courseId: "c10", title: "نمونه امتحان ۲ اضافه شد", body: "جلسهٔ حل نمونه امتحان ۲ به دورهٔ آمادگی امتحانات نهایی افزوده شد.", at: T("2026-10-02T09:00:00"), authorId: DEMO_INSTRUCTOR_ID, pinned: false },
  ];

  const notifications: AppNotification[] = [
    { id: "nt-1", userId: DEMO_STUDENT_ID, title: "تکلیف «تحلیل نوشتاری لگاریتم» ثبت شد", body: "تکلیف شما برای بررسی نزد مدرس ثبت شده است.", at: T("2026-10-12T20:16:00"), read: false, href: "/dashboard/courses" },
    { id: "nt-2", userId: DEMO_STUDENT_ID, title: "گواهی «آمادگی امتحانات نهایی» صادر شد", body: "گواهی شما اکنون در بخش گواهی‌ها قابل مشاهده است.", at: T("2026-10-05T20:31:00"), read: true, href: "/dashboard/certificates" },
    { id: "nt-3", userId: DEMO_STUDENT_ID, title: "مدرس به تکلیف شما نمره داد", body: "نمرهٔ تکلیف «اثبات اتحاد مثلثاتی» ثبت شد: ۹ از ۱۰.", at: T("2026-10-09T10:01:00"), read: false, href: "/dashboard/courses" },
    { id: "nt-4", userId: DEMO_STUDENT_ID, title: "آزمون پایانی حد و پیوستگی منتظر شماست", body: "نتیجهٔ تلاش قبلی شما قبولی نبود؛ می‌توانید دوباره شرکت کنید.", at: T("2026-10-09T21:12:00"), read: true, href: "/dashboard/quizzes" },
  ];

  const studyPlan: StudyPlanItem[] = [
    { id: "sp-1", userId: DEMO_STUDENT_ID, title: "ادامهٔ حسابان یازدهم", weekday: 0, time: "17:00", courseId: "c06", done: false },
    { id: "sp-2", userId: DEMO_STUDENT_ID, title: "مرور درس‌های لگاریتم", weekday: 2, time: "18:30", courseId: "c03", done: false },
    { id: "sp-3", userId: DEMO_STUDENT_ID, title: "حل تمرین حد و پیوستگی", weekday: 4, time: "16:00", courseId: "c14", done: false },
    { id: "sp-4", userId: DEMO_STUDENT_ID, title: "مرور هفتگی و جمع‌بندی", weekday: 5, time: "10:00", done: false },
  ];
  const goals: Goal[] = [
    { id: "g-1", userId: DEMO_STUDENT_ID, title: "پایان دورهٔ ریاضی یازدهم تا پایان آبان", target: 8, progress: 6, unit: "درس" },
    { id: "g-2", userId: DEMO_STUDENT_ID, title: "قبولی در آزمون حد و پیوستگی", target: 1, progress: 0, unit: "آزمون" },
  ];
  const act = (id: string, type: ActivityEvent["type"], label: string, at: string, minutes: number, href?: string): ActivityEvent => ({ id, userId: DEMO_STUDENT_ID, type, label, at: T(at), minutes, href });
  const activity: ActivityEvent[] = [
    act("ac-1", "lesson", "درس «مفهوم شهودی حد» را به پایان رساندید", "2026-10-16T19:30:00", 17, "/learn/math-11-functions-limits"),
    act("ac-2", "lesson", "درس «وارون و تبدیل نمودارها» را به پایان رساندید", "2026-10-15T18:10:00", 19, "/learn/calculus-11-functions-trig"),
    act("ac-3", "quiz", "در آزمون «حد و پیوستگی» شرکت کردید", "2026-10-09T21:07:00", 7, "/dashboard/quizzes"),
    act("ac-4", "lesson", "درس «جدول و نمودار حد» را مرور کردید", "2026-10-13T20:00:00", 16, "/learn/limit-continuity-from-scratch"),
    act("ac-5", "certificate", "گواهی «آمادگی امتحانات نهایی» صادر شد", "2026-10-05T20:30:00", 0, "/dashboard/certificates"),
    act("ac-6", "lesson", "درس «لگاریتم و قوانین آن» را به پایان رساندید", "2026-10-14T17:20:00", 20, "/learn/math-11-functions-limits"),
    act("ac-7", "lesson", "درس «تابع نمایی و ویژگی‌ها» را به پایان رساندید", "2026-10-12T16:30:00", 16, "/learn/math-11-functions-limits"),
    act("ac-8", "purchase", "سفارش TT-10003 را ثبت کردید", "2026-09-20T09:10:00", 0, "/order/o-1003"),
  ];

  const qa: LessonQA[] = [
    { id: "qa-1", userId: DEMO_STUDENT_ID, lessonId: "c03-l5", courseId: "c03", question: "چرا در معادلهٔ لگاریتمی باید جواب‌ها را در دامنه بررسی کنیم؟", at: T("2026-10-10T18:00:00"), answer: "چون ممکن است پس از ساده‌سازی جوابی به دست بیاید که آرگومان لگاریتم را منفی یا صفر کند؛ چنین جوابی قابل قبول نیست.", answeredAt: T("2026-10-11T09:00:00") },
    { id: "qa-2", userId: "u-negar", lessonId: "c03-l5", courseId: "c03", question: "تغییر مبنا را کی باید استفاده کنیم؟", at: T("2026-10-12T14:00:00") },
  ];
  const notes: Note[] = [{ id: "nn-1", userId: DEMO_STUDENT_ID, lessonId: "c03-l5", courseId: "c03", text: "یادم بماند: همیشه دامنه را بعد از حل بررسی کنم.", at: T("2026-10-10T18:20:00") }];
  const bookmarks: Bookmark[] = [{ id: "bk-1", userId: DEMO_STUDENT_ID, lessonId: "c03-l1", courseId: "c03", atSec: 6, label: "نمایش نمونهٔ پخش‌کننده", at: T("2026-10-10T18:30:00") }];

  return {
    users: USERS, instructors: INSTRUCTORS.map((i) => ({ ...i })), courses, resources, questions, quizzes, assignments: ASSIGNMENTS, submissions: SUBMISSIONS, discounts: DISCOUNTS,
    orders, enrollments, completed, attempts, certificates, announcements, notifications, studyPlan, goals, activity, qa, notes, bookmarks,
    homepage: {
      heroTitle: "ریاضی را بفهمید، نه فقط حفظ کنید",
      heroSubtitle: "دوره‌های ریاضی دبیرستان با تدریس آقای امیر کاویان؛ ویدیو، آزمون تعاملی و گواهی پایان دوره در یک‌جا.",
      announcement: "ثبت‌نام دورهٔ آمادگی کنکور ریاضی (دور اول) باز است.",
      showAnnouncement: true,
      featuredCourseIds: ["c07", "c10", "c03", "c14"],
    },
    settings: { academyName: "آموزشگاه کاویان", supportEmail: "support@teachtech.example", supportPhone: "۰۲۱-۰۰۰۰۰۰۰۰", certificatePassPercent: 60, allowRetakeAfterPass: false, maintenance: false },
    prefs: { weeklyGoalMin: 180, emailDigest: true, reminders: true, reduceMotion: false },
  };
}

export { CATEGORIES, INSTRUCTORS };
