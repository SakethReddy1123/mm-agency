"use client";

import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { HiOutlinePrinter, HiOutlineX, HiOutlineChevronDown, HiOutlineChevronRight } from "react-icons/hi";
import { InvoiceBill } from "../customers/components/InvoiceBill";

type OrderLineRow = {
  order_id: string;
  order_date: string;
  product_name: string;
  quantity: number;
  total_amount: number;
};

type CustomerOrdersGroup = {
  customer_id: string;
  customer_name: string;
  lines: OrderLineRow[];
  total: number;
};

type CustomerInvoice = {
  customer: { name: string; phone?: string; address?: string };
  items: { productName: string; quantity: number; price: number; total: number }[];
  total: number;
};

function totalItemCount(lines: OrderLineRow[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export default function OrdersPage() {
  const [customers, setCustomers] = useState<CustomerOrdersGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [invoiceCustomer, setInvoiceCustomer] = useState<CustomerInvoice | null>(null);
  const [linePrint, setLinePrint] = useState<{ customerName: string; line: OrderLineRow } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const linePrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoiceCustomer
      ? `Invoice-${invoiceCustomer.customer.name}`
      : "Invoice",
    pageStyle: `
      @page { margin: 14mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `,
  });

  const handleLinePrint = useReactToPrint({
    contentRef: linePrintRef,
    documentTitle: linePrint
      ? `Line-${linePrint.customerName}-${linePrint.line.product_name}`
      : "Line",
    pageStyle: `
      @page { margin: 14mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/orders?by=customer");
        if (!res.ok) throw new Error("Failed to load orders");
        const data = await res.json();
        setCustomers(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleExpand(customerId: string) {
    setExpandedId((id) => (id === customerId ? null : customerId));
  }

  async function openPrintForCustomer(group: CustomerOrdersGroup) {
    try {
      const res = await fetch(`/api/customers/${group.customer_id}`);
      if (!res.ok) throw new Error("Failed to load customer");
      const customer = await res.json();
      const items = group.lines.map((line) => ({
        productName: line.product_name,
        quantity: line.quantity,
        price: line.total_amount / line.quantity,
        total: line.total_amount,
      }));
      setInvoiceCustomer({
        customer: {
          name: customer.name,
          phone: customer.phone ?? undefined,
          address: customer.address ?? undefined,
        },
        items,
        total: group.total,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customer");
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">Orders</h1>
      <p className="mt-1 text-zinc-500">Click a customer row to expand and see all products, then print invoice.</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
          Loading…
        </div>
      ) : customers.length === 0 ? (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
          No orders yet.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50">
                <th className="w-10 px-2 py-3" aria-label="Expand" />
                <th className="px-4 py-3 font-medium text-zinc-300">Customer</th>
                <th className="px-4 py-3 font-medium text-zinc-300 text-right">Items</th>
                <th className="px-4 py-3 font-medium text-zinc-300 text-right">Total amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {customers.flatMap((group) => {
                const isExpanded = expandedId === group.customer_id;
                const itemCount = totalItemCount(group.lines);
                return [
                  <tr
                    key={group.customer_id}
                    onClick={() => toggleExpand(group.customer_id)}
                    className="cursor-pointer text-zinc-400 transition-colors hover:bg-zinc-800/50"
                  >
                    <td className="px-2 py-3 text-zinc-500">
                      {isExpanded ? (
                        <HiOutlineChevronDown className="h-5 w-5" />
                      ) : (
                        <HiOutlineChevronRight className="h-5 w-5" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {group.customer_name}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {itemCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      ₹{group.total.toFixed(2)}
                    </td>
                  </tr>,
                  ...(isExpanded
                    ? [
                        <tr key={`${group.customer_id}-expanded`}>
                          <td colSpan={4} className="bg-zinc-800/30 p-0">
                            <div className="border-t border-zinc-700 px-4 py-4">
                              <div className="overflow-x-auto rounded-lg border border-zinc-700">
                                <table className="w-full text-left text-sm">
                                  <thead>
                                    <tr className="border-b border-zinc-700 bg-zinc-800/50">
                                      <th className="px-4 py-2 font-medium text-zinc-400">Order date</th>
                                      <th className="px-4 py-2 font-medium text-zinc-400">Product</th>
                                      <th className="px-4 py-2 font-medium text-zinc-400 text-right">Qty</th>
                                      <th className="px-4 py-2 font-medium text-zinc-400 text-right">Amount</th>
                                      <th className="w-12 px-2 py-2" aria-label="Print line" />
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-700">
                                    {group.lines.map((line, idx) => (
                                      <tr
                                        key={`${line.order_id}-${line.product_name}-${idx}`}
                                        className="text-zinc-300"
                                      >
                                        <td className="px-4 py-2">
                                          {formatDate(line.order_date)}
                                        </td>
                                        <td className="px-4 py-2 font-medium text-white">
                                          {line.product_name}
                                        </td>
                                        <td className="px-4 py-2 text-right tabular-nums">
                                          {line.quantity}
                                        </td>
                                        <td className="px-4 py-2 text-right tabular-nums">
                                          ₹{line.total_amount.toFixed(2)}
                                        </td>
                                        <td className="px-2 py-2">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setLinePrint({ customerName: group.customer_name, line });
                                            }}
                                            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-600 hover:text-white"
                                            title="Print this line"
                                            aria-label="Print this line"
                                          >
                                            <HiOutlinePrinter className="h-4 w-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                <div className="text-sm text-zinc-400">
                                  <span className="font-medium text-zinc-300">Total items:</span>{" "}
                                  {itemCount}
                                  {" · "}
                                  <span className="font-medium text-zinc-300">Total amount:</span>{" "}
                                  ₹{group.total.toFixed(2)}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPrintForCustomer(group);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                                >
                                  <HiOutlinePrinter className="h-5 w-5" />
                                  Print invoice
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>,
                      ]
                    : []),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}

      {invoiceCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setInvoiceCustomer(null)}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-lg font-semibold text-white">
                Invoice — {invoiceCustomer.customer.name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  <HiOutlinePrinter className="h-5 w-5" />
                  Print / Download
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceCustomer(null)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  aria-label="Close"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <InvoiceBill
                readOnly
                contentRef={printRef}
                initialCustomer={invoiceCustomer.customer}
                initialItems={invoiceCustomer.items.map((i) => ({
                  productName: i.productName,
                  quantity: i.quantity,
                  price: i.price,
                }))}
                className="rounded-xl border border-zinc-700 bg-zinc-800/30 overflow-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {linePrint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setLinePrint(null)}
        >
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-lg font-semibold text-white">
                Print line — {linePrint.line.product_name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLinePrint()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  <HiOutlinePrinter className="h-5 w-5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setLinePrint(null)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  aria-label="Close"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div ref={linePrintRef} className="rounded-lg border border-zinc-700 bg-white p-6 text-black print:border print:bg-white">
                <p className="text-sm font-semibold text-zinc-700">Customer</p>
                <p className="mb-4 text-lg">{linePrint.customerName}</p>
                <p className="text-sm font-semibold text-zinc-700">Product</p>
                <p className="mb-4 text-lg">{linePrint.line.product_name}</p>
                <p className="text-sm font-semibold text-zinc-700">Order date</p>
                <p className="mb-4">{formatDate(linePrint.line.order_date)}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-zinc-600">Quantity</span>
                  <span className="text-right font-medium">{linePrint.line.quantity}</span>
                  <span className="text-zinc-600">Amount</span>
                  <span className="text-right font-medium">₹{linePrint.line.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
