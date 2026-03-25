export type InvoiceEmailTemplateInput = {
  customerName?: string;
  invoiceNo?: string;
};

export type InvoiceEmailTemplateResult = {
  subject: string;
  body: string;
};

type InvoiceEmailHtmlTemplateInput = {
  customerName?: string;
  invoiceNo?: string;
  body: string;
};

export function createInvoiceEmailTemplate(input: InvoiceEmailTemplateInput): InvoiceEmailTemplateResult {
  const safeCustomerName = input.customerName?.trim() || "Customer";
  const safeInvoiceNo = input.invoiceNo?.trim() || "(Draft Invoice)";

  return {
    subject: `Oxygen Fitness | Invoice ${safeInvoiceNo}`,
    body: `Dear ${safeCustomerName},

Thank you for choosing Oxygen Fitness.
Please find attached Invoice ${safeInvoiceNo} in PDF format for your review.

If you have any questions regarding this invoice, please reply to this email and our team will be happy to assist you.

Kind regards,
Oxygen Fitness Sales Team`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createInvoiceEmailHtmlTemplate(input: InvoiceEmailHtmlTemplateInput): string {
  const safeCustomerName = escapeHtml(input.customerName?.trim() || "Customer");
  const safeInvoiceNo = escapeHtml(input.invoiceNo?.trim() || "(Draft Invoice)");
  const lines = input.body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const paragraphs = lines.length > 0
    ? lines.map((line) => `<p style="margin:0 0 12px;color:#1f2937;font-size:14px;line-height:1.7;">${escapeHtml(line)}</p>`).join("")
    : `<p style="margin:0 0 12px;color:#1f2937;font-size:14px;line-height:1.7;">Please find your invoice attached.</p>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;margin:0 auto 10px;">
            <tr>
              <td style="padding:0 4px 10px;color:#64748b;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">
                Oxygen Fitness - Invoice Dispatch
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ee;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(15,23,42,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#052e2b,#0f766e);padding:24px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.01em;">
                Oxygen Fitness
              </td>
              <td align="right">
                <span style="display:inline-block;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.28);color:#f0fdfa;font-size:10px;font-weight:700;padding:7px 11px;border-radius:999px;letter-spacing:0.08em;text-transform:uppercase;">
                  Invoice Notice
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:8px;color:#ccfbf1;font-size:12px;line-height:1.6;">
                Professional invoice delivery with attached PDF document.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:26px 26px 10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr>
              <td>
                <div style="display:inline-block;background:#ecfeff;border:1px solid #67e8f9;color:#155e75;font-size:11px;font-weight:700;padding:7px 12px;border-radius:999px;letter-spacing:0.04em;">
                  Invoice No: ${safeInvoiceNo}
                </div>
              </td>
              <td align="right" style="color:#64748b;font-size:12px;">
                Accounts & Billing
              </td>
            </tr>
          </table>
          <h2 style="margin:0 0 10px;color:#0f172a;font-size:22px;line-height:1.35;font-weight:700;">Hello ${safeCustomerName},</h2>
          ${paragraphs}
        </td>
      </tr>
      <tr>
        <td style="padding:2px 26px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dbeafe;background:#f8fafc;border-radius:10px;">
            <tr>
              <td style="padding:14px 14px 8px;color:#0f172a;font-size:12px;font-weight:700;">
                Included in this email
              </td>
            </tr>
            <tr>
              <td style="padding:0 14px 14px;color:#475569;font-size:12px;line-height:1.65;">
                - PDF invoice attachment (${safeInvoiceNo}.pdf)<br />
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 26px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:11px;line-height:1.7;">
          <strong style="color:#0f172a;">Oxygen Fitness Sales Team</strong><br />
          Thank you for your business. We appreciate the opportunity to serve you.
        </td>
      </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
