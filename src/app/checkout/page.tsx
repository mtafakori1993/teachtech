import type { Metadata } from "next";
import { CheckoutView } from "@/components/pages/checkout-view";
export const metadata: Metadata = { title: "ثبت سفارش", robots: { index: false } };
export default function CheckoutPage() { return <div className="container-x py-10"><CheckoutView /></div>; }
