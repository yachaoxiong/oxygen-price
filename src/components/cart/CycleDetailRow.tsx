"use client";

import type { ChangeEvent } from "react";
import { Dumbbell } from "lucide-react";

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
  return (
    <div className="grid grid-cols-12 gap-4 items-end py-1">
      <div className="col-span-5">
        <div className="flex items-center gap-2 mb-2">
          <Dumbbell size={12} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-200">{name}</span>
          {preset && <span className="text-[9px] text-slate-600 bg-white/5 px-1 rounded">{preset}</span>}
        </div>
      </div>
      <div className="col-span-3 space-y-1">
        <label className="text-[9px] text-slate-600 block pl-1">数量</label>
        <input
          className="input-subdued w-full rounded-lg text-[11px] text-slate-300 px-2 py-1.5 text-center font-medium"
          type="number"
          value={qty}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onQtyChange(Number(event.target.value) || 1)}
        />
      </div>
      <div className="col-span-4 space-y-1">
        <label className="text-[9px] text-slate-600 block pl-1">单价</label>
        <input
          className="input-subdued w-full rounded-lg text-[11px] text-slate-300 px-2 py-1.5 text-right font-mono"
          type="number"
          value={unitPrice}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onUnitPriceChange(Number(event.target.value) || 0)}
        />
      </div>
    </div>
  );
}
