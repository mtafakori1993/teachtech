import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/pages/search-results";
export const metadata: Metadata = { title: "نتایج جستجو", robots: { index: false, follow: true } };
export default function SearchPage() {
  return <div className="container-x py-10"><Suspense fallback={null}><SearchResults /></Suspense></div>;
}
