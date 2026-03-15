"use client";

import { useState } from "react";
import { ClipboardList, CreditCard, Dumbbell, Receipt, UserRound, X, ChevronDown, UserCircle } from "lucide-react";

import type { CartCustomerInfo, CartItem, CartTotals } from "@/types/cart";
import { formatMoney, formatMoneyWithDecimals } from "@/lib/formatters/number";
import { CartField } from "@/components/cart/CartField";
import { CartTag } from "@/components/cart/CartTag";
import { CartStatRow } from "@/components/cart/CartStatRow";
import { CycleDetailRow } from "@/components/cart/CycleDetailRow";
import { NumberInput } from "@/components/ui/NumberInput";

const categoryMeta: Record<
  CartItem["category"],
  { label: string; icon: typeof UserRound; tone: string }
> = {
  membership: { label: "会籍", icon: UserRound, tone: "text-cyan-400" },
  group_class: { label: "团课", icon: Dumbbell, tone: "text-indigo-300" },
  personal_training: { label: "私教课", icon: Dumbbell, tone: "text-emerald-300" },
  assessment: { label: "评估", icon: ClipboardList, tone: "text-amber-300" },
  cycle_plan: { label: "周期方案", icon: Receipt, tone: "text-cyan-400" },
  stored_value: { label: "储值卡", icon: CreditCard, tone: "text-sky-300" },
};

const cycleDetailPattern = /^(.*?) · (.*?) · (\d+)次 · [^\d]*([\d,.]+)/;

function parseCycleDetail(line: string) {
  const match = line.match(cycleDetailPattern);
  if (!match) return null;
  return {
    name: match[1],
    preset: match[2],
    qty: Number(match[3]) || 1,
    unitPrice: Number(match[4].replace(/,/g, "")) || 0,
  };
}

function formatCycleDetail(detail: { name: string; preset: string; qty: number; unitPrice: number }) {
  return `${detail.name} · ${detail.preset} · ${detail.qty}次 · ${detail.unitPrice}`;
}

function parseMembershipWeeks(note?: string | null) {
  if (!note) return null;
  const trimmed = note.trim();
  if (!trimmed || trimmed === "-" || trimmed === "—") return null;
  const weekMatch = trimmed.match(/(\d+)\s*(周|week|weeks)/i);
  if (weekMatch) return Number(weekMatch[1]) || null;
  const monthMatch = trimmed.match(/(\d+)\s*(月|month|months)/i);
  if (monthMatch) return (Number(monthMatch[1]) || 0) * 4 || null;
  return null;
}

function formatGiftDate(date: Date) {
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function CartQuoteModal(props: {
  open: boolean;
  items: CartItem[];
  totals: CartTotals;
  customer: CartCustomerInfo;
  creditApplied: number;
  onCreditChange: (value: number) => void;
  onClose: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, update: Partial<CartItem>) => void;
  onUpdateCustomer: (update: Partial<CartCustomerInfo>) => void;
  onClearCart: () => void;
  onCopySummary: () => void;
  onDownloadPdf: () => void;
  lastAddedId?: string | null;
  onAnimationComplete?: () => void;
}) {
  const {
    open,
    items,
    totals,
    customer,
    creditApplied,
    onCreditChange,
    onClose,
    onRemoveItem,
    onUpdateItem,
    onUpdateCustomer,
    onClearCart,
    onCopySummary,
    onDownloadPdf,
    lastAddedId,
    onAnimationComplete,
  } = props;

  const [customerOpen, setCustomerOpen] = useState(false);

  const membershipGiftItems = items
    .map((item) => ({
      item,
      membershipWeeks: parseMembershipWeeks(item.note),
    }))
    .filter((entry) => entry.membershipWeeks !== null);

  const lastUpdated = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--modal-backdrop)] px-4 py-6 backdrop-blur">
      <div className="glass-panel flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[40px] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.01] px-10 py-7">
          <div className="flex items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
              <Receipt size={22} className="text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-500">Sales Quote</span>
                <div className="h-px w-6 bg-cyan-500/20" />
              </div>
              <h2 className="mt-0.5 text-xl font-bold text-white tracking-tight">客户报价单</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-white/5 hover:text-white"
            aria-label="关闭"
            title="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex max-h-[90vh] flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-6">
                <div className="relative flex items-center justify-between pb-3">
                  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                    <span className="h-1 w-1 rounded-full bg-cyan-500" />
                    项目明细
                  </h3>
                </div>

                {items.length === 0 ? (
                  <div className="glass-card rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-sm text-slate-400">
                    暂无项目，请从左侧添加到购物车！
                  </div>
                ) : (
                  <div className="space-y-3">
                    {membershipGiftItems.length > 0 && (
                      <div className="glass-card rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-5 text-slate-100">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-200/70">会员赠送</p>
                            <h4 className="mt-1 text-lg font-bold text-white">赠送会员日期计算</h4>
                          </div>
                          <span className="rounded-full border border-cyan-400/40 px-2.5 py-1 text-[10px] font-semibold text-cyan-100">
                            {membershipGiftItems.length} 项
                          </span>
                        </div>
                        <div className="space-y-3">
                          {membershipGiftItems.map(({ item, membershipWeeks }) => {
                            const storedWeeks = item.membershipWeeks ?? membershipWeeks ?? 0;
                            const bonusWeeks = 2;
                            const totalWeeks = Math.max(0, storedWeeks) + bonusWeeks;
                            const startDate = new Date();
                            const endDate = new Date(startDate.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000);

                            return (
                              <div
                                key={`membership-gift-${item.id}`}
                                className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-slate-200 md:grid-cols-[1.6fr_1fr_1fr_1fr]"
                              >
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">项目</p>
                                  <p className="text-sm font-semibold text-white">{item.name}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">周数</p>
                                  <NumberInput
                                    className="input-subdued w-full rounded-xl px-3 py-2 text-center text-xs font-semibold text-white"
                                    value={totalWeeks}
                                    min={0}
                                    allowDecimal={false}
                                    onChange={(value) => onUpdateItem(item.id, { membershipWeeks: Math.max(0, value - bonusWeeks) })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">开始日期</p>
                                  <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-sm font-semibold text-white">
                                    {formatGiftDate(startDate)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">结束日期</p>
                                  <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-sm font-semibold text-white">
                                    {formatGiftDate(endDate)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {items.map((item, index) => {
                      const isNew = lastAddedId === item.id;
                      const meta = categoryMeta[item.category];
                      const CategoryIcon = meta.icon;
                      const originalPrice = item.originalPrice ?? 0;
                      const isDiscounted = originalPrice > item.unitPrice;
                      const discountPct = isDiscounted
                        ? Math.round(((originalPrice - item.unitPrice) / originalPrice) * 100)
                        : 0;

                      return (
                        <article
                          key={item.id}
                          className={`glass-card group rounded-2xl border border-white/5 p-5 transition-colors hover:bg-white/[0.03] ${
                            isNew ? "border-cyan-500/30 bg-white/[0.02]" : ""
                          }`}
                          onAnimationEnd={() => {
                            if (isNew && onAnimationComplete) onAnimationComplete();
                          }}
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-slate-800/50">
                                <CategoryIcon size={18} className={meta.tone} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white">{item.name}</span>
                                  <CartTag label={meta.label} tone={item.category === "cycle_plan" ? "cyan" : "slate"} />
                                  {item.category === "stored_value" && (
                                    <CartTag label="免税" tone="amber" />
                                  )}
                                  {isDiscounted && <CartTag label={`优惠 ${discountPct}%`} tone="cyan" />}
                                  {item.activationFee && item.activationFee > 0 && (
                                    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-500">
                                      <span>激活费</span>
                                      <button
                                        type="button"
                                        onClick={() => onUpdateItem(item.id, { isNewCustomer: !item.isNewCustomer })}
                                        className={`relative h-3.5 w-6 rounded-full border transition ${
                                          item.isNewCustomer
                                            ? "border-cyan-400/40 bg-cyan-400/40"
                                            : "border-white/20 bg-white/10"
                                        }`}
                                        aria-label="激活费"
                                        title="激活费"
                                      >
                                        <span
                                          className={`absolute left-0.5 top-0.5 h-2 w-2 rounded-full bg-white transition ${
                                            item.isNewCustomer ? "translate-x-2.5" : ""
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[9px] font-mono tracking-tighter text-slate-600">
                                  #{String(index + 1).padStart(3, "0")}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              className="text-[9px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-red-400/80"
                            >
                              移除项目
                            </button>
                          </div>


                          {item.category === "cycle_plan" && item.details && item.details.length > 0 ? (
                            <div className="space-y-4">
                              {item.details.map((line, detailIndex) => {
                                const parsed = parseCycleDetail(line) ?? {
                                  name: line,
                                  preset: "",
                                  qty: 1,
                                  unitPrice: 0,
                                };

                                return (
                                  <div key={`${item.id}-detail-${detailIndex}`} className="border-l border-white/10 pl-4">
                                    <CycleDetailRow
                                      name={parsed.name}
                                      preset={parsed.preset}
                                      qty={parsed.qty}
                                      unitPrice={parsed.unitPrice}
                                      onQtyChange={(value) => {
                                        const cleaned = Number(String(value).replace(/^0+(?=\d)/, "")) || 1;
                                        const updated = { ...parsed, qty: Math.max(1, cleaned) };
                                        const nextDetails = [...(item.details ?? [])];
                                        nextDetails[detailIndex] = formatCycleDetail(updated);
                                        onUpdateItem(item.id, { details: nextDetails });
                                      }}
                                      onUnitPriceChange={(value) => {
                                        const cleaned = Number(String(value).replace(/^0+(?=\d)/, "")) || 0;
                                        const updated = { ...parsed, unitPrice: Math.max(0, cleaned) };
                                        const nextDetails = [...(item.details ?? [])];
                                        nextDetails[detailIndex] = formatCycleDetail(updated);
                                        onUpdateItem(item.id, { details: nextDetails });
                                      }}
                                    />
                                  </div>
                                );
                              })}
                              <div className="mt-2 flex items-center justify-end gap-3 border-t border-white/5 pt-3">
                                <span className="text-[10px] font-medium text-slate-600">方案总额</span>
                                <span className="text-base font-bold text-white tracking-tight">
                                  {formatMoney(
                                    item.details.reduce((sum, line) => {
                                      const parsed = parseCycleDetail(line);
                                      return sum + (parsed ? parsed.unitPrice * parsed.qty : 0);
                                    }, 0) + (item.isNewCustomer ? item.activationFee ?? 0 : 0),
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-12 gap-4 items-end">
                              <div className="col-span-3 space-y-1.5">
                                <label className="pl-1 text-[10px] font-semibold text-slate-500">数量</label>
                                <NumberInput
                                  className="input-subdued w-full rounded-xl px-3 py-2 text-center text-xs font-semibold text-white"
                                  value={item.quantity}
                                  min={1}
                                  allowDecimal={false}
                                  onChange={(value) => onUpdateItem(item.id, { quantity: value })}
                                />
                              </div>
                              <div className="col-span-4 space-y-1.5">
                                <label className="pl-1 text-[10px] font-semibold text-slate-500">单价 (CAD)</label>
                                <NumberInput
                                  className="input-subdued w-full rounded-xl px-3 py-2 text-right text-xs font-mono text-white"
                                  value={item.unitPrice}
                                  min={0}
                                  allowDecimal={true}
                                  onChange={(value) => onUpdateItem(item.id, { unitPrice: value })}
                                />
                              </div>
                              <div className="col-span-5 pb-1 text-right">
                                <span className="mb-0.5 block text-[10px] text-slate-600">项目小计</span>
                                <span className="text-lg font-bold text-cyan-400 tracking-tight">
                                  {formatMoney(item.unitPrice * item.quantity + (item.isNewCustomer ? item.activationFee ?? 0 : 0))}
                                </span>
                              </div>

                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6 self-start lg:sticky lg:top-6">
                <section>
                  <div className="glass-card relative flex max-h-[calc(90vh-220px)] flex-col overflow-x-hidden overflow-y-auto rounded-[28px] border border-cyan-500/10 bg-white/[0.01] p-8">
                    <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-500/5 blur-[60px]" />
                    <div className="relative mb-8 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white tracking-tight">报价汇总</h2>
                      <button
                        type="button"
                        onClick={() => setCustomerOpen((prev) => !prev)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-emerald-300/40 hover:text-emerald-200"
                        aria-label="客户信息"
                        title="客户信息"
                      >
                        <UserCircle size={18} />
                      </button>
                    </div>

                    {customerOpen && (
                      <div className="relative mb-5 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">客户信息</span>
                          <button
                            type="button"
                            onClick={() => setCustomerOpen(false)}
                            className="text-[10px] text-slate-500 hover:text-slate-300"
                          >
                            收起
                          </button>
                        </div>
                        <div className="grid gap-3">
                          <CartField
                            label="客户姓名"
                            value={customer.name}
                            onChange={(value) => onUpdateCustomer({ name: value })}
                            placeholder="请输入姓名"
                          />
                          <CartField
                            label="联系电话"
                            value={customer.phone}
                            onChange={(value) => onUpdateCustomer({ phone: value })}
                            placeholder="请输入电话"
                            inputMode="tel"
                          />
                        </div>
                      </div>
                    )}

                    <div className="relative mb-auto space-y-4">
                      <CartStatRow label="项目总数" value={`${totals.itemsCount}`} />
                      <CartStatRow label="小计金额" value={formatMoney(totals.subtotal)} />
                      <CartStatRow label="HST (13%)" value={formatMoney(totals.tax)} />
                      <CartStatRow label="含税合计" value={formatMoney(totals.totalBeforeCredit)} highlight />
                      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>储值卡抵扣</span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">CAD</span>
                        </div>
                        <NumberInput
                          className="input-subdued w-full rounded-xl px-3 py-2 text-right text-xs font-mono text-white"
                          value={creditApplied}
                          min={0}
                          allowDecimal={false}
                          onChange={onCreditChange}
                        />
                        {totals.creditOverflow > 0 && (
                          <p className="text-[11px] text-amber-300">
                            抵扣金额超过含税合计，已自动按 {formatMoney(totals.totalBeforeCredit)} 抵扣。
                          </p>
                        )}
                      </div>
                      <div className="mt-2 border-t border-white/5 pt-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                            Grand Total
                          </span>
                          <span className="text-4xl font-black tracking-tighter text-white">
                            {formatMoneyWithDecimals(totals.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-10 space-y-3">
                      <button
                        type="button"
                        onClick={onCopySummary}
                        className="w-full rounded-2xl bg-cyan-500 py-4 text-sm font-black uppercase tracking-widest text-[#04070b] shadow-xl shadow-cyan-500/10 transition-all hover:bg-cyan-400 active:scale-[0.99]"
                      >
                        复制方案
                      </button>
                      <button
                        type="button"
                        onClick={onDownloadPdf}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/5 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-white/10"
                      >
                        <Receipt size={18} />
                        导出 PDF 报价
                      </button>
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <button
                          type="button"
                          onClick={onClearCart}
                          className="rounded-xl bg-white/5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-white"
                        >
                          清空
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-xl bg-white/5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-white"
                        >
                          关闭
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-black/40 px-10 py-5 text-[9px] font-medium tracking-wider text-slate-700">
          <p>© 2026 Oxygen 报价系统 · 销售报价模块</p>
          <p>最后更新: {lastUpdated}</p>
        </div>
      </div>
    </div>
  );
}
