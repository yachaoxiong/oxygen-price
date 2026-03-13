import type { PricingCategory } from "@/types/pricing";

export type CartCustomerInfo = {
  name: string;
  phone: string;
  notes: string;
};

export type CartItem = {
  id: string;
  name: string;
  category: PricingCategory;
  unitPrice: number;
  quantity: number;
  originalPrice?: number;
  note?: string;
  details?: string[];
};

export type CartTotals = {
  subtotal: number;
  tax: number;
  total: number;
  itemsCount: number;
};
