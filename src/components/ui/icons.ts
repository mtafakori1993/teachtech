import {
  Award, BookOpen, CalendarDays, ChartNoAxesColumn, ClipboardCheck, Dices, FileCheck, GraduationCap, Layers, LayoutDashboard, LayoutTemplate,
  Lightbulb, ListChecks, Megaphone, MessagesSquare, Network, PenLine, Receipt, Settings, Sigma, Spline, Target, Ticket, TrendingUp, Triangle,
  UserCheck, UserCog, Users, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Award, BookOpen, CalendarDays, ChartNoAxesColumn, ClipboardCheck, Dices, FileCheck, GraduationCap, Layers, LayoutDashboard, LayoutTemplate,
  Lightbulb, ListChecks, Megaphone, MessagesSquare, Network, PenLine, Receipt, Settings, Sigma, Spline, Target, Ticket, TrendingUp, Triangle,
  UserCheck, UserCog, Users,
};
export const iconByName = (name: string): LucideIcon => MAP[name] ?? BookOpen;
