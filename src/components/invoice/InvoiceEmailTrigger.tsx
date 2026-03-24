type InvoiceEmailTriggerProps = {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
};

function MailIcon() {
  return <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">mail</span>;
}

export function InvoiceEmailTrigger({ onClick, disabled = false, label = "Send Email" }: InvoiceEmailTriggerProps) {
  return (
    <button
      className="flex items-center justify-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      <MailIcon /> {label}
    </button>
  );
}
