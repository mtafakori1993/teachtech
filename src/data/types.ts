export type Role = "student" | "instructor" | "admin";
export type Grade = "10" | "11" | "12" | "konkur" | "all";
export type Level = "beginner" | "intermediate" | "advanced";
export type CourseFormat = "recorded" | "live" | "hybrid" | "workshop";
export type Availability = "open" | "upcoming" | "full";
export type CourseStatus = "published" | "draft";
export type CoverArt =
  | "parabola" | "triangle" | "probability" | "graph" | "integral" | "circle"
  | "limit" | "sequence" | "conic" | "vector" | "matrix" | "sets" | "exam" | "numbers";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  grade?: Grade;
  city?: string;
  phone?: string;
  joinedAt: string;
  active: boolean;
}

export interface Instructor {
  id: string;
  userId: string;
  name: string;
  title: string;
  bio: string;
  areas: string[];
  active: boolean;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon key
}

export interface Lesson {
  id: string;
  title: string;
  durationMin: number;
  isPreview: boolean;
  summary: string;
  keyPoints: string[];
  formulas: string[]; // LaTeX
  videoSrc?: string;
  captionsSrc?: string;
  resourceIds: string[];
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Resource {
  id: string;
  courseId: string;
  title: string;
  kind: "جزوه" | "برگه تمرین" | "فرمول‌نامه" | "پاسخ‌نامه";
  sizeKB: number;
}

export interface CourseFaq { q: string; a: string }

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  grade: Grade;
  categoryId: string;
  level: Level;
  format: CourseFormat;
  availability: Availability;
  startsAt?: string;
  status: CourseStatus;
  instructorId: string;
  price: number; // toman, current price
  comparePrice?: number; // toman, price before discount
  outcomes: string[];
  prerequisites: string[];
  faq: CourseFaq[];
  sections: Section[];
  art: CoverArt;
  tags: string[];
  /** Sample (illustrative) social-proof numbers — never presented as verified. */
  sampleRating: number;
  sampleEnrolled: number;
  createdAt: string;
  certificate: boolean;
  certificateQuizId?: string;
  passPercent: number; // quiz score needed for certificate
}

export type QuestionType = "mcq" | "tf" | "short";
export interface Question {
  id: string;
  courseId: string;
  type: QuestionType;
  prompt: string; // may contain $latex$
  options?: string[]; // mcq
  correct: number | boolean | string[]; // index | value | accepted answers (normalized)
  explanation: string;
  points: number;
  topic: string;
  difficulty: Level;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  timeLimitMin: number | null;
  passPercent: number;
  maxAttempts: number | null; // null = unlimited
  practice: boolean; // practice mode reveals answers during the attempt
  questionIds: string[];
  opensAt?: string;
  dueAt?: string;
  published: boolean;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  source: "order" | "grant";
  orderId?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  courseId: string;
  userId: string;
  startedAt: string;
  submittedAt: string;
  answers: Record<string, string | number | boolean | null>;
  marked: string[];
  score: number; // earned points
  maxScore: number;
  percent: number;
  passed: boolean;
  timedOut: boolean;
}

export interface QuizDraft {
  quizId: string;
  userId: string;
  startedAt: string;
  answers: Record<string, string | number | boolean | null>;
  marked: string[];
  current: number;
}

export interface Note { id: string; userId: string; lessonId: string; courseId: string; text: string; at: string }
export interface Bookmark { id: string; userId: string; lessonId: string; courseId: string; atSec: number; label: string; at: string }
export interface LessonQA {
  id: string; userId: string; lessonId: string; courseId: string;
  question: string; at: string; answer?: string; answeredAt?: string;
}

export interface Assignment { id: string; courseId: string; title: string; prompt: string; dueAt: string; maxScore: number }
export interface Submission {
  id: string; assignmentId: string; courseId: string; userId: string; text: string; submittedAt: string;
  status: "pending" | "reviewed"; score?: number; feedback?: string; reviewedAt?: string;
}

export interface Discount {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number; // percent (1-100) or toman
  maxOff?: number; // toman cap for percent codes
  minSubtotal?: number; // toman
  courseIds?: string[]; // restrict to courses
  expiresAt?: string;
  active: boolean;
  usedCount: number;
  description: string;
}

export type OrderStatus = "paid" | "failed" | "cancelled" | "pending";
export interface OrderLine { courseId: string; title: string; unitPrice: number; listPrice: number }
export interface Order {
  id: string;
  number: string;
  userId: string;
  lines: OrderLine[];
  subtotal: number; // sum of unitPrice
  listTotal: number; // sum of listPrice (before course discounts)
  discountCode?: string;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  billing: { fullName: string; email: string; phone: string };
  simulated: true;
}

export interface Certificate {
  id: string; // public lookup id
  userId: string;
  courseId: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  academy: string;
  issuedAt: string;
  scorePercent: number;
  revoked: boolean;
}

export interface Announcement {
  id: string;
  courseId: string | null; // null = academy-wide
  title: string;
  body: string;
  at: string;
  authorId: string;
  pinned: boolean;
}

export interface AppNotification { id: string; userId: string; title: string; body: string; at: string; read: boolean; href?: string }
export interface StudyPlanItem { id: string; userId: string; title: string; weekday: number; time: string; courseId?: string; done: boolean }
export interface Goal { id: string; userId: string; title: string; target: number; progress: number; unit: string }
export interface ActivityEvent { id: string; userId: string; type: "lesson" | "quiz" | "purchase" | "note" | "certificate"; label: string; at: string; minutes: number; href?: string }

export interface Article {
  slug: string; title: string; excerpt: string; kind: "مقاله" | "راهنما" | "برگه کار"; readMin: number;
  publishedAt: string; body: { h?: string; p?: string; math?: string }[]; art: CoverArt; tags: string[];
}
export interface Testimonial { id: string; name: string; context: string; text: string }
export interface Faq { q: string; a: string; group: "general" | "buying" | "learning" | "technical" }

export interface Preferences { weeklyGoalMin: number; emailDigest: boolean; reminders: boolean; reduceMotion: boolean }
export interface HomepageContent {
  heroTitle: string; heroSubtitle: string; announcement: string; showAnnouncement: boolean; featuredCourseIds: string[];
}
export interface PlatformSettings {
  academyName: string; supportEmail: string; supportPhone: string; certificatePassPercent: number; allowRetakeAfterPass: boolean; maintenance: boolean;
}
