export type SendInvoiceEmailPayload = {
  to: string;
  subject: string;
  body: string;
  filename: string;
  pdfBase64: string;
  invoiceNo: string;
};

export type SendInvoiceEmailResponse = {
  ok: boolean;
  message: string;
};
