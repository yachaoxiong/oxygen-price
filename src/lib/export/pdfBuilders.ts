import { formatMoney } from "@/lib/formatters/number";

type PtPdfParams = {
  courseNameZh: string;
  courseNameEn?: string;
  reportDate: string;
  clientName: string;
  activeLabel: string;
  unit: number;
  qty: number;
  subtotal: number;
  credit: number;
  afterCredit: number;
  tax: number;
  total: number;
};

type CyclePdfParams = {
  program: string;
  reportDate: string;
  clientName: string;
  activeLabel: string;
  courseNameZh: string;
  courseNameEn?: string;
  weeklySessions: string;
  minSessions: string;
  wpdFollowups: string;
  assessmentsReports: string;
  membershipGift: string;
  extraBenefits: string;
  unitPrice: number;
  qty: number;
  subtotal: number;
  credit: number;
  afterCredit: number;
  tax: number;
  total: number;
  courses: { program: { nameZh: string; nameEn?: string }; unitPrice: number; qty: number }[];
};

export function buildPtPdfHtml(params: PtPdfParams) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>OXYGEN Item Report</title>
  <style>
    :root {
      --bg: #070f1d;
      --panel: #0d182b;
      --line: rgba(255,255,255,.14);
      --text: #e6edf7;
      --muted: #9fb0c8;
      --brand: #8ff2d2;
      --brand-2: #55d7ff;
      --accent: #07261f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, Segoe UI, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 28px;
    }
    .sheet {
      max-width: 920px;
      margin: 0 auto;
      border: 1px solid var(--line);
      border-radius: 18px;
      overflow: hidden;
      background: linear-gradient(180deg, #0a1424 0%, #07111f 100%);
    }
    .header {
      padding: 20px 22px;
      border-bottom: 1px solid var(--line);
      background: linear-gradient(90deg, rgba(143,242,210,.12), rgba(85,215,255,.08));
    }
    .eyebrow { font-size: 11px; letter-spacing: .12em; color: var(--muted); text-transform: uppercase; }
    h1 { margin: 6px 0 2px; font-size: 30px; color: var(--brand); }
    .sub { color: var(--muted); font-size: 16px; }

    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 14px 22px;
      border-bottom: 1px solid var(--line);
    }
    .meta-item {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: rgba(0,0,0,.2);
      padding: 10px 12px;
    }
    .k { color: var(--muted); font-size: 12px; }
    .v { margin-top: 4px; font-size: 20px; font-weight: 700; }

    .section { padding: 16px 22px; }
    .section h2 { margin: 0 0 10px; font-size: 18px; }

    table { width: 100%; border-collapse: collapse; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
    thead th {
      text-align: left;
      padding: 10px 12px;
      font-size: 12px;
      color: var(--muted);
      background: rgba(255,255,255,.04);
      border-bottom: 1px solid var(--line);
    }
    tbody td {
      padding: 12px;
      border-bottom: 1px solid var(--line);
      font-size: 15px;
    }
    tbody tr:last-child td { border-bottom: 0; }
    tbody tr.active { background: linear-gradient(90deg, rgba(143,242,210,.10), rgba(85,215,255,.06)); }

    .summary {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .card {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: rgba(0,0,0,.2);
      padding: 10px 12px;
    }
    .total {
      grid-column: 1 / -1;
      background: linear-gradient(90deg, rgba(143,242,210,.18), rgba(85,215,255,.10));
      border-color: rgba(143,242,210,.45);
    }
    .total .v { font-size: 32px; color: var(--brand); }

    .footer {
      padding: 12px 22px 18px;
      color: var(--muted);
      font-size: 12px;
    }

    @media print {
      body { background: #fff; color: #0f172a; padding: 0; }
      .sheet { border: none; border-radius: 0; background: #fff; }
      .header { background: #f8fafc; }
      .eyebrow, .sub, .k, .footer { color: #475569; }
      h1 { color: #0f766e; }
      .meta-item, table, .card { border-color: #cbd5e1; background: #fff; }
      .total { background: #ecfeff; border-color: #99f6e4; }
      .total .v { color: #0f766e; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="eyebrow">ITEM REPORT / 项目报告单</div>
      <h1>${params.courseNameZh}</h1>
      <div class="sub">${params.courseNameEn ?? ""}</div>
    </div>

    <div class="meta">
      <div class="meta-item"><div class="k">Date / 日期</div><div class="v">${params.reportDate}</div></div>
      <div class="meta-item"><div class="k">Client Name / 客户姓名</div><div class="v">${params.clientName || "N/A"}</div></div>
    </div>

    <div class="section">
      <h2>项目明细 / Item Details</h2>
      <table>
        <thead>
          <tr>
            <th>项目 / Item</th>
            <th>单价 / Unit</th>
            <th>数量 / Qty</th>
            <th>小计 / Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr class="active">
            <td>${params.activeLabel}</td>
            <td>${formatMoney(params.unit)}</td>
            <td>${params.qty}</td>
            <td>${formatMoney(params.subtotal)}</td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        <div class="card"><div class="k">Credit / 积分抵扣</div><div class="v">${formatMoney(params.credit)}</div></div>
        <div class="card"><div class="k">After Credit / 抵扣后金额</div><div class="v">${formatMoney(params.afterCredit)}</div></div>
        <div class="card"><div class="k">Tax (13%) / 税费</div><div class="v">${formatMoney(params.tax)}</div></div>
        <div class="card total"><div class="k">Total / 总计</div><div class="v">${formatMoney(params.total)}</div></div>
      </div>
    </div>

    <div class="footer">This report is for quotation reference. Final amount is subject to contract terms. / 本报告用于报价参考，最终金额以合同为准。</div>
  </div>
</body>
</html>`;
}

export function buildCyclePdfHtml(params: CyclePdfParams) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"/><title>Cycle Plan Quotation</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{width:210mm;height:297mm}body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:#1a2332;font-size:11px;line-height:1.4}.page{width:210mm;height:297mm;display:flex;flex-direction:column;overflow:hidden}.hdr{background:linear-gradient(135deg,#0b1f3a 0%,#0e2d50 60%,#0a2240 100%);padding:18px 28px;position:relative;overflow:hidden;flex-shrink:0}.hdr::before{content:'';position:absolute;top:-50px;right:-50px;width:200px;height:200px;border-radius:50%;background:rgba(6,182,212,0.1)}.hdr-inner{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start}.hdr-left .brand{display:flex;align-items:center;gap:6px;margin-bottom:8px}.brand-dot{width:7px;height:7px;border-radius:50%;background:#06b6d4}.brand-name{font-size:9px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45)}.hdr-left h1{font-size:20px;font-weight:700;color:#fff;line-height:1.15}.hdr-left p{font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px;letter-spacing:0.04em}.hdr-right{text-align:right;display:flex;flex-direction:column;gap:6px}.meta-item .ml{font-size:8.5px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.3)}.meta-item .mv{font-size:11px;font-weight:500;color:rgba(255,255,255,0.8);margin-top:1px}.abar{height:3px;background:linear-gradient(90deg,#06b6d4,#10b981,#06b6d4);flex-shrink:0}.body{padding:16px 28px;flex:1;display:flex;flex-direction:column;gap:12px;overflow:hidden}.stitle{font-size:8.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;display:flex;align-items:center;gap:6px;margin-bottom:7px}.stitle::after{content:'';flex:1;height:1px;background:#e2e8f0}.row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.row4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}.card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:8px 10px}.card .cl{font-size:8.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8}.card .cv{font-size:12px;font-weight:600;color:#1e293b;margin-top:2px}.card.gc{background:#f0fdf4;border-color:#bbf7d0}.card.gc .cl{color:#16a34a}.card.gc .cv{color:#15803d;font-size:11px}.card.cc{background:#ecfeff;border-color:#a5f3fc}.card.cc .cl{color:#0891b2}.card.cc .cv{color:#0e7490;font-size:11px}.card.span2{grid-column:span 2}.ptbl{width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}.ptbl thead tr{background:linear-gradient(135deg,#0b1f3a,#0d2d4f)}.ptbl thead th{padding:7px 12px;text-align:left;font-size:8.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.09em;color:rgba(255,255,255,0.55)}.ptbl thead th:last-child{text-align:right}.ptbl tbody td{padding:7px 12px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9}.ptbl tbody td:last-child{text-align:right;font-weight:600;color:#1e293b}.totals{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-top:7px}.titem{padding:8px 12px;border-right:1px solid #e2e8f0}.titem:last-child{border-right:none;background:linear-gradient(135deg,#0b1f3a,#0d2d4f)}.titem .tl{font-size:8.5px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8}.titem:last-child .tl{color:rgba(255,255,255,0.45)}.titem .tv{font-size:13px;font-weight:700;color:#1e293b;margin-top:2px}.titem:last-child .tv{color:#fff;font-size:15px}.titem .tv.red{color:#dc2626}.ftr{background:#f8fafc;border-top:1px solid #e2e8f0;padding:10px 28px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}.ftr-note{font-size:8.5px;color:#94a3b8;line-height:1.5}.ftr-brand{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#cbd5e1}@page{size:A4;margin:0}@media print{html,body{width:210mm;height:297mm;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{page-break-after:avoid;break-after:avoid;break-inside:avoid}}</style></head><body><div class="page"><div class="hdr"><div class="hdr-inner"><div class="hdr-left"><div class="brand"><div class="brand-dot"></div><span class="brand-name">Oxygen Fitness</span></div><h1>${params.program}</h1><p>Cycle Plan Quotation / 周期计划报价单</p></div><div class="hdr-right"><div class="meta-item"><div class="ml">报价日期 Date</div><div class="mv">${params.reportDate}</div></div><div class="meta-item"><div class="ml">客户 Client</div><div class="mv">${params.clientName || "—"}</div></div><div class="meta-item"><div class="ml">方案 Plan Type</div><div class="mv">${params.activeLabel}</div></div></div></div></div><div class="abar"></div><div class="body"><div><div class="stitle">周期计划参数 Cycle Plan Parameters</div><div class="row4"><div class="card"><div class="cl">每周次数 Weekly</div><div class="cv">${params.weeklySessions}</div></div><div class="card"><div class="cl">最少课时 Min Sessions</div><div class="cv">${params.minSessions}</div></div><div class="card"><div class="cl">跟进次数 Followups</div><div class="cv">${params.wpdFollowups}</div></div><div class="card"><div class="cl">评估报告 Assessments</div><div class="cv">${params.assessmentsReports}</div></div></div></div><div><div class="stitle">附加权益 Included Benefits</div><div class="row2"><div class="card gc"><div class="cl">赠送会籍 Membership Gift</div><div class="cv">${params.membershipGift}</div></div><div class="card cc"><div class="cl">额外权益 Extra Benefits</div><div class="cv">${params.extraBenefits}</div></div></div></div><div><div class="stitle">价格明细 Pricing Breakdown</div><table class="ptbl"><thead><tr><th>项目 Item</th><th>单价 Unit Price</th><th>数量 Qty</th><th>小计 Subtotal</th></tr></thead><tbody>${(params.courses.length ? params.courses : [{ program: { nameZh: params.courseNameZh, nameEn: params.courseNameEn }, unitPrice: params.unitPrice, qty: params.qty }]).map((course) => `<tr><td>${course.program.nameZh}${course.program.nameEn ? " / " + course.program.nameEn : ""}</td><td>${formatMoney(course.unitPrice)}</td><td>${course.qty}</td><td>${formatMoney(course.unitPrice * course.qty)}</td></tr>`).join("")}</tbody></table><div class="totals"><div class="titem"><div class="tl">积分抵扣 Credit</div><div class="tv red">− ${formatMoney(params.credit)}</div></div><div class="titem"><div class="tl">抵扣后 After Credit</div><div class="tv">${formatMoney(params.afterCredit)}</div></div><div class="titem"><div class="tl">税费 Tax 13%</div><div class="tv">${formatMoney(params.tax)}</div></div><div class="titem"><div class="tl">总计 Grand Total</div><div class="tv">${formatMoney(params.total)}</div></div></div></div></div><div class="ftr"><div class="ftr-note">本报价单仅供销售演示参考，最终价格以正式合同为准。This quotation is for reference only. Final pricing subject to signed contract.</div><div class="ftr-brand">Oxygen Fitness</div></div></div></body></html>`;
}
