"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { CartQuoteModal } from "@/components/modals/CartQuoteModal";
import { useCartState } from "@/features/cart/useCartState";
import { buildCartSummaryText } from "@/lib/cart/cartTextBuilder";
import { buildCartPdfHtml } from "@/lib/export/cartPdfBuilder";
import { printHtml } from "@/lib/export/print";

type InvoiceScaffoldProps = {
  children: ReactNode;
  profileName?: string;
  profileEmail?: string;
  profileRole?: string;
  activeLocale: "zh" | "en";
  onToggleLocale: () => void;
  onSignOut: () => Promise<void> | void;
};

export function InvoiceScaffold({
  children,
  profileName,
  profileEmail,
  profileRole,
  activeLocale,
  onToggleLocale,
  onSignOut,
}: InvoiceScaffoldProps) {
  const router = useRouter();
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

  const handleSignOutClick = async () => {
    await onSignOut();
    setAvatarMenuOpen(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        activeLocale={activeLocale}
        activeCategory="membership"
        onSelectCategory={(category) => {
          router.push(`/?category=${category}`);
        }}
        onToggleLocale={onToggleLocale}
        cartCount={cartTotals.itemsCount}
        onOpenCart={() => setCartOpen(true)}
        addingItemKey={null}
        avatarInitial={(profileName || profileEmail || "U")[0]?.toUpperCase()}
        avatarName={profileName || profileEmail || "-"}
        avatarRole={profileRole ?? "sales"}
        avatarMenuOpen={avatarMenuOpen}
        onToggleAvatarMenu={() => setAvatarMenuOpen((prev) => !prev)}
        onSignOut={handleSignOutClick}
      />

      {children}

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
