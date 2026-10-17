export const SITE = {
  name: "TeachTech",
  nameFa: "تیچ‌تک",
  tagline: "آموزش آنلاین و یادگیری هوشمند",
  description:
    "TeachTech؛ پلتفرم آموزش آنلاین ریاضی با دوره‌های ویدیویی، آزمون‌های تعاملی و گواهی پایان دوره. به سفارش آموزشگاه کاویان، مدرس: آقای امیر کاویان.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://teachtech.shomaaa.ir",
  academy: "آموزشگاه کاویان",
  instructor: "امیر کاویان",
  developer: "تفکر پردازان",
  supportEmail: "info@tafakorpardazan.ir",
  supportPhone: "۰۹۰۴۰۱۵۳۲۱۲",
  supportPhoneTel: "09040153212",
  themeColor: "#2F80ED",
  bg: "#FFFDF5",
} as const;

/** Bump when seed data shape/content changes: older persisted local data is discarded safely. */
export const DATA_VERSION = 2;
export const STORAGE_KEY = "teachtech.state";
export const INSTALL_DISMISS_KEY = "teachtech.install.dismissed";
