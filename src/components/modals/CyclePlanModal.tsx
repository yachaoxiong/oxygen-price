import { Activity, ChevronRight, User, Users, X } from "lucide-react";

import { personalTrainingProgramInfo } from "@/lib/pricing/constants";
import { getPresetUnitAndQty } from "@/lib/pricing/calculate";
import { cycleCopy } from "@/lib/copy/cycleCopy";
import { formatMoney } from "@/lib/formatters/number";
import type { CyclePlanRow, PtPreset, PtRow } from "@/types/pricing";
import { CycleReportStep } from "@/components/modals/CycleReportStep";

type CyclePlanModalProps = {
  selectedCyclePlan: CyclePlanRow | null;
  activeLocale: "zh" | "en";
  cycleStep: 1 | 2 | 3;
  cyclePtProgramOptions: PtRow[];
  cycleSelectedPtProgram: PtRow | null;
  cyclePtPreset: PtPreset;
  cycleClientName: string;
  cycleUnitInputStr: string;
  cycleQtyInputStr: string;
  cycleCreditInputStr: string;
  cycleUnitMember1v1: number;
  cycleUnitNonMember1v1: number;
  cycleUnitMember1v2: number;
  cycleUnitNonMember1v2: number;
  cycleQtyMember1v1: number;
  cycleQtyNonMember1v1: number;
  cycleQtyMember1v2: number;
  cycleQtyNonMember1v2: number;
  cycleCredit: number;
  cycleActiveLabel: string;
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
  onSetCyclePtPreset: (preset: PtPreset) => void;
  onSetCycleQtyMember1v1: (value: number) => void;
  onSetCycleQtyNonMember1v1: (value: number) => void;
  onSetCycleQtyMember1v2: (value: number) => void;
  onSetCycleQtyNonMember1v2: (value: number) => void;
  onSetCycleUnitInputStr: (value: string) => void;
  onSetCycleQtyInputStr: (value: string) => void;
  onSetCycleClientName: (value: string) => void;
  onSetCycleUnitMember1v1: (value: number) => void;
  onSetCycleUnitNonMember1v1: (value: number) => void;
  onSetCycleUnitMember1v2: (value: number) => void;
  onSetCycleUnitNonMember1v2: (value: number) => void;
  onSetCycleCreditInputStr: (value: string) => void;
  onSetCycleCredit: (value: number) => void;
  onCopySummary: () => void;
  onDownloadPdf: () => void;
};

export function CyclePlanModal(props: CyclePlanModalProps) {
  const {
    selectedCyclePlan,
    activeLocale,
    cycleStep,
    cyclePtProgramOptions,
    cycleSelectedPtProgram,
    cyclePtPreset,
    cycleClientName,
    cycleUnitInputStr,
    cycleQtyInputStr,
    cycleCreditInputStr,
    cycleUnitMember1v1,
    cycleUnitNonMember1v1,
    cycleUnitMember1v2,
    cycleUnitNonMember1v2,
    cycleQtyMember1v1,
    cycleQtyNonMember1v1,
    cycleQtyMember1v2,
    cycleQtyNonMember1v2,
    cycleCredit,
    cycleActiveLabel,
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
    onSetCyclePtPreset,
    onSetCycleQtyMember1v1,
    onSetCycleQtyNonMember1v1,
    onSetCycleQtyMember1v2,
    onSetCycleQtyNonMember1v2,
    onSetCycleUnitInputStr,
    onSetCycleQtyInputStr,
    onSetCycleClientName,
    onSetCycleUnitMember1v1,
    onSetCycleUnitNonMember1v1,
    onSetCycleUnitMember1v2,
    onSetCycleUnitNonMember1v2,
    onSetCycleCreditInputStr,
    onSetCycleCredit,
    onCopySummary,
    onDownloadPdf,
  } = props;

  const copy = cycleCopy[activeLocale];
  if (!selectedCyclePlan) return null;

  const selectedCycleProgramName = activeLocale === "zh" ? selectedCyclePlan.programZh : selectedCyclePlan.programEn ?? selectedCyclePlan.programZh;

  return (
    <div className="fixed inset-0 z-[58] flex items-center justify-center bg-black/45 px-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl border border-cyan-300/25 bg-[#0b1220]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{copy.cycleProgram}</p>
            <h3 className="mt-1 text-xl font-semibold text-cyan-100">{selectedCycleProgramName}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {activeLocale === "zh" ? `步骤 ${cycleStep} / 3` : `Step ${cycleStep} / 3`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-slate-100 hover:bg-white/10"
          >
            <X size={14} />
            {copy.close}
          </button>
        </div>

        <div className="mb-5 grid grid-cols-3 overflow-hidden rounded-xl border border-white/12 text-xs">
          {[
            [1, copy.step1],
            [2, copy.step2],
            [3, copy.step3],
          ].map(([step, label]) => (
            <div
              key={String(step)}
              className={`px-3 py-2 text-center ${cycleStep >= Number(step) ? "bg-cyan-500/15 text-cyan-100" : "bg-black/20 text-slate-400"}`}
            >
              {activeLocale === "zh" ? `步骤 ${step} · ${label}` : `Step ${step} · ${label}`}
            </div>
          ))}
        </div>

        {cycleStep === 1 && (
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-widest text-slate-500">{copy.selectProgram}</p>
            <div className="mb-1 grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-x-3 px-3 text-[10px] font-medium uppercase tracking-wider text-slate-600">
              <span>{copy.programColumn}</span>
              <span className="text-center text-emerald-500/80">1v1 {copy.member}</span>
              <span className="text-center text-amber-500/80">1v1 {copy.nonMember}</span>
              <span className="text-center text-emerald-500/60">1v2 {copy.member}</span>
              <span className="text-center text-amber-500/60">1v2 {copy.nonMember}</span>
            </div>
            <div className="space-y-1">
              {cyclePtProgramOptions.map((row, idx) => {
                const info = personalTrainingProgramInfo[row.nameZh];
                const ProgramIcon = info?.icon ?? Activity;
                return (
                  <button
                    key={row.key}
                    onClick={() => onSelectProgramAndContinue(row)}
                    className="group grid w-full grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-x-3 rounded-xl border border-transparent bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-cyan-400/30 hover:bg-[#0d2035]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="w-4 shrink-0 font-mono text-[10px] text-slate-600">{idx + 1}</span>
                      <div className="shrink-0 rounded-md border border-white/10 bg-white/[0.05] p-1.5 text-slate-300 transition-colors group-hover:border-cyan-400/30 group-hover:text-cyan-300">
                        <ProgramIcon size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white/90">
                          {activeLocale === "zh" ? row.nameZh : row.nameEn ?? row.nameZh}
                        </p>
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
              <p className="mt-2 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-3 text-sm text-slate-300">
                {copy.noPrograms}
              </p>
            )}
          </div>
        )}

        {cycleStep === 2 && cycleSelectedPtProgram && (
          <>
            <p className="mb-3 text-sm text-slate-300">
              {copy.selectedProgram}: 
              <span className="font-medium text-cyan-100">
                {activeLocale === "zh" ? cycleSelectedPtProgram.nameZh : cycleSelectedPtProgram.nameEn ?? cycleSelectedPtProgram.nameZh}
              </span>
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-3 text-sm font-medium text-slate-200">{copy.planInputs}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    key: "member_1v1",
                    label: copy.member1v1 ?? `${copy.member} 1v1`,
                    icon: <User size={14} className="text-emerald-200" />,
                  },
                  {
                    key: "non_member_1v1",
                    label: copy.nonMember1v1 ?? (activeLocale === "zh" ? "非会员 1v1" : "Non-member 1v1"),
                    icon: <User size={14} className="text-amber-200" />,
                  },
                  {
                    key: "member_1v2",
                    label: copy.member1v2 ?? (activeLocale === "zh" ? "会员 1v2" : "Member 1v2"),
                    icon: <Users size={14} className="text-emerald-200" />,
                  },
                  {
                    key: "non_member_1v2",
                    label: copy.nonMember1v2 ?? (activeLocale === "zh" ? "非会员 1v2" : "Non-member 1v2"),
                    icon: <Users size={14} className="text-amber-200" />,
                  },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      const preset = key as PtPreset;
                      onSetCyclePtPreset(preset);
                      onSetCycleQtyMember1v1(preset === "member_1v1" ? 12 : 0);
                      onSetCycleQtyNonMember1v1(preset === "non_member_1v1" ? 12 : 0);
                      onSetCycleQtyMember1v2(preset === "member_1v2" ? 12 : 0);
                      onSetCycleQtyNonMember1v2(preset === "non_member_1v2" ? 12 : 0);
                      onSetCycleQtyInputStr("12");
                      const unitVal = getPresetUnitAndQty(preset, {
                        member1v1Unit: cycleUnitMember1v1,
                        nonMember1v1Unit: cycleUnitNonMember1v1,
                        member1v2Unit: cycleUnitMember1v2,
                        nonMember1v2Unit: cycleUnitNonMember1v2,
                        member1v1Qty: cycleQtyMember1v1,
                        nonMember1v1Qty: cycleQtyNonMember1v1,
                        member1v2Qty: cycleQtyMember1v2,
                        nonMember1v2Qty: cycleQtyNonMember1v2,
                      }).unit;
                      onSetCycleUnitInputStr(String(unitVal));
                    }}
                    className={`inline-flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition ${
                      cyclePtPreset === key
                        ? "border-cyan-300/60 bg-cyan-500/16 text-cyan-100"
                        : "border-white/12 bg-white/[0.03] text-slate-300 hover:border-cyan-300/30"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">{icon}<span>{label}</span></span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/8 to-emerald-500/8 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-cyan-100">
                  {activeLocale === "zh"
                    ? cycleActiveLabel.split(" / ")[0]
                    : cycleActiveLabel.split(" / ")[1] ?? cycleActiveLabel}
                </p>
                <span className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[11px] text-slate-300">
                  {copy.defaultSessions}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr]">
                <div>
                  <label className="text-[11px] text-slate-400">
                    {copy.clientName}
                  </label>
                  <input
                    value={cycleClientName}
                    onChange={(e) => onSetCycleClientName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-slate-100"
                    placeholder={copy.clientPlaceholder}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">
                    {copy.unitPrice}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cycleUnitInputStr}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!/^\d*$/.test(raw)) return;
                      onSetCycleUnitInputStr(raw);
                      const n = raw === "" ? 0 : parseInt(raw, 10);
                      if (cyclePtPreset === "member_1v1") onSetCycleUnitMember1v1(n);
                      else if (cyclePtPreset === "non_member_1v1") onSetCycleUnitNonMember1v1(n);
                      else if (cyclePtPreset === "member_1v2") onSetCycleUnitMember1v2(n);
                      else onSetCycleUnitNonMember1v2(n);
                    }}
                    onBlur={() => {
                      const n = cycleUnitInputStr === "" ? 0 : parseInt(cycleUnitInputStr, 10);
                      onSetCycleUnitInputStr(String(n));
                      if (cyclePtPreset === "member_1v1") onSetCycleUnitMember1v1(n);
                      else if (cyclePtPreset === "non_member_1v1") onSetCycleUnitNonMember1v1(n);
                      else if (cyclePtPreset === "member_1v2") onSetCycleUnitMember1v2(n);
                      else onSetCycleUnitNonMember1v2(n);
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">{copy.quantity}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cycleQtyInputStr}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!/^\d*$/.test(raw)) return;
                      onSetCycleQtyInputStr(raw);
                      const n = raw === "" ? 0 : parseInt(raw, 10);
                      if (cyclePtPreset === "member_1v1") onSetCycleQtyMember1v1(n);
                      else if (cyclePtPreset === "non_member_1v1") onSetCycleQtyNonMember1v1(n);
                      else if (cyclePtPreset === "member_1v2") onSetCycleQtyMember1v2(n);
                      else onSetCycleQtyNonMember1v2(n);
                    }}
                    onBlur={() => {
                      const n = cycleQtyInputStr === "" ? 0 : parseInt(cycleQtyInputStr, 10);
                      onSetCycleQtyInputStr(String(n));
                      if (cyclePtPreset === "member_1v1") onSetCycleQtyMember1v1(n);
                      else if (cyclePtPreset === "non_member_1v1") onSetCycleQtyNonMember1v1(n);
                      else if (cyclePtPreset === "member_1v2") onSetCycleQtyMember1v2(n);
                      else onSetCycleQtyNonMember1v2(n);
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[12, 24, 36, 48].map((q) => {
                  const isSelected =
                    (cyclePtPreset === "member_1v1" && cycleQtyMember1v1 === q) ||
                    (cyclePtPreset === "non_member_1v1" && cycleQtyNonMember1v1 === q) ||
                    (cyclePtPreset === "member_1v2" && cycleQtyMember1v2 === q) ||
                    (cyclePtPreset === "non_member_1v2" && cycleQtyNonMember1v2 === q);

                  return (
                    <button
                      key={q}
                      onClick={() => {
                        if (cyclePtPreset === "member_1v1") onSetCycleQtyMember1v1(q);
                        else if (cyclePtPreset === "non_member_1v1") onSetCycleQtyNonMember1v1(q);
                        else if (cyclePtPreset === "member_1v2") onSetCycleQtyMember1v2(q);
                        else onSetCycleQtyNonMember1v2(q);
                        onSetCycleQtyInputStr(String(q));
                      }}
                      className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
                        isSelected
                          ? "border-cyan-300/70 bg-cyan-500/20 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
                          : "border-white/12 text-slate-300 hover:border-cyan-300/40"
                      }`}
                    >
                      {q} {copy.sessions}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[11px] text-slate-400">{copy.activePlan}</p>
                <p className="font-medium text-cyan-100">
                  {activeLocale === "zh"
                    ? cycleActiveLabel.split(" / ")[0]
                    : cycleActiveLabel.split(" / ")[1] ?? cycleActiveLabel}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[11px] text-slate-400">{copy.credit}</p>
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
                  className="mt-1 w-full rounded-md border border-white/15 bg-black/35 px-2 py-1 text-sm text-slate-100"
                />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[11px] text-slate-400">{copy.subtotal}</p>
                <p className="font-semibold text-cyan-100">{formatMoney(cycleSubtotal)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[11px] text-slate-400">{copy.afterCredit}</p>
                <p className="font-semibold text-cyan-100">{formatMoney(cycleAfterCredit)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[11px] text-slate-400">{copy.tax} (13%)</p>
                <p className="font-semibold text-cyan-100">{formatMoney(cycleTax)}</p>
              </div>
              <div className="rounded-lg border border-emerald-300/35 bg-emerald-500/12 px-3 py-2">
                <p className="text-[11px] text-slate-300">{copy.total}</p>
                <p className="text-xl font-bold text-emerald-100">{formatMoney(cycleTotal)}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onSetCycleStep(1)}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.08]"
              >
                <ChevronRight size={14} className="rotate-180" />
                {copy.back}
              </button>
              <button
                onClick={() => onSetCycleStep(3)}
                className="flex-1 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
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
  );
}
