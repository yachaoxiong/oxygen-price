import { PRICING_CONFIG } from "@/lib/config/pricing";
import type { PtPreset } from "@/types/pricing";

export const TAX_RATE = PRICING_CONFIG.taxRate;

export type PresetValues = {
  member1v1Unit: number;
  nonMember1v1Unit: number;
  member1v2Unit: number;
  nonMember1v2Unit: number;
  member1v1Qty: number;
  nonMember1v1Qty: number;
  member1v2Qty: number;
  nonMember1v2Qty: number;
};

export function getPresetUnitAndQty(preset: PtPreset, values: PresetValues) {
  if (preset === "member_1v1") {
    return { unit: values.member1v1Unit, qty: values.member1v1Qty };
  }
  if (preset === "non_member_1v1") {
    return { unit: values.nonMember1v1Unit, qty: values.nonMember1v1Qty };
  }
  if (preset === "member_1v2") {
    return { unit: values.member1v2Unit, qty: values.member1v2Qty };
  }
  return { unit: values.nonMember1v2Unit, qty: values.nonMember1v2Qty };
}

export function calcSubtotal(unit: number, qty: number) {
  return unit * qty;
}

export function calcAfterCredit(subtotal: number, credit: number) {
  return Math.max(0, subtotal - credit);
}

export function calcTax(subtotal: number, rate = TAX_RATE) {
  return subtotal * rate;
}

export function calcTotalWithTax(subtotal: number, rate = TAX_RATE) {
  const tax = calcTax(subtotal, rate);
  return subtotal + tax;
}
