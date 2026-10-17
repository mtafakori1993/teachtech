import { CourseEditor } from "@/components/manage/instructor-pages";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CourseEditor id={id} />; }
