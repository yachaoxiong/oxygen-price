import type { InvoiceEmailFormValue } from "@/hooks/useInvoiceEmailSender";

type InvoiceEmailPanelProps = {
  open: boolean;
  invoiceNo: string;
  attachmentName: string;
  form: InvoiceEmailFormValue;
  sending: boolean;
  error: string | null;
  success: string | null;
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
  success,
  onClose,
  onFieldChange,
  onResetTemplate,
  onSend,
}: InvoiceEmailPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[var(--modal-backdrop)] px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-[12px] border border-[var(--color-border)] bg-[var(--color-popover)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Send Invoice Email</h3>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Invoice No: {invoiceNo || "Draft"}</p>
          </div>
          <button
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-elevated)]"
            onClick={onClose}
            disabled={sending}
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Recipient Email</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              placeholder="customer@example.com"
              type="email"
              value={form.to}
              onChange={(event) => onFieldChange("to", event.target.value)}
              disabled={sending}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Subject</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              placeholder="Invoice subject"
              type="text"
              value={form.subject}
              onChange={(event) => onFieldChange("subject", event.target.value)}
              disabled={sending}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Body</span>
            <textarea
              className="min-h-[180px] w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm leading-6 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              value={form.body}
              onChange={(event) => onFieldChange("body", event.target.value)}
              disabled={sending}
            />
          </label>

          <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/40 px-4 py-3">
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">Attachment</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">A PDF file will be attached automatically: {attachmentName}</p>
          </div>

          {error ? <div className="rounded-[8px] border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700">{error}</div> : null}
          {success ? <div className="rounded-[8px] border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">{success}</div> : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onResetTemplate}
            disabled={sending}
          >
            Reset Template
          </button>
          <button
            className="rounded-[10px] bg-[#00A676] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#00A676]/10 transition-all hover:bg-[#00855e] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSend}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
