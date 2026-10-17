/** Pure state machine for the install experience. The browser event wiring lives in components/pwa/install-provider.tsx. */
export type InstallPhase =
  | "unknown"        // not evaluated yet (SSR / first paint)
  | "installed"      // running standalone or appinstalled fired
  | "promptable"     // beforeinstallprompt captured; native prompt can be triggered by the user
  | "ios-manual"     // iOS Safari: add-to-home-screen instructions only
  | "manual"         // no programmatic prompt available; show generic instructions on request
  | "dismissed";     // user dismissed the banner this session

export interface InstallState { phase: InstallPhase; outcome?: "accepted" | "dismissed" | "unavailable"; hasEvent: boolean }
export const initialInstallState: InstallState = { phase: "unknown", hasEvent: false };

export type InstallAction =
  | { type: "detect"; standalone: boolean; ios: boolean }
  | { type: "beforeinstallprompt" }
  | { type: "appinstalled" }
  | { type: "dismiss" }
  | { type: "prompt-result"; outcome: "accepted" | "dismissed" | "unavailable" }
  | { type: "session-dismissed" };

export function installReducer(s: InstallState, a: InstallAction): InstallState {
  switch (a.type) {
    case "detect":
      if (a.standalone) return { phase: "installed", hasEvent: false };
      if (s.phase === "promptable" || s.phase === "dismissed") return s;
      return { ...s, phase: a.ios ? "ios-manual" : "manual" };
    case "beforeinstallprompt":
      if (s.phase === "installed") return s;
      return { phase: s.phase === "dismissed" ? "dismissed" : "promptable", hasEvent: true };
    case "appinstalled":
      return { phase: "installed", outcome: "accepted", hasEvent: false };
    case "dismiss":
    case "session-dismissed":
      return s.phase === "installed" ? s : { ...s, phase: "dismissed" };
    case "prompt-result":
      // The deferred event can be used once; after it is spent the user is either installed (via appinstalled) or dismissed.
      return a.outcome === "accepted" ? { phase: "installed", outcome: a.outcome, hasEvent: false } : { phase: "dismissed", outcome: a.outcome, hasEvent: false };
  }
}

/** The banner is shown only when it can be useful and has not been dismissed. */
export const shouldShowBanner = (s: InstallState, opts: { dismissedBefore: boolean }) =>
  !opts.dismissedBefore && (s.phase === "promptable" || s.phase === "ios-manual");

export const canPromptNatively = (s: InstallState) => s.hasEvent && s.phase !== "installed";

export function isIosDevice(nav: { userAgent: string; platform?: string; maxTouchPoints?: number }): boolean {
  const ua = nav.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as Mac with touch support
  return nav.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1;
}
