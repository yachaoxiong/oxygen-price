import { Activity, ChevronRight, Dumbbell, Users, X } from "lucide-react";

import { personalTrainingProgramInfo } from "@/lib/pricing/constants";
import { cycleCopy } from "@/lib/copy/cycleCopy";
import { formatMoney } from "@/lib/formatters/number";
import type { CycleCourseSelection, CyclePlanRow, PtPreset, PtRow } from "@/types/pricing";
import { CycleReportStep } from "@/components/modals/CycleReportStep";
import { NumberInput } from "@/components/ui/NumberInput";

type CyclePlanModalProps = {
  selectedCyclePlan: CyclePlanRow | null;
  activeLocale: "zh" | "en";
  cycleStep: 1 | 2 | 3;
  cyclePtProgramOptions: PtRow[];
  cycleSelectedPtProgram: PtRow | null;
  cycleSelectedCourses: CycleCourseSelection[];
  cycleClientName: string;
  cycleCreditInputStr: string;
  cycleCredit: number;
  cycleSubtotal: number;
  cycleAfterCredit: number;
  cycleTax: number;
  cycleTotal: number;
  cycleCopied: boolean;
  cycleActivePresetUnit: number;
  cycleActivePresetQty: number;
  onClose: () => void;
  onSetCycleStep: (step: 1 | 2 | 3) => void;
  onSelectProgramAndContinue: (row: PtRow) => void;
  onSetCycleSelectedCourses: (courses: CycleCourseSelection[]) => void;
  onSetCycleClientName: (value: string) => void;
  onSetCycleCreditInputStr: (value: string) => void;
  onSetCycleCredit: (value: number) => void;
  onCopySummary: () => void;
  onDownloadPdf: () => void;
  onAddToCart: () => void;
};

export function CyclePlanModal(props: CyclePlanModalProps) {
  const {
    selectedCyclePlan,
    activeLocale,
    cycleStep,
    cyclePtProgramOptions,
    cycleSelectedPtProgram,
    cycleSelectedCourses,
    cycleClientName,
    cycleCreditInputStr,
    cycleCredit,
    cycleSubtotal,
    cycleAfterCredit,
    cycleTax,
    cycleTotal,
    cycleCopied,
    cycleActivePresetUnit,
    cycleActivePresetQty,
    onClose,
    onSetCycleStep,
    onSelectProgramAndContinue,
    onSetCycleSelectedCourses,
    onSetCycleClientName,
    onSetCycleCreditInputStr,
    onSetCycleCredit,
    onCopySummary,
    onDownloadPdf,
    onAddToCart,
  } = props;

  const copy = cycleCopy[activeLocale];
  if (!selectedCyclePlan) return null;

  const selectedCycleProgramName = activeLocale === "zh" ? selectedCyclePlan.programZh : selectedCyclePlan.programEn ?? selectedCyclePlan.programZh;

  return (
    <div className="fixed inset-0 z-[58] flex items-center justify-center bg-[var(--modal-backdrop)] px-4 py-6 backdrop-blur">
      <div className="glass-panel flex w-full max-w-6xl flex-col overflow-hidden rounded-[40px] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.01] px-10 py-7">
          <div className="flex items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
              <Users size={22} className="text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-500">{copy.cycleProgram}</span>
                <div className="h-px w-6 bg-cyan-500/20" />
              </div>
              <h3 className="mt-0.5 text-xl font-bold text-white tracking-tight">{selectedCycleProgramName}</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                {activeLocale === "zh" ? `步骤 ${cycleStep} / 3` : `Step ${cycleStep} / 3`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
            {copy.close}
          </button>
        </div>

        <div className="flex max-h-[88vh] flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
            <div className="mb-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 text-[11px]">
              {[
                [1, copy.step1],
                [2, copy.step2],
                [3, copy.step3],
              ].map(([step, label]) => (
                <div
                  key={String(step)}
                  className={`px-3 py-2.5 text-center ${cycleStep >= Number(step) ? "bg-cyan-500/15 text-cyan-100" : "bg-black/20 text-slate-400"}`}
                >
                  {activeLocale === "zh" ? `步骤 ${step} · ${label}` : `Step ${step} · ${label}`}
                </div>
              ))}
            </div>

        {cycleStep === 1 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                {copy.selectProgram}
              </h4>
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-slate-600">
                {cycleSelectedCourses.length}
              </span>
            </div>
            <div className="mb-2 grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-x-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              <span>{copy.programColumn}</span>
              <span className="text-center text-emerald-500/80">1v1 {copy.member}</span>
              <span className="text-center text-amber-500/80">1v1 {copy.nonMember}</span>
              <span className="text-center text-emerald-500/60">1v2 {copy.member}</span>
              <span className="text-center text-amber-500/60">1v2 {copy.nonMember}</span>
            </div>
            <div className="space-y-3">
              {cyclePtProgramOptions.map((row, idx) => {
                const info = personalTrainingProgramInfo[row.nameZh];
                const ProgramIcon = info?.icon ?? Activity;
                const isSelected = cycleSelectedCourses.some((course) => course.program.key === row.key);
                return (
                  <button
                    key={row.key}
                    onClick={() => {
                      if (isSelected) {
                        onSetCycleSelectedCourses(cycleSelectedCourses.filter((course) => course.program.key !== row.key));
                      } else {
                        onSetCycleSelectedCourses([
                          ...cycleSelectedCourses,
                          {
                            program: row,
                            preset: "member_1v1",
                            unitPrice: row.member1v1 ?? 0,
                            qty: 12,
                          },
                        ]);
                      }
                    }}
                    className={`glass-card group grid w-full grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-x-3 rounded-2xl px-3 py-3 text-left transition ${
                      isSelected
                        ? "border-cyan-400/70 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                        : "border-white/5 bg-white/[0.02] hover:border-cyan-500/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-5 shrink-0 font-mono text-[10px] text-slate-600">{String(idx + 1).padStart(2, "0")}</span>
                      <div className={`shrink-0 rounded-lg border p-2 transition-colors ${
                        isSelected
                          ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                          : "border-white/10 bg-black/40 text-slate-300 group-hover:border-cyan-400/30 group-hover:text-cyan-300"
                      }`}>
                        <ProgramIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[13px] font-semibold text-white/90">
                            {activeLocale === "zh" ? row.nameZh : row.nameEn ?? row.nameZh}
                          </p>
                          {isSelected && (
                            <span className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                              {activeLocale === "zh" ? "已选" : "Selected"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-[13px] font-semibold text-emerald-300">{formatMoney(row.member1v1)}</p>
                    <p className="text-center text-[13px] font-semibold text-amber-300">{formatMoney(row.nonMember1v1)}</p>
                    <p className="text-center text-[13px] font-medium text-emerald-400/80">{formatMoney(row.member1v2)}</p>
                    <p className="text-center text-[13px] font-medium text-amber-400/80">{formatMoney(row.nonMember1v2)}</p>
                  </button>
                );
              })}
            </div>
            {cyclePtProgramOptions.length === 0 && (
              <p className="glass-card mt-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-slate-300">
                {copy.noPrograms}
              </p>
            )}
            {cyclePtProgramOptions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (cycleSelectedCourses.length > 0) {
                    onSelectProgramAndContinue(cycleSelectedCourses[0].program);
                  }
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#04070b] shadow-xl shadow-cyan-500/10 transition-all hover:bg-cyan-400 active:scale-[0.99]"
                disabled={cycleSelectedCourses.length === 0}
              >
                {copy.next}
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}

        {cycleStep === 2 && (
          <>
            <p className="mb-4 text-sm text-slate-300">
              {activeLocale === "zh" ? "为每门课程选择方案与课时" : "Choose a plan & sessions for each course"}
            </p>

            {cycleSelectedCourses.length === 0 ? (
              <div className="glass-card rounded-2xl border border-white/10 bg-black/30 px-5 py-6 text-sm text-slate-400">
                {activeLocale === "zh" ? "未选择课程，请返回上一步。" : "No courses selected. Go back to select courses."}
              </div>
            ) : (
              <div className="space-y-4">
                {cycleSelectedCourses.map((course) => {
                  const row = course.program;
                  const labels = {
                    member_1v1: copy.member1v1 ?? `${copy.member} 1v1`,
                    non_member_1v1: copy.nonMember1v1 ?? (activeLocale === "zh" ? "非会员 1v1" : "Non-member 1v1"),
                    member_1v2: copy.member1v2 ?? (activeLocale === "zh" ? "会员 1v2" : "Member 1v2"),
                    non_member_1v2: copy.nonMember1v2 ?? (activeLocale === "zh" ? "非会员 1v2" : "Non-member 1v2"),
                  };
                  const priceMap = {
                    member_1v1: row.member1v1 ?? 0,
                    non_member_1v1: row.nonMember1v1 ?? 0,
                    member_1v2: row.member1v2 ?? 0,
                    non_member_1v2: row.nonMember1v2 ?? 0,
                  };

                  return (
                    <div key={row.key} className="glass-card rounded-3xl border border-white/5 bg-white/[0.02] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-500/10 text-cyan-100">
                            <Dumbbell size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {activeLocale === "zh" ? row.nameZh : row.nameEn ?? row.nameZh}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {activeLocale === "zh" ? "选择方案与课时" : "Select pricing & sessions"}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                          {labels[course.preset]}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                        <div className="space-y-4">
                          <div className="grid gap-3.5 sm:grid-cols-2">
                            {(Object.keys(priceMap) as PtPreset[]).map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  onSetCycleSelectedCourses(
                                    cycleSelectedCourses.map((item) =>
                                      item.program.key === row.key
                                        ? { ...item, preset, unitPrice: priceMap[preset] }
                                        : item,
                                    ),
                                  );
                                }}
                                className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 text-[12px] transition ${
                                  course.preset === preset
                                    ? "border-cyan-300/60 bg-cyan-500/16 text-cyan-100"
                                    : "border-white/12 bg-white/[0.03] text-slate-300 hover:border-cyan-300/30"
                                }`}
                              >
                                <span>{labels[preset]}</span>
                                <span className="text-[12px] font-semibold text-emerald-200">{formatMoney(priceMap[preset])}</span>
                              </button>
                            ))}
                          </div>

                          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">{copy.subtotal}</p>
                                <p className="mt-1 text-base font-semibold text-emerald-100">
                                  {formatMoney(course.unitPrice * course.qty)}
                                </p>
                              </div>
                              <p className="text-[11px] text-emerald-200/70">
                                {formatMoney(course.unitPrice)} × {course.qty}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                          <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            {copy.unit}
                            <NumberInput
                              className="input-subdued mt-2 w-full rounded-xl px-3 py-2 text-sm text-slate-100"
                              value={course.unitPrice}
                              min={0}
                              allowDecimal={true}
                              onChange={(value) => {
                                onSetCycleSelectedCourses(
                                  cycleSelectedCourses.map((item) =>
                                    item.program.key === row.key
                                      ? { ...item, unitPrice: value }
                                      : item,
                                  ),
                                );
                              }}
                            />
                          </label>

                          <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{copy.sessions}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {[6, 12, 18, 24].map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => {
                                    onSetCycleSelectedCourses(
                                      cycleSelectedCourses.map((item) =>
                                        item.program.key === row.key
                                          ? { ...item, qty: value }
                                          : item,
                                      ),
                                    );
                                  }}
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                                    course.qty === value
                                      ? "border-cyan-300/60 bg-cyan-500/16 text-cyan-100"
                                      : "border-white/12 bg-white/[0.04] text-slate-300 hover:border-cyan-300/30"
                                  }`}
                                >
                                  {value}
                                </button>
                              ))}
                            </div>
                            <NumberInput
                              className="input-subdued mt-2 w-full rounded-xl px-3 py-2 text-sm text-slate-100"
                              value={course.qty}
                              min={1}
                              allowDecimal={false}
                              onChange={(value) => {
                                onSetCycleSelectedCourses(
                                  cycleSelectedCourses.map((item) =>
                                    item.program.key === row.key
                                      ? { ...item, qty: value }
                                      : item,
                                  ),
                                );
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                  <span className="h-1 w-1 rounded-full bg-slate-600" />
                  {activeLocale === "zh" ? "客户信息" : "Client Info"}
                </h3>
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {copy.clientName}
                    </label>
                    <input
                      value={cycleClientName}
                      onChange={(e) => onSetCycleClientName(e.target.value)}
                      className="input-subdued mt-2 w-full rounded-xl px-3 py-2 text-sm text-slate-100"
                      placeholder={copy.clientPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {copy.credit}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cycleCreditInputStr}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (!/^\d*$/.test(raw)) return;
                        onSetCycleCreditInputStr(raw);
                        onSetCycleCredit(raw === "" ? 0 : parseInt(raw, 10));
                      }}
                      onBlur={() => {
                        const n = cycleCreditInputStr === "" ? 0 : parseInt(cycleCreditInputStr, 10);
                        onSetCycleCreditInputStr(String(n));
                        onSetCycleCredit(n);
                      }}
                      className="input-subdued mt-2 w-full rounded-xl px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="glass-card relative flex h-full flex-col overflow-hidden rounded-[28px] border border-cyan-500/10 bg-white/[0.01] p-6">
                  <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-500/5 blur-[60px]" />
                  <div className="relative mb-6 flex items-center justify-between">
                    <h2 className="text-base font-bold text-white tracking-tight">{copy.total}</h2>
                    <span className="rounded-full border border-cyan-400/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                      CAD
                    </span>
                  </div>
                  <div className="relative mb-auto space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{copy.subtotal}</span>
                      <span className="font-semibold text-white">{formatMoney(cycleSubtotal)}</span>
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
                </div>
              </section>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onSetCycleStep(1)}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-white"
              >
                <ChevronRight size={14} className="rotate-180" />
                {copy.back}
              </button>
              <button
                onClick={onAddToCart}
                className="rounded-2xl border border-white/5 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-200 transition-all hover:bg-white/10"
              >
                {activeLocale === "zh" ? "加入报价" : "Add to Cart"}
              </button>
              <button
                onClick={() => onSetCycleStep(3)}
                className="flex-1 rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-[#04070b] shadow-xl shadow-cyan-500/10 transition-all hover:bg-cyan-400 active:scale-[0.99]"
              >
                {activeLocale === "zh" ? "下一步：生成完整报告" : "Next: Generate Report"}
              </button>
            </div>
          </>
        )}

        {cycleStep === 3 && cycleSelectedPtProgram && selectedCyclePlan && (
          <CycleReportStep
            selectedCyclePlan={selectedCyclePlan}
            cycleSelectedPtProgram={cycleSelectedPtProgram}
            cycleSelectedCourses={cycleSelectedCourses}
            activeLocale={activeLocale}
            cycleActivePresetUnit={cycleActivePresetUnit}
            cycleActivePresetQty={cycleActivePresetQty}
            cycleSubtotal={cycleSubtotal}
            cycleCredit={cycleCredit}
            cycleAfterCredit={cycleAfterCredit}
            cycleTax={cycleTax}
            cycleTotal={cycleTotal}
            cycleCopied={cycleCopied}
            onBack={() => onSetCycleStep(2)}
            onCopySummary={onCopySummary}
            onDownloadPdf={onDownloadPdf}
          />
        )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-black/40 px-10 py-5 text-[9px] font-medium tracking-wider text-slate-700">
          <p>© 2026 Oxygen 报价系统 · 销售报价模块</p>
          <p>{activeLocale === "zh" ? "最后更新:" : "Last updated:"} {new Date().toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}</p>
        </div>
      </div>
    </div>
  );
}
