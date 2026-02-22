"use client";

import { useRef, useState, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePrinter } from "react-icons/hi";

export type InvoiceLineItem = {
  id: string;
  productName: string;
  quantity: number;
  price: number;
};

export type InvoiceCustomer = {
  name: string;
  phone?: string;
  address?: string;
};

export type InvoiceBillProps = {
  /** Brand/company name shown in header */
  companyName?: string;
  /** Optional tagline or address under company name */
  companyTagline?: string;
  /** Initial customer (e.g. from selected customer). Editable in form. */
  initialCustomer?: InvoiceCustomer;
  /** Initial line items (e.g. from order). Editable. */
  initialItems?: Omit<InvoiceLineItem, "id">[];
  /** Optional: hide the form and show only printable content (controlled mode) */
  readOnly?: boolean;
  /** Optional: custom class for the wrapper */
  className?: string;
  /** Optional: ref for the printable content (e.g. for parent to use with react-to-print) */
  contentRef?: React.RefObject<HTMLDivElement | null>;
};

const defaultCompany = "MM Agency";
const defaultTagline = "Quality products & services";

function generateId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function InvoiceBill({
  companyName: initialCompanyName = defaultCompany,
  companyTagline: initialCompanyTagline = defaultTagline,
  initialCustomer,
  initialItems = [],
  readOnly = false,
  className = "",
  contentRef: contentRefProp,
}: InvoiceBillProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const contentRef = contentRefProp ?? printRef;

  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [companyTagline, setCompanyTagline] = useState(initialCompanyTagline);
  const [customer, setCustomer] = useState<InvoiceCustomer>({
    name: initialCustomer?.name ?? "",
    phone: initialCustomer?.phone ?? "",
    address: initialCustomer?.address ?? "",
  });

  const [items, setItems] = useState<InvoiceLineItem[]>(() =>
    initialItems.length
      ? initialItems.map((item) => ({
          id: generateId(),
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        }))
      : [{ id: generateId(), productName: "", quantity: 0, price: 0 }]
  );

  const addRow = useCallback(() => {
    setItems((prev) => [...prev, { id: generateId(), productName: "", quantity: 0, price: 0 }]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const updateRow = useCallback(
    (id: string, field: keyof InvoiceLineItem, value: string | number) => {
      setItems((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );
    },
    []
  );

  const lineTotal = (row: InvoiceLineItem) =>
    Math.round((row.quantity * row.price) * 100) / 100;
  const grandTotal = items.reduce((sum, row) => sum + lineTotal(row), 0);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${customer.name || "Bill"}-${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page { margin: 14mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `,
  });

  const printableContent = (
    <div ref={contentRef} className="bg-white text-zinc-900 p-6 max-w-2xl mx-auto">
      {/* Brand / Company header */}
      <header className="border-b-2 border-zinc-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          {companyName}
        </h1>
        {companyTagline && (
          <p className="text-sm text-zinc-600 mt-0.5">{companyTagline}</p>
        )}
      </header>

      {/* Customer information */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Bill To
        </h2>
        <div className="text-zinc-800">
          <p className="font-medium">{customer.name || "—"}</p>
          {customer.phone && <p className="text-sm">{customer.phone}</p>}
          {customer.address && (
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">{customer.address}</p>
          )}
        </div>
      </section>

      {/* Invoice date */}
      <p className="text-sm text-zinc-500 mb-4">
        Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </p>

      {/* Product table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-zinc-300">
            <th className="text-left py-2 px-2 font-semibold text-zinc-700">Product</th>
            <th className="text-right py-2 px-2 w-20 font-semibold text-zinc-700">Qty</th>
            <th className="text-right py-2 px-2 w-24 font-semibold text-zinc-700">Price</th>
            <th className="text-right py-2 px-2 w-28 font-semibold text-zinc-700">Total</th>
            {!readOnly && <th className="w-10" />}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-b border-zinc-200">
              <td className="py-2 px-2">
                {readOnly ? (
                  row.productName || "—"
                ) : (
                  <input
                    type="text"
                    value={row.productName}
                    onChange={(e) => updateRow(row.id, "productName", e.target.value)}
                    placeholder="Product name"
                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-zinc-900"
                  />
                )}
              </td>
              <td className="py-2 px-2 text-right">
                {readOnly ? (
                  row.quantity
                ) : (
                  <input
                    type="number"
                    min={0}
                    value={row.quantity || ""}
                    onChange={(e) =>
                      updateRow(row.id, "quantity", parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full text-right bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-zinc-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>
              <td className="py-2 px-2 text-right">
                {readOnly ? (
                  row.price.toFixed(2)
                ) : (
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={row.price || ""}
                    onChange={(e) =>
                      updateRow(row.id, "price", parseFloat(e.target.value) || 0)
                    }
                    className="w-full text-right bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-zinc-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>
              <td className="py-2 px-2 text-right font-medium tabular-nums">
                {lineTotal(row).toFixed(2)}
              </td>
              {!readOnly && (
                <td className="py-2 px-1">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={items.length <= 1}
                    className="p-1.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Remove row"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Grand total */}
      <div className="mt-6 flex justify-end">
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Grand Total</p>
          <p className="text-2xl font-bold text-zinc-900 tabular-nums">
            {grandTotal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );

  if (readOnly) {
    return <div className={className}>{printableContent}</div>;
  }

  return (
    <div className={className}>
      {/* Screen form: company & customer */}
      <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Company / Brand</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Company name"
          />
          <input
            type="text"
            value={companyTagline}
            onChange={(e) => setCompanyTagline(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-400 text-sm placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Tagline or address"
          />
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Customer</h3>
        <div className="grid gap-3 sm:grid-cols-1">
          <input
            type="text"
            value={customer.name}
            onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Customer name"
          />
          <input
            type="text"
            value={customer.phone ?? ""}
            onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Phone"
          />
          <textarea
            value={customer.address ?? ""}
            onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
            rows={2}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            placeholder="Address"
          />
        </div>
      </div>

      {/* Product list with add row */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Items</h3>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Add row
        </button>
      </div>

      {/* Printable invoice (hidden on screen, shown when printing) */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/30 overflow-hidden">
        <div className="max-h-[50vh] overflow-y-auto p-4 print:max-h-none print:overflow-visible print:p-0 print:border-0 print:bg-transparent">
          {printableContent}
        </div>
      </div>

      {/* Grand total + Print button (screen only) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg font-semibold text-white">
          Grand Total: <span className="text-emerald-400 tabular-nums">{grandTotal.toFixed(2)}</span>
        </p>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          <HiOutlinePrinter className="h-5 w-5" />
          Print invoice
        </button>
      </div>
    </div>
  );
}
