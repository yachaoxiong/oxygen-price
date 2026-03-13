"use client";

import type { ChangeEvent } from "react";

type CartFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number" | "tel";
  placeholder?: string;
  inputMode?: "text" | "numeric" | "tel";
  className?: string;
};

export function CartField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  className,
}: CartFieldProps) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`input-subdued w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 ${
          className ?? ""
        }`}
      />
    </label>
  );
}
