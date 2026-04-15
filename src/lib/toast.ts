"use client";

import { useEffect, useState } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export type ToastInput = {
  title: string;
  subtitle?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastState = Required<Pick<ToastInput, "title">> & Pick<ToastInput, "subtitle" | "variant" | "durationMs">;

type ToastListener = (toast: ToastState | null) => void;

const DEFAULT_DURATION_MS = 2200;
const listeners = new Set<ToastListener>();
let activeToast: ToastState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function notify(nextToast: ToastState | null) {
  activeToast = nextToast;
  listeners.forEach((listener) => listener(nextToast));
}

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

export function showToast(input: ToastInput) {
  if (typeof window === "undefined") return;

  clearTimer();
  const nextToast: ToastState = {
    title: input.title,
    subtitle: input.subtitle,
    variant: input.variant ?? "success",
    durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
  };

  notify(nextToast);
  timer = setTimeout(() => {
    clearTimer();
    notify(null);
  }, nextToast.durationMs);
}

export function hideToast() {
  if (typeof window === "undefined") return;
  clearTimer();
  notify(null);
}

export function useToastState() {
  const [toast, setToast] = useState<ToastState | null>(activeToast);

  useEffect(() => {
    const listener: ToastListener = (nextToast) => setToast(nextToast);
    listeners.add(listener);
    setToast(activeToast);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { toast, hideToast };
}

export const toastMessages = {
  add: "添加成功",
  update: "更新成功",
  delete: "删除成功",
  save: "保存成功",
  submitFailed: "操作失败，请重试",
  networkError: "网络异常，请稍后再试",
  validationFailed: "校验失败，请检查后重试",
  addedToQuote: "已加入报价",
  updatedToQuote: "已更新报价",
  deletedFromQuote: "已删除报价",
};

export function toastSuccess(title: string, subtitle?: string) {
  showToast({ title, subtitle, variant: "success" });
}

export function toastAddSuccess(subtitle?: string) {
  showToast({ title: toastMessages.add, subtitle, variant: "success" });
}

export function toastUpdateSuccess(subtitle?: string) {
  showToast({ title: toastMessages.update, subtitle, variant: "success" });
}

export function toastDeleteSuccess(subtitle?: string) {
  showToast({ title: toastMessages.delete, subtitle, variant: "success" });
}

export function toastSaveSuccess(subtitle?: string) {
  showToast({ title: toastMessages.save, subtitle, variant: "success" });
}

export function toastFailed(subtitle = toastMessages.submitFailed) {
  showToast({ title: subtitle, variant: "error" });
}

export function toastNetworkError() {
  showToast({ title: toastMessages.networkError, variant: "error" });
}
