import { X } from "lucide-react";

import { ptReportCopy } from "@/lib/copy/modalCopy";
import { formatMoney } from "@/lib/formatters/number";
import type { PtPreset, PtRow } from "@/types/pricing";

type PtReportModalProps = {
  open: boolean;
  selectedPtRow: PtRow | null;
  activeLocale: "zh" | "en";
  ptReportDate: string;
  ptClientName: string;
  setPtClientName: (value: string) => void;
  ptPreset: PtPreset;
  ptUnitMember1v1: number;
  ptQtyMember1v1: number;
  ptCalcMember1v1: number;
  ptUnitNonMember1v1: number;
  ptQtyNonMember1v1: number;
  ptCalcNonMember1v1: number;
  ptUnitMember1v2: number;
  ptQtyMember1v2: number;
  ptCalcMember1v2: number;
  ptUnitNonMember1v2: number;
  ptQtyNonMember1v2: number;
  ptCalcNonMember1v2: number;
  ptActiveLabel: { zh: string; en: string };
  ptCredit: number;
  ptAfterCredit: number;
  ptTaxAfterAdjust: number;
  ptFinalTotal: number;
  ptCopySuccess: boolean;
  onClose: () => void;
  onCopySummary: () => void;
  onDownloadPdf: () => void;
};

export function PtReportModal({
  open,
  selectedPtRow,
  activeLocale,
  ptReportDate,
  ptClientName,
  setPtClientName,
  ptPreset,
  ptUnitMember1v1,
  ptQtyMember1v1,
  ptCalcMember1v1,
  ptUnitNonMember1v1,
  ptQtyNonMember1v1,
  ptCalcNonMember1v1,
  ptUnitMember1v2,
  ptQtyMember1v2,
  ptCalcMember1v2,
  ptUnitNonMember1v2,
  ptQtyNonMember1v2,
  ptCalcNonMember1v2,
  ptActiveLabel,
  ptCredit,
  ptAfterCredit,
  ptTaxAfterAdjust,
  ptFinalTotal,
  ptCopySuccess,
  onClose,
  onCopySummary,
  onDownloadPdf,
}: PtReportModalProps) {
  if (!open || !selectedPtRow) return null;

  const copy = ptReportCopy[activeLocale];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--modal-backdrop)] px-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl border border-emerald-300/25 bg-gradient-to-b from-[#071326] via-[#07111f] to-[#050b16] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.72)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{copy.title}</p>
            <h3 className="text-2xl font-semibold text-emerald-100">
              {activeLocale === "zh" ? selectedPtRow.nameZh : selectedPtRow.nameEn ?? selectedPtRow.nameZh}
            </h3>
            {activeLocale === "zh" && selectedPtRow.nameEn && (
              <p className="text-sm text-slate-300">{selectedPtRow.nameEn}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-slate-100 hover:bg-white/10"
          >
            <X size={14} />
            {copy.close}
          </button>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[11px] text-slate-400">{copy.date}</p>
            <p className="font-medium text-slate-100">{ptReportDate}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[11px] text-slate-400">{copy.clientName}</p>
            <input
              value={ptClientName}
              onChange={(e) => setPtClientName(e.target.value)}
              placeholder={copy.clientPlaceholder}
              className="mt-1 w-full rounded-md border border-white/15 bg-black/35 px-2 py-1 text-sm text-slate-100"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="mb-3 text-sm font-medium text-slate-100">{copy.itemDetails}</p>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] bg-white/[0.05] px-4 py-2 text-[11px] tracking-wide text-slate-400">
              <p>{copy.item}</p>
              <p>{copy.unit}</p>
              <p>{copy.qty}</p>
              <p>{copy.subtotal}</p>
            </div>

            {[
              { key: "member_1v1", label: copy.member1v1, unit: ptUnitMember1v1, qty: ptQtyMember1v1, subtotal: ptCalcMember1v1 },
              {
                key: "non_member_1v1",
                label: copy.nonMember1v1,
                unit: ptUnitNonMember1v1,
                qty: ptQtyNonMember1v1,
                subtotal: ptCalcNonMember1v1,
              },
              { key: "member_1v2", label: copy.member1v2, unit: ptUnitMember1v2, qty: ptQtyMember1v2, subtotal: ptCalcMember1v2 },
              {
                key: "non_member_1v2",
                label: copy.nonMember1v2,
                unit: ptUnitNonMember1v2,
                qty: ptQtyNonMember1v2,
                subtotal: ptCalcNonMember1v2,
              },
            ]
              .filter((line) => line.key === ptPreset)
              .map((line) => (
                <div key={line.key} className="grid grid-cols-[1.6fr_1fr_1fr_1fr] border-t border-white/10 bg-emerald-500/10 px-4 py-2.5 text-sm">
                  <p className="text-slate-200">{line.label}</p>
                  <p className="text-slate-300">{formatMoney(line.unit)}</p>
                  <p className="text-slate-300">{line.qty}</p>
                  <p className="font-medium text-emerald-200">{formatMoney(line.subtotal)}</p>
                </div>
              ))}
          </div>

          <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[11px] text-slate-400">{copy.activePlan}</p>
              <p className="font-medium text-emerald-100">{ptActiveLabel[activeLocale]}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[11px] text-slate-400">{copy.credit}</p>
              <p className="font-medium text-cyan-200">{formatMoney(ptCredit)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[11px] text-slate-400">{copy.afterCredit}</p>
              <p className="font-semibold text-emerald-200">{formatMoney(ptAfterCredit)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[11px] text-slate-400">{copy.tax} (13%)</p>
              <p className="font-semibold text-cyan-200">{formatMoney(ptTaxAfterAdjust)}</p>
            </div>
            <div className="rounded-lg border border-emerald-300/35 bg-emerald-500/12 px-3 py-2 md:col-span-2">
              <p className="text-[11px] text-slate-300">{copy.total}</p>
              <p className="text-2xl font-bold text-emerald-100">{formatMoney(ptFinalTotal)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {ptCopySuccess && (
            <span className="rounded-md border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-xs text-emerald-100">
              {copy.copied}
            </span>
          )}
          <button
            onClick={onCopySummary}
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-slate-100 hover:bg-white/10"
          >
            {copy.copySummary}
          </button>
          <button
            onClick={onDownloadPdf}
            className="rounded-lg bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
          >
            {copy.downloadPdf}
          </button>
        </div>
      </div>
    </div>
  );
}
