"use client";

type CartTagProps = {
  label: string;
  tone?: "cyan" | "slate" | "amber" | "indigo" | "emerald" | "sky" | "violet";
};

export function CartTag({ label, tone = "slate" }: CartTagProps) {
  const toneClass =
    tone === "cyan"
      ? "border-[color:var(--theme-green-soft)] bg-[color:var(--theme-green-faint)] text-[color:var(--theme-green)]"
      : tone === "amber"
        ? "border-amber-300/40 bg-amber-500/20 text-amber-100"
        : tone === "indigo"
          ? "border-indigo-400/35 bg-indigo-500/15 text-indigo-100"
          : tone === "emerald"
            ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
            : tone === "sky"
              ? "border-sky-400/35 bg-sky-500/15 text-sky-100"
              : tone === "violet"
                ? "border-violet-400/35 bg-violet-500/15 text-violet-100"
                : "border-white/20 bg-white/12 text-slate-200";

  return (
    <span
      className={`text-[9px] font-semibold uppercase tracking-[0.18em] px-2 py-0.5 rounded border ${toneClass}`}
    >
      {label}
    </span>
  );
}
