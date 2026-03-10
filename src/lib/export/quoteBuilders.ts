import { formatMoney } from "@/lib/formatters/number";

export function buildPtSummaryText(params: {
  reportDate: string;
  clientName: string;
  courseNameZh: string;
  courseNameEn?: string;
  activeLabel: { zh: string; en: string };
  unit: number;
  qty: number;
  subtotal: number;
  credit: number;
  afterCredit: number;
  tax: number;
  total: number;
}) {
  return [
    `日期: ${params.reportDate}`,
    `客户姓名: ${params.clientName || "未填写"}`,
    `课程: ${params.courseNameZh}${params.courseNameEn ? ` / ${params.courseNameEn}` : ""}`,
    `方案: ${params.activeLabel.zh} / ${params.activeLabel.en}`,
    `单价: ${formatMoney(params.unit)}`,
    `数量: ${params.qty}`,
    `小计: ${formatMoney(params.subtotal)}`,
    `积分抵扣: ${formatMoney(params.credit)}`,
    `抵扣后金额: ${formatMoney(params.afterCredit)}`,
    `税费(13%): ${formatMoney(params.tax)}`,
    `总计: ${formatMoney(params.total)}`,
  ].join("\n");
}

export function buildCycleSummaryText(params: {
  reportDate: string;
  clientName: string;
  cycleProgram: string;
  courseNameZh: string;
  courseNameEn?: string;
  activeLabel: { zh: string; en: string };
  unit: number;
  qty: number;
  subtotal: number;
  credit: number;
  afterCredit: number;
  tax: number;
  total: number;
}) {
  return [
    `日期: ${params.reportDate}`,
    `客户姓名: ${params.clientName || "未填写"}`,
    `周期计划: ${params.cycleProgram}`,
    `私教课程: ${params.courseNameZh}${params.courseNameEn ? ` / ${params.courseNameEn}` : ""}`,
    `方案: ${params.activeLabel.zh} / ${params.activeLabel.en}`,
    `单价: ${formatMoney(params.unit)}`,
    `数量: ${params.qty}`,
    `小计: ${formatMoney(params.subtotal)}`,
    `积分抵扣: ${formatMoney(params.credit)}`,
    `抵扣后金额: ${formatMoney(params.afterCredit)}`,
    `税费(13%): ${formatMoney(params.tax)}`,
    `总计: ${formatMoney(params.total)}`,
  ].join("\n");
}
