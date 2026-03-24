import type { RefObject } from "react";
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

export function InvoiceDocument({ data, paperRef }: { data: InvoiceDocumentData; paperRef?: RefObject<HTMLDivElement | null> }) {
  const customerDisplayName = data.customer.name.trim() || "New Customer (Draft)";

  return (
    <div ref={paperRef} className="invoice-paper overflow-hidden bg-white text-[color:var(--invoice-dark-grey)] shadow-2xl">
      <header className="relative border-b border-[#f3f4f6] px-12 pt-12 pb-10">
        <div className="invoice-paper__texture pointer-events-none absolute inset-0" />
        <div className="relative z-10 flex items-start justify-between gap-8">
          <div>
            <h3 className="mb-2 text-5xl leading-none font-extrabold tracking-tight text-[#1a1a1a] uppercase italic">Invoice</h3>
            <div className="flex items-center gap-3">
              <span className="mt-3 h-6 w-1.5 bg-[color:var(--invoice-brand-green)]" />
              <p className="pt-1 text-sm font-bold tracking-[0.2em] text-[color:var(--invoice-light-grey)] uppercase">OXYGEN Fitness Club</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">Date:</p>
              <p className="font-semibold text-[color:var(--invoice-dark-grey)]">{data.issueDate}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">Invoice #:</p>
              <p className="font-semibold text-[color:var(--invoice-dark-grey)]">{data.invoiceNo}</p>
            </div>
            <div className="col-span-2">
              <p className="mb-1 text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">HST #:</p>
              <p className="font-semibold text-[color:var(--invoice-dark-grey)]">773605332RT0001</p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-12 px-12 py-10">
        <div>
          <h4 className="mb-4 border-b border-[#f3f4f6] pb-2 text-[10px] font-bold tracking-widest text-[color:var(--invoice-brand-green)] uppercase">From:</h4>
          <div className="text-[13px] leading-relaxed text-[color:var(--invoice-light-grey)]">
            <p className="mb-1 font-bold text-[color:var(--invoice-dark-grey)]">OXYGEN Fitness Club</p>
            <p>Unit C - 7880 Woodbine Ave</p>
            <p>Markham ON L3R 2N7</p>
            <p>Canada</p>
            <p className="mt-3 font-medium text-[color:var(--invoice-brand-green)]">oxygen.o2fitness@gmail.com</p>
          </div>
        </div>
        <div>
          <h4 className="mb-4 border-b border-[#f3f4f6] pb-2 text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">Bill To:</h4>
          <div className="text-[13px] leading-relaxed text-[color:var(--invoice-light-grey)]">
            <p className="mb-1 font-bold text-[color:var(--invoice-dark-grey)]">{customerDisplayName}</p>
            <p>{data.customer.streetAddress.trim() || "Street address pending"}</p>
            <p>
              {[data.customer.city.trim(), data.customer.province.trim(), data.customer.postalCode.trim()].filter(Boolean).join(", ") ||
                "City / Province / Postcode pending"}
            </p>
            <p>{data.customer.country.trim() || "Country pending"}</p>
            <p>{data.customer.email.trim() || "Email pending"}</p>
          </div>
        </div>
      </section>

      <section className="px-12">
        <table className="w-full text-left">
          <thead>
            <tr className="border-y border-[#f3f4f6] bg-[#f9fafb]">
              <th className="px-4 py-4 text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">Description</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">Quantity</th>
              <th className="px-4 py-4 text-right text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">Unit Price</th>
              <th className="px-4 py-4 text-right text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">Discount</th>
              <th className="px-4 py-4 text-right text-[10px] font-bold tracking-wider text-[color:var(--invoice-light-grey)] uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f9fafb]">
            {data.items.map((line) => (
              <tr key={line.id}>
                <td className="px-2 py-4 text-sm font-semibold text-[color:var(--invoice-dark-grey)]">{line.name || "Untitled Item"}</td>
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
              <p className="mb-2 text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">Payment Terms:</p>
              <div className="w-full bg-white px-6 py-1 text-sm font-semibold text-[color:var(--invoice-dark-grey)]">{data.paymentMethod || "TBD"}</div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">Notes:</p>
              <p className="text-sm italic text-[color:var(--invoice-light-grey)]">{data.paymentMethod ? `PAID by ${data.paymentMethod}` : "Payment pending"}</p>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">Terms and Conditions</p>
              <p className="mb-3 text-sm leading-relaxed text-[color:var(--invoice-light-grey)]">Please complete payment within 7 business days after receiving this invoice.</p>
              <p className="text-sm font-bold text-[color:var(--invoice-brand-green)]">Thank you for your business!</p>
            </div>
          </div>

          <div className="w-72 space-y-3">
            <div className="flex items-center justify-between px-4 text-sm">
              <span className="text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">Subtotal</span>
              <span className="font-medium text-[color:var(--invoice-dark-grey)]">$ {data.subtotalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between px-4 text-sm">
              <span className="text-[10px] font-bold tracking-widest text-[color:var(--invoice-light-grey)] uppercase">Tax</span>
              <span className="font-medium text-[color:var(--invoice-dark-grey)]">$ {data.taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="invoice-paper__total relative overflow-hidden">
              <div className="invoice-paper__texture pointer-events-none absolute inset-0 opacity-30" />
              <div className="relative rounded bg-[color:var(--invoice-dark-grey)] p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">Total</span>
                  <span className="text-2xl font-black text-[color:var(--invoice-brand-green)]">$ {data.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
