import { User, Users, X } from "lucide-react";

import { ptCalculatorCopy, ptReportCopy } from "@/lib/copy/modalCopy";
import { formatMoney } from "@/lib/formatters/number";
import type { PtPreset, PtRow } from "@/types/pricing";
import { NumberInput } from "@/components/ui/NumberInput";

type PtCalculatorModalProps = {
  selectedPtRow: PtRow | null;
  activeLocale: "zh" | "en";
  ptPreset: PtPreset;
  ptUnitInputEmpty: boolean;
  ptQtyInputEmpty: boolean;
  ptCreditInputEmpty: boolean;
  ptUnitMember1v1: number;
  ptUnitNonMember1v1: number;
  ptUnitMember1v2: number;
  ptUnitNonMember1v2: number;
  ptQtyMember1v1: number;
  ptQtyNonMember1v1: number;
  ptQtyMember1v2: number;
  ptQtyNonMember1v2: number;
  ptActiveLabel: { zh: string; en: string };
  ptActivePresetUnit: number;
  ptActivePresetQty: number;
  ptActiveSubtotal: number;
  ptCredit: number;
  ptAfterCredit: number;
  ptTaxAfterAdjust: number;
  ptFinalTotal: number;
  ptReportDate: string;
  ptClientName: string;
  onSetPtClientName: (value: string) => void;
  ptCopySuccess: boolean;
  onClose: () => void;
  onApplyPreset: (preset: PtPreset) => void;
  onSetPtUnitInputEmpty: (value: boolean) => void;
  onSetPtQtyInputEmpty: (value: boolean) => void;
  onSetPtCreditInputEmpty: (value: boolean) => void;
  onSetPtUnitMember1v1: (value: number) => void;
  onSetPtUnitNonMember1v1: (value: number) => void;
  onSetPtUnitMember1v2: (value: number) => void;
  onSetPtUnitNonMember1v2: (value: number) => void;
  onSetPtQtyMember1v1: (value: number) => void;
  onSetPtQtyNonMember1v1: (value: number) => void;
  onSetPtQtyMember1v2: (value: number) => void;
  onSetPtQtyNonMember1v2: (value: number) => void;
  onSetPtCredit: (value: number) => void;
  onCopySummary: () => void;
  onDownloadPdf: () => void;
  onAddToCart: () => void;
};

export function PtCalculatorModal({
  selectedPtRow,
  activeLocale,
  ptPreset,
  ptUnitInputEmpty,
  ptQtyInputEmpty,
  ptCreditInputEmpty,
  ptUnitMember1v1,
  ptUnitNonMember1v1,
  ptUnitMember1v2,
  ptUnitNonMember1v2,
  ptQtyMember1v1,
  ptQtyNonMember1v1,
  ptQtyMember1v2,
  ptQtyNonMember1v2,
  ptActiveLabel,
  ptActivePresetUnit,
  ptActivePresetQty,
  ptActiveSubtotal,
  ptCredit,
  ptAfterCredit,
  ptTaxAfterAdjust,
  ptFinalTotal,
  ptReportDate,
  ptClientName,
  onSetPtClientName,
  ptCopySuccess,
  onClose,
  onApplyPreset,
  onSetPtUnitInputEmpty,
  onSetPtQtyInputEmpty,
  onSetPtCreditInputEmpty,
  onSetPtUnitMember1v1,
  onSetPtUnitNonMember1v1,
  onSetPtUnitMember1v2,
  onSetPtUnitNonMember1v2,
  onSetPtQtyMember1v1,
  onSetPtQtyNonMember1v1,
  onSetPtQtyMember1v2,
  onSetPtQtyNonMember1v2,
  onSetPtCredit,
  onCopySummary,
  onDownloadPdf,
  onAddToCart,
}: PtCalculatorModalProps) {
  const copy = ptCalculatorCopy[activeLocale];
  const reportCopy = ptReportCopy[activeLocale];

  if (!selectedPtRow) return null;

  const displayName =
    activeLocale === "zh" ? selectedPtRow.nameZh : selectedPtRow.nameEn ?? selectedPtRow.nameZh;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--modal-backdrop)] px-4 py-6 backdrop-blur">
      <div className="glass-panel flex w-full max-w-6xl flex-col overflow-hidden rounded-[40px] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.01] px-10 py-7">
          <div className="flex items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <Users size={22} className="text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-400">{copy.stepTitle}</span>
                <div className="h-px w-6 bg-emerald-500/20" />
              </div>
              <h3 className="mt-0.5 text-xl font-bold text-white tracking-tight">{displayName}</h3>
              {activeLocale === "zh" && selectedPtRow.nameEn && (
                <p className="text-sm text-slate-400">{selectedPtRow.nameEn}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-white/5 hover:text-white"
            aria-label={activeLocale === "zh" ? "关闭" : "Close"}
            title={activeLocale === "zh" ? "关闭" : "Close"}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex max-h-[88vh] flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
            <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
              <section className="space-y-4">
                <div className="glass-card rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="mb-3 text-sm font-medium text-slate-200">{copy.planInputs}</p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      {
                        key: "member_1v1",
                        label: copy.member1v1,
                        icon: <User size={14} className="text-emerald-200" />,
                      },
                      {
                        key: "non_member_1v1",
                        label: copy.nonMember1v1,
                        icon: <User size={14} className="text-amber-200" />,
                      },
                      {
                        key: "member_1v2",
                        label: copy.member1v2,
                        icon: <Users size={14} className="text-emerald-200" />,
                      },
                      {
                        key: "non_member_1v2",
                        label: copy.nonMember1v2,
                        icon: <Users size={14} className="text-amber-200" />,
                      },
                    ].map(({ key, label, icon }) => (
                      <button
                        key={key}
                        onClick={() => onApplyPreset(key as PtPreset)}
                        className={`inline-flex items-center justify-between rounded-2xl border px-3 py-2 text-xs transition ${
                          ptPreset === key
                            ? "border-emerald-300/60 bg-emerald-500/16 text-emerald-100"
                            : "border-white/12 bg-white/[0.03] text-slate-300 hover:border-emerald-300/30"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">{icon}<span>{label}</span></span>
                      </button>
                    ))}
                  </div>
                </div>

                {[
                  {
                    key: "member_1v1",
                    label: activeLocale === "zh" ? "1v1 会员" : "1v1 Member",
                    icon: <User size={16} className="text-emerald-200" />,
                    unit: ptUnitMember1v1,
                    setUnit: onSetPtUnitMember1v1,
                    qty: ptQtyMember1v1,
                    setQty: onSetPtQtyMember1v1,
                  },
                  {
                    key: "non_member_1v1",
                    label: activeLocale === "zh" ? "1v1 非会员" : "1v1 Non-member",
                    icon: <User size={16} className="text-amber-200" />,
                    unit: ptUnitNonMember1v1,
                    setUnit: onSetPtUnitNonMember1v1,
                    qty: ptQtyNonMember1v1,
                    setQty: onSetPtQtyNonMember1v1,
                  },
                  {
                    key: "member_1v2",
                    label: activeLocale === "zh" ? "1v2 会员" : "1v2 Member",
                    icon: <Users size={16} className="text-emerald-200" />,
                    unit: ptUnitMember1v2,
                    setUnit: onSetPtUnitMember1v2,
                    qty: ptQtyMember1v2,
                    setQty: onSetPtQtyMember1v2,
                  },
                  {
                    key: "non_member_1v2",
                    label: activeLocale === "zh" ? "1v2 非会员" : "1v2 Non-member",
                    icon: <Users size={16} className="text-amber-200" />,
                    unit: ptUnitNonMember1v2,
                    setUnit: onSetPtUnitNonMember1v2,
                    qty: ptQtyNonMember1v2,
                    setQty: onSetPtQtyNonMember1v2,
                  },
                ]
                  .filter((line) => line.key === ptPreset)
                  .map((line) => (
                    <div key={line.label} className="glass-card rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-100">{line.icon}{line.label}</p>
                        <span className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[11px] text-slate-300">
                          {copy.defaultSessions}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
                        <div>
                          <label className="text-[11px] text-slate-400">{copy.unitPrice}</label>
                          <NumberInput
                            className="input-subdued mt-1 w-full rounded-xl px-3 py-2 text-sm"
                            value={line.unit}
                            min={0}
                            allowDecimal={true}
                            allowEmpty={true}
                            onChange={(value) => {
                              onSetPtUnitInputEmpty(value === 0);
                              line.setUnit(value);
                            }}
                            onBlur={() => {
                              if (ptUnitInputEmpty) {
                                onSetPtUnitInputEmpty(false);
                                line.setUnit(0);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400">
                            {activeLocale === "zh" ? "数量" : "Quantity"}
                          </label>
                          <NumberInput
                            className="input-subdued mt-1 w-full rounded-xl px-3 py-2 text-sm"
                            value={line.qty}
                            min={0}
                            allowDecimal={false}
                            allowEmpty={true}
                            onChange={(value) => {
                              onSetPtQtyInputEmpty(value === 0);
                              line.setQty(value);
                            }}
                            onBlur={() => {
                              if (ptQtyInputEmpty) {
                                onSetPtQtyInputEmpty(false);
                                line.setQty(0);
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {[12, 24, 36, 48].map((q) => (
                          <button
                            key={q}
                            onClick={() => line.setQty(q)}
                            className={`rounded-full border px-3 py-1 text-[10px] font-semibold transition ${
                              line.qty === q
                                ? "border-emerald-300/60 bg-emerald-500/18 text-emerald-100"
                                : "border-white/12 text-slate-300 hover:border-emerald-300/30"
                            }`}
                          >
                            {q} {copy.sessions}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </section>

              <section>
                <div className="glass-card relative flex h-full flex-col overflow-hidden rounded-[28px] border border-emerald-500/10 bg-white/[0.01] p-6">
                  <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/5 blur-[60px]" />
                  <div className="relative mb-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <p className="text-[11px] text-slate-400">{reportCopy.clientName}</p>
                    <input
                      value={ptClientName}
                      onChange={(e) => onSetPtClientName(e.target.value)}
                      placeholder={reportCopy.clientPlaceholder}
                      className="input-subdued mt-1 w-full rounded-md px-2 py-1 text-sm text-slate-100"
                    />
                  </div>
                  <div className="relative mb-6">
                    <h2 className="text-lg font-bold text-white tracking-tight">{copy.planSummary}</h2>
                  </div>
                  <div className="relative mb-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-[11px] text-slate-400">{copy.activePlan}</p>
                    <p className="text-sm font-medium text-emerald-100">{ptActiveLabel[activeLocale]}</p>
                  </div>
                  <div className="relative mb-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">{copy.unitPrice}</span>
                      <span className="font-medium text-slate-100">{formatMoney(ptActivePresetUnit)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-slate-300">{activeLocale === "zh" ? "数量" : "Quantity"}</span>
                      <span className="font-medium text-slate-100">{ptActivePresetQty}</span>
                    </div>
                  </div>

                  <div className="relative mb-auto space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <span className="text-slate-300">{copy.subtotal}</span>
                      <span className="font-semibold text-emerald-200">{formatMoney(ptActiveSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <span className="text-slate-300">{copy.tax} (13%)</span>
                      <span className="font-semibold text-cyan-200">{formatMoney(ptTaxAfterAdjust)}</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">{copy.credit}</span>
                        <NumberInput
                          className="input-subdued w-28 rounded-md px-2 py-1 text-right text-sm"
                          value={ptCredit}
                          min={0}
                          allowDecimal={false}
                          allowEmpty={true}
                          onChange={(value) => {
                            onSetPtCreditInputEmpty(value === 0);
                            onSetPtCredit(value);
                          }}
                          onBlur={() => {
                            if (ptCreditInputEmpty) {
                              onSetPtCreditInputEmpty(false);
                              onSetPtCredit(0);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <span className="text-slate-300">{copy.afterCredit}</span>
                      <span className="font-semibold text-emerald-200">{formatMoney(ptAfterCredit)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-emerald-300/35 bg-emerald-500/12 px-3 py-2">
                      <span className="text-slate-100">{copy.total}</span>
                      <span className="text-lg font-bold text-emerald-100">{formatMoney(ptFinalTotal)}</span>
                    </div>
                  </div>

                  <div className="relative mt-6 space-y-6">
                    <div className="space-y-2">
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={onAddToCart}
                        className="w-full rounded-2xl bg-emerald-500 py-3 text-xs font-black uppercase tracking-widest text-[#04070b] shadow-xl shadow-emerald-500/10 transition-all hover:bg-emerald-400"
                      >
                        {activeLocale === "zh" ? "加入报价" : "Add to Cart"}
                      </button>
                      <button
                        onClick={onCopySummary}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/5 py-3 text-xs font-bold uppercase tracking-widest text-slate-200 transition-all hover:bg-white/10"
                      >
                        {reportCopy.copySummary}
                      </button>
                      <button
                        onClick={onDownloadPdf}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/5 py-3 text-xs font-bold uppercase tracking-widest text-slate-200 transition-all hover:bg-white/10"
                      >
                        {reportCopy.downloadPdf}
                      </button>
                      {ptCopySuccess && (
                        <span className="inline-flex rounded-md border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-100">
                          {reportCopy.copied}
                        </span>
                      )}
                      <p className="text-[11px] text-slate-400">{copy.quoteNote}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
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
