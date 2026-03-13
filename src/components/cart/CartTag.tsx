"use client";

type CartTagProps = {
  label: string;
  tone?: "cyan" | "slate";
};

export function CartTag({ label, tone = "slate" }: CartTagProps) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
      : "border-white/10 bg-white/5 text-slate-500";

  return (
    <span
      className={`text-[9px] font-semibold uppercase tracking-[0.18em] px-2 py-0.5 rounded border ${toneClass}`}
    >
      {label}
    </span>
  );
}
