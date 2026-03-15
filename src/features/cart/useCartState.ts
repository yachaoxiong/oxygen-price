"use client";

import { useMemo, useState } from "react";
import type { CartCustomerInfo, CartItem, CartTotals } from "@/types/cart";
import type { PricingCategory } from "@/types/pricing";

const createId = () => `cart-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const cycleDetailPattern = /^(.*?) · (.*?) · (\d+)次 · [^\d]*([\d,.]+)/;

const parseCycleDetail = (line: string) => {
  const match = line.match(cycleDetailPattern);
  if (!match) return null;
  return {
    name: match[1],
    preset: match[2],
    qty: Number(match[3]) || 1,
    unitPrice: Number(match[4].replace(/,/g, "")) || 0,
  };
};

const defaultCustomer: CartCustomerInfo = {
  name: "",
  phone: "",
  notes: "",
};

export function useCartState() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CartCustomerInfo>(defaultCustomer);
  const [isOpen, setIsOpen] = useState(false);
  const [creditApplied, setCreditApplied] = useState(0);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const totals = useMemo<CartTotals>(() => {
    const { subtotal, itemsCount, taxableSubtotal, nonTaxableSubtotal } = items.reduce(
      (acc, item) => {
        const isStoredValue = item.category === "stored_value";

        if (item.category === "cycle_plan" && item.details && item.details.length > 0) {
          const courseSubtotal = item.details.reduce((detailSum, line) => {
            const parsed = parseCycleDetail(line);
            if (!parsed) return detailSum;
            return detailSum + parsed.unitPrice * parsed.qty;
          }, 0);
          const courseCount = item.details.reduce((detailSum, line) => {
            const parsed = parseCycleDetail(line);
            if (!parsed) return detailSum;
            return detailSum + parsed.qty;
          }, 0);
          const activationFee = item.isNewCustomer ? item.activationFee ?? 0 : 0;
          return {
            subtotal: acc.subtotal + courseSubtotal + activationFee,
            itemsCount: acc.itemsCount + courseCount,
            taxableSubtotal: acc.taxableSubtotal + courseSubtotal + activationFee,
            nonTaxableSubtotal: acc.nonTaxableSubtotal,
          };
        }

        const lineSubtotal = item.unitPrice * item.quantity;
        const activationFee = item.isNewCustomer ? item.activationFee ?? 0 : 0;

        return {
          subtotal: acc.subtotal + lineSubtotal + activationFee,
          itemsCount: acc.itemsCount + item.quantity,
          taxableSubtotal: acc.taxableSubtotal + (isStoredValue ? 0 : lineSubtotal + activationFee),
          nonTaxableSubtotal: acc.nonTaxableSubtotal + (isStoredValue ? lineSubtotal : 0),
        };
      },
      { subtotal: 0, itemsCount: 0, taxableSubtotal: 0, nonTaxableSubtotal: 0 },
    );

    const tax = taxableSubtotal * 0.13;
    const totalBeforeCredit = subtotal + tax;
    const credit = Math.max(0, Math.min(creditApplied, totalBeforeCredit));
    const total = totalBeforeCredit - credit;
    const creditOverflow = Math.max(0, creditApplied - totalBeforeCredit);

    return {
      subtotal,
      taxableSubtotal,
      nonTaxableSubtotal,
      tax,
      total,
      itemsCount,
      creditApplied,
      creditUsed: credit,
      totalBeforeCredit,
      creditOverflow,
    };
  }, [items, creditApplied]);

  const addItem = (payload: {
    name: string;
    category: PricingCategory;
    unitPrice: number;
    quantity?: number;
    note?: string;
    details?: string[];
    isNewCustomer?: boolean;
    activationFee?: number;
  }) => {
    setItems((prev) => {
      const next: CartItem = {
        id: createId(),
        name: payload.name,
        category: payload.category,
        unitPrice: payload.unitPrice,
        quantity: payload.quantity ?? 1,
        originalPrice: payload.unitPrice,
        note: payload.note,
        details: payload.details,
        isNewCustomer: payload.isNewCustomer,
        activationFee: payload.activationFee,
      };
      setLastAddedId(next.id);
      return [...prev, next];
    });
  };

  const updateItem = (id: string, update: Partial<CartItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...update } : item)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const updateCustomer = (update: Partial<CartCustomerInfo>) => {
    setCustomer((prev) => ({ ...prev, ...update }));
  };

  const resetCustomer = () => setCustomer(defaultCustomer);

  const clearLastAdded = () => setLastAddedId(null);

  return {
    items,
    totals,
    customer,
    isOpen,
    setIsOpen,
    creditApplied,
    setCreditApplied,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    updateCustomer,
    resetCustomer,
    lastAddedId,
    clearLastAdded,
  };
}
