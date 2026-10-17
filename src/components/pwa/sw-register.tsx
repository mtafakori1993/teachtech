"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Registers /sw.js in production only (in dev it would serve stale bundles). New versions are announced; the user decides when to reload. */
export function ServiceWorkerRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let reloading = false;
    // First install also fires controllerchange (clients.claim); only an *update* of an existing worker should reload.
    const hadController = !!navigator.serviceWorker.controller;
    const onChange = () => { if (!hadController || reloading) return; reloading = true; window.location.reload(); };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    let timer: ReturnType<typeof setInterval> | undefined;

    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        w?.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) setWaiting(w); });
      });
      timer = setInterval(() => void reg.update().catch(() => undefined), 60 * 60 * 1000);
    }).catch(() => { /* registration is an enhancement; the site works without it */ });

    return () => { navigator.serviceWorker.removeEventListener("controllerchange", onChange); if (timer) clearInterval(timer); };
  }, []);

  if (!waiting) return null;
  return (
    <div role="status" className="fixed inset-x-3 top-3 z-[90] mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-brand-200 bg-white px-4 py-3 text-sm shadow-lift">
      <span className="flex items-center gap-2"><RefreshCw className="size-4 text-brand-600" aria-hidden />نسخهٔ جدید TeachTech آماده است.</span>
      <Button size="sm" onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}>بارگذاری مجدد</Button>
    </div>
  );
}
