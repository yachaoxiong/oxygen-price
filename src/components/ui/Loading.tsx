"use client";

import { useEffect, useRef, useState } from "react";

const MAX_PROGRESS = 100;

export function Loading() {
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function scheduleTick() {
      timeoutRef.current = window.setTimeout(() => {
        setProgress((prev) => {
          const nextValue = Math.min(MAX_PROGRESS, prev + Math.random() * 1.5);
          if (nextValue < MAX_PROGRESS) {
            scheduleTick();
          }
          return nextValue;
        });
      }, Math.random() * 120 + 30);
    }

    scheduleTick();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isComplete = progress >= MAX_PROGRESS;
  const percentLabel = isComplete
    ? "系统就绪 100%"
    : `系统同步中 ${Math.floor(progress)}%`;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#020202] text-[#39ff14]">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="scan-line" />

      <main className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative flex h-[min(78vw,500px)] w-[min(78vw,500px)] items-center justify-center">
          <div className="absolute h-full w-full rounded-full border border-[#39ff14]/10 border-dashed rotate-slow" />
          <div className="absolute h-[85%] w-[85%] rounded-[40%] border border-[#39ff14]/20 rotate-reverse-slow" />
          <div className="absolute h-[70%] w-[70%] rounded-full border-2 border-[#39ff14]/30 energy-pulse" />
          <div className="absolute h-[60%] w-[60%] rounded-full opacity-20 geometric-fill" />

          <svg className="absolute h-[55%] w-[55%] rotate-slow" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.2"
              strokeDasharray="2,4"
            />
            <path
              d="M50 2 L50 10 M98 50 L90 50 M50 98 L50 90 M2 50 L10 50"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </svg>

          <div className="absolute h-[45%] w-[45%] rounded-full bg-[#39ff14]/5 blur-xl core-glow" />
          <div className="relative z-20 transition-all duration-700">
            <img
              alt="Oxygen Fitness Club Logo"
              className="h-auto w-28 hologram-effect sm:w-36"
              src="/logo.png"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(80%) sepia(50%) saturate(1000%) hue-rotate(60deg)",
              }}
            />
          </div>
        </div>

        <div className="mt-10 text-center">
          <h1 className="mb-2 text-xs font-light uppercase tracking-[0.5em] text-[#39ff14]/90 sm:text-sm">
            启动能量核心...
          </h1>
          <p className="text-[9px] uppercase tracking-[0.8em] text-[#39ff14]/50 sm:text-[10px]">
            SYSTEM SYNCING...
          </p>
        </div>

        <div className="pt-6">
          <div className="flex items-center justify-center gap-4 text-[10px] font-medium tracking-widest text-[#39ff14]/80">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#39ff14]/40" />
            <span className={isComplete ? "text-white" : undefined}>{percentLabel}</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#39ff14]/40" />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 gap-12 text-[9px] uppercase tracking-[0.2em] text-[#39ff14]/30 sm:flex">
          <span>核心协议: v4.0.2</span>
          <span>连接状态: 加密</span>
          <span>节点: 0X-FF14</span>
        </div>
      </main>
    </div>
  );
}
