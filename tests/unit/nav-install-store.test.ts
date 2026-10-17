import { describe, expect, it, beforeEach } from "vitest";
import { canEnter, DASHBOARD_HOME, isActive, navFor, NAV, roleForPath } from "@/lib/nav";
import { initialInstallState, installReducer, isIosDevice, shouldShowBanner, canPromptNatively, type InstallState } from "@/lib/install";
import { useApp } from "@/store/app";
import { DEMO_STUDENT_ID, buildSeed } from "@/data/seed";

describe("role-aware navigation", () => {
  it("each role lands on its own dashboard and sees only its sections", () => {
    expect(DASHBOARD_HOME).toEqual({ student: "/dashboard", instructor: "/instructor", admin: "/admin" });
    for (const role of ["student", "instructor", "admin"] as const) {
      const prefix = DASHBOARD_HOME[role];
      expect(navFor(role).every((i) => i.href.startsWith(prefix))).toBe(true);
    }
    expect(navFor(null)).toEqual([]);
    expect(NAV.admin.some((i) => i.href === "/admin/discounts")).toBe(true);
    expect(NAV.student.some((i) => i.href.startsWith("/admin"))).toBe(false);
  });
  it("gates dashboards by role but leaves public routes open", () => {
    expect(canEnter(null, "/dashboard")).toBe("login");
    expect(canEnter("student", "/dashboard/courses")).toBe("ok");
    expect(canEnter("student", "/admin")).toBe("denied");
    expect(canEnter("instructor", "/dashboard")).toBe("denied");
    expect(canEnter("admin", "/admin/orders")).toBe("ok");
    expect(canEnter(null, "/courses")).toBe("ok");
    expect(roleForPath("/instructors/amir-kavian")).toBeNull();
  });
  it("marks active items (exact for home, prefix otherwise)", () => {
    const [home, courses] = NAV.student;
    expect(isActive(home, "/dashboard/courses")).toBe(false);
    expect(isActive(courses, "/dashboard/courses")).toBe(true);
  });
});

describe("install prompt state", () => {
  const run = (...actions: Parameters<typeof installReducer>[1][]) => actions.reduce<InstallState>(installReducer, initialInstallState);
  it("captures the native prompt and shows the banner once", () => {
    const s = run({ type: "detect", standalone: false, ios: false }, { type: "beforeinstallprompt" });
    expect(s.phase).toBe("promptable");
    expect(canPromptNatively(s)).toBe(true);
    expect(shouldShowBanner(s, { dismissedBefore: false })).toBe(true);
    expect(shouldShowBanner(s, { dismissedBefore: true })).toBe(false);
  });
  it("handles accepted, dismissed and later appinstalled", () => {
    const base = run({ type: "beforeinstallprompt" });
    expect(installReducer(base, { type: "prompt-result", outcome: "accepted" }).phase).toBe("installed");
    const dismissed = installReducer(base, { type: "prompt-result", outcome: "dismissed" });
    expect(dismissed.phase).toBe("dismissed");
    expect(canPromptNatively(dismissed)).toBe(false); // event is single-use
    expect(installReducer(dismissed, { type: "appinstalled" }).phase).toBe("installed");
  });
  it("never prompts when already standalone/installed", () => {
    const s = run({ type: "detect", standalone: true, ios: false }, { type: "beforeinstallprompt" });
    expect(s.phase).toBe("installed");
    expect(shouldShowBanner(s, { dismissedBefore: false })).toBe(false);
  });
  it("shows manual instructions on iOS and doesn't repeat after dismissal", () => {
    let s = run({ type: "detect", standalone: false, ios: true });
    expect(s.phase).toBe("ios-manual");
    expect(shouldShowBanner(s, { dismissedBefore: false })).toBe(true);
    s = installReducer(s, { type: "dismiss" });
    expect(shouldShowBanner(s, { dismissedBefore: false })).toBe(false);
  });
  it("detects iOS via feature signals", () => {
    expect(isIosDevice({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" })).toBe(true);
    expect(isIosDevice({ userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 5 })).toBe(true);
    expect(isIosDevice({ userAgent: "Mozilla/5.0 (Linux; Android 14)", platform: "Linux armv8l", maxTouchPoints: 5 })).toBe(false);
  });
});

describe("app store transitions", () => {
  beforeEach(() => { useApp.getState().resetAll(); });
  const st = () => useApp.getState();
  const billing = { fullName: "سارا موسوی", email: "student@teachtech.example", phone: "09120000001" };

  it("purchase → enrollment → lesson completion → progress → certificate, end to end", () => {
    st().login(DEMO_STUDENT_ID);
    expect(st().addToCart("c15").ok).toBe(true);
    expect(st().addToCart("c15").ok).toBe(false); // duplicate
    expect(st().addToCart("c03").ok).toBe(false); // already enrolled
    expect(st().addToCart("c16").ok).toBe(false); // full
    const r = st().checkout({ billing, outcome: "success" });
    expect(r.ok).toBe(true);
    expect(st().cart).toEqual([]);
    expect(st().enrollments.some((e) => e.userId === DEMO_STUDENT_ID && e.courseId === "c15")).toBe(true);

    const lessons = st().courses.find((c) => c.id === "c15")!.sections.flatMap((x) => x.lessons);
    for (const l of lessons) st().completeLesson("c15", l.id);
    expect(st().completed[`${DEMO_STUDENT_ID}:c15`]).toHaveLength(lessons.length);
    expect(st().issueCertificate(DEMO_STUDENT_ID, "c15").ok).toBe(false); // quiz not passed yet

    expect(st().startQuiz("q-c15-final").ok).toBe(true);
    st().saveDraft("q-c15-final", { answers: { "c15-1": "120", "c15-2": 1, "c15-3": true, "c15-4": 1 } });
    const attempt = st().submitQuiz("q-c15-final")!;
    expect(attempt.passed).toBe(true);
    expect(st().drafts[`${DEMO_STUDENT_ID}:q-c15-final`]).toBeUndefined();
    const cert = st().issueCertificate(DEMO_STUDENT_ID, "c15");
    expect(cert.ok).toBe(true);
    expect(st().certificates.find((c) => c.id === cert.certificate!.id)?.courseTitle).toContain("ترکیبیات");
  });
  it("failed or cancelled payment keeps the cart and grants no enrollment", () => {
    st().login(DEMO_STUDENT_ID);
    st().addToCart("c15");
    const before = st().enrollments.length;
    expect(st().checkout({ billing, outcome: "failed" }).ok).toBe(true);
    expect(st().enrollments.length).toBe(before);
    expect(st().cart).toEqual(["c15"]);
    expect(st().orders[0].status).toBe("failed");
  });
  it("blocks lesson completion without enrollment and requires login for checkout", () => {
    expect(st().checkout({ billing, outcome: "success" }).ok).toBe(false);
    st().login(DEMO_STUDENT_ID);
    st().completeLesson("c04", "c04-l1");
    expect(st().completed[`${DEMO_STUDENT_ID}:c04`]).toBeUndefined();
  });
  it("applies discounts to cart state and rejects bad codes", () => {
    st().login(DEMO_STUDENT_ID);
    st().addToCart("c04");
    expect(st().applyDiscount("nope").ok).toBe(false);
    expect(st().applyDiscount("teach10").ok).toBe(true);
    expect(st().discountCode).toBe("TEACH10");
    st().removeDiscount();
    expect(st().discountCode).toBeNull();
  });
  it("instructor CRUD updates course state and publish toggle hides it from the catalog", () => {
    const c = st().courses.find((x) => x.id === "c12")!;
    st().upsertCourse({ ...c, price: 640000 });
    expect(st().courses.find((x) => x.id === "c12")!.price).toBe(640000);
    st().setCourseStatus("c12", "draft");
    expect(st().courses.find((x) => x.id === "c12")!.status).toBe("draft");
    st().addToCart("c12");
    expect(st().cart).toEqual([]);
  });
  it("switchRole selects the demo account for that role and logout clears the session", () => {
    st().switchRole("admin");
    expect(st().users.find((u) => u.id === st().sessionUserId)?.role).toBe("admin");
    st().logout();
    expect(st().sessionUserId).toBeNull();
  });
  it("resetAll restores the deterministic seed", () => {
    st().login(DEMO_STUDENT_ID); st().addToCart("c15"); st().resetAll();
    expect(st().cart).toEqual([]);
    expect(st().sessionUserId).toBeNull();
    expect(st().orders.length).toBe(buildSeed().orders.length);
  });
});
