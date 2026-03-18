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
          <Dumbbell size={12} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-200 break-words">{primaryName}</span>
          {preset && <span className="text-[9px] text-slate-600 bg-white/5 px-1 rounded">{preset}</span>}
        </div>
        {subtitleName && <p className="mt-1 text-[10px] text-slate-500 ml-5">{subtitleName}</p>}
      </div>
      <div className="sm:col-span-3 space-y-1">
        <label className="text-[9px] text-slate-600 block pl-1">数量</label>
        <NumberInput
          className="input-subdued w-full rounded-lg text-[11px] text-slate-300 px-2 py-1.5 text-center font-medium"
          value={qty}
          min={1}
          allowDecimal={false}
          onChange={onQtyChange}
        />
      </div>
      <div className="sm:col-span-4 space-y-1">
        <label className="text-[9px] text-slate-600 block pl-1">单价</label>
        <NumberInput
          className="input-subdued w-full rounded-lg text-[11px] text-slate-300 px-2 py-1.5 text-right font-mono"
          value={unitPrice}
          min={0}
          allowDecimal={true}
          onChange={onUnitPriceChange}
        />
      </div>
    </div>
  );
}
