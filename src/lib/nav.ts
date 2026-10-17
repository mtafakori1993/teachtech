import type { Role } from "@/data/types";

export interface NavItem { href: string; label: string; icon: string; exact?: boolean }

export const DASHBOARD_HOME: Record<Role, string> = { student: "/dashboard", instructor: "/instructor", admin: "/admin" };
export const ROLE_LABEL: Record<Role, string> = { student: "دانش‌آموز", instructor: "مدرس", admin: "مدیر آموزشگاه" };

export const NAV: Record<Role, NavItem[]> = {
  student: [
    { href: "/dashboard", label: "نمای کلی", icon: "LayoutDashboard", exact: true },
    { href: "/dashboard/courses", label: "دوره‌های من", icon: "BookOpen" },
    { href: "/dashboard/calendar", label: "تقویم یادگیری", icon: "CalendarDays" },
    { href: "/dashboard/quizzes", label: "آزمون‌ها", icon: "ListChecks" },
    { href: "/dashboard/certificates", label: "گواهی‌ها", icon: "Award" },
    { href: "/dashboard/orders", label: "سفارش‌ها", icon: "Receipt" },
    { href: "/dashboard/profile", label: "پروفایل و تنظیمات", icon: "UserCog" },
  ],
  instructor: [
    { href: "/instructor", label: "نمای کلی", icon: "LayoutDashboard", exact: true },
    { href: "/instructor/courses", label: "دوره‌ها", icon: "BookOpen" },
    { href: "/instructor/quizzes", label: "آزمون‌ها و بانک سؤال", icon: "ListChecks" },
    { href: "/instructor/students", label: "دانش‌آموزان", icon: "Users" },
    { href: "/instructor/assignments", label: "تکلیف‌ها", icon: "FileCheck" },
    { href: "/instructor/qa", label: "پرسش و پاسخ", icon: "MessagesSquare" },
    { href: "/instructor/announcements", label: "اطلاعیه‌ها", icon: "Megaphone" },
    { href: "/instructor/analytics", label: "تحلیل و فروش", icon: "ChartNoAxesColumn" },
    { href: "/instructor/certificates", label: "گواهی‌ها", icon: "Award" },
  ],
  admin: [
    { href: "/admin", label: "نمای کلی", icon: "LayoutDashboard", exact: true },
    { href: "/admin/courses", label: "دوره‌ها", icon: "BookOpen" },
    { href: "/admin/instructors", label: "مدرسان", icon: "GraduationCap" },
    { href: "/admin/students", label: "دانش‌آموزان", icon: "Users" },
    { href: "/admin/enrollments", label: "ثبت‌نام‌ها", icon: "UserCheck" },
    { href: "/admin/orders", label: "سفارش‌ها", icon: "Receipt" },
    { href: "/admin/discounts", label: "کدهای تخفیف", icon: "Ticket" },
    { href: "/admin/certificates", label: "گواهی‌ها", icon: "Award" },
    { href: "/admin/announcements", label: "اطلاعیه‌ها", icon: "Megaphone" },
    { href: "/admin/homepage", label: "محتوای صفحهٔ اصلی", icon: "LayoutTemplate" },
    { href: "/admin/analytics", label: "تحلیل", icon: "ChartNoAxesColumn" },
    { href: "/admin/settings", label: "تنظیمات", icon: "Settings" },
  ],
};

export const roleForPath = (path: string): Role | null =>
  path === "/dashboard" || path.startsWith("/dashboard/") ? "student" :
  path === "/instructor" || path.startsWith("/instructor/") ? "instructor" :
  path === "/admin" || path.startsWith("/admin/") ? "admin" : null;

/** Frontend-only role gate. This is a UX rule, NOT a security boundary. */
export function canEnter(role: Role | null | undefined, path: string): "ok" | "login" | "denied" {
  const need = roleForPath(path);
  if (!need) return "ok";
  if (!role) return "login";
  return role === need ? "ok" : "denied";
}

export function navFor(role: Role | null | undefined): NavItem[] { return role ? NAV[role] : []; }

export const isActive = (item: NavItem, path: string) => (item.exact ? path === item.href : path === item.href || path.startsWith(item.href + "/"));
