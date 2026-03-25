import type { InvoiceEmailFormValue } from "@/hooks/useInvoiceEmailSender";

type InvoiceEmailPanelProps = {
  open: boolean;
  invoiceNo: string;
  attachmentName: string;
  form: InvoiceEmailFormValue;
  sending: boolean;
  error: string | null;
  onClose: () => void;
  onFieldChange: (field: keyof InvoiceEmailFormValue, value: string) => void;
  onResetTemplate: () => void;
  onSend: () => Promise<void> | void;
};

export function InvoiceEmailPanel({
  open,
  invoiceNo,
  attachmentName,
  form,
  sending,
  error,
  onClose,
  onFieldChange,
  onResetTemplate,
  onSend,
}: InvoiceEmailPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[var(--modal-backdrop)] px-4 py-6" onClick={onClose}>
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-popover)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/35 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Invoice Communication</p>
              <h3 className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">Send Invoice Email</h3>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">Invoice No</p>
              <p className="mt-0.5 text-xs font-mono font-semibold text-[var(--color-text-primary)]">{invoiceNo || "Draft"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/35 px-4 py-3">
            <p className="text-[11px] font-semibold text-[var(--color-text-primary)]">Attachment</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">The invoice PDF will be attached automatically: {attachmentName}</p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Recipient Email</span>
            <input
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[#00A676]/70"
              placeholder="customer@example.com"
              type="email"
              value={form.to}
              onChange={(event) => onFieldChange("to", event.target.value)}
              disabled={sending}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Subject</span>
            <input
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[#00A676]/70"
              placeholder="Invoice subject"
              type="text"
              value={form.subject}
              onChange={(event) => onFieldChange("subject", event.target.value)}
              disabled={sending}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Email Body</span>
            <textarea
              className="min-h-[210px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 text-sm leading-6 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[#00A676]/70"
              value={form.body}
              onChange={(event) => onFieldChange("body", event.target.value)}
              disabled={sending}
            />
          </label>

          {error ? <div className="rounded-[8px] border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700">{error}</div> : null}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/25 px-6 py-4">
          <button
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
            disabled={sending}
          >
            Close
          </button>
          <div className="flex items-center gap-3">
          <button
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onResetTemplate}
            disabled={sending}
          >
            Reset Template
          </button>
          <button
            className="rounded-xl bg-[#00A676] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#00A676]/15 transition-all hover:bg-[#00855e] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSend}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
