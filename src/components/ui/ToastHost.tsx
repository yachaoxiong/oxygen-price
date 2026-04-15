"use client";

import type { ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, Loader2, XCircle, X } from "lucide-react";
import { hideToast, useToastState, type ToastVariant } from "@/lib/toast";

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 size={24} strokeWidth={1.4} />,
  error: <XCircle size={24} strokeWidth={1.4} />,
  warning: <AlertCircle size={24} strokeWidth={1.4} />,
  info: <Info size={24} strokeWidth={1.4} />,
};

export function ToastHost() {
  const { toast } = useToastState();

  if (!toast) return null;

  return (
    <div className="fixed top-10 right-10 z-[90]">
      <div className="animate-slide-in notification-glow green-edge-left relative flex min-w-[260px] items-center gap-4 border border-[var(--color-border)] bg-[var(--color-surface-overlay)] px-6 py-4 text-[var(--color-text-primary)] backdrop-blur-md">
        <span className="flex items-center justify-center text-[var(--color-primary)]">
          {toast.variant === "info" ? <Loader2 size={24} className="animate-spin" /> : variantIcons[toast.variant ?? "success"]}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-light leading-tight tracking-[0.08em]">{toast.title}</span>
          {toast.subtitle ? (
            <span className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--color-primary)] opacity-60">
              {toast.subtitle}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="关闭"
          onClick={hideToast}
          className="absolute -top-1 -right-1 rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
