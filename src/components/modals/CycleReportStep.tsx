import { ChevronRight } from "lucide-react";

import { cycleCopy } from "@/lib/copy/cycleCopy";
import { formatMoney } from "@/lib/formatters/number";
import type { CycleCourseSelection, CyclePlanRow, PtRow } from "@/types/pricing";

type CycleReportStepProps = {
  selectedCyclePlan: CyclePlanRow;
  cycleSelectedPtProgram: PtRow;
  cycleSelectedCourses: CycleCourseSelection[];
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
  cycleSelectedCourses = [],
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

  const detailCourses = cycleSelectedCourses.length
    ? cycleSelectedCourses
    : [{ program: cycleSelectedPtProgram, unitPrice: cycleActivePresetUnit, qty: cycleActivePresetQty }];

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/40">
              <span className="h-1 w-1 rounded-full bg-cyan-500" />
              {copy.pricingBreakdown}
            </h3>
            <div className="glass-card rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-white/[0.05] px-3 py-2 text-[11px] text-muted-foreground">
                <p>{copy.item}</p>
                <p>{copy.unit}</p>
                <p>{copy.qty}</p>
                <p>{copy.subtotal}</p>
              </div>
              {detailCourses.map((course) => (
                <div
                  key={course.program.key}
                  className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-t border-border/70 px-3 py-2 text-sm"
                >
                  <p className="text-foreground/80">
                    {activeLocale === "zh" ? course.program.nameZh : course.program.nameEn ?? course.program.nameZh}
                  </p>
                  <p className="text-muted-foreground">{formatMoney(course.unitPrice)}</p>
                  <p className="text-muted-foreground">{course.qty}</p>
                  <p className="font-medium text-foreground">{formatMoney(course.unitPrice * course.qty)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/40">
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              {activeLocale === "zh" ? "方案亮点" : "Plan Highlights"}
            </h3>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div className="glass-card rounded-lg border border-white/10 bg-card/70 px-3 py-2">
                <span className="text-muted-foreground">{copy.weeklySessions}：</span>
                <span className="text-foreground font-medium">{selectedCyclePlan.weeklySessions}</span>
              </div>
              <div className="glass-card rounded-lg border border-border/70 bg-card/70 px-3 py-2">
                <span className="text-muted-foreground">{copy.minSessions}：</span>
                <span className="text-foreground font-medium">{selectedCyclePlan.minSessions}</span>
              </div>
              <div className="glass-card rounded-lg border border-border/70 bg-card/70 px-3 py-2">
                <span className="text-muted-foreground">{copy.followups}：</span>
                <span className="text-foreground font-medium">{selectedCyclePlan.wpdFollowups}</span>
              </div>
              <div className="glass-card rounded-lg border border-border/70 bg-card/70 px-3 py-2">
                <span className="text-muted-foreground">{copy.assessments}：</span>
                <span className="text-foreground font-medium">{selectedCyclePlan.assessmentsReports}</span>
              </div>
              <div className="glass-card rounded-lg border border-border/70 bg-card px-3 py-2 md:col-span-2">
                <span className="text-foreground">
                  {copy.membershipGift}：{activeLocale === "zh" ? selectedCyclePlan.membershipGiftZh : selectedCyclePlan.membershipGiftEn}
                </span>
              </div>
              <div className="glass-card rounded-lg border border-border/70 bg-card px-3 py-2 md:col-span-2">
                <span className="text-foreground">
                  {copy.extraBenefits}：{activeLocale === "zh" ? selectedCyclePlan.extraBenefitsZh : selectedCyclePlan.extraBenefitsEn}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="glass-card relative flex h-full flex-col overflow-hidden rounded-[28px] border border-cyan-500/10 bg-white/[0.01] p-6">
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-500/5 blur-[60px]" />
            <div className="relative mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground tracking-tight">{copy.total}</h2>
              <span className="rounded-full border border-cyan-400/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/80">
                CAD
              </span>
            </div>
            <div className="relative mb-auto space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{copy.subtotal}</span>
                <span className="font-semibold text-white">{formatMoney(cycleSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{copy.credit}</span>
                <span className="font-semibold text-white">{formatMoney(cycleCredit)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{copy.afterCredit}</span>
                <span className="font-semibold text-white">{formatMoney(cycleAfterCredit)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{copy.tax} (13%)</span>
                <span className="font-semibold text-cyan-300">{formatMoney(cycleTax)}</span>
              </div>
              <div className="mt-4 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                    Grand Total
                  </span>
                  <span className="text-3xl font-black tracking-tight text-white">
                    {formatMoney(cycleTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative mt-8 space-y-3">
              <div className="relative">
                <button
                  onClick={onCopySummary}
                  className="w-full rounded-2xl bg-cyan-500 py-3 text-xs font-black uppercase tracking-widest text-[#04070b] shadow-xl shadow-cyan-500/10 transition-all hover:bg-cyan-400"
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
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/5 py-3 text-xs font-bold uppercase tracking-widest text-foreground/80 transition-all hover:bg-white/10"
              >
                {copy.downloadPdf}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-white"
        >
          <ChevronRight size={14} className="rotate-180" />
          {copy.back}
        </button>
      </div>
    </>
  );
}
