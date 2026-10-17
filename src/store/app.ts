"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildSeed, DEMO_ADMIN_ID, DEMO_INSTRUCTOR_ID, DEMO_STUDENT_ID, type SeedData } from "@/data/seed";
import type {
  Announcement, Assignment, Instructor, Certificate, Course, Discount, Goal, HomepageContent, Lesson, LessonQA, Order, OrderStatus,
  PlatformSettings, Preferences, Question, Quiz, QuizAttempt, QuizDraft, Resource, Role, Section, StudyPlanItem, Submission, User,
} from "@/data/types";
import { DATA_VERSION, STORAGE_KEY } from "@/lib/config";
import { safeLocalStorage } from "@/lib/storage";
import { checkDiscount, lineFromCourse, normalizeCode } from "@/lib/pricing";
import { placeOrder, type Billing, type PaymentOutcome, type PlaceResult } from "@/lib/checkout";
import { gradeQuiz, canStartQuiz, attemptsFor, type AnswerValue } from "@/lib/quiz";
import { certificateEligibility, makeCertificateId } from "@/lib/certificates";
import { quizQuestions } from "@/data/quizzes";

type DataKey = keyof SeedData;
const ARRAY_KEYS: DataKey[] = ["users", "instructors", "courses", "resources", "questions", "quizzes", "assignments", "submissions", "discounts", "orders", "enrollments", "attempts", "certificates", "announcements", "notifications", "studyPlan", "goals", "activity", "qa", "notes", "bookmarks"];
const OBJECT_KEYS: DataKey[] = ["completed", "homepage", "settings", "prefs"];

interface Local {
  v: number;
  sessionUserId: string | null;
  cart: string[];
  discountCode: string | null;
  drafts: Record<string, QuizDraft>;
  playback: Record<string, number>;
  saved: Record<string, string[]>;
  hydrated: boolean;
}

export const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();
const upsert = <T extends { id: string }>(list: T[], item: T) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);

export interface Actions {
  login(userId: string): void;
  logout(): void;
  switchRole(role: Role): void;
  addToCart(courseId: string): { ok: boolean; reason?: string };
  removeFromCart(courseId: string): void;
  clearCart(): void;
  applyDiscount(code: string): { ok: boolean; reason?: string };
  removeDiscount(): void;
  checkout(input: { billing: Billing; outcome: PaymentOutcome }): PlaceResult;
  toggleSaved(courseId: string): void;
  completeLesson(courseId: string, lessonId: string): void;
  uncompleteLesson(courseId: string, lessonId: string): void;
  setPlayback(lessonId: string, value: number): void;
  addNote(courseId: string, lessonId: string, text: string): void;
  deleteNote(id: string): void;
  addBookmark(courseId: string, lessonId: string, atSec: number, label: string): void;
  removeBookmark(id: string): void;
  askQuestion(courseId: string, lessonId: string, question: string): void;
  answerQuestion(id: string, answer: string): void;
  submitAssignment(assignmentId: string, text: string): void;
  reviewSubmission(id: string, score: number, feedback: string): void;
  startQuiz(quizId: string): { ok: boolean; reason?: string };
  saveDraft(quizId: string, patch: Partial<Pick<QuizDraft, "answers" | "marked" | "current">>): void;
  submitQuiz(quizId: string, timedOut?: boolean): QuizAttempt | null;
  discardDraft(quizId: string): void;
  issueCertificate(userId: string, courseId: string): { ok: boolean; reason?: string; certificate?: Certificate };
  revokeCertificate(id: string, revoked: boolean): void;
  markNotification(id: string, read: boolean): void;
  markAllNotifications(): void;
  setPrefs(p: Partial<Preferences>): void;
  updateProfile(userId: string, patch: Partial<Pick<User, "name" | "city" | "phone" | "grade" | "email">>): void;
  addStudyItem(item: Omit<StudyPlanItem, "id" | "userId" | "done">): void;
  toggleStudyItem(id: string): void;
  deleteStudyItem(id: string): void;
  addGoal(g: Omit<Goal, "id" | "userId" | "progress">): void;
  bumpGoal(id: string, delta: number): void;
  deleteGoal(id: string): void;
  // management
  upsertCourse(c: Course): void;
  setCourseStatus(id: string, status: Course["status"]): void;
  deleteCourse(id: string): void;
  upsertSection(courseId: string, s: Section): void;
  deleteSection(courseId: string, sectionId: string): void;
  upsertLesson(courseId: string, sectionId: string, l: Lesson): void;
  deleteLesson(courseId: string, lessonId: string): void;
  moveLesson(courseId: string, lessonId: string, dir: -1 | 1): void;
  addResource(r: Resource): void;
  deleteResource(id: string): void;
  upsertQuestion(q: Question): void;
  deleteQuestion(id: string): void;
  upsertQuiz(q: Quiz): void;
  deleteQuiz(id: string): void;
  upsertAssignment(a: Assignment): void;
  upsertAnnouncement(a: Announcement): void;
  deleteAnnouncement(id: string): void;
  upsertDiscount(d: Discount): void;
  deleteDiscount(id: string): void;
  upsertUser(u: User): void;
  upsertInstructor(i: Instructor): void;
  setUserActive(id: string, active: boolean): void;
  grantEnrollment(userId: string, courseId: string): { ok: boolean; reason?: string };
  revokeEnrollment(id: string): void;
  setOrderStatus(id: string, status: OrderStatus): void;
  setHomepage(h: Partial<HomepageContent>): void;
  setSettings(s: Partial<PlatformSettings>): void;
  resetAll(): void;
  markHydrated(): void;
}

export type AppStore = SeedData & Local & Actions;

const freshLocal = (): Local => ({ v: DATA_VERSION, sessionUserId: null, cart: [], discountCode: null, drafts: {}, playback: {}, saved: { [DEMO_STUDENT_ID]: ["c07", "c05"] }, hydrated: false });
const dataOf = (s: AppStore): SeedData => s as SeedData;

export const useApp = create<AppStore>()(
  persist(
    (set, get) => {
      const log = (e: Omit<import("@/data/types").ActivityEvent, "id" | "at">) =>
        set((s) => ({ activity: [{ ...e, id: uid("ac"), at: nowIso() }, ...s.activity].slice(0, 300) }));
      const notify = (userId: string, title: string, body: string, href?: string) =>
        set((s) => ({ notifications: [{ id: uid("nt"), userId, title, body, at: nowIso(), read: false, href }, ...s.notifications].slice(0, 200) }));
      const me = () => get().sessionUserId;
      const enrolled = (userId: string, courseId: string) => get().enrollments.some((e) => e.userId === userId && e.courseId === courseId);

      return {
        ...buildSeed(),
        ...freshLocal(),

        login: (userId) => {
          if (get().users.some((u) => u.id === userId && u.active)) set({ sessionUserId: userId });
        },
        logout: () => set({ sessionUserId: null }),
        switchRole: (role) => {
          const target = role === "student" ? DEMO_STUDENT_ID : role === "instructor" ? DEMO_INSTRUCTOR_ID : DEMO_ADMIN_ID;
          set({ sessionUserId: target });
        },

        addToCart: (courseId) => {
          const s = get();
          const c = s.courses.find((x) => x.id === courseId);
          if (!c || c.status !== "published") return { ok: false, reason: "این دوره در دسترس نیست." };
          if (c.availability === "full") return { ok: false, reason: "ظرفیت این دوره تکمیل شده است." };
          const u = me();
          if (u && enrolled(u, courseId)) return { ok: false, reason: "شما قبلاً در این دوره ثبت‌نام کرده‌اید." };
          if (s.cart.includes(courseId)) return { ok: false, reason: "این دوره از قبل در سبد خرید است." };
          set({ cart: [...s.cart, courseId] });
          return { ok: true };
        },
        removeFromCart: (courseId) => set((s) => ({ cart: s.cart.filter((x) => x !== courseId) })),
        clearCart: () => set({ cart: [], discountCode: null }),
        applyDiscount: (code) => {
          const s = get();
          const lines = s.cart.map((id) => s.courses.find((c) => c.id === id)).filter((c): c is Course => !!c).map(lineFromCourse);
          const r = checkDiscount(code, s.discounts, lines);
          if (!r.ok) return { ok: false, reason: r.reason };
          set({ discountCode: r.discount.code });
          return { ok: true };
        },
        removeDiscount: () => set({ discountCode: null }),

        checkout: ({ billing, outcome }) => {
          const s = get();
          const userId = s.sessionUserId;
          if (!userId) return { ok: false, reason: "برای ثبت سفارش ابتدا وارد حساب خود شوید." };
          const res = placeOrder(dataOf(s), { userId, courseIds: s.cart, discountCode: s.discountCode, billing, outcome });
          if (!res.ok) return res;
          set({ ...res.patch, ...(outcome === "success" ? { cart: [], discountCode: null } : {}) } as Partial<AppStore>);
          return res;
        },
        toggleSaved: (courseId) => {
          const u = me() ?? "guest";
          set((s) => {
            const cur = s.saved[u] ?? [];
            return { saved: { ...s.saved, [u]: cur.includes(courseId) ? cur.filter((x) => x !== courseId) : [...cur, courseId] } };
          });
        },

        completeLesson: (courseId, lessonId) => {
          const u = me();
          if (!u || !enrolled(u, courseId)) return;
          const key = `${u}:${courseId}`;
          const course = get().courses.find((c) => c.id === courseId);
          const lesson = course?.sections.flatMap((x) => x.lessons).find((l) => l.id === lessonId);
          if (!course || !lesson) return;
          const cur = get().completed[key] ?? [];
          if (cur.includes(lessonId)) return;
          set((s) => ({ completed: { ...s.completed, [key]: [...cur, lessonId] } }));
          log({ userId: u, type: "lesson", label: `درس «${lesson.title}» را به پایان رساندید`, minutes: lesson.durationMin, href: `/learn/${course.slug}` });
        },
        uncompleteLesson: (courseId, lessonId) => {
          const u = me();
          if (!u) return;
          const key = `${u}:${courseId}`;
          set((s) => ({ completed: { ...s.completed, [key]: (s.completed[key] ?? []).filter((x) => x !== lessonId) } }));
        },
        setPlayback: (lessonId, value) => {
          const u = me();
          if (!u) return;
          set((s) => ({ playback: { ...s.playback, [`${u}:${lessonId}`]: Math.max(0, Math.round(value * 10) / 10) } }));
        },

        addNote: (courseId, lessonId, text) => {
          const u = me(); const t = text.trim();
          if (!u || !t) return;
          set((s) => ({ notes: [{ id: uid("nn"), userId: u, courseId, lessonId, text: t.slice(0, 2000), at: nowIso() }, ...s.notes] }));
        },
        deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
        addBookmark: (courseId, lessonId, atSec, label) => {
          const u = me();
          if (!u) return;
          set((s) => ({ bookmarks: [{ id: uid("bk"), userId: u, courseId, lessonId, atSec: Math.round(atSec), label: label.trim().slice(0, 120) || "نشانه", at: nowIso() }, ...s.bookmarks] }));
        },
        removeBookmark: (id) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
        askQuestion: (courseId, lessonId, question) => {
          const u = me(); const q = question.trim();
          if (!u || !q) return;
          set((s) => ({ qa: [{ id: uid("qa"), userId: u, courseId, lessonId, question: q.slice(0, 1500), at: nowIso() }, ...s.qa] }));
        },
        answerQuestion: (id, answer) => {
          const a = answer.trim();
          if (!a) return;
          const q = get().qa.find((x) => x.id === id);
          set((s) => ({ qa: s.qa.map((x): LessonQA => (x.id === id ? { ...x, answer: a.slice(0, 3000), answeredAt: nowIso() } : x)) }));
          if (q) notify(q.userId, "مدرس به پرسش شما پاسخ داد", a.slice(0, 80), "/dashboard/courses");
        },

        submitAssignment: (assignmentId, text) => {
          const u = me(); const t = text.trim();
          const a = get().assignments.find((x) => x.id === assignmentId);
          if (!u || !a || !t) return;
          const sub: Submission = { id: uid("sub"), assignmentId, courseId: a.courseId, userId: u, text: t.slice(0, 5000), submittedAt: nowIso(), status: "pending" };
          set((s) => ({ submissions: [sub, ...s.submissions.filter((x) => !(x.assignmentId === assignmentId && x.userId === u))] }));
          notify(u, `تکلیف «${a.title}» ثبت شد`, "تکلیف شما برای بررسی نزد مدرس ثبت شده است.");
        },
        reviewSubmission: (id, score, feedback) => {
          const sub = get().submissions.find((x) => x.id === id);
          const a = sub && get().assignments.find((x) => x.id === sub.assignmentId);
          if (!sub || !a) return;
          const sc = Math.min(a.maxScore, Math.max(0, score));
          set((s) => ({ submissions: s.submissions.map((x): Submission => (x.id === id ? { ...x, status: "reviewed", score: sc, feedback: feedback.trim().slice(0, 2000), reviewedAt: nowIso() } : x)) }));
          notify(sub.userId, "مدرس به تکلیف شما نمره داد", `نمرهٔ تکلیف «${a.title}» ثبت شد: ${sc} از ${a.maxScore}.`, "/dashboard/courses");
        },

        startQuiz: (quizId) => {
          const s = get(); const u = s.sessionUserId;
          const quiz = s.quizzes.find((q) => q.id === quizId);
          if (!u || !quiz) return { ok: false, reason: "آزمون پیدا نشد." };
          if (!enrolled(u, quiz.courseId)) return { ok: false, reason: "برای شرکت در این آزمون باید در دوره ثبت‌نام کنید." };
          const key = `${u}:${quizId}`;
          if (s.drafts[key]) return { ok: true };
          const chk = canStartQuiz(quiz, attemptsFor(s.attempts, u, quizId), { allowRetakeAfterPass: s.settings.allowRetakeAfterPass });
          if (!chk.ok) return { ok: false, reason: chk.reason };
          set({ drafts: { ...s.drafts, [key]: { quizId, userId: u, startedAt: nowIso(), answers: {}, marked: [], current: 0 } } });
          return { ok: true };
        },
        saveDraft: (quizId, patch) => {
          const u = me();
          if (!u) return;
          const key = `${u}:${quizId}`;
          set((s) => (s.drafts[key] ? { drafts: { ...s.drafts, [key]: { ...s.drafts[key], ...patch } } } : {}));
        },
        discardDraft: (quizId) => {
          const u = me();
          if (!u) return;
          set((s) => { const d = { ...s.drafts }; delete d[`${u}:${quizId}`]; return { drafts: d }; });
        },
        submitQuiz: (quizId, timedOut = false) => {
          const s = get(); const u = s.sessionUserId;
          const quiz = s.quizzes.find((q) => q.id === quizId);
          const draft = u ? s.drafts[`${u}:${quizId}`] : undefined;
          if (!u || !quiz || !draft) return null;
          const qs = quizQuestions(quiz, s.questions);
          const g = gradeQuiz(quiz, qs, draft.answers as Record<string, AnswerValue>);
          const attempt: QuizAttempt = {
            id: uid("at"), quizId, courseId: quiz.courseId, userId: u, startedAt: draft.startedAt, submittedAt: nowIso(),
            answers: draft.answers, marked: draft.marked, score: g.score, maxScore: g.maxScore, percent: g.percent, passed: g.passed, timedOut,
          };
          const drafts = { ...s.drafts }; delete drafts[`${u}:${quizId}`];
          set({ attempts: [...s.attempts, attempt], drafts });
          log({ userId: u, type: "quiz", label: `در آزمون «${quiz.title}» شرکت کردید (${g.passed ? "قبول" : "مردود"})`, minutes: Math.max(1, Math.round((Date.now() - new Date(draft.startedAt).getTime()) / 60000)), href: "/dashboard/quizzes" });
          return attempt;
        },

        issueCertificate: (userId, courseId) => {
          const s = get();
          const course = s.courses.find((c) => c.id === courseId);
          const user = s.users.find((x) => x.id === userId);
          if (!course || !user) return { ok: false, reason: "اطلاعات دوره یا کاربر پیدا نشد." };
          const existing = s.certificates.find((c) => c.userId === userId && c.courseId === courseId && !c.revoked);
          if (existing) return { ok: true, certificate: existing };
          if (!s.enrollments.some((e) => e.userId === userId && e.courseId === courseId)) return { ok: false, reason: "کاربر در این دوره ثبت‌نام نکرده است." };
          const quiz = s.quizzes.find((q) => q.id === course.certificateQuizId);
          const el = certificateEligibility(course, s.completed[`${userId}:${courseId}`] ?? [], quiz, attemptsFor(s.attempts, userId, quiz?.id ?? ""));
          if (!el.eligible) return { ok: false, reason: el.reasons[0] ?? "شرایط صدور گواهی کامل نیست." };
          const instructorName = s.instructors.find((i) => i.id === course.instructorId)?.name ?? "امیر کاویان";
          const cert: Certificate = {
            id: makeCertificateId(`${userId}:${courseId}:${s.certificates.length}`), userId, courseId, studentName: user.name, courseTitle: course.title,
            instructorName, academy: s.settings.academyName, issuedAt: nowIso(), scorePercent: el.bestPercent ?? 0, revoked: false,
          };
          set({ certificates: [...s.certificates, cert] });
          log({ userId, type: "certificate", label: `گواهی «${course.title}» صادر شد`, minutes: 0, href: "/dashboard/certificates" });
          notify(userId, `گواهی «${course.title}» صادر شد`, "گواهی شما اکنون در بخش گواهی‌ها قابل مشاهده و چاپ است.", "/dashboard/certificates");
          return { ok: true, certificate: cert };
        },
        revokeCertificate: (id, revoked) => set((s) => ({ certificates: s.certificates.map((c) => (c.id === id ? { ...c, revoked } : c)) })),

        markNotification: (id, read) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read } : n)) })),
        markAllNotifications: () => { const u = me(); set((s) => ({ notifications: s.notifications.map((n) => (n.userId === u ? { ...n, read: true } : n)) })); },
        setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),
        updateProfile: (userId, patch) => set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)) })),
        addStudyItem: (item) => { const u = me(); if (u) set((s) => ({ studyPlan: [...s.studyPlan, { ...item, id: uid("sp"), userId: u, done: false }] })); },
        toggleStudyItem: (id) => set((s) => ({ studyPlan: s.studyPlan.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),
        deleteStudyItem: (id) => set((s) => ({ studyPlan: s.studyPlan.filter((i) => i.id !== id) })),
        addGoal: (g) => { const u = me(); if (u) set((s) => ({ goals: [...s.goals, { ...g, id: uid("g"), userId: u, progress: 0 }] })); },
        bumpGoal: (id, delta) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, progress: Math.min(g.target, Math.max(0, g.progress + delta)) } : g)) })),
        deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

        upsertCourse: (c) => set((s) => ({ courses: upsert(s.courses, c) })),
        setCourseStatus: (id, status) => set((s) => ({ courses: s.courses.map((c) => (c.id === id ? { ...c, status } : c)) })),
        deleteCourse: (id) => set((s) => ({
          courses: s.courses.filter((c) => c.id !== id), cart: s.cart.filter((x) => x !== id),
          quizzes: s.quizzes.filter((q) => q.courseId !== id), resources: s.resources.filter((r) => r.courseId !== id),
        })),
        upsertSection: (courseId, sec) => set((s) => ({ courses: s.courses.map((c) => (c.id === courseId ? { ...c, sections: upsert(c.sections, sec) } : c)) })),
        deleteSection: (courseId, sectionId) => set((s) => ({ courses: s.courses.map((c) => (c.id === courseId ? { ...c, sections: c.sections.filter((x) => x.id !== sectionId) } : c)) })),
        upsertLesson: (courseId, sectionId, l) => set((s) => ({
          courses: s.courses.map((c) => c.id !== courseId ? c : { ...c, sections: c.sections.map((sec) => sec.id !== sectionId ? sec : { ...sec, lessons: upsert(sec.lessons, l) }) }),
        })),
        deleteLesson: (courseId, lessonId) => set((s) => ({
          courses: s.courses.map((c) => c.id !== courseId ? c : { ...c, sections: c.sections.map((sec) => ({ ...sec, lessons: sec.lessons.filter((l) => l.id !== lessonId) })) }),
        })),
        moveLesson: (courseId, lessonId, dir) => set((s) => ({
          courses: s.courses.map((c) => c.id !== courseId ? c : {
            ...c, sections: c.sections.map((sec) => {
              const i = sec.lessons.findIndex((l) => l.id === lessonId);
              const j = i + dir;
              if (i < 0 || j < 0 || j >= sec.lessons.length) return sec;
              const lessons = [...sec.lessons]; [lessons[i], lessons[j]] = [lessons[j], lessons[i]];
              return { ...sec, lessons };
            }),
          }),
        })),
        addResource: (r) => set((s) => ({ resources: upsert(s.resources, r) })),
        deleteResource: (id) => set((s) => ({
          resources: s.resources.filter((r) => r.id !== id),
          courses: s.courses.map((c) => ({ ...c, sections: c.sections.map((sec) => ({ ...sec, lessons: sec.lessons.map((l) => ({ ...l, resourceIds: l.resourceIds.filter((x) => x !== id) })) })) })),
        })),
        upsertQuestion: (q) => set((s) => ({ questions: upsert(s.questions, q) })),
        deleteQuestion: (id) => set((s) => ({ questions: s.questions.filter((q) => q.id !== id), quizzes: s.quizzes.map((z) => ({ ...z, questionIds: z.questionIds.filter((x) => x !== id) })) })),
        upsertQuiz: (q) => set((s) => ({ quizzes: upsert(s.quizzes, q) })),
        deleteQuiz: (id) => set((s) => ({ quizzes: s.quizzes.filter((q) => q.id !== id), courses: s.courses.map((c) => (c.certificateQuizId === id ? { ...c, certificateQuizId: undefined } : c)) })),
        upsertAssignment: (a) => set((s) => ({ assignments: upsert(s.assignments, a) })),
        upsertAnnouncement: (a) => set((s) => ({ announcements: upsert(s.announcements, a) })),
        deleteAnnouncement: (id) => set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) })),
        upsertDiscount: (d) => set((s) => ({ discounts: upsert(s.discounts, { ...d, code: normalizeCode(d.code) }) })),
        deleteDiscount: (id) => set((s) => ({ discounts: s.discounts.filter((d) => d.id !== id) })),
        upsertUser: (u) => set((s) => ({ users: upsert(s.users, u) })),
        upsertInstructor: (i) => set((s) => ({ instructors: upsert(s.instructors, i) })),
        setUserActive: (id, active) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, active } : u)) })),
        grantEnrollment: (userId, courseId) => {
          const s = get();
          if (s.enrollments.some((e) => e.userId === userId && e.courseId === courseId)) return { ok: false, reason: "این کاربر قبلاً ثبت‌نام شده است." };
          if (!s.courses.some((c) => c.id === courseId) || !s.users.some((u) => u.id === userId)) return { ok: false, reason: "کاربر یا دوره پیدا نشد." };
          set({ enrollments: [...s.enrollments, { id: `en-${userId}-${courseId}`, userId, courseId, enrolledAt: nowIso(), source: "grant" }] });
          return { ok: true };
        },
        revokeEnrollment: (id) => set((s) => ({ enrollments: s.enrollments.filter((e) => e.id !== id) })),
        setOrderStatus: (id, status) => set((s) => ({ orders: s.orders.map((o): Order => (o.id === id ? { ...o, status } : o)) })),
        setHomepage: (h) => set((s) => ({ homepage: { ...s.homepage, ...h } })),
        setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

        resetAll: () => set({ ...buildSeed(), ...freshLocal(), hydrated: true }),
        markHydrated: () => set({ hydrated: true }),
      };
    },
    {
      name: STORAGE_KEY,
      version: DATA_VERSION,
      storage: createJSONStorage(() => safeLocalStorage),
      skipHydration: true, // rehydrated after mount so the first client render matches the server render
      partialize: (s) => {
        const { hydrated: _h, ...rest } = s;
        void _h;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function"));
      },
      migrate: () => ({}) as never, // older data versions are discarded safely and replaced by the seed
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== "object") return current;
        const p = persisted as Record<string, unknown>;
        if (p.v !== DATA_VERSION) return current;
        const next: Record<string, unknown> = { ...current };
        for (const k of ARRAY_KEYS) if (Array.isArray(p[k])) next[k] = p[k];
        for (const k of OBJECT_KEYS) if (p[k] && typeof p[k] === "object" && !Array.isArray(p[k])) next[k] = { ...((current as unknown as Record<string, object>)[k]), ...(p[k] as object) };
        for (const k of ["drafts", "playback", "saved"] as const) if (p[k] && typeof p[k] === "object" && !Array.isArray(p[k])) next[k] = p[k];
        if (Array.isArray(p.cart)) next.cart = (p.cart as unknown[]).filter((x): x is string => typeof x === "string");
        next.sessionUserId = typeof p.sessionUserId === "string" && (next.users as User[]).some((u) => u.id === p.sessionUserId && u.active) ? p.sessionUserId : null;
        next.discountCode = typeof p.discountCode === "string" ? p.discountCode : null;
        return next as unknown as AppStore;
      },
    },
  ),
);

// ---- selectors / hooks --------------------------------------------------------------------------------------------
export const useHydrated = () => useApp((s) => s.hydrated);
export const useSessionUser = (): User | null => useApp((s) => (s.sessionUserId ? s.users.find((u) => u.id === s.sessionUserId) ?? null : null));
