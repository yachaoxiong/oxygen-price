"use client";

type CartStatRowProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

export function CartStatRow({ label, value, highlight }: CartStatRowProps) {
  return (
    <div
      className={`flex items-center justify-between text-[13px] ${
        highlight ? "text-white" : "text-slate-500"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className={`font-mono ${highlight ? "text-[color:var(--theme-green)] font-semibold" : "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}
