import type { Metadata } from "next";
import { QuizView } from "@/components/quiz/quiz-view";
export const metadata: Metadata = { title: "آزمون", robots: { index: false, follow: false } };
export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuizView id={id} />;
}
