import type { Metadata } from "next";
import { OrderView } from "@/components/pages/order-view";
export const metadata: Metadata = { title: "جزئیات سفارش", robots: { index: false } };
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="container-x max-w-3xl py-10"><OrderView id={id} /></div>;
}
