"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { initialInstallState, installReducer, isIosDevice, shouldShowBanner, canPromptNatively, type InstallState } from "@/lib/install";
import { INSTALL_DISMISS_KEY } from "@/lib/config";
import { readSessionFlag, writeSessionFlag } from "@/lib/storage";
import { toast } from "@/components/ui/toast";

interface BIPEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }
interface Ctx {
  state: InstallState;
  showBanner: boolean;
  helpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  install: () => Promise<void>;
  dismissBanner: () => void;
}
const InstallCtx = createContext<Ctx | null>(null);
export const useInstall = () => {
  const c = useContext(InstallCtx);
  if (!c) throw new Error("useInstall must be used inside InstallProvider");
  return c;
};

const SESSION_KEY = "teachtech.install.session-dismissed";
const COOLDOWN_MS = 14 * 24 * 3600 * 1000;
const BANNER_DELAY_MS = 9000;

function dismissedRecently(): boolean {
  try {
    const at = Number(window.localStorage.getItem(INSTALL_DISMISS_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < COOLDOWN_MS;
  } catch { return false; }
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(installReducer, initialInstallState);
  const [ready, setReady] = useState(false); // banner timer elapsed
  const [dismissedBefore, setDismissedBefore] = useState(true); // assume dismissed until storage is read (no flash)
  const [helpOpen, setHelpOpen] = useState(false);
  const eventRef = useRef<BIPEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    dispatch({ type: "detect", standalone, ios: isIosDevice(navigator) });
    const early = (window as unknown as { __ttBip?: BIPEvent }).__ttBip;
    if (early) { eventRef.current = early; dispatch({ type: "beforeinstallprompt" }); }
    const onBip = (e: Event) => { e.preventDefault(); eventRef.current = e as BIPEvent; dispatch({ type: "beforeinstallprompt" }); };
    const onInstalled = () => { eventRef.current = null; dispatch({ type: "appinstalled" }); toast.success("TeachTech روی دستگاه شما نصب شد."); };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    const t = setTimeout(() => { setDismissedBefore(readSessionFlag(SESSION_KEY) || dismissedRecently()); setReady(true); }, BANNER_DELAY_MS);
    return () => { window.removeEventListener("beforeinstallprompt", onBip); window.removeEventListener("appinstalled", onInstalled); clearTimeout(t); };
  }, []);

  const rememberDismiss = useCallback(() => {
    writeSessionFlag(SESSION_KEY);
    try { window.localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now())); } catch { /* storage unavailable */ }
    setDismissedBefore(true);
  }, []);

  const dismissBanner = useCallback(() => { dispatch({ type: "dismiss" }); rememberDismiss(); }, [rememberDismiss]);

  const install = useCallback(async () => {
    const ev = eventRef.current;
    if (!ev) { dispatch({ type: "prompt-result", outcome: "unavailable" }); setHelpOpen(true); return; }
    eventRef.current = null; // the event is single-use
    try {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      dispatch({ type: "prompt-result", outcome });
      if (outcome === "dismissed") { rememberDismiss(); toast.info("هر زمان خواستید از بخش «نصب اپلیکیشن» در پایین صفحه نصب کنید."); }
    } catch {
      dispatch({ type: "prompt-result", outcome: "unavailable" });
      setHelpOpen(true);
    }
  }, [rememberDismiss]);

  const value = useMemo<Ctx>(() => ({
    state,
    showBanner: ready && shouldShowBanner(state, { dismissedBefore }),
    helpOpen,
    openHelp: () => setHelpOpen(true),
    closeHelp: () => setHelpOpen(false),
    install,
    dismissBanner,
  }), [state, ready, dismissedBefore, helpOpen, install, dismissBanner]);

  return <InstallCtx.Provider value={value}>{children}</InstallCtx.Provider>;
}

export { canPromptNatively };
