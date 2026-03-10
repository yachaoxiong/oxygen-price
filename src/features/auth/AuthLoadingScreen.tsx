import { Sparkles } from "lucide-react";

export function AuthLoadingScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#03050b] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,163,0.18),transparent_34%),radial-gradient(circle_at_84%_8%,rgba(59,130,246,0.14),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-size:3px_3px] [background-image:radial-gradient(rgba(255,255,255,0.4)_0.4px,transparent_0.4px)]" />

      <div className="relative w-[min(92vw,420px)] rounded-3xl border border-cyan-300/25 bg-[#071222]/80 p-6 shadow-[0_0_45px_rgba(34,211,238,0.16)] backdrop-blur">
        <div className="mb-5 flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-cyan-100">
            <Sparkles size={12} /> OXYGEN PRICING
          </p>
          <p className="text-[11px] text-slate-400">Loading</p>
        </div>

        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="h-3 w-3 animate-[pulse_1.1s_ease-in-out_infinite] rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.85)]" />
          <span className="h-3 w-3 animate-[pulse_1.1s_ease-in-out_0.2s_infinite] rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.85)]" />
          <span className="h-3 w-3 animate-[pulse_1.1s_ease-in-out_0.4s_infinite] rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.85)]" />
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300" />
        </div>

        <p className="mt-3 text-center text-xs text-slate-300">正在载入价格与权益数据...</p>
      </div>
    </div>
  );
}
