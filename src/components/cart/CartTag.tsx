"use client";

type CartTagProps = {
  label: string;
  tone?: "cyan" | "slate" | "amber" | "indigo" | "emerald" | "sky" | "violet";
};

export function CartTag({ label, tone = "slate" }: CartTagProps) {
  const toneClass =
    tone === "cyan"
      ? "border-border/70 bg-card text-foreground"
      : tone === "amber"
        ? "border-border/70 bg-card text-foreground"
        : tone === "indigo"
          ? "border-border/70 bg-card text-foreground"
          : tone === "emerald"
            ? "border-border/70 bg-card text-foreground"
            : tone === "sky"
              ? "border-border/70 bg-card text-foreground"
              : tone === "violet"
                ? "border-border/70 bg-card text-foreground"
                : "border-border/70 bg-card text-muted-foreground";

  return (
    <span
      className={`text-[9px] font-semibold uppercase tracking-[0.18em] px-2 py-0.5 rounded border ${toneClass}`}
    >
      {label}
    </span>
  );
}
