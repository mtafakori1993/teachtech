"use client";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/primitives";
import { SITE } from "@/lib/config";

const schema = z.object({
  name: z.string().trim().min(3, "نام را کامل وارد کنید."),
  email: z.string().trim().pipe(z.email("ایمیل معتبر وارد کنید.")),
  topic: z.string().min(1),
  message: z.string().trim().min(15, "پیام باید حداقل ۱۵ نویسه باشد.").max(2000, "پیام بیش از حد طولانی است."),
});

/** There is no backend: a valid message opens the user's mail app addressed to support. */
export function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = schema.safeParse(fd);
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); setSent(false); return; }
    setErrors({}); setSent(true);
    const body = `${r.data.message}\n\n— ${r.data.name} (${r.data.email})`;
    window.location.href = `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(`[TeachTech] ${r.data.topic}`)}&body=${encodeURIComponent(body)}`;
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-lg border border-line bg-card/60 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام و نام خانوادگی" error={errors.name}>{(p) => <Input {...p} name="name" autoComplete="name" />}</Field>
        <Field label="ایمیل" error={errors.email}>{(p) => <Input {...p} name="email" type="email" dir="ltr" autoComplete="email" className="text-end" />}</Field>
      </div>
      <Field label="موضوع">{(p) => <Select {...p} name="topic"><option>انتخاب دوره</option><option>مشکل فنی</option><option>لیست انتظار</option><option>سایر</option></Select>}</Field>
      <Field label="پیام" error={errors.message}>{(p) => <Textarea {...p} name="message" rows={6} />}</Field>
      {sent && <Alert tone="success">برنامهٔ ایمیل شما باز شد. پیام فقط با ارسال از همان‌جا به پشتیبانی می‌رسد.</Alert>}
      <Button type="submit"><Send className="size-4" />آماده‌سازی پیام</Button>
    </form>
  );
}
