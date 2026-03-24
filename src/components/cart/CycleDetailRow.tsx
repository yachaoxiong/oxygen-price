"use client";

import { Dumbbell } from "lucide-react";

import { NumberInput } from "@/components/ui/NumberInput";
type CycleDetailRowProps = {
  name: string;
  preset?: string;
  qty: number;
  unitPrice: number;
  onQtyChange: (value: number) => void;
  onUnitPriceChange: (value: number) => void;
};

export function CycleDetailRow({
  name,
  preset,
  qty,
  unitPrice,
  onQtyChange,
  onUnitPriceChange,
}: CycleDetailRowProps) {
  const [primaryName, subtitleName] = name.split(" / ");

  return (
    <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-12 sm:items-end sm:gap-4">
      <div className="sm:col-span-5">
        <div className="flex flex-wrap items-center gap-2">
          <Dumbbell size={12} className="text-muted-foreground" />
          <span className="text-xs font-bold text-foreground break-words">{primaryName}</span>
          {preset && <span className="rounded border border-border/70 bg-card px-1 text-[9px] text-foreground/80">{preset}</span>}
        </div>
        {subtitleName && <p className="mt-1 ml-5 text-[10px] text-muted-foreground">{subtitleName}</p>}
      </div>
      <div className="sm:col-span-3 space-y-1">
        <label className="block pl-1 text-[9px] text-muted-foreground">数量</label>
        <NumberInput
          className="input-subdued w-full rounded-lg px-2 py-1.5 text-center text-[11px] font-medium text-foreground"
          value={qty}
          min={1}
          allowDecimal={false}
          onChange={onQtyChange}
        />
      </div>
      <div className="sm:col-span-4 space-y-1">
        <label className="block pl-1 text-[9px] text-muted-foreground">单价</label>
        <NumberInput
          className="input-subdued w-full rounded-lg px-2 py-1.5 text-right text-[11px] font-mono text-foreground"
          value={unitPrice}
          min={0}
          allowDecimal={true}
          onChange={onUnitPriceChange}
        />
      </div>
    </div>
  );
}
