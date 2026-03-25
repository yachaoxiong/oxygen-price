"use client";

import type { ReactElement } from "react";

interface LoadingStitchProps {
  className?: string;
}

export function LoadingStitch({ className }: LoadingStitchProps): ReactElement {
  return (
    <div
      className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden gradient-bg-vertical text-[var(--loading-accent)] ${
        className ?? ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0 loading-stitch-grid grid-mask opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--loading-vignette)_100%)]" />

      <main className="relative z-20 flex flex-col items-center justify-center -translate-y-8">
        <div className="relative mb-12 flex h-80 w-80 items-center justify-center">
          <div className="absolute inset-0 animate-pulse-slow rounded-full pulse-layer-2" />
          <div className="absolute inset-8 animate-pulse-slow rounded-full pulse-layer-1 stagger-5" />
          <div className="absolute inset-0 grid-mask flex items-center justify-center">
            <div className="h-full w-full rounded-lg border border-[var(--loading-accent-soft)]" />
          </div>
          <div className="relative h-40 w-40 animate-logo-heartbeat static-glow-logo">
            <img
              alt="Brand Logo Base"
              className="h-full w-full object-contain opacity-25"
              src="/logo.png"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                alt="Brand Logo Core"
                className="h-full w-full object-contain logo-filter"
                src="/logo.png"
              />
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="flex items-center gap-6">
            <div className="h-6 w-px bg-gradient-to-t from-transparent via-[var(--loading-accent-soft)] to-transparent" />
            <h1 className="flex font-mono text-lg uppercase tracking-[0.4em] text-[var(--loading-accent)]">
              <span className="animate-char-reveal stagger-1">l</span>
              <span className="animate-char-reveal stagger-2">o</span>
              <span className="animate-char-reveal stagger-3">a</span>
              <span className="animate-char-reveal stagger-4">d</span>
              <span className="animate-char-reveal stagger-5">i</span>
              <span className="animate-char-reveal stagger-6">n</span>
              <span className="animate-char-reveal stagger-7">g</span>
              <span className="animate-char-reveal stagger-8">.</span>
              <span className="animate-char-reveal stagger-9">.</span>
              <span className="animate-char-reveal stagger-10">.</span>
            </h1>
            <div className="h-6 w-px bg-gradient-to-t from-transparent via-[var(--loading-accent-soft)] to-transparent" />
          </div>
          <div className="mt-4 h-px w-48 bg-gradient-to-r from-transparent via-[var(--loading-accent-soft)] to-transparent" />
        </div>
      </main>

      <div className="fixed left-12 top-12 h-10 w-10 border-l border-t border-[var(--loading-accent-soft)]" />
      <div className="fixed right-12 top-12 h-10 w-10 border-r border-t border-[var(--loading-accent-soft)]" />
      <div className="fixed bottom-12 left-12 h-10 w-10 border-b border-l border-[var(--loading-accent-soft)]" />
      <div className="fixed bottom-12 right-12 h-10 w-10 border-b border-r border-[var(--loading-accent-soft)]" />

      <div className="fixed bottom-12 left-1/2 flex -translate-x-1/2 gap-4 opacity-35">
        <div className="h-3 w-px bg-[var(--loading-accent)]" />
        <div className="h-5 w-px bg-[var(--loading-accent)]" />
        <div className="h-2 w-px bg-[var(--loading-accent)]" />
        <div className="h-4 w-px bg-[var(--loading-accent)]" />
        <div className="h-3 w-px bg-[var(--loading-accent)]" />
      </div>
    </div>
  );
}
