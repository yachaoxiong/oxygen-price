"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DURATION_MS = 1000;

export function LoadingCircuit() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const nextProgress = Math.min((elapsed / DURATION_MS) * 100, 100);
      setProgress(nextProgress);

      if (nextProgress < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const displayProgress = Math.floor(progress);
  const progressLabel = displayProgress.toString().padStart(2, "0");
  const isComplete = progress >= 100;

  const statusOne = progress > 30 ? "定价已就绪" : "定价准备中";
  const statusTwo = isComplete ? "同步完成" : "数据同步中";

  const statusTwoClasses = isComplete
    ? "text-[#39ff14]"
    : progress > 60
      ? "text-[#39ff14]"
      : "opacity-30";

  const progressStyles = useMemo(
    () => ({
      "--scan-progress": `${progress}%`,
    }) as React.CSSProperties,
    [progress],
  );

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050505] text-[#39ff14] circuit-board" style={progressStyles}>
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="circuit-trace left-0 top-1/4 h-[2px] w-1/3" />
        <div className="circuit-trace left-1/3 top-1/4 h-1/4 w-[2px]" />
        <div className="circuit-trace bottom-1/3 right-0 h-[2px] w-1/4" />
        <div className="circuit-trace bottom-1/3 right-1/4 h-1/2 w-[2px]" />
        <div className="node absolute left-[33.3%] top-[25%] text-[#39ff14]/20" />
        <div className="node absolute bottom-[33.3%] right-[25%] text-[#39ff14]/20" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: Math.min(progress / 100, 1) }}>
          <div className="circuit-trace trace-active left-0 top-1/4 h-[2px] w-1/3" />
          <div className="circuit-trace trace-active left-1/3 top-1/4 h-1/4 w-[2px]" />
          <div className="circuit-trace trace-active bottom-1/3 right-0 h-[2px] w-1/4" />
          <div className="circuit-trace trace-active bottom-1/3 right-1/4 h-1/2 w-[2px]" />
        </div>
      </div>

      <main className="relative z-20 flex h-full w-full flex-col items-center justify-center">
        <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
          <img
            alt="Logo Base"
            className="absolute inset-0 h-full w-full object-contain opacity-10"
            src="/logo.png"
          />
          <div className="reveal-mask absolute inset-0 flex h-full w-full items-center justify-center" aria-hidden="true">
            <img
              alt="Oxygen Fitness Club Logo"
              className="logo-core h-full w-full object-contain"
              src="/logo.png"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(80%) sepia(50%) saturate(1000%) hue-rotate(60deg)",
              }}
            />
          </div>
          <div className="absolute inset-0 scale-[1.4] rotate-45 rounded-full border border-[#39ff14]/10" />
          <div className="absolute inset-0 scale-[1.8] rounded-full border border-[#39ff14]/5" />

          <div className="absolute -left-48 top-1/2 hidden -translate-y-1/2 items-center gap-4 md:flex">
            <div className="flex flex-col items-end">
              <span className="data-text text-[10px] opacity-40">PRICING</span>
              <span className="data-text text-xs">{statusOne}</span>
            </div>
            <div className="h-px w-12 bg-[#39ff14]/30" />
          </div>

          <div className="absolute -right-48 top-1/2 hidden -translate-y-1/2 items-center gap-4 md:flex">
            <div className="h-px w-12 bg-[#39ff14]/30" />
            <div className="flex flex-col items-start">
              <span className="data-text text-[10px] opacity-40">SYNC</span>
              <span className={`data-text text-xs ${statusTwoClasses}`}>{statusTwo}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="data-text mb-4 text-[10px] font-light tracking-[1em] opacity-50">PRICING_READY</div>
          <div className={`text-5xl font-bold tracking-tighter italic ${isComplete ? "animate-pulse" : ""}`}>
            {isComplete ? "已就绪" : `${progressLabel}%`}
          </div>
          <div className="relative mx-auto mt-4 h-[2px] w-48 overflow-hidden bg-[#39ff14]/10">
            <div
              className="absolute inset-y-0 left-0 bg-[#39ff14] shadow-[0_0_10px_#39FF14]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </main>

      <div className="data-text fixed bottom-10 left-10 hidden flex-col gap-1 text-[9px] opacity-30 md:flex">
        <div>价格引擎: 就绪</div>
        <div>折扣规则: 已加载</div>
        <div>税率配置: 已同步</div>
      </div>

      <div className="data-text fixed right-10 top-10 hidden text-[9px] opacity-20 md:block">
        [ PRICING v2.4 ]
      </div>
    </div>
  );
}
