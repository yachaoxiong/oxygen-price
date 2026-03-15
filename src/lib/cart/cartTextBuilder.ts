import { formatMoney } from "@/lib/formatters/number";
import type { CartCustomerInfo, CartItem, CartTotals } from "@/types/cart";

export function buildCartSummaryText(params: {
  reportDate: string;
  customer: CartCustomerInfo;
  items: CartItem[];
  totals: CartTotals;
}) {
  const { customer, items, totals, reportDate } = params;

  return [
    `日期: ${reportDate}`,
    `客户姓名: ${customer.name || "未填写"}`,
    `联系电话: ${customer.phone || "未填写"}`,
    `需求备注: ${customer.notes || "未填写"}`,
    "-",
    "项目明细:",
    ...items.map((item, index) => {
      const activationFee = item.isNewCustomer ? item.activationFee ?? 0 : 0;
      const subtotal = item.unitPrice * item.quantity + activationFee;
      const original = item.originalPrice ? ` (原价 ${formatMoney(item.originalPrice)})` : "";
      const activationNote = activationFee > 0 ? ` | 新顾客激活费 +${formatMoney(activationFee)}` : "";
      return `${index + 1}. ${item.name} x${item.quantity} · ${formatMoney(item.unitPrice)}${original} = ${formatMoney(subtotal)}${item.note ? ` | ${item.note}` : ""}${activationNote}`;
    }),
    "-",
    `项目数量: ${totals.itemsCount}`,
    `小计金额: ${formatMoney(totals.subtotal)}`,
    ...(totals.nonTaxableSubtotal > 0 ? [`储值卡金额 (免税): ${formatMoney(totals.nonTaxableSubtotal)}`] : []),
    `应税小计: ${formatMoney(totals.taxableSubtotal)}`,
    `税费 (13%): ${formatMoney(totals.tax)}`,
    `含税合计: ${formatMoney(totals.totalBeforeCredit)}`,
    `储值卡抵扣: ${formatMoney(totals.creditUsed)}`,
    `应付总额: ${formatMoney(totals.total)}`,
  ].join("\n");
}
