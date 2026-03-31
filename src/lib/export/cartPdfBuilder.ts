import { formatMoney } from "@/lib/formatters/number";
import type { CartCustomerInfo, CartItem, CartTotals } from "@/types/cart";

export function buildCartPdfHtml(params: {
  reportDate: string;
  customer: CartCustomerInfo;
  items: CartItem[];
  totals: CartTotals;
}) {
  const { customer, items, totals, reportDate } = params;

  const cycleDetailPattern = /^(.*?) · (.*?) · (\d+)\s*(次|sessions?) · [^\d]*([\d,.]+)/i;

  const itemCards = items.length
    ? items
        .map((item, index) => {
          const subtotal = item.unitPrice * item.quantity;
          const note = item.note ? `<div class="note">${item.note}</div>` : "";
          const details = item.details?.length
            ? `<div class="details"><div class="detail-title">课程明细</div><table class="detail-table"><thead><tr><th>课程</th><th>方案</th><th>数量</th><th>单价</th><th>小计</th></tr></thead><tbody>${item.details
                .map((detail) => {
                  const match = detail.match(cycleDetailPattern);
                  if (!match) {
                    return `<tr><td colspan="5">${detail}</td></tr>`;
                  }
                  const qty = Number(match[3]) || 1;
                  const unitPrice = Number(match[5].replace(/,/g, "")) || 0;
                  return `<tr><td>${match[1]}</td><td>${match[2]}</td><td>${qty}</td><td>${formatMoney(unitPrice)}</td><td>${formatMoney(unitPrice * qty)}</td></tr>`;
                })
                .join("")}</tbody></table></div>`
            : "";

          return `
            <div class="item-card">
              <div class="item-head">
                <div>
                  <div class="item-index">ITEM ${String(index + 1).padStart(2, "0")}</div>
                  <div class="item-name">${item.name}</div>
                </div>
                <div class="item-total">${formatMoney(subtotal)}</div>
              </div>
              <div class="item-metrics">
                <div>
                  <div class="metric-label">数量</div>
                  <div class="metric-value">${item.category === "cycle_plan" && item.details?.length ? item.details.length : item.quantity}</div>
                </div>
                <div>
                  <div class="metric-label">单价</div>
                  <div class="metric-value">${formatMoney(item.unitPrice)}</div>
                </div>
                <div>
                  <div class="metric-label">小计</div>
                  <div class="metric-value">${formatMoney(subtotal)}</div>
                </div>
              </div>
              ${note}
              ${item.isNewCustomer && item.activationFee ? `<div class="note">新顾客激活费 +${formatMoney(item.activationFee)}</div>` : ""}
              ${details}
            </div>
          `;
        })
        .join("")
    : `<div class="empty">暂无项目</div>`;

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>统一报价方案</title>
        <style>
          :root {
            --bg: #f6f7fb;
            --panel: #ffffff;
            --line: #e6e9ef;
            --text: #1f2937;
            --muted: #6b7280;
            --brand: #1f3a8a;
            --accent: #0f766e;
          }
          * { box-sizing: border-box; font-family: "Inter", "PingFang SC", "Microsoft Yahei", sans-serif; }
          body {
            margin: 0;
            padding: 26px;
            background: var(--bg);
            color: var(--text);
          }
          .sheet {
            background: var(--panel);
            border-radius: 20px;
            padding: 30px;
            max-width: 980px;
            margin: 0 auto;
            border: 1px solid var(--line);
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 18px 20px;
            border-radius: 16px;
            border: 1px solid var(--line);
            background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #ecfeff 100%);
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .logo {
            width: 54px;
            height: 54px;
            border-radius: 14px;
            border: 1px solid var(--line);
            background: #ffffff;
            padding: 6px;
            object-fit: contain;
            box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
          }
          .title h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: var(--brand);
          }
          .title .meta { margin-top: 4px; }
          .meta { font-size: 12px; color: var(--muted); }
          .badge {
            border: 1px solid rgba(31, 58, 138, 0.2);
            background: rgba(31, 58, 138, 0.08);
            color: var(--brand);
            font-size: 11px;
            padding: 6px 12px;
            border-radius: 999px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .section { margin-top: 22px; }
          .section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: var(--muted);
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-top: 12px;
          }
          .info-card {
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 14px;
            background: #fbfcff;
          }
          .info-label { font-size: 11px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; }
          .info-value { margin-top: 6px; font-size: 14px; font-weight: 600; }
          .items {
            display: grid;
            gap: 14px;
            margin-top: 12px;
          }
          .item-card {
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 16px;
            background: #fbfcff;
          }
          .item-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid var(--line);
            padding-bottom: 10px;
          }
          .item-index {
            font-size: 10px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--muted);
          }
          .item-name { font-size: 15px; font-weight: 700; margin-top: 4px; }
          .item-total {
            font-size: 16px;
            font-weight: 700;
            color: var(--brand);
          }
          .item-metrics {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-top: 12px;
          }
          .metric-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--muted);
          }
          .metric-value { margin-top: 4px; font-size: 13px; font-weight: 600; }
          .note { margin-top: 10px; font-size: 11px; color: var(--accent); }
          .details { margin-top: 12px; border-top: 1px dashed var(--line); padding-top: 10px; }
          .detail-title {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: var(--muted);
            margin-bottom: 6px;
          }
          .detail-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            border: 1px solid var(--line);
            border-radius: 10px;
            overflow: hidden;
          }
          .detail-table th,
          .detail-table td {
            padding: 8px 10px;
            font-size: 11px;
            text-align: left;
            border-bottom: 1px solid var(--line);
          }
          .detail-table th {
            background: #f3f4f6;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 9px;
          }
          .detail-table tr:last-child td { border-bottom: none; }
          .summary {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 12px;
          }
          .summary-card {
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 14px;
            background: #fbfcff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
          }
          .summary-card strong { font-size: 15px; }
          .summary-highlight {
            background: linear-gradient(135deg, rgba(31,58,138,0.12), rgba(15,118,110,0.12));
            border-color: rgba(31, 58, 138, 0.35);
          }
          .empty {
            border: 1px dashed var(--line);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            color: var(--muted);
            font-size: 12px;
          }
          .footer {
            margin-top: 20px;
            padding-top: 12px;
            border-top: 1px solid var(--line);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            font-size: 11px;
            color: var(--muted);
          }
          .footer-brand {
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #94a3b8;
          }

          @media (max-width: 720px) {
            body { padding: 16px; }
            .sheet { padding: 20px; }
            .info-grid, .summary, .item-metrics { grid-template-columns: 1fr; }
            .header { flex-direction: column; align-items: flex-start; }
          }

          @media print {
            body { background: #fff; padding: 0; }
            .sheet { border: none; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div class="brand">
              <img class="logo" src="/logo.png" alt="Oxygen" />
              <div class="title">
                <h1>统一报价方案</h1>
                <div class="meta">日期：${reportDate}</div>
              </div>
            </div>
            <div class="badge">Sales Quotation</div>
          </div>

          <div class="section">
            <div class="section-title">客户信息</div>
            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">客户姓名</div>
                <div class="info-value">${customer.name || "未填写"}</div>
              </div>
              <div class="info-card">
                <div class="info-label">联系电话</div>
                <div class="info-value">${customer.phone || "未填写"}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">项目明细</div>
            <div class="items">
              ${itemCards}
            </div>
          </div>

          <div class="section">
            <div class="section-title">费用汇总</div>
            <div class="summary">
              <div class="summary-card"><span>项目数量</span><strong>${totals.itemsCount}</strong></div>
              <div class="summary-card"><span>小计金额</span><strong>${formatMoney(totals.subtotal)}</strong></div>
              ${totals.nonTaxableSubtotal > 0 ? `<div class="summary-card"><span>储值卡金额 (免税)</span><strong>${formatMoney(totals.nonTaxableSubtotal)}</strong></div>` : ""}
              <div class="summary-card"><span>应税小计</span><strong>${formatMoney(totals.taxableSubtotal)}</strong></div>
              <div class="summary-card"><span>税费 (13%)</span><strong>${formatMoney(totals.tax)}</strong></div>
              <div class="summary-card"><span>含税合计</span><strong>${formatMoney(totals.totalBeforeCredit)}</strong></div>
              <div class="summary-card"><span>储值卡抵扣</span><strong>${formatMoney(totals.creditUsed)}</strong></div>
              <div class="summary-card summary-highlight"><span>应付总额</span><strong>${formatMoney(totals.total)}</strong></div>
            </div>
          </div>

          <div class="footer">
            <span>本报价含税，最终以签约方案为准。</span>
            <span class="footer-brand">OXYGEN FITNESS</span>
          </div>
        </div>
      </body>
    </html>
  `;
}
