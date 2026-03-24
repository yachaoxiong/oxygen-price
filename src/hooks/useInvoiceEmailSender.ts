import { useMemo, useState } from "react";

import { blobToBase64, generateInvoicePdfBlob } from "@/lib/invoicePdf";
import { createInvoiceEmailTemplate } from "@/lib/invoiceEmailTemplate";
import { sendInvoiceEmail } from "@/lib/invoiceEmailService";
import { isValidEmail } from "@/lib/emailValidation";

export type InvoiceEmailFormValue = {
  to: string;
  subject: string;
  body: string;
};

export function useInvoiceEmailSender(params: {
  invoiceNo: string;
  customerName?: string;
  defaultEmail?: string;
  getInvoiceElement: () => HTMLDivElement | null;
  onSent?: () => Promise<void> | void;
}) {
  const template = useMemo(
    () =>
      createInvoiceEmailTemplate({
        customerName: params.customerName,
        invoiceNo: params.invoiceNo,
      }),
    [params.customerName, params.invoiceNo],
  );

  const [form, setForm] = useState<InvoiceEmailFormValue>({
    to: params.defaultEmail ?? "",
    subject: template.subject,
    body: template.body,
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setField = (field: keyof InvoiceEmailFormValue, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const resetTemplate = () => {
    const next = createInvoiceEmailTemplate({
      customerName: params.customerName,
      invoiceNo: params.invoiceNo,
    });

    setForm((prev) => ({
      ...prev,
      subject: next.subject,
      body: next.body,
    }));
  };

  const validate = () => {
    if (!form.to.trim()) return "Recipient email is required.";
    if (!isValidEmail(form.to)) return "Please enter a valid recipient email.";
    if (!form.subject.trim()) return "Email subject is required.";
    if (!form.body.trim()) return "Email body is required.";
    return null;
  };

  const send = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return false;
    }

    const invoiceElement = params.getInvoiceElement();
    if (!invoiceElement) {
      setError("Invoice preview is unavailable. Please refresh and try again.");
      return false;
    }

    setSending(true);
    try {
      const pdfBlob = await generateInvoicePdfBlob({ invoiceElement });
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("Failed to generate invoice PDF attachment.");
      }

      const pdfBase64 = await blobToBase64(pdfBlob);
      await sendInvoiceEmail({
        to: form.to.trim(),
        subject: form.subject.trim(),
        body: form.body.trim(),
        pdfBase64,
        invoiceNo: params.invoiceNo,
        filename: `${params.invoiceNo || "invoice"}.pdf`,
      });

      if (params.onSent) {
        await params.onSent();
      }

      setSuccess("Invoice email sent successfully.");
      return true;
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send invoice email.");
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    form,
    sending,
    error,
    success,
    setField,
    resetTemplate,
    send,
  };
}
