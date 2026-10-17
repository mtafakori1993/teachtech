"use client";
import { useEffect } from "react";
import { useApp } from "@/store/app";
import { STORAGE_KEY } from "@/lib/config";
import { InstallProvider } from "@/components/pwa/install-provider";
import { InstallBanner, InstallDialog } from "@/components/pwa/install-ui";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { Toaster } from "@/components/ui/toast";

/** Rehydrates persisted state after mount (so SSR and first client render match), and keeps tabs in sync. */
function Hydrator() {
  useEffect(() => {
    void Promise.resolve(useApp.persist.rehydrate()).finally(() => useApp.getState().markHydrated());
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) void useApp.persist.rehydrate(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <InstallProvider>
      <Hydrator />
      {children}
      <InstallBanner />
      <InstallDialog />
      <ServiceWorkerRegister />
      <Toaster />
    </InstallProvider>
  );
}
