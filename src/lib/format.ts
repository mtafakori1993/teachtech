const faNumber = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });
const faDigits = "۰۱۲۳۴۵۶۷۸۹";

export const formatNumber = (n: number) => faNumber.format(n);
/** All money is stored and shown in toman (integer). Never rial. */
export const formatToman = (n: number) => (n === 0 ? "رایگان" : `${faNumber.format(n)} تومان`);
export const toFaDigits = (s: string | number) => String(s).replace(/\d/g, (d) => faDigits[Number(d)]);
export const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String(faDigits.indexOf(d))).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
export const discountPercent = (regular: number, sale: number) => (regular > 0 ? Math.round(((regular - sale) / regular) * 100) : 0);

const dateFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "long", timeZone: "Asia/Tehran" });
const dateTimeFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" });
const shortFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric", timeZone: "Asia/Tehran" });
const weekdayFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", timeZone: "Asia/Tehran" });
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const formatShortDate = (iso: string) => shortFmt.format(new Date(iso));
export const formatWeekday = (iso: string) => weekdayFmt.format(new Date(iso));

export function formatDuration(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  if (h === 0) return `${formatNumber(m)} دقیقه`;
  if (m === 0) return `${formatNumber(h)} ساعت`;
  return `${formatNumber(h)} ساعت و ${formatNumber(m)} دقیقه`;
}
export function formatClock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return toFaDigits(`${mm}:${ss}`);
}
export const formatPercent = (n: number) => `${formatNumber(Math.round(n))}٪`;
export const formatBytes = (kb: number) => (kb >= 1024 ? `${toFaDigits((kb / 1024).toFixed(1))} مگابایت` : `${formatNumber(kb)} کیلوبایت`);
