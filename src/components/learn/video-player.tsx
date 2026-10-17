"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Captions, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { formatClock, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const setTrackMode = (el: HTMLVideoElement | null, show: boolean) => { const t = el?.textTracks[0]; if (t) t.mode = show ? "showing" : "hidden"; };

export interface PlayerHandle { time: () => number; seek: (s: number) => void }

/** HTML5 video with accessible custom controls. Position is reported through onProgress; resume position is applied once metadata loads. */
export function VideoPlayer({ src, captions, title, resumeAt = 0, onProgress, onEnded, handleRef }: {
  src: string; captions?: string; title: string; resumeAt?: number; onProgress: (sec: number) => void; onEnded: () => void; handleRef?: React.MutableRefObject<PlayerHandle | null>;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [cc, setCc] = useState(false);
  const [full, setFull] = useState(false);
  const [error, setError] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    if (handleRef) handleRef.current = { time: () => ref.current?.currentTime ?? 0, seek: (s) => { if (ref.current) { ref.current.currentTime = s; setCur(s); } } };
  }, [handleRef]);
  useEffect(() => setTrackMode(ref.current, cc), [cc, src]);
  useEffect(() => { const f = () => setFull(document.fullscreenElement === box.current); document.addEventListener("fullscreenchange", f); return () => document.removeEventListener("fullscreenchange", f); }, []);

  const toggle = useCallback(() => { const v = ref.current; if (!v) return; if (v.paused) void v.play().catch(() => undefined); else v.pause(); }, []);
  const seek = (s: number) => { if (ref.current) { ref.current.currentTime = s; setCur(s); onProgress(s); } };
  const toggleFull = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void box.current?.requestFullscreen?.().catch(() => undefined); };
  const canFull = typeof document !== "undefined" && !!document.fullscreenEnabled;

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "SELECT") return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); seek(Math.max(0, cur - 5)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); seek(Math.min(dur, cur + 5)); }
    else if (e.key === "m") setMuted((m) => !m);
    else if (e.key === "f") toggleFull();
  };

  if (error) return <div className="grid aspect-video place-items-center rounded-xl bg-ink p-6 text-center text-cream"><p>بارگذاری ویدیو ممکن نشد. اتصال اینترنت را بررسی و صفحه را دوباره باز کنید.</p></div>;

  return (
    <div ref={box} onKeyDown={onKey} className={cn("group relative overflow-hidden rounded-xl bg-ink", full && "rounded-none")} aria-label={`پخش‌کنندهٔ ویدیو: ${title}`} role="region">
      <video ref={ref} src={src} playsInline preload="metadata" className="aspect-video w-full bg-ink" onClick={toggle}
        onLoadedMetadata={(e) => { const v = e.currentTarget; setDur(v.duration); if (resumeAt > 1 && resumeAt < v.duration - 2) { v.currentTime = resumeAt; setCur(resumeAt); } }}
        onTimeUpdate={(e) => { const t = e.currentTarget.currentTime; setCur(t); if (Math.abs(t - last.current) >= 3) { last.current = t; onProgress(t); } }}
        onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); onProgress(ref.current?.currentTime ?? 0); }}
        onEnded={() => { setPlaying(false); onProgress(0); onEnded(); }} onError={() => setError(true)}
        onVolumeChange={(e) => { setVol(e.currentTarget.volume); setMuted(e.currentTarget.muted); }}>
        {captions && <track kind="captions" srcLang="fa" label="فارسی" src={captions} />}
      </video>
      {!playing && <button onClick={toggle} aria-label="پخش" className="absolute inset-0 m-auto grid size-16 place-items-center rounded-full bg-white/95 text-brand-700 shadow-pop transition hover:scale-105"><Play className="size-7 translate-x-[-1px]" /></button>}
      <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-ink/90 to-transparent px-3 pb-2 pt-8 text-cream" dir="ltr">
        <input type="range" min={0} max={dur || 1} step={0.1} value={cur} onChange={(e) => seek(Number(e.target.value))} aria-label="موقعیت پخش" aria-valuetext={`${formatClock(cur)} از ${formatClock(dur)}`} className="h-2 w-full cursor-pointer accent-sun-400" />
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button onClick={toggle} aria-label={playing ? "توقف" : "پخش"} className="grid size-10 place-items-center rounded-md hover:bg-white/15">{playing ? <Pause className="size-5" /> : <Play className="size-5" />}</button>
          <button onClick={() => seek(Math.max(0, cur - 10))} aria-label="۱۰ ثانیه عقب" className="grid size-10 place-items-center rounded-md hover:bg-white/15"><RotateCcw className="size-4" /></button>
          <span className="tabular text-xs" dir="rtl">{formatClock(cur)} / {formatClock(dur)}</span>
          <span className="flex-1" />
          <button onClick={() => { const v = ref.current; if (v) v.muted = !v.muted; }} aria-label={muted ? "باز کردن صدا" : "بی‌صدا"} className="grid size-10 place-items-center rounded-md hover:bg-white/15">{muted || vol === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}</button>
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : vol} onChange={(e) => { const v = ref.current; if (v) { v.volume = Number(e.target.value); v.muted = false; } }} aria-label="بلندی صدا" className="hidden h-2 w-20 cursor-pointer accent-sun-400 sm:block" />
          <label className="sr-only" htmlFor="rate">سرعت پخش</label>
          <select id="rate" value={rate} onChange={(e) => { const r = Number(e.target.value); setRate(r); if (ref.current) ref.current.playbackRate = r; }} className="h-9 rounded-md border border-white/30 bg-ink px-1.5 text-xs text-cream">
            {SPEEDS.map((s) => <option key={s} value={s}>{toFaDigits(s)}×</option>)}
          </select>
          {captions && <button onClick={() => setCc(!cc)} aria-pressed={cc} aria-label="زیرنویس" className={cn("grid size-10 place-items-center rounded-md hover:bg-white/15", cc && "bg-white/25")}><Captions className="size-5" /></button>}
          {canFull && <button onClick={toggleFull} aria-label={full ? "خروج از تمام‌صفحه" : "تمام‌صفحه"} className="grid size-10 place-items-center rounded-md hover:bg-white/15">{full ? <Minimize className="size-5" /> : <Maximize className="size-5" />}</button>}
        </div>
      </div>
    </div>
  );
}
