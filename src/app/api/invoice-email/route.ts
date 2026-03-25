import { NextResponse } from "next/server";
import { Resend } from "resend";

import type { SendInvoiceEmailPayload } from "@/types/invoiceEmail";
import { isValidEmail } from "@/lib/emailValidation";

export async function POST(request: Request) {
  let payload: SendInvoiceEmailPayload;

  try {
    payload = (await request.json()) as SendInvoiceEmailPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request payload." }, { status: 400 });
  }

  if (!payload?.to || !isValidEmail(payload.to)) {
    return NextResponse.json({ ok: false, message: "A valid recipient email is required." }, { status: 400 });
  }

  if (!payload.subject?.trim()) {
    return NextResponse.json({ ok: false, message: "Email subject is required." }, { status: 400 });
  }

  if (!payload.body?.trim()) {
    return NextResponse.json({ ok: false, message: "Email body is required." }, { status: 400 });
  }

  if (!payload.pdfBase64?.trim()) {
    return NextResponse.json({ ok: false, message: "PDF attachment is missing." }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.INVOICE_MAIL_FROM?.trim();
  const devFallbackFrom = "onboarding@resend.dev";

  if (!resendApiKey) {
    return NextResponse.json(
      {
        ok: false,
        message: "Email service is not configured. Please set RESEND_API_KEY.",
      },
      { status: 500 },
    );
  }

  const isDevOrPreview = process.env.NODE_ENV !== "production";
  const safeFrom = configuredFrom || (isDevOrPreview ? devFallbackFrom : "");

  if (!safeFrom) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "INVOICE_MAIL_FROM is required in production. Use onboarding@resend.dev only for local testing.",
      },
      { status: 500 },
    );
  }

  const filename = payload.filename?.trim() || `${payload.invoiceNo || "invoice"}.pdf`;
  const resend = new Resend(resendApiKey);

  try {
    const result = await resend.emails.send({
      from: safeFrom,
      to: [payload.to.trim()],
      subject: payload.subject.trim(),
      text: payload.body.trim(),
      html: payload.html?.trim() || undefined,
      attachments: [
        {
          filename,
          content: payload.pdfBase64,
        },
      ],
    });

    if (result.error) {
      return NextResponse.json(
        {
          ok: false,
          message: result.error.message || "Email provider rejected the request.",
        },
        { status: 502 },
      );
    }

    const usedFallback = !configuredFrom && safeFrom === devFallbackFrom;
    return NextResponse.json({
      ok: true,
      message: usedFallback
        ? "Invoice email sent successfully using Resend test sender (onboarding@resend.dev)."
        : "Invoice email sent successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to send invoice email.",
      },
      { status: 500 },
    );
  }
}
