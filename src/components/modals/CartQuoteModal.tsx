"use client";

import { useEffect, useState } from "react";
import { ClipboardList, CreditCard, Dumbbell, Receipt, UserRound, X, UserCircle } from "lucide-react";

import type { CartCustomerInfo, CartItem, CartTotals } from "@/types/cart";
import { formatMoney, formatMoneyWithDecimals } from "@/lib/formatters/number";
import { CartField } from "@/components/cart/CartField";
import { CartTag } from "@/components/cart/CartTag";
import { CartStatRow } from "@/components/cart/CartStatRow";
import { CycleDetailRow } from "@/components/cart/CycleDetailRow";
import { NumberInput } from "@/components/ui/NumberInput";
import { cartCopy, formatCartCopy, type CartLocale, type CartCopyValue } from "@/lib/cart/cartCopy";

const categoryMeta: Record<
  CartItem["category"],
  { label: CartCopyValue; icon: typeof UserRound; tone: string }
> = {
  membership: { label: cartCopy.category.membership, icon: UserRound, tone: "text-[color:var(--theme-green)]" },
  group_class: { label: cartCopy.category.groupClass, icon: Dumbbell, tone: "text-[color:var(--theme-green)]" },
  personal_training: { label: cartCopy.category.personalTraining, icon: Dumbbell, tone: "text-[color:var(--theme-green)]" },
  assessment: { label: cartCopy.category.assessment, icon: ClipboardList, tone: "text-[color:var(--theme-green)]" },
  cycle_plan: { label: cartCopy.category.cyclePlan, icon: Receipt, tone: "text-[color:var(--theme-green)]" },
  stored_value: { label: cartCopy.category.storedValue, icon: CreditCard, tone: "text-[color:var(--theme-green)]" },
};

const cycleDetailPattern = /^(.*?) · (.*?) · (\d+)\s*(次|sessions?) · [^\d]*([\d,.]+)/i;

function parseCycleDetail(line: string) {
  const match = line.match(cycleDetailPattern);
  if (!match) return null;
  return {
    name: match[1],
    preset: match[2],
    qty: Number(match[3]) || 1,
    unitPrice: Number(match[5].replace(/,/g, "")) || 0,
  };
}

function formatCycleDetail(detail: { name: string; preset: string; qty: number; unitPrice: number }, locale: CartLocale) {
  const sessionLabel = locale === "zh" ? "次" : " sessions";
  return `${detail.name} · ${detail.preset} · ${detail.qty}${sessionLabel} · ${formatMoney(detail.unitPrice)}`;
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

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatGiftDate(date: Date, locale: CartLocale) {
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
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
  activeLocale: CartLocale;
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
    activeLocale,
  } = props;

  const [customerOpen, setCustomerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const { body } = document;
    body.setAttribute("data-modal-open", "true");

    const preventTouchMove = (event: TouchEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest(".cart-modal-scroll")) {
        return;
      }
      event.preventDefault();
    };

    document.addEventListener("touchmove", preventTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventTouchMove);
      body.removeAttribute("data-modal-open");
    };
  }, [open]);

  const membershipGiftItems = items
    .map((item) => ({
      item,
      membershipWeeks: parseMembershipWeeks(item.note),
    }))
    .filter((entry) => entry.membershipWeeks !== null);

  const lastUpdated = new Date().toLocaleString(activeLocale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-[var(--modal-backdrop)] px-3 sm:px-4 backdrop-blur pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] sm:py-6 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-panel flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl sm:rounded-[32px] lg:rounded-[40px] shadow-2xl max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:max-h-[calc(100dvh-3rem)]">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.01] px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-7">
          <div className="flex items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--theme-green-soft)] bg-[color:var(--theme-green-faint)]">
              <Receipt size={22} className="text-[color:var(--theme-green)]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[color:var(--theme-green)]">
                  {cartCopy.modal.salesQuoteLabel[activeLocale]}
                </span>
                <div className="h-px w-6 bg-[color:var(--theme-green-soft)]" />
              </div>
              <h2 className="mt-0.5 text-xl font-bold text-foreground tracking-tight">
                {cartCopy.modal.salesQuote[activeLocale]}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground"
            aria-label={cartCopy.modal.close[activeLocale]}
            title={cartCopy.modal.close[activeLocale]}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden cart-modal-scroll">
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7 lg:px-10 lg:py-8 custom-scrollbar">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-6">
                <div className="relative flex items-center justify-between pb-3">
                  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/80">
                    <span className="h-1 w-1 rounded-full bg-[color:var(--theme-green)]" />
                    {cartCopy.modal.itemsSection[activeLocale]}
                  </h3>
                </div>

                {items.length === 0 ? (
                  <div className="glass-card rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
                    {cartCopy.modal.emptyCart[activeLocale]}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {membershipGiftItems.length > 0 && (
                      <div className="glass-card rounded-2xl border border-[color:var(--theme-green-soft)] bg-[color:var(--theme-green-faint)] p-5 text-foreground/80">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[color:var(--theme-green)]/70">
                              {cartCopy.modal.membershipGiftLabel[activeLocale]}
                            </p>
                            <h4 className="mt-1 text-lg font-bold text-foreground">
                              {cartCopy.modal.membershipGiftTitle[activeLocale]}
                            </h4>
                          </div>
                          <span className="rounded-full border border-[color:var(--theme-green-soft)] px-2.5 py-1 text-[10px] font-semibold text-[color:var(--theme-green)]">
                            {membershipGiftItems.length} 项
                          </span>
                        </div>
                        <div className="space-y-3">
                          {membershipGiftItems.map(({ item, membershipWeeks }) => {
                            const storedWeeks = item.membershipWeeks ?? membershipWeeks ?? 0;
                            const bonusWeeks = 2;
                            const totalWeeks = Math.max(0, storedWeeks) + bonusWeeks;
                            const startDate = parseDateInputValue(item.membershipStartDate) ?? new Date();
                            const startDateInput = toDateInputValue(startDate);
                            const endDate = addDays(startDate, totalWeeks * 7);

                            return (
                              <div
                                key={`membership-gift-${item.id}`}
                                className="grid grid-cols-1 gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-xs text-foreground/80 md:grid-cols-[1.6fr_1fr_1fr_1fr]"
                              >
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    {cartCopy.modal.item[activeLocale]}
                                  </p>
                                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    {cartCopy.modal.weeks[activeLocale]}
                                  </p>
                                  <NumberInput
                                    className="input-subdued w-full rounded-xl px-3 py-2 text-center text-xs font-semibold text-white"
                                    value={totalWeeks}
                                    min={0}
                                    allowDecimal={false}
                                    onChange={(value) => onUpdateItem(item.id, { membershipWeeks: Math.max(0, value - bonusWeeks) })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                    {cartCopy.modal.startDate[activeLocale]}
                                  </p>
                                  <input
                                    type="date"
                                    value={startDateInput}
                                    onChange={(event) => {
                                      onUpdateItem(item.id, { membershipStartDate: event.target.value });
                                    }}
                                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-sm font-semibold text-white outline-none transition focus:border-[var(--theme-green-soft)]"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                    {cartCopy.modal.endDate[activeLocale]}
                                  </p>
                                  <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-sm font-semibold text-white">
                                    {formatGiftDate(endDate, activeLocale)}
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
                          className={`glass-card group rounded-2xl border border-white/5 p-4 sm:p-5 transition-colors hover:bg-white/[0.03] ${
                            isNew ? "border-[color:var(--theme-green-soft)] bg-[color:var(--theme-green-muted)]" : ""
                          }`}
                          onAnimationEnd={() => {
                            if (isNew && onAnimationComplete) onAnimationComplete();
                          }}
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card">
                                <CategoryIcon size={18} className={meta.tone} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-foreground">{item.name}</span>
                                  <CartTag
                                    label={meta.label[activeLocale]}
                                    tone={
                                      item.category === "membership"
                                        ? "violet"
                                        : item.category === "group_class"
                                          ? "indigo"
                                          : item.category === "personal_training"
                                            ? "emerald"
                                            : item.category === "assessment"
                                              ? "amber"
                                              : item.category === "cycle_plan"
                                                ? "cyan"
                                                : item.category === "stored_value"
                                                  ? "sky"
                                                  : "slate"
                                    }
                                  />
                                  {item.category === "stored_value" && (
                                    <CartTag label={cartCopy.modal.taxExempt[activeLocale]} tone="amber" />
                                  )}
                                  {isDiscounted && (
                                    <CartTag
                                      label={formatCartCopy(cartCopy.modal.discount[activeLocale], { pct: discountPct })}
                                      tone="cyan"
                                    />
                                  )}
                                  {item.activationFee && item.activationFee > 0 && (
                                    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                      <span>{cartCopy.modal.activationFee[activeLocale]}</span>
                                      <button
                                        type="button"
                                        onClick={() => onUpdateItem(item.id, { isNewCustomer: !item.isNewCustomer })}
                                        className={`relative h-3.5 w-6 rounded-full border transition ${
                                          item.isNewCustomer
                                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                                            : "border-border/70 bg-card"
                                        }`}
                                        aria-label={cartCopy.modal.activationFee[activeLocale]}
                                        title={cartCopy.modal.activationFee[activeLocale]}
                                      >
                                        <span
                                          className={`absolute left-0.5 top-0.5 h-2 w-2 rounded-full transition ${
                                            item.isNewCustomer ? "translate-x-2.5 bg-[var(--color-primary-contrast)]" : "bg-foreground"
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[9px] font-mono tracking-tighter text-muted-foreground">
                                  #{String(index + 1).padStart(3, "0")}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              className="text-[9px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-red-400/80"
                            >
                              {cartCopy.modal.removeItem[activeLocale]}
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
                                        nextDetails[detailIndex] = formatCycleDetail(updated, activeLocale);
                                        onUpdateItem(item.id, { details: nextDetails });
                                      }}
                                      onUnitPriceChange={(value) => {
                                        const cleaned = Number(String(value).replace(/^0+(?=\d)/, "")) || 0;
                                        const updated = { ...parsed, unitPrice: Math.max(0, cleaned) };
                                        const nextDetails = [...(item.details ?? [])];
                                        nextDetails[detailIndex] = formatCycleDetail(updated, activeLocale);
                                        onUpdateItem(item.id, { details: nextDetails });
                                      }}
                                    />
                                  </div>
                                );
                              })}
                              <div className="mt-2 flex items-center justify-end gap-3 border-t border-white/5 pt-3">
                                <span className="text-[10px] font-medium text-slate-600">
                                  {cartCopy.modal.planTotal[activeLocale]}
                                </span>
                                <span className="text-base font-bold text-[color:var(--theme-green)] tracking-tight">
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
                            <div className="grid grid-cols-1 gap-4 items-end sm:grid-cols-12">
                              <div className="sm:col-span-3 space-y-1.5">
                                <label className="pl-1 text-[10px] font-semibold text-slate-500">
                                  {cartCopy.modal.quantity[activeLocale]}
                                </label>
                                <NumberInput
                                  className="input-subdued w-full rounded-xl px-3 py-2 text-center text-xs font-semibold text-white"
                                  value={item.quantity}
                                  min={1}
                                  allowDecimal={false}
                                  onChange={(value) => onUpdateItem(item.id, { quantity: value })}
                                />
                              </div>
                              <div className="sm:col-span-4 space-y-1.5">
                                <label className="pl-1 text-[10px] font-semibold text-slate-500">
                                  {cartCopy.modal.unitPrice[activeLocale]}
                                </label>
                                <NumberInput
                                  className="input-subdued w-full rounded-xl px-3 py-2 text-right text-xs font-mono text-white"
                                  value={item.unitPrice}
                                  min={0}
                                  allowDecimal={true}
                                  onChange={(value) => onUpdateItem(item.id, { unitPrice: value })}
                                />
                              </div>
                              <div className="sm:col-span-5 pb-1 text-right">
                                <span className="mb-0.5 block text-[10px] text-slate-600">
                                  {cartCopy.modal.lineSubtotal[activeLocale]}
                                </span>
                                <span className="text-lg font-bold text-[color:var(--theme-green)] tracking-tight">
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
                  <div className="glass-card relative flex flex-col overflow-x-hidden rounded-3xl border border-[color:var(--theme-green-muted)] bg-white/[0.01] p-6 sm:rounded-[28px] sm:p-8">
                    <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[color:var(--theme-green-faint)] blur-[60px]" />
                    <div className="relative mb-8 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-foreground tracking-tight">
                        {cartCopy.modal.summaryTitle[activeLocale]}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setCustomerOpen((prev) => !prev)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-emerald-300/40 hover:text-emerald-200"
                        aria-label={cartCopy.modal.customerInfo[activeLocale]}
                        title={cartCopy.modal.customerInfo[activeLocale]}
                      >
                        <UserCircle size={18} />
                      </button>
                    </div>

                    {customerOpen && (
                      <div className="relative mb-5 rounded-2xl border border-white/10 bg-card/80 px-4 py-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                            {cartCopy.modal.customerInfo[activeLocale]}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomerOpen(false)}
                            className="text-[10px] text-slate-500 hover:text-slate-300"
                          >
                            {cartCopy.modal.collapse[activeLocale]}
                          </button>
                        </div>
                        <div className="grid gap-3">
                          <CartField
                            label={cartCopy.modal.customerName[activeLocale]}
                            value={customer.name}
                            onChange={(value) => onUpdateCustomer({ name: value })}
                            placeholder={cartCopy.modal.namePlaceholder[activeLocale]}
                          />
                          <CartField
                            label={cartCopy.modal.customerPhone[activeLocale]}
                            value={customer.phone}
                            onChange={(value) => onUpdateCustomer({ phone: value })}
                            placeholder={cartCopy.modal.phonePlaceholder[activeLocale]}
                            inputMode="tel"
                          />
                        </div>
                      </div>
                    )}

                    <div className="relative mb-auto space-y-4">
                      <CartStatRow label={cartCopy.modal.itemsCount[activeLocale]} value={`${totals.itemsCount}`} />
                      <CartStatRow label={cartCopy.modal.subtotal[activeLocale]} value={formatMoney(totals.subtotal)} />
                      <CartStatRow label={cartCopy.modal.tax[activeLocale]} value={formatMoney(totals.tax)} />
                      <CartStatRow
                        label={cartCopy.modal.totalBeforeCredit[activeLocale]}
                        value={formatMoney(totals.totalBeforeCredit)}
                        highlight
                      />
                      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{cartCopy.modal.creditLabel[activeLocale]}</span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                            {cartCopy.modal.creditUnit[activeLocale]}
                          </span>
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
                            {formatCartCopy(cartCopy.modal.creditOverflow[activeLocale], {
                              total: formatMoney(totals.totalBeforeCredit),
                            })}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 border-t border-white/5 pt-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                            {cartCopy.modal.grandTotal[activeLocale]}
                          </span>
                          <span className="text-4xl font-black tracking-tighter text-foreground">
                            {formatMoneyWithDecimals(totals.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-8 space-y-3 sm:mt-10">
                      <button
                        type="button"
                        onClick={onCopySummary}
                        className="w-full rounded-2xl bg-[color:var(--theme-green)] py-4 text-sm font-black uppercase tracking-widest text-[#04070b] shadow-xl shadow-[color:var(--theme-green-glow-soft)] transition-all hover:bg-[color:var(--theme-green-soft)] hover:shadow-[0_0_0_1px_var(--color-primary-faint)] active:scale-[0.99]"
                      >
                        {cartCopy.modal.copyPlan[activeLocale]}
                      </button>
                      <button
                        type="button"
                        onClick={onDownloadPdf}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card py-3 text-sm font-bold text-foreground transition-all hover:border-[var(--color-primary-soft)] hover:bg-[var(--color-primary-faint)]"
                      >
                        <Receipt size={18} />
                        {cartCopy.modal.exportPdf[activeLocale]}
                      </button>
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <button
                          type="button"
                          onClick={onClearCart}
                          className="rounded-xl border border-border/70 bg-card py-2 text-[10px] font-bold uppercase tracking-wider text-foreground/80 transition-colors hover:border-[var(--color-primary-soft)] hover:bg-[var(--color-primary-faint)] hover:text-foreground"
                        >
                          {cartCopy.modal.clear[activeLocale]}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-xl border border-border/70 bg-card py-2 text-[10px] font-bold uppercase tracking-wider text-foreground/80 transition-colors hover:border-[var(--color-primary-soft)] hover:bg-[var(--color-primary-faint)] hover:text-foreground"
                        >
                          {cartCopy.modal.close[activeLocale]}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/5 bg-card/80 px-5 py-4 text-[9px] font-medium tracking-wider text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5 lg:px-10">
          <p>{cartCopy.modal.footer[activeLocale]}</p>
          <p>{formatCartCopy(cartCopy.modal.lastUpdated[activeLocale], { time: lastUpdated })}</p>
        </div>
      </div>
    </div>
  );
}
