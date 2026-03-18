"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { CartQuoteModal } from "@/components/modals/CartQuoteModal";
import { glass } from "@/lib/pricing/constants";
import { formatMoney } from "@/lib/formatters/number";
import { useCartState } from "@/features/cart/useCartState";
import { buildCartSummaryText } from "@/lib/cart/cartTextBuilder";
import { buildCartPdfHtml } from "@/lib/export/cartPdfBuilder";
import { printHtml } from "@/lib/export/print";
import { useAuth } from "@/features/auth/useAuth";
import { AuthLoadingScreen } from "@/features/auth/AuthLoadingScreen";
import { AuthLoginScreen } from "@/features/auth/AuthLoginScreen";

const invoiceItems = [
  {
    id: "1",
    name: "Performance Membership · Annual",
    description: "Access to all studio zones and premium amenities.",
    qty: 1,
    unitPrice: 12800,
  },
  {
    id: "2",
    name: "Personal Training Pack · 12 Sessions",
    description: "1-on-1 coaching with strength + mobility focus.",
    qty: 1,
    unitPrice: 7200,
  },
  {
    id: "3",
    name: "Recovery Add-on",
    description: "Infrared sauna + cold plunge credits.",
    qty: 1,
    unitPrice: 980,
  },
];

const subtotal = invoiceItems.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
const discount = 520;
const taxRate = 0.06;
const tax = Math.round((subtotal - discount) * taxRate);
const total = subtotal - discount + tax;

export default function InvoicePage() {
  const router = useRouter();
  const { authState, email, setEmail, password, setPassword, authError, profile, handleSignIn, handleSignOut } = useAuth();
  const handleSelectCategory = (category: string) => {
    router.push(`/?category=${category}`);
  };
  const handleSignOutClick = async () => {
    await handleSignOut();
    setAvatarMenuOpen(false);
    router.push("/");
  };
  const [activeLocale, setActiveLocale] = useState<"zh" | "en">(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("oxygen-pricing-locale");
    return saved === "zh" || saved === "en" ? saved : "en";
  });
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const {
    items: cartItems,
    totals: cartTotals,
    customer: cartCustomer,
    isOpen: cartOpen,
    setIsOpen: setCartOpen,
    creditApplied: cartCreditApplied,
    setCreditApplied: setCartCreditApplied,
    updateItem: updateCartItem,
    removeItem: removeCartItem,
    clearCart,
    updateCustomer: updateCartCustomer,
    lastAddedId,
    clearLastAdded,
  } = useCartState();

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-avatar-menu]")) return;
      setAvatarMenuOpen(false);
    }

    if (avatarMenuOpen) {
      document.addEventListener("mousedown", handleDocumentClick);
    }
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [avatarMenuOpen]);


  const handleToggleLocale = () => {
    setActiveLocale((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("oxygen-pricing-locale", next);
      }
      return next;
    });
  };

  if (authState === "loading") {
    return <AuthLoadingScreen />;
  }

  if (authState !== "authed") {
    return (
      <AuthLoginScreen
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        authError={authError}
        onSignIn={handleSignIn}
      />
    );
  }

  return (
    <div className="relative min-h-screen  bg-[#03050b] text-slate-100">
      <Navbar
        activeLocale={activeLocale}
        activeCategory="membership"
        onSelectCategory={handleSelectCategory}
        onToggleLocale={handleToggleLocale}
        cartCount={cartTotals.itemsCount}
        onOpenCart={() => setCartOpen(true)}
        addingItemKey={null}
        avatarInitial={(profile?.full_name || profile?.email || email || "U")[0]?.toUpperCase()}
        avatarName={profile?.full_name || profile?.email || email || "-"}
        avatarRole={profile?.role ?? (email?.toLowerCase() === "admin" ? "admin" : "sales")}
        avatarMenuOpen={avatarMenuOpen}
        onToggleAvatarMenu={() => setAvatarMenuOpen((prev) => !prev)}
        onSignOut={handleSignOutClick}
      />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <section className={`${glass} border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(5,8,15,0.65)] md:p-10`}>
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-white/10 pb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.5em] text-slate-500">Invoice</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Oxygen Wellness Studio</h1>
              <p className="mt-3 max-w-md text-sm text-slate-400">
                188 Skyline Blvd, Suite 120 · Shanghai · +86 21 5888 3000 · hello@oxygen.com
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                Paid
              </span>
              <div className="mt-4 space-y-1 text-sm text-slate-300">
                <p className="text-slate-500">Invoice #</p>
                <p className="text-lg font-semibold text-white">INV-2026-0315</p>
                <p className="text-slate-500">Issued</p>
                <p>Mar 15, 2026</p>
                <p className="text-slate-500">Due</p>
                <p>Mar 20, 2026</p>
              </div>
            </div>
          </header>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Bill To</p>
              <h2 className="mt-3 text-lg font-semibold text-white">Alicia Wang</h2>
              <p className="mt-1 text-sm text-slate-400">alicia.wang@oxygen.com</p>
              <p className="mt-3 text-sm text-slate-400">
                Room 4203, 88 Century Avenue<br />
                Pudong, Shanghai 200120
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Payment Details</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Method</span>
                  <span className="font-medium text-white">UnionPay · 4321</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Transaction</span>
                  <span>TX-548-20260315</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment Date</span>
                  <span>Mar 15, 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Sales Lead</span>
                  <span>Olivia Chen</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10 overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoiceItems.map((item) => (
                    <tr key={item.id} className="bg-black/10">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                      </td>
                      <td className="px-6 py-5 text-slate-300">{item.qty}</td>
                      <td className="px-6 py-5 text-slate-300">{formatMoney(item.unitPrice)}</td>
                      <td className="px-6 py-5 text-right font-semibold text-white">
                        {formatMoney(item.qty * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-6">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Notes</p>
              <p className="mt-4 text-sm text-slate-300">
                Thank you for choosing Oxygen Wellness Studio. All services include complimentary orientation and
                quarterly wellness check-ins. Please keep this invoice for your records.
              </p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Support</p>
                <p className="mt-2 text-sm text-slate-300">support@oxygen.com · +86 21 5888 3000</p>
                <p className="mt-1 text-xs text-slate-500">Open daily 08:00 - 22:00</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Summary</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-200">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Membership Discount</span>
                  <span className="text-emerald-300">-{formatMoney(discount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tax (6%)</span>
                  <span className="text-slate-200">{formatMoney(tax)}</span>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center justify-between text-base font-semibold text-white">
                  <span>Total</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  className="w-full rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.2)] transition hover:border-emerald-300/70 hover:bg-emerald-500/20"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/40 hover:bg-white/[0.08]"
                >
                  Print Invoice
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:border-white/30 hover:text-slate-200"
                >
                  Send to Client
                </button>
              </div>
            </div>
          </section>
        </section>
      </main>

      <CartQuoteModal
        open={cartOpen}
        items={cartItems}
        totals={cartTotals}
        customer={cartCustomer}
        creditApplied={cartCreditApplied}
        onCreditChange={setCartCreditApplied}
        onClose={() => setCartOpen(false)}
        onRemoveItem={removeCartItem}
        onUpdateItem={updateCartItem}
        onUpdateCustomer={updateCartCustomer}
        onClearCart={clearCart}
        activeLocale={activeLocale}
        onCopySummary={() => {
          const reportDate = new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const summary = buildCartSummaryText({
            reportDate,
            customer: cartCustomer,
            items: cartItems,
            totals: cartTotals,
          });
          navigator.clipboard.writeText(summary);
        }}
        onDownloadPdf={() => {
          const reportDate = new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const html = buildCartPdfHtml({
            reportDate,
            customer: cartCustomer,
            items: cartItems,
            totals: cartTotals,
          });
          printHtml(html, { width: 980, height: 760, delayMs: 250 });
        }}
        lastAddedId={lastAddedId}
        onAnimationComplete={clearLastAdded}
      />
    </div>
  );
}
