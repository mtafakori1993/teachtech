import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/course/catalog-view";
import { Skeleton, PageTitle } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "دوره‌های ریاضی",
  description: "فهرست دوره‌های ریاضی دهم، یازدهم، دوازدهم، حسابان، هندسه، آمار، گسسته و آمادگی امتحان نهایی و کنکور با فیلتر پایه، سطح و قیمت.",
  alternates: { canonical: "/courses" },
};

export default function CoursesPage() {
  return (
    <div className="container-x py-10">
      <PageTitle title="دوره‌های ریاضی">دوره را بر اساس پایه، مبحث، سطح و قیمت پیدا کنید.</PageTitle>
      <Suspense fallback={<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-96" />)}</div>}>
        <CatalogView />
      </Suspense>
    </div>
  );
}
