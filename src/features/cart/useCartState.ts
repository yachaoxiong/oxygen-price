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
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const totals = useMemo<CartTotals>(() => {
    const { subtotal, itemsCount } = items.reduce(
      (acc, item) => {
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
          return {
            subtotal: acc.subtotal + courseSubtotal,
            itemsCount: acc.itemsCount + courseCount,
          };
        }
        return {
          subtotal: acc.subtotal + item.unitPrice * item.quantity,
          itemsCount: acc.itemsCount + item.quantity,
        };
      },
      { subtotal: 0, itemsCount: 0 },
    );

    const tax = subtotal * 0.13;
    const total = subtotal + tax;
    return {
      subtotal,
      tax,
      total,
      itemsCount,
    };
  }, [items]);

  const addItem = (payload: {
    name: string;
    category: PricingCategory;
    unitPrice: number;
    quantity?: number;
    note?: string;
    details?: string[];
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
