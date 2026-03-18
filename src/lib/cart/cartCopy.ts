export const cartCopy = {
  navbar: {
    cartLabel: { zh: "购物车，当前 {count} 项", en: "Cart, {count} items" },
    cartTitle: { zh: "购物车", en: "Cart" },
  },
  modal: {
    salesQuote: { zh: "客户报价单", en: "Client Quote" },
    salesQuoteLabel: { zh: "销售报价", en: "Sales Quote" },
    close: { zh: "关闭", en: "Close" },
    itemsSection: { zh: "项目明细", en: "Line Items" },
    emptyCart: { zh: "暂无项目，请从左侧添加到购物车！", en: "No items yet. Add from the left panel." },
    membershipGiftTitle: { zh: "赠送会员日期计算", en: "Gift Membership Date Calculator" },
    membershipGiftLabel: { zh: "会员赠送", en: "Membership Gift" },
    item: { zh: "项目", en: "Item" },
    weeks: { zh: "周数", en: "Weeks" },
    startDate: { zh: "开始日期", en: "Start Date" },
    endDate: { zh: "结束日期", en: "End Date" },
    removeItem: { zh: "移除项目", en: "Remove" },
    quantity: { zh: "数量", en: "Qty" },
    unitPrice: { zh: "单价 (CAD)", en: "Unit Price (CAD)" },
    lineSubtotal: { zh: "项目小计", en: "Line Subtotal" },
    planTotal: { zh: "方案总额", en: "Plan Total" },
    activationFee: { zh: "激活费", en: "Activation Fee" },
    taxExempt: { zh: "免税", en: "Tax Exempt" },
    discount: { zh: "优惠 {pct}%", en: "Discount {pct}%" },
    summaryTitle: { zh: "报价汇总", en: "Quote Summary" },
    customerInfo: { zh: "客户信息", en: "Customer Info" },
    collapse: { zh: "收起", en: "Collapse" },
    customerName: { zh: "客户姓名", en: "Customer Name" },
    customerPhone: { zh: "联系电话", en: "Phone" },
    namePlaceholder: { zh: "请输入姓名", en: "Enter name" },
    phonePlaceholder: { zh: "请输入电话", en: "Enter phone" },
    itemsCount: { zh: "项目总数", en: "Total Items" },
    subtotal: { zh: "小计金额", en: "Subtotal" },
    tax: { zh: "HST (13%)", en: "HST (13%)" },
    totalBeforeCredit: { zh: "含税合计", en: "Total (Tax Included)" },
    creditLabel: { zh: "储值卡抵扣", en: "Stored Value Credit" },
    creditUnit: { zh: "CAD", en: "CAD" },
    creditOverflow: { zh: "抵扣金额超过含税合计，已自动按 {total} 抵扣。", en: "Credit exceeds total. Applied {total}." },
    grandTotal: { zh: "总计", en: "Grand Total" },
    copyPlan: { zh: "复制方案", en: "Copy Quote" },
    exportPdf: { zh: "导出 PDF 报价", en: "Export PDF" },
    clear: { zh: "清空", en: "Clear" },
    footer: { zh: "© 2026 Oxygen 报价系统 · 销售报价模块", en: "© 2026 Oxygen Sales Pricing · Quote Module" },
    lastUpdated: { zh: "最后更新: {time}", en: "Last updated: {time}" },
  },
  toast: {
    copySuccessTitle: { zh: "内容已复制", en: "Copied" },
    copySuccessSubtitle: { zh: "报价摘要已复制", en: "Cart summary copied" },
    copyFailedTitle: { zh: "复制失败", en: "Copy failed" },
    copyFailedSubtitle: { zh: "请重试", en: "Please try again" },
  },
  category: {
    membership: { zh: "会籍", en: "Membership" },
    groupClass: { zh: "团课", en: "Classes" },
    personalTraining: { zh: "私教课", en: "Personal Training" },
    assessment: { zh: "评估", en: "Assessment" },
    cyclePlan: { zh: "周期方案", en: "Cycle Plan" },
    storedValue: { zh: "储值卡", en: "Stored Value" },
  },
};

export type CartLocale = "zh" | "en";
export type CartCopyValue = { zh: string; en: string };

export function formatCartCopy(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}
