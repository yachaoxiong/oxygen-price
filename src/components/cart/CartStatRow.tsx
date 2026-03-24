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
        highlight ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className={`font-mono ${highlight ? "text-foreground font-semibold" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
