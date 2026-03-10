import { User, Users, X } from "lucide-react";

import { ptCalculatorCopy } from "@/lib/copy/modalCopy";
import { formatMoney } from "@/lib/formatters/number";
import type { PtPreset, PtRow } from "@/types/pricing";

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
  onOpenReport: () => void;
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
  onOpenReport,
}: PtCalculatorModalProps) {
  const copy = ptCalculatorCopy[activeLocale];

  if (!selectedPtRow) return null;

  const displayName =
    activeLocale === "zh" ? selectedPtRow.nameZh : selectedPtRow.nameEn ?? selectedPtRow.nameZh;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xl">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl border border-white/15 bg-[#0f1115]/92 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{copy.stepTitle}</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">{displayName}</h3>
              {activeLocale === "zh" && selectedPtRow.nameEn && (
                <p className="text-sm text-slate-400">{selectedPtRow.nameEn}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-100 hover:bg-white/[0.08]"
            >
              <X size={14} />
              {activeLocale === "zh" ? "关闭" : "Close"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
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
                    className={`inline-flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition ${
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
                <div key={line.label} className="rounded-2xl border border-emerald-300/20 bg-gradient-to-r from-emerald-500/8 to-cyan-500/8 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold text-emerald-100">{line.icon}{line.label}</p>
                    <span className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[11px] text-slate-300">
                      {copy.defaultSessions}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
                    <div>
                      <label className="text-[11px] text-slate-400">{copy.unitPrice}</label>
                      <input
                        type="number"
                        value={ptUnitInputEmpty ? "" : String(line.unit)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            onSetPtUnitInputEmpty(true);
                            line.setUnit(0);
                            return;
                          }
                          onSetPtUnitInputEmpty(false);
                          line.setUnit(Number(raw));
                        }}
                        onBlur={() => {
                          if (ptUnitInputEmpty) {
                            onSetPtUnitInputEmpty(false);
                            line.setUnit(0);
                          }
                        }}
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">
                        {activeLocale === "zh" ? "数量" : "Quantity"}
                      </label>
                      <input
                        type="number"
                        value={ptQtyInputEmpty ? "" : String(line.qty)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            onSetPtQtyInputEmpty(true);
                            line.setQty(0);
                            return;
                          }
                          onSetPtQtyInputEmpty(false);
                          line.setQty(Number(raw));
                        }}
                        onBlur={() => {
                          if (ptQtyInputEmpty) {
                            onSetPtQtyInputEmpty(false);
                            line.setQty(0);
                          }
                        }}
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[12, 24, 36, 48].map((q) => (
                      <button
                        key={q}
                        onClick={() => line.setQty(q)}
                        className={`rounded-lg border px-3 py-1 text-xs transition ${
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

          <aside className="rounded-2xl border border-emerald-300/30 bg-gradient-to-b from-emerald-500/14 via-emerald-500/8 to-cyan-500/10 p-4">
            <p className="text-sm font-medium text-emerald-100">{copy.planSummary}</p>
            <div className="mt-2 rounded-lg border border-white/15 bg-black/25 px-3 py-2">
              <p className="text-[11px] text-slate-400">{copy.activePlan}</p>
              <p className="text-sm font-medium text-emerald-100">{ptActiveLabel[activeLocale]}</p>
            </div>

            <div className="mt-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{copy.unitPrice}</span>
                <span className="font-medium text-slate-100">{formatMoney(ptActivePresetUnit)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-300">{activeLocale === "zh" ? "数量" : "Quantity"}</span>
                <span className="font-medium text-slate-100">{ptActivePresetQty}</span>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <span className="text-slate-300">{copy.subtotal}</span>
                <span className="font-semibold text-emerald-200">{formatMoney(ptActiveSubtotal)}</span>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">{copy.credit}</span>
                  <input
                    type="number"
                    value={ptCreditInputEmpty ? "" : String(ptCredit)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        onSetPtCreditInputEmpty(true);
                        onSetPtCredit(0);
                        return;
                      }
                      onSetPtCreditInputEmpty(false);
                      onSetPtCredit(Number(raw));
                    }}
                    onBlur={() => {
                      if (ptCreditInputEmpty) {
                        onSetPtCreditInputEmpty(false);
                        onSetPtCredit(0);
                      }
                    }}
                    className="w-28 rounded-md border border-white/15 bg-black/35 px-2 py-1 text-right text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <span className="text-slate-300">{copy.afterCredit}</span>
                <span className="font-semibold text-emerald-200">{formatMoney(ptAfterCredit)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <span className="text-slate-300">{copy.tax} (13%)</span>
                <span className="font-semibold text-cyan-200">{formatMoney(ptTaxAfterAdjust)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-emerald-300/35 bg-emerald-500/12 px-3 py-2">
                <span className="text-slate-100">{copy.total}</span>
                <span className="text-lg font-bold text-emerald-100">{formatMoney(ptFinalTotal)}</span>
              </div>
            </div>

            <button
              onClick={onOpenReport}
              className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
            >
              {copy.generateReport}
            </button>
            <p className="mt-2 text-[11px] text-slate-400">{copy.quoteNote}</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
