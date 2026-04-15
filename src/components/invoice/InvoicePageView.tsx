"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomerProfile,
  createInvoice,
  deleteInvoice,
  fetchPricingItems,
  supabase,
  updateCustomerProfile,
  updateInvoiceStatus,
  type CustomerProfile,
  type InvoiceRecord,
} from "@/lib/supabase";
import { downloadInvoicePdfFromElement } from "@/lib/invoicePdf";
import { createInvoiceEmailTemplate } from "@/lib/invoiceEmailTemplate";
import { NumberInput } from "@/components/ui/NumberInput";
import {
  InvoiceDocument,
  defaultInvoiceTemplateSettings,
  type InvoiceDocumentData,
  type InvoiceTemplateSettings,
} from "@/components/invoice/InvoiceDocument";
import { InvoiceEmailPanel } from "@/components/invoice/InvoiceEmailPanel";
import { InvoiceEmailTrigger } from "@/components/invoice/InvoiceEmailTrigger";
import { useInvoiceEmailSender } from "@/hooks/useInvoiceEmailSender";
import { getInvoicePageCopy, type InvoiceLocale } from "@/components/invoice/invoicePageCopy";
import { toastAddSuccess, toastDeleteSuccess, toastFailed, toastSaveSuccess, toastUpdateSuccess } from "@/lib/toast";
import type { PricingItem } from "@/types/pricing";
import type { PresetItem, RecentQuotation } from "@/components/invoice/mockData";

type IconName =
  | "receipt_long"
  | "add"
  | "expand_more"
  | "post_add"
  | "settings"
  | "edit_note"
  | "person_add"
  | "close"
  | "drag_pan"
  | "add_circle"
  | "info"
  | "delete"
  | "fitness_center"
  | "picture_as_pdf"
  | "mail"
  | "description"
  | "list_alt"
  | "person_search"
  | "request_quote"
  | "visibility"
  | "edit"
  | "edit_square"
  | "search"
  | "chevron_left"
  | "chevron_right"
  | "badge"
  | "alternate_email"
  | "location_on"
  | "storage"
  | "image";

function MaterialIcon({ name, className }: { name: IconName; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`}>{name}</span>;
}

function IconCircle({ icon }: { icon: IconName }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
      <MaterialIcon name={icon} className="text-[var(--color-primary)]" />
    </div>
  );
}

function HoverActionButton({ icon }: { icon: "visibility" | "edit" | "edit_square" }) {
  return (
    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-border-strong)] text-[var(--color-text-primary)] shadow-lg transition-colors hover:bg-[var(--color-primary)]">
      <MaterialIcon name={icon} className="text-[18px]" />
    </button>
  );
}

type InvoiceLineItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  discount: number;
  sourceCategory?: PricingItem["category"];
};

type InvoiceListStatus = "SENT" | "NOT SENT";

type InvoiceListRow = {
  id: string;
  initials: string;
  initialsClassName: string;
  customer: string;
  amount: string;
  date: string;
  status: InvoiceListStatus;
  raw: InvoiceRecord;
};


const INVOICE_DRAFT_STORAGE_KEY = "invoice-builder-draft-v1";
const INVOICE_NO_REGISTRY_STORAGE_KEY = "invoice-no-registry-v1";

type InvoiceTemplateField = keyof InvoiceTemplateSettings["oxygenInfo"];

type TemplateGroupKey = "header" | "company" | "terms";

const TEMPLATE_GROUPS: Array<{ key: TemplateGroupKey; fields: InvoiceTemplateField[] }> = [
  {
    key: "header",
    fields: ["invoiceTitle", "headerSubtitle", "dateLabel", "invoiceNoLabel", "hstLabel", "hstNumber"],
  },
  {
    key: "company",
    fields: ["fromTitle", "billToTitle", "companyName", "addressLine1", "addressLine2", "country", "email"],
  },
  {
    key: "terms",
    fields: ["paymentTermsTitle", "notesTitle", "notesTemplate", "termsTitle", "termsDescription", "thankYouMessage"],
  },
];

function createEmptyInvoiceItem(): InvoiceLineItem {
  return { id: `line-${Date.now()}-${Math.floor(Math.random() * 1000)}`, name: "", qty: 1, unitPrice: 0, discount: 0 };
}

function generateInvoiceNo(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  if (typeof window === "undefined") {
    const suffix = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `OXY${suffix}`;
  }

  const raw = window.localStorage.getItem(INVOICE_NO_REGISTRY_STORAGE_KEY);
  const used = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);

  let next = "";
  for (let i = 0; i < 50; i += 1) {
    const suffix = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const candidate = `OXY${suffix}`;
    if (!used.has(candidate)) {
      next = candidate;
      break;
    }
  }

  if (!next) {
    next = `OXY${Date.now().toString(36).toUpperCase().slice(-8).padStart(8, "0")}`;
  }

  used.add(next);
  const keep = Array.from(used).slice(-2000);
  window.localStorage.setItem(INVOICE_NO_REGISTRY_STORAGE_KEY, JSON.stringify(keep));

  return next;
}

type CustomerErrors = Partial<Record<keyof InvoiceCustomerInfo, string>> & { address?: string };
type ItemErrors = Record<string, { name?: string; qty?: string; unitPrice?: string; discount?: string }>;

type InvoiceCustomerInfo = {
  name: string;
  email: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

const emptyCustomerInfo: InvoiceCustomerInfo = {
  name: "",
  email: "",
  streetAddress: "",
  city: "",
  province: "ON",
  postalCode: "",
  country: "Canada",
};

type CustomerRecord = InvoiceCustomerInfo & { id: string; fullAddress: string };

type CustomerCreateInput = {
  name: string;
  email: string;
  address: string;
};

type ListTab = "invoice" | "quotation" | "customer";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function composeCustomerAddress(customer: InvoiceCustomerInfo): string {
  const parts = [customer.streetAddress.trim(), customer.city.trim(), customer.province.trim(), customer.postalCode.trim(), customer.country.trim()].filter(Boolean);
  return parts.join(", ");
}

function parseCustomerAddress(address: string): Pick<InvoiceCustomerInfo, "streetAddress" | "city" | "province" | "postalCode" | "country"> {
  const chunks = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (chunks.length >= 5) {
    const [streetAddress, city, province, postalCode, ...rest] = chunks;
    return {
      streetAddress: streetAddress ?? "",
      city: city ?? "",
      province: province ?? "ON",
      postalCode: postalCode ?? "",
      country: rest.join(", ") || "Canada",
    };
  }

  return {
    streetAddress: address,
    city: "",
    province: "ON",
    postalCode: "",
    country: "Canada",
  };
}

function CustomerInfoPanel({
  customer,
  errors,
  locale,
  onChange,
}: {
  customer: InvoiceCustomerInfo;
  errors: CustomerErrors;
  locale: InvoiceLocale;
  onChange: (next: InvoiceCustomerInfo) => void;
}) {
  const copy = getInvoicePageCopy(locale).modal.customerInfo;

  return (
    <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/35 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-wider text-[var(--color-text-secondary)] uppercase">Billing Contact</p>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{copy.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 md:col-span-1">
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
            <MaterialIcon name="badge" className="text-[13px]" /> {copy.name}
          </span>
          <input
            className={`w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] ${errors.name ? "ring-1 ring-red-500/70" : ""}`}
            placeholder="Zhang Wei"
            value={customer.name}
            onChange={(event) => onChange({ ...customer, name: event.target.value })}
          />
          {errors.name ? <div className="mt-1 text-[10px] text-red-400">{errors.name}</div> : null}
        </label>

        <label className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 md:col-span-1">
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
            <MaterialIcon name="alternate_email" className="text-[13px]" /> {copy.email}
          </span>
          <input
            className={`w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] ${errors.email ? "ring-1 ring-red-500/70" : ""}`}
            placeholder="example@email.com"
            value={customer.email}
            onChange={(event) => onChange({ ...customer, email: event.target.value })}
          />
          {errors.email ? <div className="mt-1 text-[10px] text-red-400">{errors.email}</div> : null}
        </label>

        <label className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 md:col-span-2">
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
            <MaterialIcon name="location_on" className="text-[13px]" /> {copy.streetAddress}
          </span>
          <input
            className={`w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] ${errors.address ? "ring-1 ring-red-500/70" : ""}`}
            placeholder={copy.streetAddressPlaceholder}
            value={customer.streetAddress}
            onChange={(event) => onChange({ ...customer, streetAddress: event.target.value })}
          />
          {errors.address ? <div className="mt-1 text-[10px] text-red-400">{errors.address}</div> : null}
        </label>

        <label className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 md:col-span-1">
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">{copy.city}</span>
          <input
            className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            placeholder={copy.cityPlaceholder}
            value={customer.city}
            onChange={(event) => onChange({ ...customer, city: event.target.value })}
          />
        </label>

        <label className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 md:col-span-1">
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">{copy.province}</span>
          <input
            className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            value={customer.province}
            onChange={(event) => onChange({ ...customer, province: event.target.value })}
          />
        </label>

        <label className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 md:col-span-1">
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">{copy.postcode}</span>
          <input
            className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            placeholder="A1A 1A1"
            value={customer.postalCode}
            onChange={(event) => onChange({ ...customer, postalCode: event.target.value })}
          />
        </label>

        <label className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 md:col-span-1">
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">{copy.country}</span>
          <input
            className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            value={customer.country}
            onChange={(event) => onChange({ ...customer, country: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

function QuotationCard({ row }: { row: RecentQuotation }) {
  return (
    <div className="quotation-card group relative cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/55 p-6">
      <div className="mb-4 flex items-start justify-between">
        <IconCircle icon="request_quote" />
        <span className="font-mono text-[10px] font-bold text-[var(--color-text-muted)]">{row.id}</span>
      </div>
      <h3 className="mb-1 text-base font-bold text-[var(--color-text-primary)]">{row.customer}</h3>
      <p className="mb-6 text-xs text-[var(--color-text-secondary)]">{row.plan}</p>
      <div className="flex items-end justify-between border-t border-[var(--color-surface-elevated)] pt-4">
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase text-[var(--color-text-muted)]">总计</p>
          <p className="font-mono text-lg font-bold text-[var(--color-primary)]">{row.amount}</p>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)]">{row.date}</p>
      </div>
      <div className="action-overlay absolute top-4 right-4 flex gap-2">
        <HoverActionButton icon="visibility" />
        <HoverActionButton icon="edit" />
      </div>
    </div>
  );
}

function CustomerInfoModal({
  open,
  locale,
  customer,
  onChange,
  onSave,
  onClose,
}: {
  open: boolean;
  locale: InvoiceLocale;
  customer: InvoiceCustomerInfo;
  onChange: (next: InvoiceCustomerInfo) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const { modal } = getInvoicePageCopy(locale);
  const copy = modal.customerInfo;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--modal-backdrop)] backdrop-blur-[1px] px-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
            <MaterialIcon name="person_add" className="text-[#00A676]" />
            {copy.title}
          </h3>
          <button className="rounded-md p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" onClick={onClose}>
            <MaterialIcon name="close" className="text-lg" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.name}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              placeholder={copy.namePlaceholder}
              type="text"
              value={customer.name}
              onChange={(event) => onChange({ ...customer, name: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.email}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-page-bg-strong)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[#00A676] focus:ring-[#00A676]"
              placeholder={copy.emailPlaceholder}
              type="email"
              value={customer.email}
              onChange={(event) => onChange({ ...customer, email: event.target.value })}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.streetAddress}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              placeholder={copy.streetAddressPlaceholder}
              type="text"
              value={customer.streetAddress}
              onChange={(event) => onChange({ ...customer, streetAddress: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.city}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              placeholder={copy.cityPlaceholder}
              type="text"
              value={customer.city}
              onChange={(event) => onChange({ ...customer, city: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.province}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              type="text"
              value={customer.province}
              onChange={(event) => onChange({ ...customer, province: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.postcode}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              placeholder={copy.postcodePlaceholder}
              type="text"
              value={customer.postalCode}
              onChange={(event) => onChange({ ...customer, postalCode: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.country}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              type="text"
              value={customer.country}
              onChange={(event) => onChange({ ...customer, country: event.target.value })}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface)]"
            onClick={onClose}
          >
            {modal.cancel}
          </button>
          <button
            className="rounded-[10px] bg-[#00A676] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#00A676]/10 transition-all hover:bg-[color-mix(in_srgb,var(--color-primary)_82%,black)]"
            onClick={onSave}
          >
            {copy.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemPickerModal({
  open,
  locale,
  items,
  loading,
  onClose,
  onPick,
}: {
  open: boolean;
  locale: InvoiceLocale;
  items: PricingItem[];
  loading: boolean;
  onClose: () => void;
  onPick: (item: PricingItem) => void;
}) {
  const [keyword, setKeyword] = useState("");

  if (!open) return null;

  const copy = getInvoicePageCopy(locale).modal.itemPicker;

  const filteredItems = items.filter((item) => {
    const key = keyword.trim().toLowerCase();
    if (!key) return true;
    return (`${item.name_zh ?? ""} ${item.name_en ?? ""}`.toLowerCase().includes(key));
  });

  const grouped = {
    membership: filteredItems.filter((item) => item.category === "membership"),
    group_class: filteredItems.filter((item) => item.category === "group_class"),
    personal_training: filteredItems.filter((item) => item.category === "personal_training"),
    cycle_plan: filteredItems.filter((item) => item.category === "cycle_plan"),
    stored_value: filteredItems.filter((item) => item.category === "stored_value"),
  };

  const sections: Array<{ key: keyof typeof grouped; title: string }> = [
    { key: "membership", title: copy.sections.membership },
    { key: "group_class", title: copy.sections.group_class },
    { key: "personal_training", title: copy.sections.personal_training },
    { key: "cycle_plan", title: copy.sections.cycle_plan },
    { key: "stored_value", title: copy.sections.stored_value },
  ];

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center bg-[var(--modal-backdrop)] px-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-[12px] border border-[var(--color-border)] bg-[var(--color-popover)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
            <MaterialIcon name="storage" className="text-[#00A676]" />
            {copy.title}
          </h3>
          <button className="rounded-md p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" onClick={onClose}>
            <MaterialIcon name="close" className="text-lg" />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="relative">
            <MaterialIcon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[var(--color-text-muted)]" />
            <input
              className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-9 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              placeholder={copy.searchPlaceholder}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>

          {loading ? <div className="text-sm text-[var(--color-text-secondary)]">{copy.loading}</div> : null}

          {!loading && items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)]/45 p-4 text-sm text-[var(--color-text-secondary)]">
              {copy.noItems}
            </div>
          ) : null}

          {!loading && items.length > 0 && filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)]/45 p-4 text-sm text-[var(--color-text-secondary)]">
              {copy.noMatch}
            </div>
          ) : null}

          {!loading
            ? sections.map((section) => (
                <div key={section.key} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/55 p-3">
                  <div className="mb-2 text-xs font-bold tracking-wide text-[#00A676]">{section.title}</div>
                  <div className="space-y-2">
                    {grouped[section.key].length === 0 ? (
                      <div className="text-xs text-[var(--color-text-muted)]">{copy.noSectionItems}</div>
                    ) : (
                      grouped[section.key].map((item) => (
                        <button
                          key={item.id}
                          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left transition-all hover:border-[#00A676]/40 hover:bg-[var(--color-surface-elevated)]"
                          onClick={() => onPick(item)}
                        >
                          <div className="text-sm font-medium text-[var(--color-text-primary)]">{item.name_zh}</div>
                          <div className="text-xs text-[var(--color-text-secondary)]">{item.price ? `$ ${item.price}` : copy.pricePending}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

function CustomerDatabaseModal({
  open,
  locale,
  customers,
  onClose,
  onSelect,
}: {
  open: boolean;
  locale: InvoiceLocale;
  customers: CustomerRecord[];
  onClose: () => void;
  onSelect: (customer: InvoiceCustomerInfo) => void;
}) {
  const [keyword, setKeyword] = useState("");

  if (!open) return null;

  const copy = getInvoicePageCopy(locale).modal.customerDb;

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredCustomers = customers.filter((row) => {
    if (!normalizedKeyword) return true;
    const searchText = `${row.name} ${row.email} ${row.fullAddress}`.toLowerCase();
    return searchText.includes(normalizedKeyword);
  });

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center bg-[var(--modal-backdrop)] px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-[12px] border border-[var(--color-border)] bg-[var(--color-popover)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
            <MaterialIcon name="storage" className="text-[#00A676]" />
            {copy.title}
          </h3>
          <button className="rounded-md p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" onClick={onClose}>
            <MaterialIcon name="close" className="text-lg" />
          </button>
        </div>

        <div className="mb-4 relative">
          <MaterialIcon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[var(--color-text-muted)]" />
          <input
            className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-9 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
            placeholder={copy.searchPlaceholder}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>

        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((row) => (
              <button
                key={row.id}
                className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-all hover:border-[#00A676]/40 hover:bg-[var(--color-surface-elevated)]"
                onClick={() => {
                  onSelect({
                    name: row.name,
                    email: row.email,
                    streetAddress: row.streetAddress,
                    city: row.city,
                    province: row.province,
                    postalCode: row.postalCode,
                    country: row.country,
                  });
                  onClose();
                }}
              >
                <div className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">{row.name}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">{row.email}</div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">{row.fullAddress}</div>
              </button>
            ))
          ) : (
            <div className="rounded-[10px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)]/35 p-4 text-sm text-[var(--color-text-secondary)]">没有匹配的客户</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  locale,
  title,
  description,
  confirmLabel,
  confirming,
  onConfirm,
  onClose,
}: {
  open: boolean;
  locale: InvoiceLocale;
  title: string;
  description: string;
  confirmLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const copy = getInvoicePageCopy(locale).modal;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[var(--modal-backdrop)] px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[12px] border border-[var(--color-border)] bg-[var(--color-popover)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-base font-bold text-[var(--color-text-primary)]">{title}</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface)] disabled:opacity-50"
            onClick={onClose}
            disabled={confirming}
          >
            取消
          </button>
          <button
            className="rounded-[10px] bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? copy.confirmDelete.deleting : confirmLabel ?? copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerProfileModal({
  open,
  locale,
  customer,
  errors,
  saving,
  submitError,
  editing,
  onChange,
  onSave,
  onClose,
}: {
  open: boolean;
  locale: InvoiceLocale;
  customer: InvoiceCustomerInfo;
  errors: CustomerErrors;
  saving: boolean;
  submitError: string | null;
  editing: boolean;
  onChange: (next: InvoiceCustomerInfo) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const copy = getInvoicePageCopy(locale).modal;

  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const { documentElement } = document;
    const prevOverflow = body.style.overflow;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;
    const prevHtmlOverflow = documentElement.style.overflow;
    const prevHtmlOverscroll = documentElement.style.overscrollBehavior;
    const scrollY = window.scrollY;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    body.setAttribute("data-modal-open", "true");

    const preventTouchMove = (event: TouchEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest(".customer-profile-modal-scroll")) {
        return;
      }
      event.preventDefault();
    };
    document.addEventListener("touchmove", preventTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventTouchMove);
      body.style.overflow = prevOverflow;
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      documentElement.style.overflow = prevHtmlOverflow;
      documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      body.removeAttribute("data-modal-open");
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[102] flex items-start justify-center bg-[rgba(3,8,17,0.48)] px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="customer-profile-modal-scroll flex w-full max-w-xl flex-col overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-popover)] shadow-2xl max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
            <MaterialIcon name="person_add" className="text-[#00A676]" />
            {editing ? copy.customerProfile.titleEdit : copy.customerProfile.titleCreate}
          </h3>
          <button className="rounded-md p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" onClick={onClose}>
            <MaterialIcon name="close" className="text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.customerInfo.name}</span>
            <input
              className={`w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676] ${errors.name ? "ring-1 ring-red-500/70" : ""}`}
              placeholder={copy.customerInfo.namePlaceholder}
              type="text"
              value={customer.name}
              onChange={(event) => onChange({ ...customer, name: event.target.value })}
            />
            {errors.name ? <div className="mt-1 text-[10px] text-red-500">{errors.name}</div> : null}
            </label>
            <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.customerInfo.email}</span>
            <input
              className={`w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676] ${errors.email ? "ring-1 ring-red-500/70" : ""}`}
              placeholder={copy.customerInfo.emailPlaceholder}
              type="email"
              value={customer.email}
              onChange={(event) => onChange({ ...customer, email: event.target.value })}
            />
            {errors.email ? <div className="mt-1 text-[10px] text-red-500">{errors.email}</div> : null}
            </label>
            <label className="block md:col-span-2">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.customerInfo.streetAddress}</span>
            <input
              className={`w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676] ${errors.address ? "ring-1 ring-red-500/70" : ""}`}
              placeholder={copy.customerInfo.streetAddressPlaceholder}
              type="text"
              value={customer.streetAddress}
              onChange={(event) => onChange({ ...customer, streetAddress: event.target.value })}
            />
            {errors.address ? <div className="mt-1 text-[10px] text-red-500">{errors.address}</div> : null}
            </label>
            <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.customerInfo.city}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              placeholder={copy.customerInfo.cityPlaceholder}
              type="text"
              value={customer.city}
              onChange={(event) => onChange({ ...customer, city: event.target.value })}
            />
            </label>
            <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.customerInfo.province}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              type="text"
              value={customer.province}
              onChange={(event) => onChange({ ...customer, province: event.target.value })}
            />
            </label>
            <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.customerInfo.postcode}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              placeholder={copy.customerInfo.postcodePlaceholder}
              type="text"
              value={customer.postalCode}
              onChange={(event) => onChange({ ...customer, postalCode: event.target.value })}
            />
            </label>
            <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{copy.customerInfo.country}</span>
            <input
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
              type="text"
              value={customer.country}
              onChange={(event) => onChange({ ...customer, country: event.target.value })}
            />
            </label>
          </div>

          {submitError ? <div className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700">{submitError}</div> : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-popover)] px-6 py-4">
          <button
            className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
            disabled={saving}
          >
            取消
          </button>
          <button
            className="rounded-[10px] bg-[#00A676] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#00A676]/10 transition-all hover:bg-[#00855e] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? copy.customerProfile.saving : editing ? copy.customerProfile.saveEdit : copy.customerProfile.saveCreate}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceTableRow({
  row,
  onView,
  onDownload,
  onSendEmail,
  onDelete,
  deleting,
  supportsHoverActions,
}: {
  row: InvoiceListRow;
  onView: (row: InvoiceListRow) => void;
  onDownload: (row: InvoiceListRow) => void;
  onSendEmail: (row: InvoiceListRow) => void;
  onDelete: (row: InvoiceListRow) => void;
  deleting: boolean;
  supportsHoverActions: boolean;
}) {
  return (
    <tr className="invoice-table-row group">
      <td className="px-6 py-2.5 font-mono text-[13px] text-[var(--color-text-secondary)]">{row.id}</td>
      <td className="px-6 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${row.initialsClassName}`}>
            {row.initials}
          </div>
          <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{row.customer}</span>
        </div>
      </td>
      <td className="px-6 py-2.5 text-right font-mono text-[13px] font-bold text-[#00A676]">{row.amount}</td>
      <td className="px-6 py-2.5 text-[12px] text-[var(--color-text-secondary)]">{row.date}</td>
      <td className="px-6 py-2.5">
        <span
          className={`inline-flex items-center rounded-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            row.status === "SENT"
              ? "bg-[#00A676]/15 text-[#00A676]"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]"
          }`}
        >
          {row.status}
        </span>
      </td>
      <td className="px-6 py-2.5 text-right">
        <div
          className={`flex justify-end gap-1.5 transition-all ${
            supportsHoverActions ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" : "opacity-100"
          }`}
        >
          <button
            className="rounded-md bg-[var(--color-surface-elevated)] p-1.5 text-[var(--color-text-secondary)] transition-all hover:bg-[#00A676] hover:text-[var(--color-text-primary)]"
            onClick={() => onView(row)}
          >
            <MaterialIcon name="visibility" className="text-[16px]" />
          </button>
          <button
            className="rounded-md bg-[var(--color-surface-elevated)] p-1.5 text-[var(--color-text-secondary)] transition-all hover:bg-[#00A676] hover:text-[var(--color-text-primary)]"
            onClick={() => onDownload(row)}
          >
            <MaterialIcon name="picture_as_pdf" className="text-[16px]" />
          </button>
          <button
            className="rounded-md bg-[var(--color-surface-elevated)] p-1.5 text-[var(--color-text-secondary)] transition-all hover:bg-[#00A676] hover:text-[var(--color-text-primary)]"
            onClick={() => onSendEmail(row)}
          >
            <MaterialIcon name="mail" className="text-[16px]" />
          </button>
          <button
            className="rounded-md bg-[var(--color-surface-elevated)] p-1.5 text-[var(--color-text-secondary)] transition-all hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onDelete(row)}
            disabled={deleting}
          >
            <MaterialIcon name="delete" className="text-[16px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function InvoicePageView({
  presetItems: _presetItems,
  recentQuotations,
  invoiceRows,
  customerProfilesFromDb,
  activeLocale = "en",
  showBuilderSection = true,
  showListSection = true,
  showQuotationTab = true,
  onRequestInvoicesRefresh,
}: {
  presetItems: PresetItem[];
  recentQuotations: RecentQuotation[];
  invoiceRows: InvoiceRecord[];
  customerProfilesFromDb: CustomerProfile[];
  activeLocale?: "zh" | "en";
  showBuilderSection?: boolean;
  showListSection?: boolean;
  showQuotationTab?: boolean;
  onRequestInvoicesRefresh?: () => Promise<void>;
}) {
  void _presetItems;
  const router = useRouter();
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerDbModalOpen, setCustomerDbModalOpen] = useState(false);
  const [customerProfileModalOpen, setCustomerProfileModalOpen] = useState(false);
  const [customerRecords, setCustomerRecords] = useState<CustomerRecord[]>([]);
  const [customerProfileDraft, setCustomerProfileDraft] = useState<InvoiceCustomerInfo>(emptyCustomerInfo);
  const [customerProfileEditingId, setCustomerProfileEditingId] = useState<string | null>(null);
  const [customerProfileErrors, setCustomerProfileErrors] = useState<CustomerErrors>({});
  const [customerProfilesLoading, setCustomerProfilesLoading] = useState(false);
  const [customerProfileSaving, setCustomerProfileSaving] = useState(false);
  const [customerProfileSubmitError, setCustomerProfileSubmitError] = useState<string | null>(null);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [invoiceCustomer, setInvoiceCustomer] = useState<InvoiceCustomerInfo>(emptyCustomerInfo);
  const [customerDraft, setCustomerDraft] = useState<InvoiceCustomerInfo>(emptyCustomerInfo);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([]);
  const [customerErrors, setCustomerErrors] = useState<CustomerErrors>({});
  const [itemErrors, setItemErrors] = useState<ItemErrors>({});
  const [catalogItems, setCatalogItems] = useState<PricingItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState(() => generateInvoiceNo());
  const [issueDate, setIssueDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const paymentOptions = ["Bank Transfer", "Credit Card", "Cash", "Store Credit", "EMT", "Custom"] as const;
  const [paymentMethodType, setPaymentMethodType] = useState<(typeof paymentOptions)[number]>("Credit Card");
  const [customPaymentMethod, setCustomPaymentMethod] = useState("");
  const paymentMethod = paymentMethodType === "Custom" ? customPaymentMethod : paymentMethodType;

  const [activeListTab, setActiveListTab] = useState<ListTab>(showQuotationTab ? "quotation" : "invoice");
  const [listSearch, setListSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<"ALL" | InvoiceListStatus>("ALL");
  const [invoiceDateFilter, setInvoiceDateFilter] = useState("");
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceRecord | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<InvoiceRecord | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteInvoice, setPendingDeleteInvoice] = useState<InvoiceRecord | null>(null);
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [templateSettings, setTemplateSettings] = useState<InvoiceTemplateSettings>(defaultInvoiceTemplateSettings);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const [templateActiveGroup, setTemplateActiveGroup] = useState(0);
  const [supportsHoverActions, setSupportsHoverActions] = useState(false);
  const [headerActionsOpen, setHeaderActionsOpen] = useState(false);
  const headerActionsRef = useRef<HTMLDivElement | null>(null);
  const copy = getInvoicePageCopy(activeLocale as InvoiceLocale);

  useEffect(() => {
    if (!templateModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [templateModalOpen]);

  useEffect(() => {
    if (!viewingInvoice) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [viewingInvoice]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => {
      const nextSupportsHover = media.matches;
      setSupportsHoverActions(nextSupportsHover);
      if (nextSupportsHover) setHeaderActionsOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (supportsHoverActions || !headerActionsOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!headerActionsRef.current) return;
      if (headerActionsRef.current.contains(event.target as Node)) return;
      setHeaderActionsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [headerActionsOpen, supportsHoverActions]);

  const getAccessToken = async (): Promise<string | null> => {
    if (!supabase) return null;
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) return null;
    return session?.access_token ?? null;
  };

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      setCatalogLoading(true);
      try {
        const data = await fetchPricingItems();
        if (!mounted) return;
        setCatalogItems(data);
      } catch {
        if (!mounted) return;
        setCatalogItems([]);
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    }

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setCustomerRecords(
      customerProfilesFromDb.map((row) => {
        const parsed = parseCustomerAddress(row.address);
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          ...parsed,
          fullAddress: composeCustomerAddress({ name: row.name, email: row.email, ...parsed }),
        };
      }),
    );
    setCustomerProfilesLoading(false);
  }, [customerProfilesFromDb]);

  useEffect(() => {
    if (!showQuotationTab && activeListTab === "quotation") {
      setActiveListTab("invoice");
    }
  }, [showQuotationTab, activeListTab]);

  useEffect(() => {
    invoiceEmail.setField("to", invoiceCustomer.email || "");
  }, [invoiceCustomer.email]);

  useEffect(() => {
    let mounted = true;

    async function loadTemplateSettings() {
      setTemplateLoading(true);
      setTemplateError(null);

      try {
        const accessToken = await getAccessToken();
        const response = await fetch("/api/invoice-template-settings", {
          cache: "no-store",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        const result = (await response.json()) as {
          ok?: boolean;
          message?: string;
          data?: { default?: { settings_json?: unknown } | null };
        };

        if (!mounted) return;

        if (!response.ok || !result?.ok) {
          throw new Error(result?.message || copy.feedback.templateLoadFailed);
        }

        const saved = result.data?.default?.settings_json;
        if (!saved || typeof saved !== "object") {
          return;
        }

        setTemplateSettings((prev) => ({
          ...defaultInvoiceTemplateSettings,
          ...prev,
          ...(saved as Partial<InvoiceTemplateSettings>),
          oxygenInfo: {
            ...defaultInvoiceTemplateSettings.oxygenInfo,
            ...(saved as Partial<InvoiceTemplateSettings>).oxygenInfo,
          },
        }));
      } catch (error) {
        if (!mounted) return;
        setTemplateError(error instanceof Error ? error.message : copy.feedback.templateLoadFailed);
      } finally {
        if (mounted) setTemplateLoading(false);
      }
    }

    loadTemplateSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const validateCustomer = (value: InvoiceCustomerInfo): CustomerErrors => {
    const errors: CustomerErrors = {};
    if (!value.name.trim()) errors.name = "Name is required";
    if (!value.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) {
      errors.email = "Invalid email format";
    }
    if (!value.streetAddress.trim()) errors.address = "Address is required";
    return errors;
  };

  const validateItems = (value: InvoiceLineItem[]): ItemErrors => {
    const errors: ItemErrors = {};
    value.forEach((item) => {
      const rowError: { name?: string; qty?: string; unitPrice?: string; discount?: string } = {};
      if (!item.name.trim()) rowError.name = "Item name is required";
      if (!Number.isFinite(item.qty) || item.qty < 1) rowError.qty = "Qty must be at least 1";
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) rowError.unitPrice = "Unit price must be 0 or more";
      if (!Number.isFinite(item.discount) || item.discount < 0) rowError.discount = "Discount must be 0 or more";
      const gross = item.qty * item.unitPrice;
      if (Number.isFinite(item.discount) && item.discount > gross) rowError.discount = "Discount cannot exceed line amount";
      if (rowError.name || rowError.qty || rowError.unitPrice || rowError.discount) errors[item.id] = rowError;
    });
    return errors;
  };

  const subtotalAmount = useMemo(
    () => invoiceItems.reduce((sum, item) => sum + Math.max(item.qty * item.unitPrice - item.discount, 0), 0),
    [invoiceItems],
  );

  const taxableAmount = useMemo(
    () =>
      invoiceItems.reduce(
        (sum, item) =>
          item.sourceCategory === "stored_value"
            ? sum
            : sum + Math.max(item.qty * item.unitPrice - item.discount, 0),
        0,
      ),
    [invoiceItems],
  );

  const taxAmount = useMemo(() => taxableAmount * 0.13, [taxableAmount]);
  const totalAmount = useMemo(() => subtotalAmount + taxAmount, [subtotalAmount, taxAmount]);

  const normalizedSearch = normalizeText(listSearch);

  const invoiceListRows = useMemo<InvoiceListRow[]>(() => {
    return invoiceRows.map((row) => {
      const trimmed = row.customer_name.trim();
      const initials = trimmed
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "NA";
      return {
        id: row.invoice_no,
        initials,
        initialsClassName: "bg-[#00A676]/10 text-[#00A676]",
        customer: row.customer_name,
        amount: `$ ${Number(row.total_amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        date: row.issue_date,
        status: row.status === "sent" ? "SENT" : "NOT SENT",
        raw: row,
      };
    });
  }, [invoiceRows]);

  const filteredInvoices = useMemo(() => {
    return invoiceListRows.filter((row) => {
      const matchesStatus = invoiceStatusFilter === "ALL" || row.status === invoiceStatusFilter;
      const matchesDate = !invoiceDateFilter || row.date === invoiceDateFilter;
      const searchText = `${row.id} ${row.customer} ${row.amount} ${row.status}`.toLowerCase();
      const matchesSearch = !normalizedSearch || searchText.includes(normalizedSearch);
      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [invoiceListRows, invoiceStatusFilter, invoiceDateFilter, normalizedSearch]);

  const filteredQuotations = useMemo(() => {
    return recentQuotations.filter((row) => {
      const searchText = `${row.id} ${row.customer} ${row.plan} ${row.amount} ${row.date}`.toLowerCase();
      return !normalizedSearch || searchText.includes(normalizedSearch);
    });
  }, [recentQuotations, normalizedSearch]);

  const duplicateCustomerEmails = useMemo(() => {
    const counts = customerRecords.reduce<Record<string, number>>((acc, row) => {
      const key = row.email.trim().toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .filter(([, count]) => count > 1)
      .map(([email]) => email)
      .sort();
  }, [customerRecords]);

  const customerOverviewRows = useMemo(() => {
    const fromInvoices = invoiceListRows.map((row) => {
      const found = customerRecords.find(
        (customer) =>
          customer.email.trim().toLowerCase() === (row.raw.customer_email ?? "").trim().toLowerCase() ||
          row.customer.includes(customer.name.split(" (")[0]),
      );
      return {
        id: found?.id ?? `from-invoice-${row.id}`,
        profileId: found?.id ?? null,
        name: found?.name || row.customer,
        email: found?.email || row.raw.customer_email || "—",
        fullAddress: found?.fullAddress || row.raw.customer_address || "—",
        invoices: 1,
        quotations: recentQuotations.filter((q) => q.customer === row.customer).length,
        totalAmount: Number(row.raw.total_amount ?? 0),
        latestDate: row.date,
      };
    });

    const fromDatabase = customerRecords
      .filter((dbRow) => !fromInvoices.some((invoiceRow) => invoiceRow.profileId === dbRow.id))
      .map((dbRow) => ({
        id: dbRow.id,
        profileId: dbRow.id,
        name: dbRow.name,
        email: dbRow.email,
        fullAddress: dbRow.fullAddress,
        invoices: 0,
        quotations: recentQuotations.filter((q) => q.customer === dbRow.name).length,
        totalAmount: 0,
        latestDate: "—",
      }));

    const merged = [...fromInvoices, ...fromDatabase].reduce<Record<string, (typeof fromInvoices)[number]>>((acc, row) => {
      const key = row.profileId ?? row.email.toLowerCase() ?? row.name;
      if (!acc[key]) {
        acc[key] = row;
      } else {
        acc[key] = {
          ...acc[key],
          invoices: acc[key].invoices + row.invoices,
          quotations: acc[key].quotations + row.quotations,
          totalAmount: acc[key].totalAmount + row.totalAmount,
          latestDate: acc[key].latestDate === "—" ? row.latestDate : acc[key].latestDate,
        };
      }
      return acc;
    }, {});

    const rows = Object.values(merged);

    return rows.filter((row) => {
      const searchText = `${row.name} ${row.email} ${row.fullAddress}`.toLowerCase();
      return !normalizedSearch || searchText.includes(normalizedSearch);
    });
  }, [invoiceListRows, recentQuotations, customerRecords, normalizedSearch]);

  const updateInvoiceItem = (id: string, update: Partial<InvoiceLineItem>) => {
    setInvoiceItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...update } : item));
      setItemErrors(validateItems(next));
      return next;
    });
  };

  const addCustomLineItem = () => {
    setInvoiceItems((prev) => {
      const next = [...prev, createEmptyInvoiceItem()];
      setItemErrors(validateItems(next));
      return next;
    });
  };

  const resetInvoiceForm = () => {
    setInvoiceCustomer(emptyCustomerInfo);
    setCustomerDraft(emptyCustomerInfo);
    setInvoiceItems([]);
    setCustomerErrors({});
    setItemErrors({});
    setPaymentMethodType("Credit Card");
    setCustomPaymentMethod("");
    setIssueDate(new Date().toLocaleDateString("en-CA"));
    setInvoiceNo(generateInvoiceNo());
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(INVOICE_DRAFT_STORAGE_KEY);
    }
  };

  const removeLineItem = (id: string) => {
    setInvoiceItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setItemErrors(validateItems(next));
      return next;
    });
  };

  const pickCatalogItem = (item: PricingItem) => {
    setInvoiceItems((prev) => {
      const next = [
        ...prev,
        {
          id: `line-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: item.name_en?.trim() || item.name_zh,
          qty: 1,
          unitPrice: item.price ?? 0,
          discount: 0,
          sourceCategory: item.category,
        },
      ];
      setItemErrors(validateItems(next));
      return next;
    });
    setItemPickerOpen(false);
  };

  const goToNewInvoice = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(INVOICE_DRAFT_STORAGE_KEY);
    }
    router.push("/new-invoice");
  };

  const invoicePaperRef = useRef<HTMLDivElement | null>(null);
  const emailRenderRef = useRef<HTMLDivElement | null>(null);
  const viewingInvoiceRef = useRef<HTMLDivElement | null>(null);
  const hiddenDownloadRef = useRef<HTMLDivElement | null>(null);

  const invoiceEmail = useInvoiceEmailSender({
    invoiceNo,
    customerName: invoiceCustomer.name,
    defaultEmail: invoiceCustomer.email,
    // In list-only mode, the visible builder preview is not mounted.
    // Keep a hidden document node as a stable source for PDF generation.
    getInvoiceElement: () => invoicePaperRef.current ?? emailRenderRef.current,
    onSent: async () => {
      const matchingInvoice = invoiceRows.find((row) => row.invoice_no === invoiceNo);
      if (!matchingInvoice) return;

      await updateInvoiceStatus(matchingInvoice.id, "sent");
      if (onRequestInvoicesRefresh) {
        await onRequestInvoicesRefresh();
      }
      toastUpdateSuccess(activeLocale === "zh" ? "发票状态已更新" : "Invoice updated");
    },
  });

  const normalizeInvoiceItemsFromRecord = (invoice: InvoiceRecord): InvoiceLineItem[] => {
    const rows = (invoice.items ?? []).map((item) => ({
      id: item.id,
      name: item.item_name,
      qty: Number(item.quantity ?? 0),
      unitPrice: Number(item.unit_price ?? 0),
      discount: Number(item.discount ?? 0),
      sourceCategory: (item.source_category as PricingItem["category"] | null) ?? undefined,
    }));

    return rows.length > 0 ? rows : [createEmptyInvoiceItem()];
  };


  const handleDownloadPdf = async () => {
    const invoiceElement = invoicePaperRef.current;
    if (!invoiceElement) return;
    await downloadInvoicePdfFromElement({ invoiceElement, invoiceNo });
  };

  const toDocumentData = (payload: {
    invoiceNo: string;
    issueDate: string;
    customer: InvoiceCustomerInfo;
    items: InvoiceLineItem[];
    paymentMethod: string;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
  }): InvoiceDocumentData => ({
    invoiceNo: payload.invoiceNo,
    issueDate: payload.issueDate,
    customer: payload.customer,
    items: payload.items,
    paymentMethod: payload.paymentMethod,
    subtotalAmount: payload.subtotalAmount,
    taxAmount: payload.taxAmount,
    totalAmount: payload.totalAmount,
  });

  const selectedInvoiceDocumentData = useMemo(() => {
    if (!viewingInvoice) return null;
    const items = normalizeInvoiceItemsFromRecord(viewingInvoice);
    return toDocumentData({
      invoiceNo: viewingInvoice.invoice_no,
      issueDate: viewingInvoice.issue_date,
      customer: {
        name: viewingInvoice.customer_name,
        email: viewingInvoice.customer_email,
        streetAddress: parseCustomerAddress(viewingInvoice.customer_address).streetAddress,
        city: parseCustomerAddress(viewingInvoice.customer_address).city,
        province: parseCustomerAddress(viewingInvoice.customer_address).province,
        postalCode: parseCustomerAddress(viewingInvoice.customer_address).postalCode,
        country: parseCustomerAddress(viewingInvoice.customer_address).country,
      },
      items,
      paymentMethod: viewingInvoice.payment_method,
      subtotalAmount: Number(viewingInvoice.subtotal ?? 0),
      taxAmount: Number(viewingInvoice.tax_amount ?? 0),
      totalAmount: Number(viewingInvoice.total_amount ?? 0),
    });
  }, [viewingInvoice]);

  const builderDocumentData = useMemo(
    () =>
      toDocumentData({
        invoiceNo,
        issueDate,
        customer: invoiceCustomer,
        items: invoiceItems,
        paymentMethod,
        subtotalAmount,
        taxAmount,
        totalAmount,
      }),
    [invoiceNo, issueDate, invoiceCustomer, invoiceItems, paymentMethod, subtotalAmount, taxAmount, totalAmount],
  );

  const downloadingInvoiceDocumentData = useMemo(() => {
    if (!downloadingInvoice) return null;
    const items = normalizeInvoiceItemsFromRecord(downloadingInvoice);
    return toDocumentData({
      invoiceNo: downloadingInvoice.invoice_no,
      issueDate: downloadingInvoice.issue_date,
      customer: {
        name: downloadingInvoice.customer_name,
        email: downloadingInvoice.customer_email,
        streetAddress: parseCustomerAddress(downloadingInvoice.customer_address).streetAddress,
        city: parseCustomerAddress(downloadingInvoice.customer_address).city,
        province: parseCustomerAddress(downloadingInvoice.customer_address).province,
        postalCode: parseCustomerAddress(downloadingInvoice.customer_address).postalCode,
        country: parseCustomerAddress(downloadingInvoice.customer_address).country,
      },
      items,
      paymentMethod: downloadingInvoice.payment_method,
      subtotalAmount: Number(downloadingInvoice.subtotal ?? 0),
      taxAmount: Number(downloadingInvoice.tax_amount ?? 0),
      totalAmount: Number(downloadingInvoice.total_amount ?? 0),
    });
  }, [downloadingInvoice]);

  useEffect(() => {
    if (!downloadingInvoice || !hiddenDownloadRef.current) return;

    let cancelled = false;

    const run = async () => {
      await downloadInvoicePdfFromElement({
        invoiceElement: hiddenDownloadRef.current as HTMLDivElement,
        invoiceNo: downloadingInvoice.invoice_no,
      });
      if (!cancelled) {
        setDownloadingInvoice(null);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [downloadingInvoice]);

  const handleSaveInvoice = async () => {
    setSaveError(null);

    const nextCustomerErrors = validateCustomer(invoiceCustomer);
    const nextItemErrors = validateItems(invoiceItems);
    setCustomerErrors(nextCustomerErrors);
    setItemErrors(nextItemErrors);

    if (Object.keys(nextCustomerErrors).length > 0 || Object.keys(nextItemErrors).length > 0) {
      setSaveError(copy.feedback.saveInvoiceRequired);
      return;
    }

    if (!paymentMethod.trim()) {
      setSaveError(copy.feedback.paymentRequired);
      return;
    }

    setSaveSubmitting(true);
    try {
      await createInvoice({
        invoice_no: invoiceNo,
        issue_date: issueDate,
        customer_name: invoiceCustomer.name.trim(),
        customer_email: invoiceCustomer.email.trim(),
        customer_address: composeCustomerAddress(invoiceCustomer),
        payment_method: paymentMethod.trim(),
        status: "saved",
        subtotal: Number(subtotalAmount.toFixed(2)),
        taxable_amount: Number(taxableAmount.toFixed(2)),
        tax_amount: Number(taxAmount.toFixed(2)),
        total_amount: Number(totalAmount.toFixed(2)),
        items: invoiceItems.map((item) => ({
          item_name: item.name.trim(),
          quantity: item.qty,
          unit_price: Number(item.unitPrice.toFixed(2)),
          discount: Number(item.discount.toFixed(2)),
          source_category: item.sourceCategory ?? null,
          line_total: Number(Math.max(item.qty * item.unitPrice - item.discount, 0).toFixed(2)),
        })),
      });

      if (onRequestInvoicesRefresh) {
        await onRequestInvoicesRefresh();
      }

      toastSaveSuccess(copy.feedback.invoiceSaved);
      resetInvoiceForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.feedback.saveFailed;
      setSaveError(message);
      toastFailed(message);
    } finally {
      setSaveSubmitting(false);
    }
  };

  const updateTemplateField = (field: InvoiceTemplateField, value: string) => {
    setTemplateSettings((prev) => ({
      ...prev,
      oxygenInfo: {
        ...prev.oxygenInfo,
        [field]: value,
      },
    }));
  };

  const handleSaveTemplateSettings = async () => {
    setTemplateSaving(true);
    setTemplateError(null);
    setTemplateMessage(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/invoice-template-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ settings: templateSettings }),
      });

      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || copy.feedback.templateSaveFailed);
      }

      setTemplateMessage(copy.feedback.templateSaved);
      toastSaveSuccess(copy.feedback.templateSaved);
      setTemplateModalOpen(false);
      setTemplateError(null);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : copy.feedback.templateSaveFailed;
      const normalized = rawMessage.toLowerCase();
      const isPermissionError =
        normalized.includes("permission") ||
        normalized.includes("not allowed") ||
        normalized.includes("violates row-level security") ||
        normalized.includes("new row violates row-level security");

      setTemplateError(isPermissionError ? copy.feedback.noTemplatePermission : rawMessage);
      toastFailed(isPermissionError ? copy.feedback.noTemplatePermission : rawMessage);
    } finally {
      setTemplateSaving(false);
    }
  };

  return (
    <div className="invoice-design min-h-screen bg-background font-sans text-[var(--color-text-primary)] antialiased">
      <CustomerInfoModal
        open={customerModalOpen}
        locale={activeLocale}
        customer={customerDraft}
        onChange={setCustomerDraft}
        onSave={() => {
          const nextErrors = validateCustomer(customerDraft);
          setCustomerErrors(nextErrors);
          if (Object.keys(nextErrors).length > 0) return;
          setInvoiceCustomer(customerDraft);
          setCustomerModalOpen(false);
          toastUpdateSuccess(activeLocale === "zh" ? "客户信息已更新" : "Customer updated");
        }}
        onClose={() => setCustomerModalOpen(false)}
      />
      <CustomerDatabaseModal
        open={customerDbModalOpen}
        locale={activeLocale}
        customers={customerRecords}
        onClose={() => setCustomerDbModalOpen(false)}
        onSelect={(customer) => {
          setInvoiceCustomer(customer);
          setCustomerErrors(validateCustomer(customer));
        }}
      />
      <CustomerProfileModal
        open={customerProfileModalOpen}
        locale={activeLocale}
        customer={customerProfileDraft}
        errors={customerProfileErrors}
        saving={customerProfileSaving}
        submitError={customerProfileSubmitError}
        editing={Boolean(customerProfileEditingId)}
        onChange={(next) => {
          setCustomerProfileDraft(next);
          setCustomerProfileErrors(validateCustomer(next));
          if (customerProfileSubmitError) setCustomerProfileSubmitError(null);
        }}
        onSave={async () => {
          const nextErrors = validateCustomer(customerProfileDraft);
          setCustomerProfileErrors(nextErrors);
          if (Object.keys(nextErrors).length > 0) return;

          const payload: CustomerCreateInput = {
            name: customerProfileDraft.name.trim(),
            email: customerProfileDraft.email.trim(),
            address: composeCustomerAddress(customerProfileDraft),
          };

          setCustomerProfileSaving(true);
          setCustomerProfileSubmitError(null);
          try {
            if (customerProfileEditingId) {
              const updated = await updateCustomerProfile(customerProfileEditingId, payload);
              setCustomerRecords((prev) =>
                prev.map((row) =>
                  row.id === updated.id
                    ? (() => {
                        const parsed = parseCustomerAddress(updated.address);
                        return {
                          id: updated.id,
                          name: updated.name,
                          email: updated.email,
                          ...parsed,
                          fullAddress: composeCustomerAddress({ name: updated.name, email: updated.email, ...parsed }),
                        };
                      })()
                    : row,
                ),
              );
              toastUpdateSuccess(copy.feedback.customerSaved);
            } else {
              const created = await createCustomerProfile(payload);
              setCustomerRecords((prev) => [
                (() => {
                  const parsed = parseCustomerAddress(created.address);
                  return {
                    id: created.id,
                    name: created.name,
                    email: created.email,
                    ...parsed,
                    fullAddress: composeCustomerAddress({ name: created.name, email: created.email, ...parsed }),
                  };
                })(),
                ...prev,
              ]);
              toastAddSuccess(copy.feedback.customerSaved);
            }
            setCustomerProfileDraft(emptyCustomerInfo);
            setCustomerProfileEditingId(null);
            setCustomerProfileErrors({});
            setCustomerProfileModalOpen(false);
          } catch (error) {
            setCustomerProfileSubmitError(error instanceof Error ? error.message : copy.feedback.customerSaveFailed);
          } finally {
            setCustomerProfileSaving(false);
          }
        }}
        onClose={() => {
          if (customerProfileSaving) return;
          setCustomerProfileModalOpen(false);
          setCustomerProfileEditingId(null);
          setCustomerProfileErrors({});
          setCustomerProfileSubmitError(null);
        }}
      />
      <ItemPickerModal
        open={itemPickerOpen}
        locale={activeLocale}
        items={catalogItems}
        loading={catalogLoading}
        onClose={() => setItemPickerOpen(false)}
        onPick={pickCatalogItem}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteInvoice)}
        locale={activeLocale}
        title={copy.modal.confirmDelete.title}
        description={pendingDeleteInvoice ? copy.modal.confirmDelete.description(pendingDeleteInvoice.invoice_no) : ""}
        confirmLabel={copy.modal.confirmDelete.confirmLabel}
        confirming={Boolean(deletingInvoiceId)}
        onClose={() => {
          if (deletingInvoiceId) return;
          setPendingDeleteInvoice(null);
        }}
        onConfirm={async () => {
          if (!pendingDeleteInvoice) return;

          setDeleteError(null);
          setDeletingInvoiceId(pendingDeleteInvoice.id);
          try {
            await deleteInvoice(pendingDeleteInvoice.id);
            if (onRequestInvoicesRefresh) {
              await onRequestInvoicesRefresh();
            }
            setPendingDeleteInvoice(null);
            toastDeleteSuccess(copy.feedback.invoiceDeleted);
          } catch (error) {
            setDeleteError(error instanceof Error ? error.message : copy.feedback.deleteFailed);
            toastFailed(error instanceof Error ? error.message : copy.feedback.deleteFailed);
          } finally {
            setDeletingInvoiceId(null);
          }
        }}
      />

      {templateModalOpen ? (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/45 px-3 py-4 backdrop-blur-[2px] sm:px-4 sm:py-6">
          <div className="relative grid h-[82vh] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-popover)] shadow-2xl lg:max-h-[860px] lg:grid-cols-[240px_1fr]">
            <aside className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 p-4 lg:border-r lg:border-b-0">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">{copy.template.title}</h3>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <div className="mb-2 h-1.5 w-14 rounded-full" style={{ backgroundColor: templateSettings.brandColor }} />
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{templateSettings.oxygenInfo.companyName || copy.template.previewFallbackCompany}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{templateSettings.oxygenInfo.headerSubtitle || copy.template.previewFallbackSubtitle}</p>
                </div>

                <div className="space-y-1">
                  {TEMPLATE_GROUPS.map((group, index) => (
                    <button
                      key={group.key}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        templateActiveGroup === index
                          ? "border-[#00A676]/45 bg-[#00A676]/10 text-[#00A676]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[#00A676]/25 hover:text-[var(--color-text-primary)]"
                      }`}
                      onClick={() => setTemplateActiveGroup(index)}
                    >
                      <span>{copy.template.groups[group.key]}</span>
                      <span className="opacity-80">{group.fields.length}</span>
                    </button>
                  ))}
                </div>

                {templateLoading ? <p className="text-xs text-[var(--color-text-secondary)]">{copy.template.loading}</p> : null}
                {templateError ? <p className="rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-400">{templateError}</p> : null}
                {templateMessage ? <p className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs text-emerald-500">{templateMessage}</p> : null}
              </div>
            </aside>

            <section className="relative flex min-h-0 flex-col">
              <button
                className="absolute top-3 right-3 z-20   p-2 text-[var(--color-text-secondary)] transition-colors  hover:text-[var(--color-text-primary)]"
                onClick={() => setTemplateModalOpen(false)}
                aria-label={copy.template.closeAria}
              >
                <MaterialIcon name="close" className="text-lg" />
              </button>

              <div className="flex-1 overflow-y-auto px-4 py-4 pt-14 sm:px-6 sm:py-5 sm:pt-14">
                <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <p className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">{copy.template.brandColor}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[84px_1fr]">
                    <input
                      className="h-11 w-full cursor-pointer rounded-lg border border-[var(--color-border)] bg-transparent"
                      type="color"
                      value={templateSettings.brandColor}
                      onChange={(event) => setTemplateSettings((prev) => ({ ...prev, brandColor: event.target.value }))}
                    />
                    <input
                      className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-page-bg-strong)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[#00A676]/50"
                      value={templateSettings.brandColor}
                      onChange={(event) => setTemplateSettings((prev) => ({ ...prev, brandColor: event.target.value }))}
                      placeholder="#00A676"
                    />
                  </div>
                </div>

                <div className="space-y-4 pb-6">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">{copy.template.groups[TEMPLATE_GROUPS[templateActiveGroup]?.key ?? "header"]}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{copy.template.sectionHint}</p>
                      </div>
                      <span className="rounded-full bg-[var(--color-page-bg-strong)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                        {templateActiveGroup + 1} / {TEMPLATE_GROUPS.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {(TEMPLATE_GROUPS[templateActiveGroup]?.fields ?? []).map((field) => {
                        const isLongTextField = field === "termsDescription";

                        return (
                          <label
                            key={field}
                            className={`block rounded-lg border border-[var(--color-border)] bg-[var(--color-page-bg-strong)]/60 p-3 transition-colors hover:border-[#00A676]/35 ${
                              isLongTextField ? "md:col-span-2" : ""
                            }`}
                          >
                            <span className="mb-1.5 block text-[11px] font-semibold text-[var(--color-text-secondary)]">{copy.template.fieldLabels[field]}</span>
                            {isLongTextField ? (
                              <textarea
                                className="min-h-[88px] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-popover)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[#00A676]/50"
                                value={templateSettings.oxygenInfo[field]}
                                onChange={(event) => updateTemplateField(field, event.target.value)}
                              />
                            ) : (
                              <input
                                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-popover)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[#00A676]/50"
                                value={templateSettings.oxygenInfo[field]}
                                onChange={(event) => updateTemplateField(field, event.target.value)}
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-popover)] px-4 py-3 sm:px-6">
                <p className="text-xs text-[var(--color-text-secondary)]">{copy.template.footerHint}</p>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
                    onClick={() => {
                      setTemplateSettings(defaultInvoiceTemplateSettings);
                    }}
                  >
                    {copy.template.resetDefault}
                  </button>
                  <button
                    className="rounded-lg bg-[#00A676] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#00855e] disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={handleSaveTemplateSettings}
                    disabled={templateSaving}
                  >
                    {templateSaving ? copy.template.saving : copy.template.save}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      <InvoiceEmailPanel
        open={emailPanelOpen}
        invoiceNo={invoiceNo}
        attachmentName={`${invoiceNo || "invoice"}.pdf`}
        form={invoiceEmail.form}
        sending={invoiceEmail.sending}
        error={invoiceEmail.error}
        onClose={() => {
          if (invoiceEmail.sending) return;
          setEmailPanelOpen(false);
        }}
        onFieldChange={invoiceEmail.setField}
        onResetTemplate={invoiceEmail.resetTemplate}
        onSend={async () => {
          const sent = await invoiceEmail.send();
          if (sent) {
            setEmailPanelOpen(false);
            toastSaveSuccess(activeLocale === "zh" ? "邮件发送成功" : "Email sent successfully");
          }
        }}
      />

      {viewingInvoice && selectedInvoiceDocumentData ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--modal-backdrop)] p-2 sm:p-4"
          onClick={() => setViewingInvoice(null)}
        >
          <div
            className="relative max-h-[86vh] w-full max-w-[1100px] overflow-auto rounded-[12px] border border-[var(--color-border)] bg-[var(--color-popover)] p-3 sm:p-4 shadow-2xl sm:max-h-[96vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{copy.modal.invoicePreview.titlePrefix}{viewingInvoice.invoice_no}</h3>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-elevated)]"
                  onClick={async () => {
                    if (!viewingInvoiceRef.current) return;
                    await downloadInvoicePdfFromElement({
                      invoiceElement: viewingInvoiceRef.current,
                      invoiceNo: viewingInvoice.invoice_no,
                    });
                  }}
                >
                  {copy.modal.invoicePreview.downloadPdf}
                </button>
                <button
                  className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-elevated)]"
                  onClick={() => setViewingInvoice(null)}
                >
                  {copy.modal.close}
                </button>
              </div>
            </div>
            <InvoiceDocument data={selectedInvoiceDocumentData} settings={templateSettings} locale={activeLocale} paperRef={viewingInvoiceRef} />
          </div>
        </div>
      ) : null}

      {downloadingInvoice && downloadingInvoiceDocumentData ? (
        <div className="pointer-events-none fixed top-0 left-[-12000px] opacity-0" aria-hidden>
          <InvoiceDocument data={downloadingInvoiceDocumentData} settings={templateSettings} locale={activeLocale} paperRef={hiddenDownloadRef} />
        </div>
      ) : null}

      <div className="pointer-events-none fixed top-0 left-[-12000px] opacity-0" aria-hidden>
        <InvoiceDocument data={builderDocumentData} settings={templateSettings} locale={activeLocale} paperRef={emailRenderRef} />
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10">
        <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <span className="rounded-lg bg-[#00A676]/10 p-2">
                <MaterialIcon name="receipt_long" className="text-[#00A676]" />
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{copy.header.title}</h1>
            </div>
            <div className="flex flex-col">
              <p className="text-sm text-[var(--color-text-secondary)]">{copy.header.subtitle}</p>
              <p className="mt-1 text-xs font-medium tracking-wide text-[var(--color-primary)]/85">{copy.header.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!showListSection ? (
              <button
                className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface)]"
                onClick={() => router.push("/invoice")}
              >
                {copy.header.backToList}
              </button>
            ) : null}

            <div className="group relative" ref={headerActionsRef}>
              <button
                className="flex items-center gap-2 rounded-[10px] bg-[#00A676] px-6 py-2.5 font-bold text-white shadow-lg shadow-[#00A676]/10 transition-all duration-300 hover:bg-[#00855e]"
                onClick={() => {
                  if (!supportsHoverActions) setHeaderActionsOpen((prev) => !prev);
                }}
                aria-haspopup="menu"
                aria-expanded={supportsHoverActions ? undefined : headerActionsOpen}
              >
                <MaterialIcon name="add" />
                <span>{copy.header.actions}</span>
                <MaterialIcon name="expand_more" className="text-sm" />
              </button>
              <div
                className={`absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-popover)] shadow-2xl transition-all ${
                  supportsHoverActions
                    ? "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                    : headerActionsOpen
                      ? "visible opacity-100"
                      : "invisible pointer-events-none opacity-0"
                }`}
                role="menu"
              >
                {showListSection ? (
                  <button
                    className="flex w-full items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left text-sm text-[var(--color-text-primary)] hover:bg-[#00A676]/10"
                    onClick={() => {
                      setHeaderActionsOpen(false);
                      goToNewInvoice();
                    }}
                  >
                    <MaterialIcon name="post_add" className="text-lg" /> {copy.header.createInvoice}
                  </button>
                ) : null}
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--color-text-primary)] hover:bg-[#00A676]/10"
                  onClick={() => {
                    setHeaderActionsOpen(false);
                    setTemplateModalOpen(true);
                  }}
                >
                  <MaterialIcon name="settings" className="text-lg" /> {copy.header.templateSettings}
                </button>
              </div>
            </div>
          </div>
        </header>

        {showBuilderSection ? (
          <section className="mb-16 grid grid-cols-1 gap-10 xl:grid-cols-12">
            <div className="flex flex-col gap-6 xl:col-span-8">
              <div className="glass-panel rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-3 text-lg font-semibold text-[var(--color-text-primary)]">
                    <MaterialIcon name="person_add" className="text-[#00A676]" />
                    {copy.builder.customerInfoTitle}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-border-strong)]"
                      onClick={() => setCustomerDbModalOpen(true)}
                    >
                      <MaterialIcon name="storage" className="text-sm text-[var(--color-primary)]" /> {copy.builder.pickCustomerFromDb}
                    </button>
                    <button
                      className="flex items-center gap-2 rounded-md border border-[#00A676]/40 bg-[#00A676]/10 px-4 py-2 text-xs font-semibold text-[#00A676] transition-colors hover:bg-[#00A676]/20"
                      onClick={() => {
                        setCustomerDraft(emptyCustomerInfo);
                        setCustomerModalOpen(true);
                      }}
                    >
                      <MaterialIcon name="person_add" className="text-sm" /> {copy.builder.createCustomerProfile}
                    </button>
                  </div>
                </div>
                <CustomerInfoPanel
                  customer={invoiceCustomer}
                  errors={customerErrors}
                  locale={activeLocale}
                  onChange={(next) => {
                    setInvoiceCustomer(next);
                    setCustomerErrors(validateCustomer(next));
                  }}
                />
              </div>

              <div className="glass-panel flex min-h-[420px] flex-col overflow-hidden rounded-[10px]">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/35 p-6">
                  <h2 className="flex items-center gap-3 text-lg font-semibold text-[var(--color-text-primary)]">
                    <MaterialIcon name="edit_note" className="text-[#00A676]" />
                    {copy.builder.quoteBuilderTitle}
                  </h2>
                </div>

                <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
                  <div className="space-y-5">
                    {invoiceItems.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-6 text-center">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{copy.builder.emptyItemsTitle}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{copy.builder.emptyItemsHint}</p>
                      </div>
                    ) : null}

                    {invoiceItems.map((line) => (
                      <div key={line.id} className="group relative grid grid-cols-12 items-end gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/25 p-5">
                        <div className="col-span-5">
                          <label className="mb-2 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{copy.builder.labels.itemName}</label>
                          <input
                            className={`w-full rounded-md border-[var(--color-border)] bg-[var(--color-page-bg-strong)] py-2 text-sm text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(0,0,0,0.03)] focus:border-[#00A676] focus:ring-[#00A676] ${itemErrors[line.id]?.name ? "ring-1 ring-red-500/70" : ""}`}
                            type="text"
                            value={line.name}
                            onChange={(event) => updateInvoiceItem(line.id, { name: event.target.value })}
                          />
                          {line.sourceCategory === "stored_value" ? <div className="mt-1 text-[10px] font-semibold uppercase text-[var(--color-primary)]/80">{copy.builder.labels.nonTaxable}</div> : null}
                          {itemErrors[line.id]?.name ? <div className="mt-1 text-[10px] text-red-500">{itemErrors[line.id]?.name}</div> : null}
                        </div>
                        <div className="col-span-2">
                          <label className="mb-2 block text-center text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{copy.builder.labels.qty}</label>
                          <NumberInput
                            className={`w-full rounded-md border-[var(--color-border)] bg-[var(--color-page-bg-strong)] py-2 text-center text-sm text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(0,0,0,0.03)] focus:border-[#00A676] focus:ring-[#00A676] ${itemErrors[line.id]?.qty ? "ring-1 ring-red-500/70" : ""}`}
                            min={1}
                            allowDecimal={false}
                            value={line.qty}
                            onChange={(value) => updateInvoiceItem(line.id, { qty: value || 1 })}
                          />
                          {itemErrors[line.id]?.qty ? <div className="mt-1 text-[10px] text-red-500">{itemErrors[line.id]?.qty}</div> : null}
                        </div>
                        <div className="col-span-2">
                          <label className="mb-2 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{copy.builder.labels.unitPrice}</label>
                          <NumberInput
                            className={`w-full rounded-md border-[var(--color-border)] bg-[var(--color-page-bg-strong)] py-2 text-sm text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(0,0,0,0.03)] focus:border-[#00A676] focus:ring-[#00A676] ${itemErrors[line.id]?.unitPrice ? "ring-1 ring-red-500/70" : ""}`}
                            min={0}
                            value={line.unitPrice}
                            onChange={(value) => updateInvoiceItem(line.id, { unitPrice: value || 0 })}
                          />
                          {itemErrors[line.id]?.unitPrice ? <div className="mt-1 text-[10px] text-red-500">{itemErrors[line.id]?.unitPrice}</div> : null}
                        </div>
                        <div className="col-span-2">
                          <label className="mb-2 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{copy.builder.labels.discount}</label>
                          <NumberInput
                            className={`w-full rounded-md border-[var(--color-border)] bg-[var(--color-page-bg-strong)] py-2 text-sm text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(0,0,0,0.03)] focus:border-[#00A676] focus:ring-[#00A676] ${itemErrors[line.id]?.discount ? "ring-1 ring-red-500/70" : ""}`}
                            min={0}
                            value={line.discount}
                            onChange={(value) => updateInvoiceItem(line.id, { discount: value || 0 })}
                          />
                          {itemErrors[line.id]?.discount ? <div className="mt-1 text-[10px] text-red-500">{itemErrors[line.id]?.discount}</div> : null}
                        </div>
                        <div className="col-span-1 flex justify-center pb-2">
                          <button className="text-[var(--color-text-muted)] transition-colors hover:text-red-500" onClick={() => removeLineItem(line.id)}>
                            <MaterialIcon name="delete" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-text-secondary)] transition-all hover:border-[#00A676] hover:text-[#00A676]"
                        onClick={() => setItemPickerOpen(true)}
                      >
                        <MaterialIcon name="storage" className="text-xl" />
                        <span className="text-xs font-medium tracking-wide">{copy.builder.addFromDb}</span>
                      </button>

                      <button
                        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-text-secondary)] transition-all hover:border-[#00A676] hover:text-[#00A676]"
                        onClick={addCustomLineItem}
                      >
                        <MaterialIcon name="add" className="text-xl" />
                        <span className="text-xs font-medium tracking-wide">{copy.builder.addCustom}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/20 p-6">
                  <div className="flex items-center gap-8">
                    <div>
                      <span className="mb-1 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{copy.builder.totalAmount}</span>
                      <span className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">$ {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="mt-1 block text-[10px] text-[var(--color-text-secondary)]">{copy.builder.taxHint}</span>
                    </div>
                    <div className="h-10 w-px bg-[var(--color-border)]" />
                    <div>
                      <span className="mb-1 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{copy.builder.totalItems}</span>
                      <span className="text-sm font-semibold text-[var(--color-text-secondary)]">{invoiceItems.length} {copy.builder.itemsSuffix}</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="min-w-[220px] rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
                      <p className="mb-1 text-[10px] font-bold tracking-widest text-[var(--color-text-secondary)] uppercase">{copy.builder.paymentMethod}</p>
                      <select
                        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-page-bg-strong)] px-2 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] outline-none"
                        value={paymentMethodType}
                        onChange={(event) => setPaymentMethodType(event.target.value as (typeof paymentOptions)[number])}
                      >
                        {paymentOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {paymentMethodType === "Custom" ? (
                        <input
                          className="mt-1.5 w-full rounded border border-[var(--color-border)] bg-[var(--color-page-bg-strong)] px-2 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                          value={customPaymentMethod}
                          onChange={(event) => setCustomPaymentMethod(event.target.value)}
                          placeholder={copy.builder.customPaymentPlaceholder}
                        />
                      ) : null}
                    </div>
                    <button
                      className="rounded-[10px] bg-[#00A676] px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#00A676]/10 transition-all hover:bg-[#00855e] disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleSaveInvoice}
                      disabled={saveSubmitting}
                    >
                      {saveSubmitting ? copy.builder.saving : copy.builder.save}
                    </button>
                  </div>
                </div>
                {saveError ? <div className="px-6 pb-4 text-xs font-medium text-red-500">{saveError}</div> : null}
              </div>
            </div>

            <div className="flex flex-col gap-6 xl:col-span-4">
              <div className="glass-panel mini-invoice-preview flex flex-col overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 p-6">
                <h2 className="mb-4 text-[11px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase">{copy.builder.livePreview}</h2>

                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-2">
                  <div className="flex justify-center p-2">
                    <div className="relative h-[553px] w-[391px] overflow-hidden">
                      <div className="absolute top-0 left-0 origin-top-left" style={{ width: 850, transform: "scale(0.46)" }}>
                        <InvoiceDocument data={builderDocumentData} settings={templateSettings} locale={activeLocale} paperRef={invoicePaperRef} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  className="flex items-center justify-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-elevated)]"
                  onClick={handleDownloadPdf}
                >
                  <MaterialIcon name="picture_as_pdf" className="text-sm text-[var(--color-primary)]" /> {copy.builder.downloadPdf}
                </button>
                <InvoiceEmailTrigger
                  onClick={() => {
                    invoiceEmail.clearFeedback();
                    invoiceEmail.resetTemplate();
                    setEmailPanelOpen(true);
                  }}
                />
              </div>
            </div>
          </section>
        ) : null} 

        {showListSection ? (
          <section className="mb-20">
            <div className="mb-8 flex overflow-x-auto rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/30 p-1.5">
              <button
                className={`flex items-center gap-2 rounded-md px-6 py-3 text-sm whitespace-nowrap transition-all ${
                  activeListTab === "invoice"
                    ? "bg-[#00A676]/12 font-bold text-[#00A676] shadow-sm"
                    : "font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                }`}
                onClick={() => setActiveListTab("invoice")}
              >
                <MaterialIcon name="description" className="text-lg" /> {copy.table.tabs.invoiceList}
              </button>
              {showQuotationTab ? (
                <button
                  className={`flex items-center gap-2 rounded-md px-6 py-3 text-sm whitespace-nowrap transition-all ${
                    activeListTab === "quotation"
                      ? "bg-[#00A676]/12 font-bold text-[#00A676] shadow-sm"
                      : "font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                  }`}
                  onClick={() => setActiveListTab("quotation")}
                >
                  <MaterialIcon name="list_alt" className="text-lg" /> {copy.table.tabs.quotationList}
                </button>
              ) : null}
              <button
                className={`flex items-center gap-2 rounded-md px-6 py-3 text-sm whitespace-nowrap transition-all ${
                  activeListTab === "customer"
                    ? "bg-[#00A676]/12 font-bold text-[#00A676] shadow-sm"
                    : "font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                }`}
                onClick={() => setActiveListTab("customer")}
              >
                <MaterialIcon name="person_search" className="text-lg" /> {copy.table.tabs.customerList}
              </button>
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--color-text-primary)]">
                {activeListTab === "invoice"
                  ? copy.table.management.invoice
                  : activeListTab === "quotation"
                    ? copy.table.management.quotation
                    : copy.table.management.customer}
                <span className="ml-2 rounded bg-[var(--color-surface-elevated)] px-2 py-0.5 text-xs font-normal text-[var(--color-text-muted)]">{copy.table.management.realtime}</span>
              </h2>
              <div className="relative">
                <MaterialIcon name="search" className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[var(--color-text-muted)]" />
                <input
                  className="w-72 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-4 pl-10 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[#00A676] focus:ring-[#00A676]"
                  placeholder={
                    activeListTab === "invoice"
                      ? copy.table.searchPlaceholder.invoice
                      : activeListTab === "quotation"
                        ? copy.table.searchPlaceholder.quotation
                        : copy.table.searchPlaceholder.customer
                  }
                  type="text"
                  value={listSearch}
                  onChange={(event) => setListSearch(event.target.value)}
                />
              </div>
            </div>

            {activeListTab === "quotation" ? (
              <div className="mb-12">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredQuotations.map((row) => (
                    <QuotationCard key={row.id} row={row} />
                  ))}

                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/35 p-6 text-[var(--color-text-secondary)] opacity-70 transition-all hover:border-[var(--color-primary)]/35 hover:bg-[var(--color-surface-elevated)] hover:opacity-100"
                    onClick={goToNewInvoice}
                  >
                    <MaterialIcon name="add" className="mb-2 text-3xl text-[var(--color-primary)]" />
                    <p className="text-xs font-bold uppercase tracking-wider">{copy.table.quotation.create}</p>
                  </div>
                </div>

                {filteredQuotations.length === 0 ? (
                  <div className="mt-6 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)]/35 p-5 text-sm text-[var(--color-text-muted)]">{copy.table.quotation.noMatch}</div>
                ) : null}
              </div>
            ) : null}

            {activeListTab === "invoice" ? (
              <div className="glass-panel overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="flex flex-wrap items-center justify-between gap-6 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/30 p-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{copy.table.invoice.all}</h2>
                    <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
                      <button
                        className={`rounded-md px-5 py-1.5 text-xs font-semibold transition-colors ${
                          invoiceStatusFilter === "ALL" ? "bg-[#00A676]/15 font-bold text-[#00A676]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
                        }`}
                        onClick={() => setInvoiceStatusFilter("ALL")}
                      >
                        {copy.table.invoice.statusFilter.all}
                      </button>
                      <button
                        className={`rounded-md px-5 py-1.5 text-xs font-semibold transition-colors ${
                          invoiceStatusFilter === "SENT" ? "bg-[#00A676]/15 text-[#00A676]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
                        }`}
                        onClick={() => setInvoiceStatusFilter("SENT")}
                      >
                        {copy.table.invoice.statusFilter.sent}
                      </button>
                      <button
                        className={`rounded-md px-5 py-1.5 text-xs font-semibold transition-colors ${
                          invoiceStatusFilter === "NOT SENT" ? "bg-[#00A676]/15 text-[#00A676]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
                        }`}
                        onClick={() => setInvoiceStatusFilter("NOT SENT")}
                      >
                        {copy.table.invoice.statusFilter.notSent}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-text-primary)] focus:border-[#00A676] focus:ring-[#00A676]"
                      type="date"
                      value={invoiceDateFilter}
                      onChange={(event) => setInvoiceDateFilter(event.target.value)}
                    />
                  </div>
                </div>

                {customerProfilesLoading ? (
                  <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/20 px-6 py-3 text-xs text-[var(--color-text-secondary)]">{copy.table.invoice.loadingCustomers}</div>
                ) : null}
                {deleteError ? <div className="border-b border-red-500/30 bg-red-500/10 px-6 py-2 text-xs text-red-700">{deleteError}</div> : null}
                {duplicateCustomerEmails.length > 0 ? (
                  <div className="mx-6 mt-4 rounded-[10px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-800">
                    {copy.table.invoice.duplicateWarning(duplicateCustomerEmails.length, duplicateCustomerEmails.join("，"))}
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[var(--color-surface-elevated)]/45 text-[10px] uppercase tracking-widest text-[var(--color-text-secondary)]">
                        <th className="px-6 py-4 font-bold">{copy.table.invoice.headers.invoiceNo}</th>
                        <th className="px-6 py-4 font-bold">{copy.table.invoice.headers.customerName}</th>
                        <th className="px-6 py-4 text-right font-bold">{copy.table.invoice.headers.total}</th>
                        <th className="px-6 py-4 font-bold">{copy.table.invoice.headers.date}</th>
                        <th className="px-6 py-4 font-bold">{copy.table.invoice.headers.status}</th>
                        <th className="px-6 py-4 text-right font-bold">{copy.table.invoice.headers.action}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((row) => (
                          <InvoiceTableRow
                            key={row.id}
                            row={row}
                            deleting={deletingInvoiceId === row.raw.id}
                            supportsHoverActions={supportsHoverActions}
                            onView={(target) => {
                              setViewingInvoice(target.raw);
                            }}
                            onDownload={(target) => {
                              setDownloadingInvoice(target.raw);
                            }}
                            onSendEmail={(target) => {
                              const source = target.raw;
                              const parsed = parseCustomerAddress(source.customer_address ?? "");
                              const nextInvoiceNo = source.invoice_no || generateInvoiceNo();
                              const normalizedCustomer: InvoiceCustomerInfo = {
                                name: source.customer_name,
                                email: source.customer_email,
                                streetAddress: parsed.streetAddress,
                                city: parsed.city,
                                province: parsed.province,
                                postalCode: parsed.postalCode,
                                country: parsed.country,
                              };
                              const normalizedItems = normalizeInvoiceItemsFromRecord(source);
                              setInvoiceNo(nextInvoiceNo);
                              setIssueDate(source.issue_date || new Date().toLocaleDateString("en-CA"));
                              setInvoiceCustomer(normalizedCustomer);
                              setCustomerErrors(validateCustomer(normalizedCustomer));
                              setInvoiceItems(normalizedItems);
                              setItemErrors(validateItems(normalizedItems));

                              if (paymentOptions.includes(source.payment_method as (typeof paymentOptions)[number])) {
                                setPaymentMethodType(source.payment_method as (typeof paymentOptions)[number]);
                                setCustomPaymentMethod("");
                              } else {
                                setPaymentMethodType("Custom");
                                setCustomPaymentMethod(source.payment_method || "");
                              }

                              const nextTemplate = createInvoiceEmailTemplate({
                                customerName: normalizedCustomer.name,
                                invoiceNo: nextInvoiceNo,
                              });
                              invoiceEmail.clearFeedback();
                              invoiceEmail.setField("to", source.customer_email || "");
                              invoiceEmail.setField("subject", nextTemplate.subject);
                              invoiceEmail.setField("body", nextTemplate.body);
                              setEmailPanelOpen(true);
                            }}
                            onDelete={(target) => {
                              setDeleteError(null);
                              setPendingDeleteInvoice(target.raw);
                            }}
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-sm text-[var(--color-text-secondary)]">
                            {copy.table.invoice.empty}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/20 p-6">
                  <div className="text-[11px] font-medium tracking-widest text-[var(--color-text-muted)] uppercase">
                    {copy.table.invoice.showing(filteredInvoices.length)}
                  </div>
                  <button
                    className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
                    onClick={() => {
                      setListSearch("");
                      setInvoiceStatusFilter("ALL");
                      setInvoiceDateFilter("");
                    }}
                  >
                    {copy.table.invoice.resetFilter}
                  </button>
                </div>
              </div>
            ) : null}

            {activeListTab === "customer" ? (
              <div className="glass-panel overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/20 px-6 py-4">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{copy.table.customer.overview}</h3>
                  <button
                    className="flex items-center gap-2 rounded-[10px] bg-[#00A676] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#00A676]/10 transition-all hover:bg-[#00855e]"
                    onClick={() => {
                      setCustomerProfileDraft(emptyCustomerInfo);
                      setCustomerProfileEditingId(null);
                      setCustomerProfileErrors({});
                      setCustomerProfileModalOpen(true);
                    }}
                  >
                    <MaterialIcon name="person_add" className="text-sm" />
                    {copy.table.customer.add}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[var(--color-surface-elevated)]/45 text-[10px] uppercase tracking-widest text-[var(--color-text-secondary)]">
                        <th className="px-6 py-4 font-bold">{copy.table.customer.headers.customer}</th>
                        <th className="px-6 py-4 font-bold">{copy.table.customer.headers.contact}</th>
                        <th className="px-6 py-4 text-right font-bold">{copy.table.customer.headers.totalAmount}</th>
                        <th className="px-6 py-4 font-bold">{copy.table.customer.headers.latest}</th>
                        <th className="px-6 py-4 text-right font-bold">{copy.table.customer.headers.action}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {customerOverviewRows.map((customer) => {
                        const matchedRecord = customerRecords.find((record) => record.id === customer.profileId);
                        return (
                          <tr key={customer.id} className="hover:bg-[var(--color-surface-elevated)]/25">
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-[var(--color-text-primary)]">{customer.name}</div>
                            </td>
                            <td className="px-6 py-4 text-xs text-[var(--color-text-secondary)]">
                              <div>{customer.email}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-sm font-bold text-[#00A676]">
                              $ {customer.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-xs text-[var(--color-text-secondary)]">{customer.latestDate}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:border-[#00A676]/40 hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={!matchedRecord}
                                onClick={() => {
                                  if (!matchedRecord) return;
                                  setCustomerProfileDraft({
                                    name: matchedRecord.name,
                                    email: matchedRecord.email,
                                    streetAddress: matchedRecord.streetAddress,
                                    city: matchedRecord.city,
                                    province: matchedRecord.province,
                                    postalCode: matchedRecord.postalCode,
                                    country: matchedRecord.country,
                                  });
                                  setCustomerProfileEditingId(matchedRecord.id);
                                  setCustomerProfileErrors({});
                                  setCustomerProfileSubmitError(null);
                                  setCustomerProfileModalOpen(true);
                                }}
                              >
                                {copy.table.customer.edit}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {customerOverviewRows.length === 0 ? (
                  <div className="border-t border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)]">{copy.table.customer.empty}</div>
                ) : null}
              </div>
            ) : null}

          </section>
        ) : null}
      </div>
    </div>
  );
}
