"use client";

import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { HiOutlinePrinter, HiOutlineX } from "react-icons/hi";
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

type OrderInvoice = {
  order_id: string;
  customer: { name: string; phone?: string; address?: string };
  created_at: string;
  items: { productName: string; quantity: number; price: number; total: number }[];
  total: number;
};

export default function OrdersPage() {
  const [customers, setCustomers] = useState<CustomerOrdersGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<OrderInvoice | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoiceOrder
      ? `Invoice-${invoiceOrder.customer.name}-${invoiceOrder.order_id.slice(0, 8)}`
      : "Invoice",
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

  async function openInvoice(orderId: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to load order");
      const data: OrderInvoice = await res.json();
      setInvoiceOrder(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoice");
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  /** First row index of each order_id in a customer's lines, for showing Invoice button once per order */
  function orderIdFirstRowIndex(lines: OrderLineRow[]): Set<number> {
    const seen = new Set<string>();
    const first = new Set<number>();
    lines.forEach((line, i) => {
      if (!seen.has(line.order_id)) {
        seen.add(line.order_id);
        first.add(i);
      }
    });
    return first;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">Orders</h1>
      <p className="mt-1 text-zinc-500">View orders by customer — product name, quantity, total amount.</p>

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
        <div className="mt-8 space-y-8">
          {customers.map((group) => {
            const firstRowByOrder = orderIdFirstRowIndex(group.lines);
            return (
              <div
                key={group.customer_id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50"
              >
                <div className="border-b border-zinc-800 bg-zinc-800/50 px-4 py-3">
                  <h2 className="text-lg font-semibold text-white">
                    {group.customer_name}
                  </h2>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    Total: ₹{group.total.toFixed(2)} · {group.lines.length} line{group.lines.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/80">
                        <th className="px-4 py-3 font-medium text-zinc-300">Order date</th>
                        <th className="px-4 py-3 font-medium text-zinc-300">Product</th>
                        <th className="px-4 py-3 font-medium text-zinc-300 text-right">Qty</th>
                        <th className="px-4 py-3 font-medium text-zinc-300 text-right">Total</th>
                        <th className="w-24 px-4 py-3 text-right font-medium text-zinc-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {group.lines.map((line, idx) => (
                        <tr
                          key={`${line.order_id}-${line.product_name}-${idx}`}
                          className="text-zinc-400 hover:bg-zinc-800/30"
                        >
                          <td className="px-4 py-3 text-zinc-300">
                            {formatDate(line.order_date)}
                          </td>
                          <td className="px-4 py-3 font-medium text-white">
                            {line.product_name}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {line.quantity}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            ₹{line.total_amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {firstRowByOrder.has(idx) && (
                              <button
                                type="button"
                                onClick={() => openInvoice(line.order_id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                              >
                                <HiOutlinePrinter className="h-4 w-4" />
                                Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {invoiceOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setInvoiceOrder(null)}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-lg font-semibold text-white">
                Invoice — {invoiceOrder.customer.name}
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
                  onClick={() => setInvoiceOrder(null)}
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
                initialCustomer={invoiceOrder.customer}
                initialItems={invoiceOrder.items.map((i) => ({
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
    </div>
  );
}
