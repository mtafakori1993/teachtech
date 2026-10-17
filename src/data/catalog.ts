import type { Category, Instructor } from "./types";

export const CATEGORIES: Category[] = [
  { id: "cat-10", title: "ریاضی دهم", description: "مجموعه، دنباله، معادله، تابع و آمار", icon: "Sigma" },
  { id: "cat-11", title: "ریاضی یازدهم", description: "تابع، لگاریتم، حد و مثلثات", icon: "Spline" },
  { id: "cat-hesaban", title: "حسابان", description: "حد، مشتق و کاربردها", icon: "TrendingUp" },
  { id: "cat-geometry", title: "هندسه", description: "دایره، تبدیل، ماتریس، مخروطی و بردار", icon: "Triangle" },
  { id: "cat-stats", title: "آمار و احتمال", description: "احتمال شرطی و متغیر تصادفی", icon: "Dices" },
  { id: "cat-discrete", title: "ریاضیات گسسته", description: "نظریه اعداد، ترکیبیات و گراف", icon: "Network" },
  { id: "cat-final", title: "آمادگی امتحانات نهایی", description: "مرور، نمونه سؤال و زمان‌بندی", icon: "ClipboardCheck" },
  { id: "cat-konkur", title: "آمادگی کنکور ریاضی", description: "تیپ‌بندی تست و تکنیک حل", icon: "Target" },
  { id: "cat-exam", title: "حل نمونه سؤالات امتحانی", description: "کارگاه‌های حل مسئله", icon: "PenLine" },
  { id: "cat-review", title: "دوره‌های جمع‌بندی", description: "مرور فشرده پیش از امتحان", icon: "Layers" },
  { id: "cat-concept", title: "آموزش مفهومی مباحث دشوار", description: "درک عمیق مباحثی که دانش‌آموزان را اذیت می‌کند", icon: "Lightbulb" },
];

export const INSTRUCTORS: Instructor[] = [
  {
    id: "ins-kavian",
    userId: "u-amir",
    name: "امیر کاویان",
    title: "مدرس ریاضی",
    bio: "آقای امیر کاویان مدرس ریاضی آموزشگاه کاویان است. دوره‌های TeachTech با تکیه بر توضیح مفهومی، حل گام‌به‌گام مثال و تمرین هدفمند طراحی شده‌اند تا دانش‌آموز مسئله را بفهمد، نه اینکه فقط راه‌حل را حفظ کند.",
    areas: ["ریاضی دهم و یازدهم", "حسابان", "هندسه", "آمار و احتمال", "ریاضیات گسسته", "آمادگی امتحانات نهایی و کنکور"],
    active: true,
  },
];
