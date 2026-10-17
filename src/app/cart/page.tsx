import type { Metadata } from "next";
import { CartView } from "@/components/pages/cart-view";
export const metadata: Metadata = { title: "سبد خرید", robots: { index: false } };
export default function CartPage() { return <div className="container-x py-10"><CartView /></div>; }
