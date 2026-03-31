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
  membershipWeeks?: number;
  membershipStartDate?: string;
  isNewCustomer?: boolean;
  activationFee?: number;
};

export type CartTotals = {
  subtotal: number;
  taxableSubtotal: number;
  nonTaxableSubtotal: number;
  tax: number;
  totalBeforeCredit: number;
  creditApplied: number;
  creditUsed: number;
  creditOverflow: number;
  total: number;
  itemsCount: number;
};
