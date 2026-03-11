import { ChevronRight } from "lucide-react";

import { cycleCopy } from "@/lib/copy/cycleCopy";
import { formatMoney } from "@/lib/formatters/number";
import type { CyclePlanRow, PtRow } from "@/types/pricing";

type CycleReportStepProps = {
  selectedCyclePlan: CyclePlanRow;
  cycleSelectedPtProgram: PtRow;
  activeLocale: "zh" | "en";
  cycleActivePresetUnit: number;
  cycleActivePresetQty: number;
  cycleSubtotal: number;
  cycleCredit: number;
  cycleAfterCredit: number;
  cycleTax: number;
  cycleTotal: number;
  cycleCopied: boolean;
  onBack: () => void;
  onCopySummary: () => void;
  onDownloadPdf: () => void;
};

export function CycleReportStep({
  selectedCyclePlan,
  cycleSelectedPtProgram,
  activeLocale,
  cycleActivePresetUnit,
  cycleActivePresetQty,
  cycleSubtotal,
  cycleCredit,
  cycleAfterCredit,
  cycleTax,
  cycleTotal,
  cycleCopied,
  onBack,
  onCopySummary,
  onDownloadPdf,
}: CycleReportStepProps) {
  if (!selectedCyclePlan) return null;

  const copy = cycleCopy[activeLocale];
  const ptProgramName = activeLocale === "zh" ? cycleSelectedPtProgram.nameZh : cycleSelectedPtProgram.nameEn ?? cycleSelectedPtProgram.nameZh;

  return (
    <>
      <div className="mb-4 grid gap-2 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"><span className="text-slate-400">{copy.weeklySessions}：</span><span className="text-cyan-100 font-medium">{selectedCyclePlan.weeklySessions}</span></div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"><span className="text-slate-400">{copy.minSessions}：</span><span className="text-cyan-100 font-medium">{selectedCyclePlan.minSessions}</span></div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"><span className="text-slate-400">{copy.followups}：</span><span className="text-cyan-100 font-medium">{selectedCyclePlan.wpdFollowups}</span></div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"><span className="text-slate-400">{copy.assessments}：</span><span className="text-cyan-100 font-medium">{selectedCyclePlan.assessmentsReports}</span></div>
        <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 md:col-span-2"><span className="text-emerald-100">{copy.membershipGift}：{activeLocale === "zh" ? selectedCyclePlan.membershipGiftZh : selectedCyclePlan.membershipGiftEn}</span></div>
        <div className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 md:col-span-2"><span className="text-cyan-100">{copy.extraBenefits}：{activeLocale === "zh" ? selectedCyclePlan.extraBenefitsZh : selectedCyclePlan.extraBenefitsEn}</span></div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 md:col-span-2"><span className="text-slate-400">{copy.ptProgram}：</span><span className="text-cyan-100 font-medium">{ptProgramName}</span></div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="mb-2 text-sm font-medium text-slate-100">{copy.pricingBreakdown}</p>
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-white/[0.05] px-3 py-2 text-[11px] text-slate-400">
          <p>{copy.item}</p><p>{copy.unit}</p><p>{copy.qty}</p><p>{copy.subtotal}</p>
        </div>
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-t border-white/10 bg-cyan-500/10 px-3 py-2 text-sm">
          <p className="text-slate-200">{copy.cyclePlan}</p>
          <p className="text-slate-300">{formatMoney(cycleActivePresetUnit)}</p>
          <p className="text-slate-300">{cycleActivePresetQty}</p>
          <p className="font-medium text-cyan-100">{formatMoney(cycleSubtotal)}</p>
        </div>

        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"><p className="text-[11px] text-slate-400">{copy.credit}</p><p className="font-medium text-cyan-200">{formatMoney(cycleCredit)}</p></div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"><p className="text-[11px] text-slate-400">{copy.afterCredit}</p><p className="font-medium text-cyan-200">{formatMoney(cycleAfterCredit)}</p></div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"><p className="text-[11px] text-slate-400">{copy.tax} (13%)</p><p className="font-medium text-cyan-200">{formatMoney(cycleTax)}</p></div>
          <div className="rounded-lg border border-emerald-300/35 bg-emerald-500/12 px-3 py-2"><p className="text-[11px] text-slate-300">{copy.total}</p><p className="text-2xl font-bold text-emerald-100">{formatMoney(cycleTotal)}</p></div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.08]"
        >
          <ChevronRight size={14} className="rotate-180" />
          {copy.back}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              onClick={onCopySummary}
              className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-slate-100 hover:bg-white/10"
            >
              {cycleCopied ? `${copy.copied} ✓` : copy.copySummary}
            </button>
            {cycleCopied && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-700 px-2 py-1 text-[11px] text-slate-100 shadow-lg">
                {copy.copiedHint}
              </span>
            )}
          </div>
          <button
            onClick={onDownloadPdf}
            className="rounded-lg bg-cyan-400 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            {copy.downloadPdf}
          </button>
        </div>
      </div>
    </>
  );
}
