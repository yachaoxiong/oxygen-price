import type { RefObject } from "react";
import { getInvoicePageCopy, type InvoiceLocale } from "@/components/invoice/invoicePageCopy";
import type { PricingItem } from "@/types/pricing";

export type InvoiceDocumentItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  discount: number;
  sourceCategory?: PricingItem["category"];
};

export type InvoiceDocumentCustomer = {
  name: string;
  email: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

export type InvoiceTemplateSettings = {
  brandColor: string;
  oxygenInfo: {
    invoiceTitle: string;
    headerSubtitle: string;
    dateLabel: string;
    invoiceNoLabel: string;
    hstLabel: string;
    hstNumber: string;
    fromTitle: string;
    billToTitle: string;
    companyName: string;
    addressLine1: string;
    addressLine2: string;
    country: string;
    email: string;
    paymentTermsTitle: string;
    notesTitle: string;
    notesTemplate: string;
    termsTitle: string;
    termsDescription: string;
    thankYouMessage: string;
  };
};

export const defaultInvoiceTemplateSettings: InvoiceTemplateSettings = {
  brandColor: "#00A676",
  oxygenInfo: {
    invoiceTitle: "Invoice",
    headerSubtitle: "OXYGEN Fitness Club",
    dateLabel: "Date:",
    invoiceNoLabel: "Invoice #:",
    hstLabel: "HST #:",
    hstNumber: "773605332RT0001",
    fromTitle: "From:",
    billToTitle: "Bill To:",
    companyName: "OXYGEN Fitness Club",
    addressLine1: "Unit C - 7880 Woodbine Ave",
    addressLine2: "Markham ON L3R 2N7",
    country: "Canada",
    email: "oxygen.o2fitness@gmail.com",
    paymentTermsTitle: "Payment Terms:",
    notesTitle: "Notes:",
    notesTemplate: "PAID by {{paymentMethod}}",
    termsTitle: "Terms and Conditions",
    termsDescription: "Please complete payment within 7 business days after receiving this invoice.",
    thankYouMessage: "Thank you for your business!",
  },
};

export type InvoiceDocumentData = {
  invoiceNo: string;
  issueDate: string;
  customer: InvoiceDocumentCustomer;
  items: InvoiceDocumentItem[];
  paymentMethod: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
};

function renderNotesTemplate(template: string, paymentMethod: string) {
  const normalizedPayment = paymentMethod || "Payment pending";
  return template.replaceAll("{{paymentMethod}}", normalizedPayment);
}

export function InvoiceDocument({
  data,
  settings = defaultInvoiceTemplateSettings,
  locale = "en",
  paperRef,
}: {
  data: InvoiceDocumentData;
  settings?: InvoiceTemplateSettings;
  locale?: InvoiceLocale;
  paperRef?: RefObject<HTMLDivElement | null>;
}) {
  const copy = getInvoicePageCopy(locale).document;
  const customerDisplayName = data.customer.name.trim() || copy.newCustomerDraft;

  return (
    <div ref={paperRef} className="invoice-paper overflow-hidden bg-white text-[color:var(--invoice-dark-grey)] shadow-2xl">
      <header className="relative border-b border-[#f3f4f6] px-12 pt-12 pb-10">
        <div className="invoice-paper__texture pointer-events-none absolute inset-0" />
        <div className="relative z-10 flex items-start justify-between gap-8">
          <div className="flex items-start">
            <div className="mt-1 flex h-[96px] w-[126px] shrink-0 items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="block h-full w-full object-contain"
                draggable={false}
              />
            </div>
            <div>
              <h3 className="mb-2 text-5xl leading-none font-extrabold tracking-tight text-[#1a1a1a] uppercase italic">{settings.oxygenInfo.invoiceTitle}</h3>
              <div className="flex items-center gap-3">
                <span className="mt-3 h-6 w-1.5" style={{ backgroundColor: settings.brandColor }} />
                <p className="pt-1 text-sm font-bold tracking-[0.2em] text-[color:var(--invoice-light-grey)] uppercase">{settings.oxygenInfo.headerSubtitle}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">{settings.oxygenInfo.dateLabel}</p>
              <p className="font-semibold text-[color:var(--invoice-dark-grey)]">{data.issueDate}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">{settings.oxygenInfo.invoiceNoLabel}</p>
              <p className="font-semibold text-[color:var(--invoice-dark-grey)]">{data.invoiceNo}</p>
            </div>
            <div className="col-span-2">
              <p className="mb-1 text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">{settings.oxygenInfo.hstLabel}</p>
              <p className="font-semibold text-[color:var(--invoice-dark-grey)]">{settings.oxygenInfo.hstNumber}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-12 px-12 py-10">
        <div>
          <h4 className="mb-4 border-b border-[#f3f4f6] pb-2 text-[10px] font-bold tracking-widest uppercase" style={{ color: settings.brandColor }}>
            {settings.oxygenInfo.fromTitle}
          </h4>
          <div className="text-[13px] leading-relaxed text-[color:var(--invoice-light-grey)]">
            <p className="mb-1 font-bold text-[color:var(--invoice-dark-grey)]">{settings.oxygenInfo.companyName}</p>
            <p>{settings.oxygenInfo.addressLine1}</p>
            <p>{settings.oxygenInfo.addressLine2}</p>
            <p>{settings.oxygenInfo.country}</p>
            <p className="mt-3 font-medium" style={{ color: settings.brandColor }}>
              {settings.oxygenInfo.email}
            </p>
          </div>
        </div>
        <div>
          <h4 className="mb-4 border-b border-[#f3f4f6] pb-2 text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">{settings.oxygenInfo.billToTitle}</h4>
          <div className="text-[13px] leading-relaxed text-[color:var(--invoice-light-grey)]">
            <p className="mb-1 font-bold text-[color:var(--invoice-dark-grey)]">{customerDisplayName}</p>
            <p>{data.customer.streetAddress.trim() || copy.streetPending}</p>
            <p>
              {[data.customer.city.trim(), data.customer.province.trim(), data.customer.postalCode.trim()].filter(Boolean).join(", ") ||
                copy.cityProvincePostcodePending}
            </p>
            <p>{data.customer.country.trim() || copy.countryPending}</p>
            <p>{data.customer.email.trim() || copy.emailPending}</p>
          </div>
        </div>
      </section>

      <section className="px-12">
        <table className="w-full text-left">
          <thead>
            <tr className="border-y border-[#f3f4f6] bg-[#f9fafb]">
              <th className="px-4 py-4 text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">{copy.table.description}</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">{copy.table.quantity}</th>
              <th className="px-4 py-4 text-right text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">{copy.table.unitPrice}</th>
              <th className="px-4 py-4 text-right text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">{copy.table.discount}</th>
              <th className="px-4 py-4 text-right text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">{copy.table.total}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f9fafb]">
            {data.items.map((line) => (
              <tr key={line.id}>
                <td className="px-2 py-4 text-sm font-semibold text-[color:var(--invoice-dark-grey)]">{line.name || copy.table.untitledItem}</td>
                <td className="px-2 py-4 text-center text-sm text-[color:var(--invoice-light-grey)]">{line.qty}</td>
                <td className="px-2 py-4 text-right text-sm text-[color:var(--invoice-light-grey)]">$ {line.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-2 py-4 text-right text-sm text-[color:var(--invoice-light-grey)]">$ {line.discount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-2 py-4 text-right text-sm font-bold text-[color:var(--invoice-dark-grey)]">$ {Math.max(line.qty * line.unitPrice - line.discount, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
            <tr className="h-16">
              <td colSpan={5} />
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-auto px-12 pt-8 pb-10">
        <div className="flex justify-between gap-10 border-t border-[#f3f4f6] pt-7">
          <div className="max-w-md space-y-6">
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">{settings.oxygenInfo.paymentTermsTitle}</p>
              <div className="w-full bg-white px-6 py-1 text-sm font-semibold text-[color:var(--invoice-dark-grey)]">{data.paymentMethod || copy.tbd}</div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">{settings.oxygenInfo.notesTitle}</p>
              <p className="text-sm italic text-[color:var(--invoice-light-grey)]">{renderNotesTemplate(settings.oxygenInfo.notesTemplate, data.paymentMethod)}</p>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">{settings.oxygenInfo.termsTitle}</p>
              <p className="mb-3 text-sm leading-relaxed text-[color:var(--invoice-light-grey)]">{settings.oxygenInfo.termsDescription}</p>
              <p className="text-sm font-bold" style={{ color: settings.brandColor }}>
                {settings.oxygenInfo.thankYouMessage}
              </p>
            </div>
          </div>

          <div className="w-72 space-y-3">
            <div className="flex items-center justify-between px-4 text-sm">
              <span className="text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">{copy.summary.subtotal}</span>
              <span className="font-medium text-[color:var(--invoice-dark-grey)]">$ {data.subtotalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between px-4 text-sm">
              <span className="text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">{copy.summary.tax}</span>
              <span className="font-medium text-[color:var(--invoice-dark-grey)]">$ {data.taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="invoice-paper__total relative overflow-hidden">
              <div className="relative px-4 py-2 text-[color:var(--invoice-dark-grey)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">
                    {copy.summary.total}
                  </span>
                  <span className="text-2xl font-black leading-none" style={{ color: settings.brandColor }}>
                    $ {data.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
