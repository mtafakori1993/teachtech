import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/pages/prose";
import { Button } from "@/components/ui/button";
export const metadata: Metadata = { title: "دربارهٔ آموزشگاه", description: "آشنایی با آموزشگاه کاویان و پلتفرم TeachTech برای آموزش آنلاین ریاضی.", alternates: { canonical: "/about" } };
export default function About() {
  return (
    <>
      <PageHero eyebrow="دربارهٔ ما" title="آموزشگاه کاویان و TeachTech">پلتفرمی برای اینکه یادگیری ریاضی منظم، قابل‌پیگیری و در دسترس باشد.</PageHero>
      <div className="container-x py-12">
        <Prose>
          <p>TeachTech به سفارش آموزشگاه کاویان و برای ارائهٔ دوره‌های ریاضی آقای امیر کاویان ساخته شده است. هدف این پلتفرم این است که دانش‌آموز بتواند درس‌ها را به ترتیب دنبال کند، پیشرفتش را ببیند، در آزمون‌ها شرکت کند و در پایان گواهی آموزشگاه را دریافت کند.</p>
          <h2>ما چه کار می‌کنیم</h2>
          <ul><li>دوره‌های ریاضی پایه‌های دهم تا دوازدهم، حسابان، هندسه، آمار و احتمال و گسسته</li><li>دوره‌های آمادگی امتحان نهایی و کنکور ریاضی</li><li>آموزش مفهومی مباحثی که معمولاً برای دانش‌آموزان دشوارند</li></ul>
          <h2>رویکرد آموزشی</h2>
          <p>در هر درس ابتدا مفهوم توضیح داده می‌شود، سپس با مثال‌های حل‌شده تثبیت می‌شود و در پایان تمرین و آزمون کوتاه برای سنجش درک وجود دارد.</p>
          <h2>توسعه</h2>
          <p>طراحی و توسعهٔ فنی TeachTech را شرکت تفکر پردازان انجام داده است. در نسخهٔ فعلی ورود به حساب و پرداخت شبیه‌سازی‌شده‌اند و داده‌ها فقط در مرورگر شما ذخیره می‌شوند.</p>
        </Prose>
        <div className="mt-8 flex gap-3"><Button href="/courses" variant="cta">مشاهدهٔ دوره‌ها</Button><Button href="/contact" variant="outline">تماس با ما</Button></div>
      </div>
    </>
  );
}
