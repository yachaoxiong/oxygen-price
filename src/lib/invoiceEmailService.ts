import type { SendInvoiceEmailPayload, SendInvoiceEmailResponse } from "@/types/invoiceEmail";

export async function sendInvoiceEmail(payload: SendInvoiceEmailPayload): Promise<SendInvoiceEmailResponse> {
  const response = await fetch("/api/invoice-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as SendInvoiceEmailResponse | null;

  if (!response.ok) {
    throw new Error(result?.message || "Failed to send invoice email.");
  }

  return result ?? { ok: true, message: "Invoice email sent successfully." };
}
