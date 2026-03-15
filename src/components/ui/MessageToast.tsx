"use client";

import { CheckCircle2, X } from "lucide-react";

interface MessageToastProps {
  title: string;
  subtitle?: string;
  visible: boolean;
  onClose: () => void;
}

export function MessageToast({ title, subtitle, visible, onClose }: MessageToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-10 right-10 z-50">
      <div className="animate-slide-in notification-glow green-edge-left relative flex min-w-[260px] items-center gap-4 border border-white/10 bg-[#08090a]/95 px-6 py-4 text-white backdrop-blur-md">
        <span className="flex items-center justify-center text-[#00ff66]">
          <CheckCircle2 size={24} strokeWidth={1.4} />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-light tracking-[0.08em] leading-tight">
            {title}
          </span>
          {subtitle ? (
            <span className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#00ff66]/60">
              {subtitle}
            </span>
          ) : null}
        </div>
        <span className="ml-auto pl-6 opacity-20">
          <span className="block h-1 w-1 rounded-full bg-[#00ff66]" />
        </span>
        <button
          type="button"
          aria-label="关闭"
          onClick={onClose}
          className="absolute -top-1 -right-1 rounded-full p-2 text-white/20 transition-colors hover:text-white/50"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
