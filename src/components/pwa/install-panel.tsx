"use client";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallSteps } from "./install-ui";
import { canPromptNatively, useInstall } from "./install-provider";

export function InstallPanel() {
  const { state, install } = useInstall();
  return (
    <div className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-soft">
      {state.phase === "installed" ? (
        <p className="flex items-center gap-2 font-bold text-success-600"><CheckCircle2 className="size-5" />TeachTech روی این دستگاه نصب شده یا در حالت اپلیکیشن اجرا می‌شود.</p>
      ) : (
        <>
          {canPromptNatively(state) && <div><Button size="lg" onClick={install}><Download className="size-5" />نصب اپلیکیشن</Button><p className="mt-2 text-xs text-ink-500">پنجرهٔ نصب مرورگر فقط پس از زدن این دکمه باز می‌شود.</p></div>}
          <InstallSteps />
        </>
      )}
    </div>
  );
}
