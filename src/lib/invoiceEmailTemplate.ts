export type InvoiceEmailTemplateInput = {
  customerName?: string;
  invoiceNo?: string;
};

export type InvoiceEmailTemplateResult = {
  subject: string;
  body: string;
};

export function createInvoiceEmailTemplate(input: InvoiceEmailTemplateInput): InvoiceEmailTemplateResult {
  const safeCustomerName = input.customerName?.trim() || "Customer";
  const safeInvoiceNo = input.invoiceNo?.trim() || "(Draft Invoice)";

  return {
    subject: `Invoice ${safeInvoiceNo} from Oxygen Fitness`,
    body: `Dear ${safeCustomerName},

Please find attached your invoice (${safeInvoiceNo}) in PDF format.
Kindly review it at your convenience.

If you have any questions, please contact us.

Best regards,
Oxygen Fitness`,
  };
}
